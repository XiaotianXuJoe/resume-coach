import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { chat, chatJson, type ChatMessage } from "../services/llm";
import { resolveModelConfig } from "../services/settings";
import * as kb from "../services/kb";
import {
  detectResumeType,
  resumeTypeBlock,
  type DetectedResumeType,
} from "../services/resume-type";
import type {
  EvaluationResult,
  InterviewResult,
  KBItem,
} from "@contracts/types";

// ---------- 输入校验 ----------

/**
 * 请求体中的模型配置：所有字段均可缺省/空串（视为未提供），
 * 最终生效值由 resolveModelConfig 按「请求体 → 服务端保存值 → 环境变量/硬默认」解析。
 */
const modelConfigSchema = z.object({
  apiKey: z.string().default(""),
  baseUrl: z.string().default(""),
  model: z.string().default(""),
  thinking: z.string().default(""),
  temperatureMode: z.enum(["auto", "manual"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const directionSchema = z.enum(["java", "python", "cpp", "llm", "frontend", "test", "data"]);

const resumeTypeSchema = z.enum(["auto", "campus", "experienced"]);

const analyzeInputSchema = z.object({
  resumeText: z.string().min(1),
  direction: directionSchema,
  resumeType: resumeTypeSchema.default("auto"),
  jd: z.string().default(""),
  config: modelConfigSchema,
});

/** auto 时按简历文本启发式判定校招/社招 */
function resolveResumeType(
  input: z.infer<typeof analyzeInputSchema>,
): DetectedResumeType {
  if (input.resumeType === "campus" || input.resumeType === "experienced") {
    return input.resumeType;
  }
  return detectResumeType(input.resumeText).type;
}

// ---------- Prompt 模板加载 ----------

function resolvePromptDir(): string {
  const fromCwd = path.resolve(process.cwd(), "api/data/prompts");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return fileURLToPath(new URL("../data/prompts", import.meta.url));
}

const promptCache = new Map<string, string>();

function loadPrompt(name: string): string {
  const cached = promptCache.get(name);
  if (cached) return cached;
  const full = path.join(resolvePromptDir(), `${name}.md`);
  const text = fs.readFileSync(full, "utf-8");
  promptCache.set(name, text);
  return text;
}

function fillPrompt(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

function jdBlock(jd: string): string {
  const trimmed = jd.trim();
  if (!trimmed) return "";
  return `## 目标岗位 JD（请结合 JD 评估匹配度）\n${trimmed}`;
}

const LANG_LABELS: Record<string, string> = {
  java: "Java 后端",
  python: "Python 后端",
  cpp: "C++ 后端",
  llm: "大模型开发",
  frontend: "前端开发",
  test: "测试开发",
  data: "数据分析",
};

// ---------- Router ----------

export const resumeRouter = createRouter({
  /** 检测简历技术方向（含各方向命中关键词数组） */
  detectDirection: publicQuery
    .input(z.object({ resumeText: z.string().min(1) }))
    .query(({ input }) => {
      return kb.detectLanguage(input.resumeText);
    }),

  /** 检测简历类型（校招/社招，含命中特征词） */
  detectResumeType: publicQuery
    .input(z.object({ resumeText: z.string().min(1) }))
    .query(({ input }) => {
      return detectResumeType(input.resumeText);
    }),

  /** 简历评价 */
  evaluate: publicQuery
    .input(analyzeInputSchema)
    .mutation(async ({ input }) => {
      const resumeType = resolveResumeType(input);
      const template = loadPrompt(`evaluate_${input.direction}`);
      const prompt = fillPrompt(template, {
        resume_text: input.resumeText,
        resume_type_block: resumeTypeBlock(resumeType),
        jd_block: jdBlock(input.jd),
      });
      const messages: ChatMessage[] = [{ role: "user", content: prompt }];
      const config = await resolveModelConfig(input.config);
      const result = await chatJson<EvaluationResult>(messages, config);
      return result;
    }),

  /** 面试题生成（返回生成结果与检索到的题库题目） */
  interview: publicQuery
    .input(analyzeInputSchema)
    .mutation(async ({ input }) => {
      const retrieved = kb.retrieve(input.resumeText, input.direction, 15);
      const kbQuestions = retrieved
        .map(
          (it) =>
            `- [${it.id}]（${it.topic}/${it.difficulty}）${it.question}｜答题要点：${it.answer_points.join("；")}`,
        )
        .join("\n");
      const template = loadPrompt("interview");
      const prompt = fillPrompt(template, {
        lang_label: LANG_LABELS[input.direction] ?? input.direction,
        kb_questions: kbQuestions,
        resume_text: input.resumeText,
        jd_block: jdBlock(input.jd),
      });
      const messages: ChatMessage[] = [{ role: "user", content: prompt }];
      const config = await resolveModelConfig(input.config);
      const interview = await chatJson<InterviewResult>(messages, config);
      return { interview, retrieved: retrieved as KBItem[] };
    }),

  /** 简历截图转文字（多模态，非 jsonMode） */
  transcribe: publicQuery
    .input(
      z.object({
        images: z.array(z.string().min(1)).min(1),
        config: modelConfigSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const messages: ChatMessage[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "以下是一份简历的页面截图。请逐页完整转录其中的文字内容，保持原有板块结构，按阅读顺序输出纯文本。不要评价、不要总结，只做忠实转录。",
            },
            ...input.images.map((b64) => ({
              type: "image_url" as const,
              image_url: { url: `data:image/png;base64,${b64}` },
            })),
          ],
        },
      ];
      const config = await resolveModelConfig(input.config);
      const text = await chat(messages, config);
      return { text };
    }),
});

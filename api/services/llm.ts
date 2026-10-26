import type { ModelConfig } from "@contracts/types";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

const K3_THINKING_LEVELS = new Set(["low", "high", "max"]);
const K2_THINKING_TYPES = new Set(["enabled", "disabled"]);

function isK3Model(model: string): boolean {
  return model === "k3" || model.startsWith("kimi-k3");
}

/**
 * 取生效 API Key。调用方应先经 resolveModelConfig() 完成
 * 「请求体 → 服务端保存值 → MOONSHOT_API_KEY 环境变量」解析，
 * 此处仅作最后校验。
 */
function resolveApiKey(cfg: ModelConfig): string {
  const key = cfg.apiKey || process.env.MOONSHOT_API_KEY || "";
  if (!key) {
    throw new Error(
      "未配置模型 API Key：请在「设置」页填写并保存 API Key，或在服务端环境变量中配置 MOONSHOT_API_KEY",
    );
  }
  return key;
}

function buildBody(
  messages: ChatMessage[],
  cfg: ModelConfig,
  jsonMode: boolean,
): Record<string, unknown> {
  const model = cfg.model || "kimi-k3";
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: 16384,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const thinking = (cfg.thinking || "").trim();
  if (isK3Model(model)) {
    // K3 系列：reasoning_effort 顶层字段，绝不发送 thinking 字段
    if (K3_THINKING_LEVELS.has(thinking)) {
      body.reasoning_effort = thinking;
    }
  } else {
    // K2.6 / K2.5 等：thinking: { type: "enabled" | "disabled" }
    if (K2_THINKING_TYPES.has(thinking)) {
      body.thinking = { type: thinking };
    }
  }

  // auto 模式不发送 temperature（K3 固定 1.0、K2.6 非思考固定 0.6，显式传错会 400）
  if (cfg.temperatureMode === "manual") {
    body.temperature = cfg.temperature;
  }

  return body;
}

/** 整体超时上限：思考模型 + 长 JSON 输出可能很慢，放宽到 15 分钟 */
const OVERALL_TIMEOUT_MS = 900_000;
/** 流式空闲看门狗：超过 3 分钟没有任何数据到达视为卡死 */
const IDLE_TIMEOUT_MS = 180_000;

/**
 * 流式读取 SSE 响应体，累加 delta.content。
 * 流式让连接持续有数据流动，避免长思考期间被中间网关按空闲连接掐断，
 * 这是 Kimi/Moonshot 官方对长时间推理请求的建议做法。
 */
async function readStream(res: Response): Promise<string> {
  if (!res.body) throw new Error("LLM 响应无内容流");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  // 空闲看门狗：每次 read 与定时器竞速
  const readWithIdleWatch = (): Promise<ReadableStreamReadResult<Uint8Array>> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("LLM 响应空闲超时（3 分钟无数据）")),
        IDLE_TIMEOUT_MS,
      );
      reader.read().then(
        (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });

  try {
    for (;;) {
      const { done, value } = await readWithIdleWatch();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE 按行解析："data: {...}" / "data: [DONE]"
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) content += delta;
        } catch {
          // 半行/心跳行，忽略
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return content;
}

/**
 * 调用 OpenAI 兼容的 chat/completions 接口（Moonshot/Kimi）。
 * 默认走流式（stream: true）并在本地累加结果：
 * - 思考模型推理久，非流式下连接长时间无字节，容易被超时/网关掐断
 * - jsonMode 时追加 response_format: { type: "json_object" }
 */
export async function chat(
  messages: ChatMessage[],
  cfg: ModelConfig,
  opts?: { jsonMode?: boolean },
): Promise<string> {
  const apiKey = resolveApiKey(cfg);
  const baseUrl = (cfg.baseUrl || "https://api.moonshot.cn/v1").replace(
    /\/+$/,
    "",
  );
  const body = {
    ...buildBody(messages, cfg, opts?.jsonMode ?? false),
    stream: true,
  };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(OVERALL_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败（HTTP ${res.status}）：${text.slice(0, 500)}`);
  }

  const content = await readStream(res);
  if (!content) {
    throw new Error("LLM 返回内容为空");
  }
  return content;
}

/** 判断是否为超时/中断类错误（这类错误值得原样重试一次） */
export function isTimeoutError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|aborted|abort|空闲超时/i.test(msg);
}

/**
 * 从模型输出中提取 JSON：容忍 ```json 代码块包裹与首尾杂文本，
 * 取第一个 "{" 到最后一个 "}" 之间的内容解析。
 */
export function extractJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    text = fence[1].trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型输出中未找到 JSON 对象");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/**
 * chat + JSON 解析；解析失败时追加一条纠错消息重试 1 次，再失败才抛错。
 */
export async function chatJson<T>(
  messages: ChatMessage[],
  cfg: ModelConfig,
): Promise<T> {
  let first: string;
  try {
    first = await chat(messages, cfg, { jsonMode: true });
  } catch (err) {
    // 超时/中断类错误：原样重试一次（思考模型偶发慢，重试通常能过）
    if (isTimeoutError(err)) {
      first = await chat(messages, cfg, { jsonMode: true });
    } else {
      throw err;
    }
  }
  try {
    return extractJson<T>(first);
  } catch {
    const retryMessages: ChatMessage[] = [
      ...messages,
      { role: "assistant", content: first },
      {
        role: "user",
        content: "你上一条回复不是合法 JSON，请只输出修正后的完整 JSON",
      },
    ];
    const second = await chat(retryMessages, cfg, { jsonMode: true });
    try {
      return extractJson<T>(second);
    } catch (err) {
      throw new Error(
        `LLM 输出 JSON 解析失败（已重试 1 次）：${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

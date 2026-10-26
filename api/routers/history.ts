import { z } from "zod";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { count, desc, eq } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { analyses, archives } from "@db/schema";
import { Errors } from "@contracts/errors";
import { detectStudentName, stripFileExtension } from "../services/student-name";
import type {
  AnalysisDetail,
  AnalysisSummary,
  EvaluationResult,
  InterviewResult,
} from "@contracts/types";

/** 原始简历文件存储目录：<cwd>/data/uploads */
export const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads");

/** 安全化文件名：剥离路径分隔符、`..` 等危险字符，保留中英文与常见符号 */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/]/g, "_")
    .replace(/\.\.+/g, "_")
    .replace(/[:*?"<>|\x00-\x1f]/g, "_")
    .trim();
  return cleaned.slice(-200) || "resume.bin";
}

const createInputSchema = z.object({
  filename: z.string().min(1).max(255),
  direction: z.string().min(1).max(16),
  /** 简历类型（已解析为 campus/experienced 后入库） */
  resumeType: z.enum(["campus", "experienced"]).optional(),
  overallScore: z.number().int(),
  resumeText: z.string(),
  evaluation: z.custom<EvaluationResult>((v) => v != null && typeof v === "object"),
  interview: z.custom<InterviewResult>((v) => v != null && typeof v === "object"),
  kbIds: z.array(z.string()),
  /** 可选：指定所属档案；不传则按学生姓名/文件名自动归档 */
  archiveId: z.number().int().positive().optional(),
  /** 可选：上传的原始简历文件（base64），服务端落盘到 data/uploads */
  originalFile: z
    .object({
      name: z.string().min(1).max(255),
      base64: z.string(),
    })
    .optional(),
});

export const historyRouter = createRouter({
  /** 保存一次分析结果，返回 id/档案/版本名；可选附带原始简历文件（base64 落盘） */
  create: publicQuery.input(createInputSchema).mutation(async ({ input }) => {
    const db = getDb();

    // 归档：指定档案则校验存在；否则按学生姓名/文件名挂入同名档案或新建
    let archiveId: number;
    if (input.archiveId != null) {
      const found = await db
        .select({ id: archives.id })
        .from(archives)
        .where(eq(archives.id, input.archiveId))
        .limit(1);
      if (!found[0]) throw Errors.notFound(`档案不存在（id=${input.archiveId}）`);
      archiveId = found[0].id;
    } else {
      const name = (
        detectStudentName(input.resumeText) ??
        (stripFileExtension(input.filename) || "未命名档案")
      ).slice(0, 128);
      const found = await db
        .select({ id: archives.id })
        .from(archives)
        .where(eq(archives.name, name))
        .limit(1);
      if (found[0]) {
        archiveId = found[0].id;
      } else {
        const inserted = await db.insert(archives).values({ name }).$returningId();
        archiveId = inserted[0].id;
      }
    }

    const [{ value: versionCount }] = await db
      .select({ value: count() })
      .from(analyses)
      .where(eq(analyses.archiveId, archiveId));
    const versionName = `版本 ${versionCount + 1}`;

    const rows = await db
      .insert(analyses)
      .values({
        filename: input.filename,
        direction: input.direction,
        resumeType: input.resumeType ?? null,
        overallScore: input.overallScore,
        resumeText: input.resumeText,
        evaluation: input.evaluation,
        interview: input.interview,
        kbIds: input.kbIds,
        originalFileName: input.originalFile?.name ?? null,
        originalFilePath: null,
        archiveId,
        versionName,
      })
      .$returningId();
    const id = rows[0].id;

    // 附带原始文件：base64 → Buffer 落盘到 data/uploads/<id>_<安全化文件名>
    if (input.originalFile) {
      const safeName = sanitizeFileName(input.originalFile.name);
      await mkdir(UPLOAD_DIR, { recursive: true });
      const filePath = path.join(UPLOAD_DIR, `${id}_${safeName}`);
      await writeFile(filePath, Buffer.from(input.originalFile.base64, "base64"));
      await db
        .update(analyses)
        .set({ originalFilePath: filePath })
        .where(eq(analyses.id, id));
    }

    return { id, archiveId, versionName };
  }),

  /** 重命名某个分析版本 */
  renameVersion: publicQuery
    .input(z.object({ id: z.number().int().positive(), versionName: z.string().min(1).max(128) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(analyses)
        .set({ versionName: input.versionName })
        .where(eq(analyses.id, input.id));
      return { ok: true };
    }),

  /** 历史列表（按创建时间倒序） */
  list: publicQuery.query(async (): Promise<AnalysisSummary[]> => {
    const db = getDb();
    return db
      .select({
        id: analyses.id,
        filename: analyses.filename,
        direction: analyses.direction,
        resumeType: analyses.resumeType,
        overallScore: analyses.overallScore,
        createdAt: analyses.createdAt,
        archiveId: analyses.archiveId,
        versionName: analyses.versionName,
      })
      .from(analyses)
      .orderBy(desc(analyses.createdAt));
  }),

  /** 单条分析详情（追加所属档案名） */
  get: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }): Promise<AnalysisDetail & { archiveName: string | null }> => {
      const db = getDb();
      const rows = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, input.id))
        .limit(1);
      const row = rows[0];
      if (!row) throw Errors.notFound(`分析记录不存在（id=${input.id}）`);
      let archiveName: string | null = null;
      if (row.archiveId != null) {
        const archiveRows = await db
          .select({ name: archives.name })
          .from(archives)
          .where(eq(archives.id, row.archiveId))
          .limit(1);
        archiveName = archiveRows[0]?.name ?? null;
      }
      // 存储路径属于服务端内部信息，不通过 API 暴露
      const { originalFilePath: _originalFilePath, ...detail } = row;
      return { ...detail, archiveName };
    }),

  /** 删除一条分析记录（存在原始文件时一并删除磁盘文件） */
  remove: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ originalFilePath: analyses.originalFilePath })
        .from(analyses)
        .where(eq(analyses.id, input.id))
        .limit(1);
      await db.delete(analyses).where(eq(analyses.id, input.id));
      const filePath = rows[0]?.originalFilePath;
      if (filePath) {
        // 容错：文件已不存在等情况不报错
        await unlink(filePath).catch(() => {});
      }
      return { ok: true };
    }),
});

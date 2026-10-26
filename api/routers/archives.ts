import { z } from "zod";
import { unlink } from "node:fs/promises";
import { asc, eq, isNull } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { analyses, archives } from "@db/schema";
import { Errors } from "@contracts/errors";
import { detectStudentName, stripFileExtension } from "../services/student-name";
import type { ArchiveSummary } from "@contracts/types";

type Db = ReturnType<typeof getDb>;

/** 由分析记录推导档案名：学生姓名 → 文件名去扩展名 → 未命名档案 */
function deriveArchiveName(resumeText: string, filename: string): string {
  const name =
    detectStudentName(resumeText) ?? (stripFileExtension(filename) || "未命名档案");
  return name.slice(0, 128);
}

/**
 * 懒迁移：把 archiveId 为 NULL 的分析记录逐条挂入档案
 * （同名档案已存在则直接挂入，否则新建），并回写 archiveId
 */
async function migrateOrphanAnalyses(db: Db): Promise<void> {
  const orphans = await db
    .select()
    .from(analyses)
    .where(isNull(analyses.archiveId))
    .orderBy(asc(analyses.createdAt), asc(analyses.id));
  if (orphans.length === 0) return;

  const existing = await db.select().from(archives);
  const idByName = new Map(existing.map((a) => [a.name, a.id]));

  for (const row of orphans) {
    const name = deriveArchiveName(row.resumeText, row.filename);
    let archiveId = idByName.get(name);
    if (archiveId == null) {
      const inserted = await db.insert(archives).values({ name }).$returningId();
      archiveId = inserted[0].id;
      idByName.set(name, archiveId);
    }
    await db.update(analyses).set({ archiveId }).where(eq(analyses.id, row.id));
  }
}

/** 回填空版本名：N 为档案内按 createdAt 顺序的序号 */
async function backfillVersionNames(db: Db): Promise<void> {
  const archiveRows = await db.select({ id: archives.id }).from(archives);
  for (const archive of archiveRows) {
    const rows = await db
      .select({ id: analyses.id, versionName: analyses.versionName })
      .from(analyses)
      .where(eq(analyses.archiveId, archive.id))
      .orderBy(asc(analyses.createdAt), asc(analyses.id));
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].versionName) {
        await db
          .update(analyses)
          .set({ versionName: `版本 ${i + 1}` })
          .where(eq(analyses.id, rows[i].id));
      }
    }
  }
}

export const archivesRouter = createRouter({
  /** 档案列表（先执行懒迁移，再按最新版本时间倒序返回聚合结果） */
  list: publicQuery.query(async (): Promise<ArchiveSummary[]> => {
    const db = getDb();
    await migrateOrphanAnalyses(db);
    await backfillVersionNames(db);

    const archiveRows = await db.select().from(archives);
    const analysisRows = await db
      .select({
        archiveId: analyses.archiveId,
        overallScore: analyses.overallScore,
        createdAt: analyses.createdAt,
      })
      .from(analyses);

    // 数据量小，内存聚合 versionCount / avgScore / latestAt
    const aggByArchive = new Map<
      number,
      { count: number; scoreSum: number; latestAt: Date | null }
    >();
    for (const row of analysisRows) {
      if (row.archiveId == null) continue;
      const agg =
        aggByArchive.get(row.archiveId) ?? { count: 0, scoreSum: 0, latestAt: null };
      agg.count += 1;
      agg.scoreSum += row.overallScore;
      if (!agg.latestAt || row.createdAt > agg.latestAt) agg.latestAt = row.createdAt;
      aggByArchive.set(row.archiveId, agg);
    }

    const result: ArchiveSummary[] = archiveRows.map((archive) => {
      const agg = aggByArchive.get(archive.id);
      return {
        id: archive.id,
        name: archive.name,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt,
        versionCount: agg?.count ?? 0,
        avgScore: agg ? Math.round(agg.scoreSum / agg.count) : null,
        latestAt: agg?.latestAt ?? null,
      };
    });
    result.sort((a, b) => {
      if (a.latestAt && b.latestAt) return b.latestAt.getTime() - a.latestAt.getTime();
      if (a.latestAt) return -1;
      if (b.latestAt) return 1;
      return b.id - a.id;
    });
    return result;
  }),

  /** 重命名档案 */
  rename: publicQuery
    .input(z.object({ id: z.number().int().positive(), name: z.string().min(1).max(128) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ id: archives.id })
        .from(archives)
        .where(eq(archives.id, input.id))
        .limit(1);
      if (!rows[0]) throw Errors.notFound(`档案不存在（id=${input.id}）`);
      await db
        .update(archives)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(archives.id, input.id));
      return { ok: true };
    }),

  /** 删除档案及其下全部分析记录（原始文件一并从磁盘删除，容错） */
  remove: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ originalFilePath: analyses.originalFilePath })
        .from(analyses)
        .where(eq(analyses.archiveId, input.id));
      await db.delete(analyses).where(eq(analyses.archiveId, input.id));
      for (const row of rows) {
        if (row.originalFilePath) {
          // 容错：文件已不存在等情况不报错
          await unlink(row.originalFilePath).catch(() => {});
        }
      }
      await db.delete(archives).where(eq(archives.id, input.id));
      return { ok: true };
    }),
});

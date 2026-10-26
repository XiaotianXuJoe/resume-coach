import {
  mysqlTable,
  serial,
  varchar,
  int,
  bigint,
  text,
  json,
  timestamp,
} from "drizzle-orm/mysql-core";
import type {
  EvaluationResult,
  InterviewResult,
  ModelConfig,
} from "@contracts/types";

export const analyses = mysqlTable("analyses", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  direction: varchar("direction", { length: 16 }).notNull(),
  /** 简历类型：campus 校招 / experienced 社招（旧数据为 null） */
  resumeType: varchar("resume_type", { length: 16 }),
  overallScore: int("overall_score").notNull(),
  resumeText: text("resume_text").notNull(),
  evaluation: json("evaluation").$type<EvaluationResult>().notNull(),
  interview: json("interview").$type<InterviewResult>().notNull(),
  kbIds: json("kb_ids").$type<string[]>().notNull(),
  /** 上传的原始简历文件名（未上传文件的历史记录为 null） */
  originalFileName: varchar("original_file_name", { length: 255 }),
  /** 原始简历文件在服务器上的存储路径（data/uploads/<id>_<安全化文件名>） */
  originalFilePath: varchar("original_file_path", { length: 512 }),
  /** 所属档案 id（旧数据为 null，由 archives.list 懒迁移回填） */
  archiveId: bigint("archive_id", { mode: "number", unsigned: true }),
  /** 版本名（默认「版本 N」，可自定义） */
  versionName: varchar("version_name", { length: 128 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 简历档案：一个学生一份档案，下挂多个分析版本 */
export const archives = mysqlTable("archives", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type ArchiveRow = typeof archives.$inferSelect;
export type ArchiveInsert = typeof archives.$inferInsert;

export type AnalysisRow = typeof analyses.$inferSelect;
export type AnalysisInsert = typeof analyses.$inferInsert;

/** 单行键值配置表（目前仅 key="model_config" 一行，存完整 ModelConfig） */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").$type<ModelConfig>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type SettingRow = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;

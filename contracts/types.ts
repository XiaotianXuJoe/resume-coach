export * from "./errors";

// ---------- 简历辅导助手 共享类型 ----------

export type Direction = "auto" | "java" | "python" | "cpp" | "llm" | "frontend" | "test" | "data";

/** 简历类型：校招 / 社招 / 自动判断 */
export type ResumeType = "auto" | "campus" | "experienced";

export interface ModelConfig {
  /** 可为空字符串 → 服务端回退用环境变量 MOONSHOT_API_KEY */
  apiKey: string;
  /** 默认 https://api.moonshot.cn/v1 */
  baseUrl: string;
  /** 默认 kimi-k3 */
  model: string;
  /** k3: "low"|"high"|"max"；k2.6/k2.5: "enabled"|"disabled" */
  thinking: string;
  temperatureMode: "auto" | "manual";
  /** manual 时生效 */
  temperature: number;
}

/** 设置页视图模型：绝不包含完整 API Key */
export interface SettingsView {
  /** 服务端是否已保存 Key */
  hasKey: boolean;
  /** 脱敏 Key：无 Key 空串；≤8 位全 *；否则 前3 + **** + 后4 */
  maskedKey: string;
  baseUrl: string;
  model: string;
  thinking: string;
  temperatureMode: "auto" | "manual";
  temperature: number;
}

export interface EvalDimension {
  name: string;
  score: number;
  comment: string;
}

export interface EvalIssue {
  severity: "高" | "中" | "低";
  location: string;
  problem: string;
  suggestion: string;
  example_rewrite?: string;
}

export interface EvaluationResult {
  overall_score: number;
  language_detected?: string;
  summary: string;
  dimensions: EvalDimension[];
  issues: EvalIssue[];
  strengths: string[];
}

export interface InterviewQuestion {
  question: string;
  intent: string;
  answer_direction: string;
  source: string;
}

export interface InterviewTier {
  tier: string;
  questions: InterviewQuestion[];
}

export interface InterviewResult {
  tiers: InterviewTier[];
}

export interface KBItem {
  id: string;
  language: string;
  topic: string;
  difficulty: string;
  frequency: string;
  question: string;
  answer_points: string[];
}

export interface AnalysisSummary {
  id: number;
  filename: string;
  direction: string;
  /** 简历类型：campus 校招 / experienced 社招（旧数据为 null） */
  resumeType: string | null;
  overallScore: number;
  createdAt: Date;
  /** 所属档案 id（旧数据迁移后为必填，仅兼容期可空） */
  archiveId: number | null;
  /** 版本名（默认「版本 N」，可自定义） */
  versionName: string | null;
}

export interface AnalysisDetail extends AnalysisSummary {
  resumeText: string;
  evaluation: EvaluationResult;
  interview: InterviewResult;
  kbIds: string[];
  /** 原始简历文件名（无附件时为 null；存储路径与内容不通过 API 暴露） */
  originalFileName: string | null;
}

/** 简历档案（一个学生一份档案，下挂多个简历版本） */
export interface ArchiveSummary {
  id: number;
  /** 档案名（默认学生姓名，可修改） */
  name: string;
  createdAt: Date;
  updatedAt: Date;
  versionCount: number;
  /** 版本平均分（无版本时为 null） */
  avgScore: number | null;
  /** 最新版本时间（无版本时为 null） */
  latestAt: Date | null;
}

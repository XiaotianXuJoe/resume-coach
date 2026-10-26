/**
 * 简历类型（校招/社招）关键词启发式判定。
 * 与技术方向检测同风格：命中计数 + 强信号加权，平局默认校招
 * （本工具的主要使用场景是教师辅导学生）。
 */

export type DetectedResumeType = "campus" | "experienced";

export interface ResumeTypeDetectResult {
  type: DetectedResumeType;
  campusHits: string[];
  experiencedHits: string[];
}

const CAMPUS_WORDS = [
  "应届", "在校生", "在读", "预计毕业", "校园招聘", "校招",
  "GPA", "绩点", "保研", "考研", "ACM", "ICPC", "蓝桥杯",
  "奖学金", "三好学生", "学生会", "社团", "课程设计", "毕业设计", "毕业论文",
];

const EXPERIENCED_WORDS = [
  "工作年限", "年工作经验", "社招", "社会招聘", "高级工程师",
  "资深工程师", "技术负责人", "团队负责人", "晋升", "年度绩效",
  "离职", "在职", "正职", "带团队", "下属", "汇报给",
];

function countHits(text: string, words: string[]): string[] {
  return words.filter((w) => text.includes(w));
}

/** 届别/毕业年份强信号：202X届、毕业时间含未来年份 → 校招 */
function hasGradYearSignal(text: string): boolean {
  if (/20[2-3]\d\s*届/.test(text)) return true;
  if (/预计?\s*(于)?\s*20[2-3]\d\s*年?\s*(6|七|六)?\s*月?\s*(毕业|取得|获得)/.test(text)) return true;
  if (/毕业时间[:：]?\s*20[2-3]\d/.test(text)) return true;
  return false;
}

/** 工作经历"至今"强信号：公司/职位时间段写到"至今" → 社招 */
function hasPresentJobSignal(text: string): boolean {
  return /(19|20)\d{2}[./年-]\s*\d{1,2}?\s*[-–—~至到]+\s*(至今|现在|今)/.test(text);
}

export function detectResumeType(text: string): ResumeTypeDetectResult {
  const campusHits = countHits(text, CAMPUS_WORDS);
  const experiencedHits = countHits(text, EXPERIENCED_WORDS);

  let campusScore = campusHits.length;
  let experiencedScore = experiencedHits.length;
  if (hasGradYearSignal(text)) campusScore += 3;
  if (hasPresentJobSignal(text)) experiencedScore += 3;

  const type: DetectedResumeType =
    experiencedScore > campusScore ? "experienced" : "campus";
  return { type, campusHits, experiencedHits };
}

export const RESUME_TYPE_LABELS: Record<DetectedResumeType, string> = {
  campus: "校招",
  experienced: "社招",
};

/**
 * 注入评价/出题 prompt 的类型说明块：明确简历类型与侧重点。
 */
export function resumeTypeBlock(type: DetectedResumeType): string {
  if (type === "campus") {
    return [
      "【简历类型：校招（应届/在校生）】",
      "评价与建议请按校招标准：看重基础扎实度、实习/项目/竞赛经历、学习潜力与培养价值；",
      "对「缺少正式工作经验」类问题不计缺陷，但对「项目同质化、无量化结果、堆砌名词」等问题要明确指出。",
    ].join("\n");
  }
  return [
    "【简历类型：社招（有工作经验）】",
    "评价与建议请按社招标准：看重工作年限与职级匹配度、业务成果与量化产出、技术深度与架构决策、团队协作/带人经验；",
    "额外检查：跳槽频率与稳定性、职业空窗期、职级与能力是否匹配、项目描述是否体现owner意识；",
    "对「缺少竞赛/校园经历」类问题不计缺陷。",
  ].join("\n");
}

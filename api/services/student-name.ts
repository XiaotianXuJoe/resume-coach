/**
 * 从简历文本推断学生姓名，规则按序尝试：
 * a) 匹配「姓名：张三」式标注 → 取 2-4 个汉字
 * b) 首个非空行去除空白与标点（含 | 、 等分隔符）后，若为纯 2-4 个汉字 → 作为姓名
 * c) 都不行返回 null
 */
export function detectStudentName(resumeText: string): string | null {
  if (!resumeText) return null;

  // a) 显式「姓名：」标注
  const labeled = resumeText.match(/姓\s*名[:：]\s*([\u4e00-\u9fa5]{2,4})/);
  if (labeled) return labeled[1];

  // b) 首个非空行去空白与标点（\p{P} 标点 + \p{S} 符号，覆盖 | 、 等分隔符）
  const firstLine = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (firstLine) {
    const cleaned = firstLine.replace(/[\s\p{P}\p{S}]+/gu, "");
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(cleaned)) return cleaned;
  }

  return null;
}

/** 文件名去扩展名（档案命名回退用），结果可能为空串 */
export function stripFileExtension(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, "").trim();
}

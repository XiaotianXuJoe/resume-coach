/** 分数色阶：<60 柔红 / 60–74 琥珀 / 75–89 赤陶 / ≥90 松绿 */
export function scoreColor(score: number): string {
  if (score < 60) return '#B4402F'
  if (score < 75) return '#B8892E'
  if (score < 90) return '#B9552E'
  return '#5C7A67'
}

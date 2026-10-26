import type { AnalysisSummary, InterviewResult } from '@contracts/types'

/** DB 中 direction 可能是 java/python/cpp/Java/自动检测 等写法，统一归一为展示名 */
export function normalizeDirection(direction: string): string {
  const d = direction.trim().toLowerCase()
  if (d === 'java') return 'Java'
  if (d === 'python') return 'Python'
  if (d === 'cpp' || d === 'c++') return 'C++'
  if (d === 'llm' || d === '大模型' || d === '大模型开发') return '大模型'
  if (d === 'frontend' || d === '前端' || d === '前端开发') return '前端'
  if (d === 'test' || d === 'qa' || d === '测试' || d === '测试开发') return '测试'
  if (d === 'data' || d === '数分' || d === '数据分析') return '数分'
  if (d === 'auto' || d === '' || d === '自动检测') return '自动检测'
  return direction
}

export const DIRECTIONS = ['Java', 'Python', 'C++', '大模型', '前端', '测试', '数分'] as const

/** 简历类型归一为展示名；旧数据无类型时返回 null（不展示标签） */
export function normalizeResumeType(t: string | null | undefined): string | null {
  if (t === 'campus' || t === '校招') return '校招'
  if (t === 'experienced' || t === '社招') return '社招'
  return null
}

/** 2025-06-18 14:32 */
export function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 面试题总数 */
export function questionCount(interview: InterviewResult): number {
  return interview.tiers.reduce((acc, t) => acc + t.questions.length, 0)
}

export interface HistoryStats {
  total: number
  avg: number
  max: number
  min: number
  weekly: number
  distribution: { name: string; count: number; pct: number }[]
}

export function computeStats(list: AnalysisSummary[]): HistoryStats {
  const total = list.length
  const scores = list.map((r) => r.overallScore)
  const avg = total ? scores.reduce((a, b) => a + b, 0) / total : 0
  const max = total ? Math.max(...scores) : 0
  const min = total ? Math.min(...scores) : 0
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  const weekly = list.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length
  const counts = new Map<string, number>()
  for (const r of list) {
    const name = normalizeDirection(r.direction)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const distribution = [...counts.entries()]
    .map(([name, count]) => ({ name, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count)
  return { total, avg, max, min, weekly, distribution }
}

import type { KBItem } from '@contracts/types'

/** 语言分库元信息：Java 赤陶 / Python 尘蓝 / C++ 松绿 / 大模型 黛紫 / 前端 青碧 / 测试 暖棕 / 数分 黛蓝 / 通用 墨色 */
export const LANGUAGE_META: Record<string, { label: string; short: string; color: string }> = {
  all: { label: '全部', short: '全部', color: '#2D2822' },
  common: { label: '通用', short: '通用', color: '#2D2822' },
  java: { label: 'Java 后端', short: 'Java', color: '#B9552E' },
  python: { label: 'Python 后端', short: 'Python', color: '#5E7FA0' },
  cpp: { label: 'C++ 后端', short: 'C++', color: '#5C7A67' },
  llm: { label: '大模型开发', short: '大模型', color: '#7A5C8E' },
  frontend: { label: '前端开发', short: '前端', color: '#3E7C7B' },
  test: { label: '测试开发', short: '测试', color: '#9C6B30' },
  data: { label: '数据分析', short: '数分', color: '#4A6FA5' },
}

export const LANGUAGE_ORDER = ['all', 'common', 'java', 'python', 'cpp', 'llm', 'frontend', 'test', 'data'] as const

export const DIFFICULTIES = ['基础', '中等', '困难'] as const
export const FREQUENCIES = ['高频', '中频', '低频'] as const

/** 难度配色：困难柔红不刺眼 */
export const DIFFICULTY_COLOR: Record<string, string> = {
  基础: '#5C7A67',
  中等: '#B8892E',
  困难: '#B4402F',
}

/** 考频配色：中频琥珀 */
export const FREQUENCY_COLOR: Record<string, string> = {
  高频: '#B9552E',
  中频: '#B8892E',
  低频: '#5E7FA0',
}

export interface KbFilters {
  language: string
  topics: string[]
  difficulties: string[]
  frequencies: string[]
}

export const EMPTY_FILTERS: KbFilters = {
  language: 'all',
  topics: [],
  difficulties: [],
  frequencies: [],
}

export function hasActiveFilters(f: KbFilters, keyword: string): boolean {
  return (
    f.language !== 'all' ||
    f.topics.length > 0 ||
    f.difficulties.length > 0 ||
    f.frequencies.length > 0 ||
    keyword.trim() !== ''
  )
}

/** 按筛选条件过滤题目 */
export function filterItems(items: KBItem[], f: KbFilters, keyword: string): KBItem[] {
  const kw = keyword.trim().toLowerCase()
  return items.filter((it) => {
    if (f.language !== 'all' && it.language !== f.language) return false
    if (f.topics.length > 0 && !f.topics.includes(it.topic)) return false
    if (f.difficulties.length > 0 && !f.difficulties.includes(it.difficulty)) return false
    if (f.frequencies.length > 0 && !f.frequencies.includes(it.frequency)) return false
    if (kw) {
      const hay = `${it.id} ${it.question} ${it.topic} ${it.answer_points.join(' ')}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
}

/** 按 topic 分组（保持出现顺序） */
export function groupByTopic(items: KBItem[]): { topic: string; items: KBItem[] }[] {
  const map = new Map<string, KBItem[]>()
  for (const it of items) {
    const arr = map.get(it.topic) ?? []
    arr.push(it)
    map.set(it.topic, arr)
  }
  return [...map.entries()].map(([topic, arr]) => ({ topic, items: arr }))
}

import { Wand2, Coffee, FileCode2, Cpu, Sparkles, LayoutTemplate, FlaskConical, BarChart3, GraduationCap, Briefcase } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ---------------- 求职方向 ---------------- */

export type DirectionValue = 'auto' | 'java' | 'python' | 'cpp' | 'llm' | 'frontend' | 'test' | 'data'

export interface DirectionOption {
  value: DirectionValue
  label: string
  icon: LucideIcon
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: 'auto', label: '自动检测', icon: Wand2 },
  { value: 'java', label: 'Java 后端', icon: Coffee },
  { value: 'python', label: 'Python 后端', icon: FileCode2 },
  { value: 'cpp', label: 'C++ 后端', icon: Cpu },
  { value: 'llm', label: '大模型开发', icon: Sparkles },
  { value: 'frontend', label: '前端开发', icon: LayoutTemplate },
  { value: 'test', label: '测试开发', icon: FlaskConical },
  { value: 'data', label: '数据分析', icon: BarChart3 },
]

/* ---------------- 简历类型 ---------------- */

export type ResumeTypeValue = 'auto' | 'campus' | 'experienced'

export interface ResumeTypeOption {
  value: ResumeTypeValue
  label: string
  icon: LucideIcon
}

export const RESUME_TYPE_OPTIONS: ResumeTypeOption[] = [
  { value: 'auto', label: '自动判断', icon: Wand2 },
  { value: 'campus', label: '校招', icon: GraduationCap },
  { value: 'experienced', label: '社招', icon: Briefcase },
]

/** 简历类型值 → 展示文案 */
export function resumeTypeLabel(t: ResumeTypeValue | string | null | undefined): string {
  switch (t) {
    case 'campus':
      return '校招'
    case 'experienced':
      return '社招'
    default:
      return '自动判断'
  }
}

/** 后端方向值 → DirectionChip 文案 */
export function directionChipLabel(direction: DirectionValue): string {
  switch (direction) {
    case 'java':
      return 'Java'
    case 'python':
      return 'Python'
    case 'cpp':
      return 'C++'
    case 'llm':
      return '大模型'
    case 'frontend':
      return '前端'
    case 'test':
      return '测试'
    case 'data':
      return '数分'
    default:
      return '自动检测'
  }
}

export function directionFullLabel(direction: DirectionValue): string {
  switch (direction) {
    case 'java':
      return 'Java 后端'
    case 'python':
      return 'Python 后端'
    case 'cpp':
      return 'C++ 后端'
    case 'llm':
      return '大模型开发'
    case 'frontend':
      return '前端开发'
    case 'test':
      return '测试开发'
    case 'data':
      return '数据分析'
    default:
      return '自动检测'
  }
}

import type {
  EvaluationResult,
  InterviewResult,
  KBItem,
} from '@contracts/types'
import type { DirectionValue, ResumeTypeValue } from './config'
import type { StepStatus } from '@/components/ui-ext'

/** 页面三态 */
export type WorkbenchStatus = 'idle' | 'analyzing' | 'done'

/** 分析完成后的完整结果（含展示用元数据） */
export interface AnalysisResult {
  filename: string
  fileKind: 'pdf' | 'docx'
  resumeText: string
  charCount: number
  direction: Exclude<DirectionValue, 'auto'>
  resumeType: Exclude<ResumeTypeValue, 'auto'>
  detectedBy: 'auto' | 'manual'
  /** 自动检测命中关键词（auto 时存在） */
  hits?: Partial<Record<Exclude<DirectionValue, 'auto'>, string[]>>
  evaluation: EvaluationResult
  interview: InterviewResult
  retrieved: KBItem[]
  durationMs: number
}

/** 四步分析中的单步运行时状态 */
export interface PipelineStep {
  status: StepStatus
  logs: string[]
}

export const STEP_COUNT = 4

export function initialSteps(): PipelineStep[] {
  return Array.from({ length: STEP_COUNT }, () => ({ status: 'pending', logs: [] }))
}

/** 把 answer_direction 按「；」拆分为要点列表 */
export function splitAnswerPoints(text: string): string[] {
  return text
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

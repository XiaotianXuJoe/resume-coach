import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  FileSearch,
  Compass,
  ClipboardCheck,
  LibraryBig,
  CircleAlert,
  RotateCcw,
} from 'lucide-react'
import { Stepper } from '@/components/ui-ext'
import type { StepperStep } from '@/components/ui-ext'
import { formatElapsed } from './parsing'
import type { PipelineStep } from './types'

const STEP_META = [
  { icon: FileSearch, title: '解析简历文件' },
  { icon: Compass, title: '判定技术方向' },
  { icon: ClipboardCheck, title: '大模型评价简历' },
  { icon: LibraryBig, title: '检索知识库并生成面试题' },
]

interface AnalyzingPanelProps {
  filename: string
  steps: PipelineStep[]
  error: string | null
  startedAt: number
  onCancel: () => void
  onRetry: () => void
}

/** analyzing 状态：进度头 + 四步 Stepper + 底部进度条 + 失败错误卡片。 */
export default function AnalyzingPanel({
  filename,
  steps,
  error,
  startedAt,
  onCancel,
  onRetry,
}: AnalyzingPanelProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const doneCount = steps.filter((s) => s.status === 'done').length
  const hasActive = steps.some((s) => s.status === 'active')
  const failedIndex = steps.findIndex((s) => s.status === 'error')
  // Key 相关错误：提示前往设置页配置
  const keyIssue = error !== null && (error.includes('API Key') || error.includes('401'))
  // 含步内估算：进行中的步按 0.5 计
  const progress = Math.min(1, (doneCount + (hasActive ? 0.5 : 0)) / STEP_META.length)

  const stepperSteps: StepperStep[] = STEP_META.map((meta, i) => ({
    icon: meta.icon,
    title: meta.title,
    status: steps[i]?.status ?? 'pending',
    logs: steps[i]?.logs ?? [],
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-[720px] rounded-2xl border border-line bg-surface p-10 shadow-card"
    >
      {/* 进度头 */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-[20px] font-bold tracking-[0.01em] text-ink">
            正在分析简历
          </h2>
          <p className="mt-2 inline-block max-w-full truncate rounded-md border border-line bg-paper px-2.5 py-0.5 font-mono text-[12px] text-ink-2">
            {filename}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[14px] tabular-nums text-ink-2">
            {formatElapsed(now - startedAt)}
          </span>
          {!error && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-[10px] px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
            >
              取消
            </button>
          )}
        </div>
      </div>

      {/* 四步 Stepper */}
      <div className="mt-8">
        <Stepper steps={stepperSteps} />
      </div>

      {/* 底部进度条 */}
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-terra"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* 失败态错误卡片 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, x: [0, -4, 4, -4, 4, 0] }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
            x: { duration: 0.4, delay: 0.1 },
          }}
          className="mt-6 rounded-xl border border-softred/30 bg-softred/[0.06] p-5"
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-softred" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-softred">
                {failedIndex >= 0 ? `「${STEP_META[failedIndex].title}」失败` : '分析失败'}
              </p>
              <p className="mt-1 break-words font-mono text-[12px] leading-relaxed text-ink-2">
                {error}
              </p>
              {keyIssue && (
                <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                  服务端 API Key 缺失或无效，请在设置页检查后重试。
                  <Link
                    to="/settings"
                    className="ml-1 font-medium text-terra underline-offset-2 hover:underline"
                  >
                    前往设置页配置 Key
                  </Link>
                </p>
              )}
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-medium text-ink transition-shadow hover:shadow-card"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                重试
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

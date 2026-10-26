import { motion } from 'framer-motion'
import { Loader2, CircleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'pending' | 'active' | 'done' | 'error'

export interface StepperStep {
  icon: LucideIcon
  title: string
  status: StepStatus
  /** 子日志（mono 12px，逐行滑入） */
  logs?: string[]
}

export interface StepperProps {
  steps: StepperStep[]
  className?: string
}

/** 完成勾 path draw 动画 */
function CheckDraw() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <motion.path
        d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
        stroke="#FFFDF9"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  )
}

/** 进行中：旋转 Loader + 呼吸光环 */
function ActiveHalo() {
  return (
    <>
      <motion.span
        className="absolute inset-0 rounded-full bg-terra/20"
        animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.4, 0.9] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Loader2 className="h-4 w-4 animate-spin text-terra" strokeWidth={2} />
    </>
  )
}

/**
 * 分析四步纵向步骤条：图标圆（待办 line 描边 / 进行旋转 Loader + 赤陶光环 /
 * 完成松绿勾 / 失败柔红），左侧 24px 处纵向虚线连接，子日志 mono 12px。
 */
export default function Stepper({ steps, className }: StepperProps) {
  return (
    <ol className={cn('relative flex flex-col', className)}>
      {steps.map((step, i) => {
        const Icon = step.icon
        const last = i === steps.length - 1
        return (
          <li key={i} className="relative flex gap-4 pb-7 last:pb-0">
            {/* 连接虚线 */}
            {!last && (
              <span
                aria-hidden
                className="absolute left-6 top-12 bottom-1 w-px -translate-x-1/2 border-l border-dashed border-line"
              />
            )}
            {/* 图标圆 */}
            <span
              className={cn(
                'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                step.status === 'pending' && 'border border-line bg-surface text-ink-3',
                step.status === 'active' && 'border border-terra/40 bg-surface',
                step.status === 'done' && 'bg-pine',
                step.status === 'error' && 'bg-softred/10 text-softred',
              )}
            >
              {step.status === 'active' ? (
                <ActiveHalo />
              ) : step.status === 'done' ? (
                <CheckDraw />
              ) : step.status === 'error' ? (
                <CircleAlert className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              )}
            </span>
            {/* 标题 + 子日志 */}
            <div className="min-w-0 flex-1 pt-2.5">
              <p
                className={cn(
                  'text-[15px] font-bold transition-colors duration-300',
                  step.status === 'pending' ? 'text-ink-3' : 'text-ink',
                )}
              >
                {step.title}
              </p>
              {step.logs && step.logs.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {step.logs.map((log, j) => (
                    <motion.p
                      key={j}
                      className="font-mono text-[12px] leading-relaxed text-ink-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: j * 0.08 }}
                    >
                      {log}
                    </motion.p>
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

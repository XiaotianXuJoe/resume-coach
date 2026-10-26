import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import { DIRECTION_OPTIONS, RESUME_TYPE_OPTIONS } from './config'
import type { DirectionValue, ResumeTypeValue } from './config'

const JD_MAX = 2000

interface AnalysisOptionsProps {
  direction: DirectionValue
  onDirectionChange: (d: DirectionValue) => void
  resumeType: ResumeTypeValue
  onResumeTypeChange: (t: ResumeTypeValue) => void
  jd: string
  onJdChange: (jd: string) => void
  /** 所属档案：null 表示「自动（按学生姓名归档）」 */
  archiveId: number | null
  onArchiveChange: (id: number | null) => void
  canStart: boolean
  onStart: () => void
}

/**
 * 分析选项卡：求职方向 2×2 分段按钮组（layoutId 滑动激活块）、
 * 所属档案下拉、可选 JD 文本域（字数统计）、「开始分析」主 CTA。
 */
export default function AnalysisOptions({
  direction,
  onDirectionChange,
  resumeType,
  onResumeTypeChange,
  jd,
  onJdChange,
  archiveId,
  onArchiveChange,
  canStart,
  onStart,
}: AnalysisOptionsProps) {
  const archivesQuery = trpc.archives.list.useQuery()
  // 保持稳定引用：仅在 canStart 翻转时触发一次轻微脉冲，避免每次输入重放动画
  const ctaAnimate = useMemo(
    () => (canStart ? { scale: [1, 1.02, 1] } : { scale: 1 }),
    [canStart],
  )
  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
      {/* 求职方向 */}
      <div>
        <p className="text-[13px] font-medium tracking-[0.02em] text-ink">求职方向</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {DIRECTION_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = direction === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onDirectionChange(value)}
                className={cn(
                  'relative flex h-11 items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium transition-colors duration-200',
                  active ? 'text-terra' : 'bg-white/60 text-ink-2 hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="direction-active"
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute inset-0 rounded-[10px] border border-terra bg-terra/[0.08]"
                  />
                )}
                {!active && <span className="absolute inset-0 rounded-[10px] border border-line" />}
                <Icon className="relative h-4 w-4" strokeWidth={1.75} />
                <span className="relative">{label}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[12px] text-ink-3">自动检测将按简历关键词判定方向</p>
      </div>

      {/* 简历类型 */}
      <div>
        <p className="text-[13px] font-medium tracking-[0.02em] text-ink">简历类型</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {RESUME_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = resumeType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onResumeTypeChange(value)}
                className={cn(
                  'relative flex h-11 items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium transition-colors duration-200',
                  active ? 'text-terra' : 'bg-white/60 text-ink-2 hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="resume-type-active"
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute inset-0 rounded-[10px] border border-terra bg-terra/[0.08]"
                  />
                )}
                {!active && <span className="absolute inset-0 rounded-[10px] border border-line" />}
                <Icon className="relative h-4 w-4" strokeWidth={1.75} />
                <span className="relative">{label}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[12px] text-ink-3">校招与社招的评价标准与出题侧重不同</p>
      </div>

      {/* 所属档案 */}
      <div>
        <p className="text-[13px] font-medium tracking-[0.02em] text-ink">所属档案</p>
        <select
          value={archiveId === null ? 'auto' : String(archiveId)}
          onChange={(e) => {
            const v = e.target.value
            onArchiveChange(v === 'auto' ? null : Number(v))
          }}
          className="mt-2.5 h-11 w-full rounded-[10px] border border-line bg-white/60 px-3.5 text-[14px] text-ink focus:border-terra focus:outline-none focus:ring-2 focus:ring-terra/30"
        >
          <option value="auto">自动（按学生姓名归档）</option>
          {(archivesQuery.data ?? []).map((archive) => (
            <option key={archive.id} value={String(archive.id)}>
              {archive.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[12px] text-ink-3">「自动」将按简历中的学生姓名归档，同名档案直接挂入</p>
      </div>

      {/* 目标岗位 JD（可选） */}
      <div className="flex-1">
        <p className="text-[13px] font-medium tracking-[0.02em] text-ink">
          目标岗位 JD <span className="font-normal text-ink-3">（可选）</span>
        </p>
        <div className="relative mt-2.5">
          <textarea
            value={jd}
            onChange={(e) => onJdChange(e.target.value.slice(0, JD_MAX))}
            placeholder="粘贴 JD 后，评价与出题会结合岗位匹配度"
            className="h-24 w-full resize-none rounded-[10px] border border-line bg-white/60 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-3 focus:border-terra focus:outline-none focus:ring-2 focus:ring-terra/30"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-ink-3">
            {jd.length} / {JD_MAX}
          </span>
        </div>
      </div>

      {/* 主 CTA */}
      <motion.button
        type="button"
        disabled={!canStart}
        onClick={onStart}
        whileTap={canStart ? { scale: 0.97 } : undefined}
        animate={ctaAnimate}
        transition={{ duration: 0.5 }}
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold transition-colors duration-300',
          canStart
            ? 'bg-terra text-surface shadow-card hover:bg-terra-deep'
            : 'cursor-not-allowed bg-ink-3/40 text-surface/80',
        )}
      >
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
        开始分析
      </motion.button>
    </div>
  )
}

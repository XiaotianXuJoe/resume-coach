import { useEffect, useRef } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { FolderOpen, Files, Clock } from 'lucide-react'
import { ScoreRing } from '@/components/ui-ext'
import { formatTime } from './utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** 档案视角统计 */
export interface ArchiveStats {
  /** 档案总数 */
  archives: number
  /** 版本总数 */
  versions: number
  /** 全部版本平均总分 */
  avg: number
  /** 最近分析时间（无版本时为 null） */
  latestAt: Date | string | null
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(wrapRef, { once: true, amount: 0.4 })
  useEffect(() => {
    if (!inView || !ref.current) return
    const controls = animate(0, value, {
      duration: 1,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals)
      },
    })
    return () => controls.stop()
  }, [inView, value, decimals])
  return (
    <span ref={wrapRef}>
      <span ref={ref} className="tabular-nums">
        0
      </span>
    </span>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO, delay: i * 0.08 },
  }),
}

/** Section 1 — 统计条（档案视角）：档案总数 / 版本总数 / 平均总分 / 最近分析 */
export default function StatsBar({ stats }: { stats: ArchiveStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* 档案总数 */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="rounded-2xl border border-line bg-surface p-5 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">档案总数</span>
          <FolderOpen className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-[32px] font-bold leading-none text-ink">
            <CountUp value={stats.archives} />
          </span>
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">份档案</span>
        </div>
      </motion.div>

      {/* 版本总数 */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="rounded-2xl border border-line bg-surface p-5 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">版本总数</span>
          <Files className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-serif text-[32px] font-bold leading-none text-ink">
            <CountUp value={stats.versions} />
          </span>
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">个版本</span>
        </div>
      </motion.div>

      {/* 平均总分 */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-card"
      >
        <div>
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">平均总分</span>
          <div className="mt-3 font-serif text-[32px] font-bold leading-none text-ink">
            <CountUp value={stats.avg} decimals={1} />
          </div>
        </div>
        <ScoreRing score={stats.avg} size={48} />
      </motion.div>

      {/* 最近分析 */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="rounded-2xl border border-line bg-surface p-5 shadow-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium tracking-[0.06em] text-ink-3">最近分析</span>
          <Clock className="h-4 w-4 text-pine" strokeWidth={1.75} />
        </div>
        <div className="mt-3 font-mono text-[18px] font-semibold leading-[1.4] text-ink">
          {stats.latestAt ? formatTime(stats.latestAt) : '—'}
        </div>
      </motion.div>
    </div>
  )
}

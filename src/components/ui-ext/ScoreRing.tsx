import { useEffect, useId, useRef } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
import { scoreColor } from './score'

export interface ScoreRingProps {
  score: number
  /** 三档尺寸 160 / 72 / 48，也可传任意像素值 */
  size?: number
  className?: string
  /** 是否显示中心大数字（48px 迷你档默认隐藏 /100） */
  showFraction?: boolean
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * 评分环：SVG 双环（底环 --line，值环赤陶→琥珀渐变，round 端点），
 * 中心 Serif 大数字 + /100。入场：stroke-dashoffset 1.2s + 数字 count-up。
 */
export default function ScoreRing({
  score,
  size = 160,
  className,
  showFraction,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const gradId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  const stroke = size >= 160 ? 10 : size >= 72 ? 7 : 5
  const r = (size - stroke) / 2 - 2
  const cx = size / 2
  const showFrac = showFraction ?? size >= 72

  useEffect(() => {
    if (!inView || !numRef.current) return
    const controls = animate(0, clamped, {
      duration: 1.2,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = String(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, clamped])

  const numSize = size >= 160 ? 44 : size >= 72 ? 20 : 13

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B9552E" />
            <stop offset="100%" stopColor="#B8892E" />
          </linearGradient>
        </defs>
        {/* 底环 */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E7DCCC" strokeWidth={stroke} />
        {/* 值环 */}
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: clamped / 100 } : {}}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          ref={numRef}
          className="font-serif font-bold leading-none tabular-nums"
          style={{ fontSize: numSize, color: scoreColor(clamped) }}
        >
          0
        </span>
        {showFrac && (
          <span className="mt-1 text-[11px] font-medium tracking-[0.06em] text-ink-3">/100</span>
        )}
      </div>
    </div>
  )
}

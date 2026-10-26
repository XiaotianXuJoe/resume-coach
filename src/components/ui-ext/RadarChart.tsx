import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface RadarDimension {
  name: string
  score: number
}

export interface RadarChartProps {
  /** 维度数据，标准 5 维；不足时按实际项数绘制多边形 */
  data: RadarDimension[]
  /** SVG 宽度（高度按 viewBox 比例自适应） */
  width?: number
  height?: number
  className?: string
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]
const VB_W = 400
const VB_H = 360

/**
 * 定制 SVG 雷达图：3 圈虚线网格 + 轴端标签 + 数据多边形
 * （fill 赤陶 18% / stroke 赤陶 2px / 顶点圆点）。
 */
export default function RadarChart({ data, width = 400, height = 360, className }: RadarChartProps) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  const cx = VB_W / 2
  const cy = VB_H / 2 + 6
  const R = 118
  const n = Math.max(3, data.length)

  const { rings, axes, labels, points } = useMemo(() => {
    const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
    const pt = (i: number, ratio: number): [number, number] => [
      cx + Math.cos(angleAt(i)) * R * ratio,
      cy + Math.sin(angleAt(i)) * R * ratio,
    ]
    const polygon = (ratio: number) =>
      Array.from({ length: n }, (_, i) => pt(i, ratio).map((v) => v.toFixed(2)).join(',')).join(' ')
    const rings = [1 / 3, 2 / 3, 1].map(polygon)
    const axes = Array.from({ length: n }, (_, i) => pt(i, 1))
    const labels = data.map((d, i) => {
      const [x, y] = pt(i, 1.22)
      return { name: d.name, x, y }
    })
    const points = data.map((d, i) => {
      const ratio = Math.max(0, Math.min(100, d.score)) / 100
      const [x, y] = pt(i, ratio)
      return { x, y, score: d.score }
    })
    return { rings, axes, labels, points }
  }, [data, n, cx, cy])

  const dataPolygon = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={height}
      className={cn('mx-auto block', className)}
      role="img"
      aria-label="五维度评分雷达图"
    >
      {/* 网格圈（逐圈淡入） */}
      {rings.map((pts, i) => (
        <motion.polygon
          key={i}
          points={pts}
          fill="none"
          stroke="#E7DCCC"
          strokeWidth={1}
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        />
      ))}
      {/* 轴线 */}
      {axes.map(([x, y], i) => (
        <motion.line
          key={i}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke="#E7DCCC"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
        />
      ))}
      {/* 数据多边形（scale 0→1，origin 中心） */}
      <motion.polygon
        points={dataPolygon}
        fill="rgba(185,85,46,0.18)"
        stroke="#B9552E"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.3 }}
      />
      {/* 顶点圆点 */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#B9552E"
          stroke="#FFFDF9"
          strokeWidth={1.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.55 + i * 0.06 }}
        >
          <title>{`${data[i]?.name ?? ''}：${p.score}`}</title>
        </motion.circle>
      ))}
      {/* 轴端标签 */}
      {labels.map((l, i) => (
        <motion.text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="#6E6455"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
        >
          {l.name}
        </motion.text>
      ))}
    </svg>
  )
}

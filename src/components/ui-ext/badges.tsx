import type { ReactNode, MouseEventHandler } from 'react'
import { cn } from '@/lib/utils'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface PillProps {
  color: string
  children: ReactNode
  dot?: boolean
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  title?: string
}

/** 999px 胶囊基座：8% 浓度底色 + 全浓度文字 + 可选圆点 */
function Pill({ color, children, dot, className, onClick, title }: PillProps) {
  const style = { backgroundColor: hexToRgba(color, 0.08), color }
  const inner = (
    <>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </>
  )
  const cls = cn(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5',
    onClick && 'transition-shadow hover:shadow-card cursor-pointer',
    className,
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={cls} style={style}>
        {inner}
      </button>
    )
  }
  return (
    <span className={cls} style={style} title={title}>
      {inner}
    </span>
  )
}

/* ---------------- SeverityBadge ---------------- */

export type Severity = '高' | '中' | '低'

const SEVERITY_COLOR: Record<Severity, string> = {
  高: '#B4402F', // 柔红
  中: '#B8892E', // 琥珀
  低: '#5E7FA0', // 尘蓝
}

export function SeverityBadge({ level, className }: { level: Severity; className?: string }) {
  return (
    <Pill color={SEVERITY_COLOR[level]} dot className={className}>
      {level}
    </Pill>
  )
}

/* ---------------- SourceBadge ---------------- */

/**
 * 来源徽标：`kb:xxx` 赤陶底胶囊（可传 onClick 跳知识库）；`生成` 松绿底胶囊。
 */
export function SourceBadge({
  source,
  onClick,
  className,
}: {
  source: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}) {
  const isKb = source.startsWith('kb:')
  const color = isKb ? '#B9552E' : '#5C7A67'
  return (
    <Pill
      color={color}
      onClick={isKb ? onClick : undefined}
      title={isKb ? '来自知识库 · 点击查看' : '大模型生成'}
      className={cn(isKb && 'font-mono', className)}
    >
      {source}
    </Pill>
  )
}

/* ---------------- DirectionChip ---------------- */

export type Direction = '自动检测' | 'Java' | 'Python' | 'C++'

const DIRECTION_COLOR: Record<Direction, string> = {
  自动检测: '#6E6455', // ink-2
  Java: '#B9552E',     // 赤陶
  Python: '#5E7FA0',   // 尘蓝
  'C++': '#5C7A67',    // 松绿
}

export function DirectionChip({
  direction,
  suffix,
  className,
}: {
  direction: Direction | string
  /** 如「后端」，拼接在方向名后 */
  suffix?: string
  className?: string
}) {
  const color = DIRECTION_COLOR[direction as Direction] ?? '#6E6455'
  return (
    <Pill color={color} dot className={className}>
      {direction}
      {suffix}
    </Pill>
  )
}

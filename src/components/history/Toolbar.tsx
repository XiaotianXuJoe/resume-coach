import { motion } from 'framer-motion'
import { Search, X, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIRECTIONS } from './utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** 档案排序：最近分析 / 平均分 / 档案名 */
export type SortMode = 'newest' | 'avgScore' | 'name'

export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'newest', label: '最近分析优先' },
  { value: 'avgScore', label: '平均分优先' },
  { value: 'name', label: '档案名排序' },
]

const DIRECTION_PILL_COLOR: Record<string, string> = {
  Java: '#B9552E',
  Python: '#5E7FA0',
  'C++': '#5C7A67',
}

interface ToolbarProps {
  keyword: string
  onKeyword: (v: string) => void
  direction: string // '全部' | Java | Python | C++（作用于版本）
  onDirection: (v: string) => void
  sort: SortMode
  onSort: (v: SortMode) => void
  /** 当前筛选下可见的档案数 */
  matchCount: number
}

/** Section 2 — 工具条：搜索（档案名/版本名/文件名）+ 方向筛选 + 排序（sticky 于 TopBar 之下） */
export default function Toolbar({
  keyword,
  onKeyword,
  direction,
  onDirection,
  sort,
  onSort,
  matchCount,
}: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="sticky top-16 z-30 -mx-2 border-b border-transparent bg-paper/90 px-2 py-3 backdrop-blur-md transition-colors data-[stuck]:border-line"
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* 搜索 */}
        <div className="relative w-[280px] max-w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            strokeWidth={1.75}
          />
          <input
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
            placeholder="搜索档案 / 版本 / 文件名…"
            className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-8 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-terra/30"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => onKeyword('')}
              aria-label="清除搜索"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 transition-colors hover:bg-panel hover:text-ink"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* 方向筛选胶囊组 */}
        <div className="flex items-center gap-1.5">
          {['全部', ...DIRECTIONS].map((d) => {
            const active = direction === d
            const color = d === '全部' ? '#2D2822' : DIRECTION_PILL_COLOR[d]
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDirection(d)}
                className={cn(
                  'h-8 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-200',
                  active
                    ? 'border-transparent text-surface'
                    : 'border-line bg-surface text-ink-2 hover:text-ink',
                )}
                style={active ? { backgroundColor: color } : undefined}
              >
                {d}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* 匹配数量 */}
          <span className="hidden text-[12px] font-medium tracking-[0.06em] text-ink-3 sm:inline">
            匹配 {matchCount} 个档案
          </span>

          {/* 排序下拉（原生 select，样式化） */}
          <div className="relative">
            <ArrowUpDown
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
              strokeWidth={1.75}
            />
            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortMode)}
              aria-label="排序方式"
              className="h-10 appearance-none rounded-[10px] border border-line bg-surface pl-9 pr-8 text-[13px] font-medium text-ink-2 focus:outline-none focus:ring-2 focus:ring-terra/30"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-3">
              ▾
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

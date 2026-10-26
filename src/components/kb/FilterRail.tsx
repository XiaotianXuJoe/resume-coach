import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LANGUAGE_META,
  LANGUAGE_ORDER,
  DIFFICULTIES,
  FREQUENCIES,
  hasActiveFilters,
} from './utils'
import type { KbFilters } from './utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

function GroupTitle({ children }: { children: string }) {
  return (
    <p className="mb-2.5 text-[12px] font-medium tracking-[0.06em] text-ink-3">{children}</p>
  )
}

/** 胶囊（多选/单选通用） */
function Pill({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      animate={{ scale: active ? [1, 0.92, 1] : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition-colors duration-200',
        active
          ? 'border-transparent text-surface'
          : 'border-line bg-surface text-ink-2 hover:text-ink',
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      {children}
    </motion.button>
  )
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

interface FilterRailProps {
  filters: KbFilters
  onChange: (f: KbFilters) => void
  /** 当前语言下可用的 topic */
  topics: string[]
  /** 各语言题数（key 为 language 值） */
  counts: Record<string, number>
  keyword: string
  onClear: () => void
}

/** Section 2.1 — 左侧索引栏（sticky） */
export default function FilterRail({
  filters,
  onChange,
  topics,
  counts,
  keyword,
  onClear,
}: FilterRailProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const showClear = hasActiveFilters(filters, keyword)

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="sticky top-24 self-start rounded-2xl border border-line bg-surface p-5 shadow-card"
    >
      <div className="flex flex-col gap-6">
        {/* 语言分库 */}
        <div>
          <GroupTitle>语言分库</GroupTitle>
          <div className="flex flex-col gap-0.5">
            {LANGUAGE_ORDER.map((lang) => {
              const meta = LANGUAGE_META[lang]
              const active = filters.language === lang
              const count = lang === 'all' ? total : (counts[lang] ?? 0)
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onChange({ ...filters, language: lang, topics: [] })}
                  className={cn(
                    'relative flex h-9 items-center justify-between rounded-[10px] px-3 text-[13px] font-medium transition-colors duration-200',
                    active ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:bg-paper hover:text-ink',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-full bg-terra transition-opacity duration-200',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-ink-3">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 主题 topic */}
        {topics.length > 0 && (
          <div>
            <GroupTitle>主题</GroupTitle>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => {
                const active = filters.topics.includes(t)
                return (
                  <Pill
                    key={t}
                    active={active}
                    color="#B9552E"
                    onClick={() => onChange({ ...filters, topics: toggle(filters.topics, t) })}
                  >
                    {t}
                  </Pill>
                )
              })}
            </div>
          </div>
        )}

        {/* 难度 */}
        <div>
          <GroupTitle>难度</GroupTitle>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <Pill
                key={d}
                active={filters.difficulties.includes(d)}
                color="#6E6455"
                onClick={() =>
                  onChange({ ...filters, difficulties: toggle(filters.difficulties, d) })
                }
              >
                {d}
              </Pill>
            ))}
          </div>
        </div>

        {/* 考频 */}
        <div>
          <GroupTitle>考频</GroupTitle>
          <div className="flex flex-wrap gap-1.5">
            {FREQUENCIES.map((f) => (
              <Pill
                key={f}
                active={filters.frequencies.includes(f)}
                color="#6E6455"
                onClick={() =>
                  onChange({ ...filters, frequencies: toggle(filters.frequencies, f) })
                }
              >
                {f === '高频' && <Flame className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />}
                {f}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {/* 清除全部筛选 */}
      {showClear && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClear}
          className="mt-5 w-full rounded-[10px] px-3 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
        >
          清除全部筛选
        </motion.button>
      )}
    </motion.aside>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  Search,
  SearchX,
  Lightbulb,
  ArrowRight,
  ArrowUpRight,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import FilterRail from '@/components/kb/FilterRail'
import QuestionList from '@/components/kb/QuestionList'
import {
  LANGUAGE_META,
  EMPTY_FILTERS,
  filterItems,
  groupByTopic,
} from '@/components/kb/utils'
import type { KbFilters } from '@/components/kb/utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/* ---------- Section 4 — 页尾说明卡 ---------- */

const STEPS = [
  { title: '按方向过滤分库', desc: 'Java / Python / C++ / 通用，四个分库独立检索' },
  { title: 'TF-IDF 加权检索', desc: '关键词加权，捞取与简历最相关的 top 15 题' },
  { title: '大模型改写生成', desc: '结合学生项目改写成追问，标注 kb:id 来源' },
]

function FooterCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      className="mt-16 rounded-2xl bg-panel p-7"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-surface shadow-card">
          <Lightbulb className="h-5 w-5 text-brass" strokeWidth={1.75} />
        </span>
        <h3 className="font-serif text-[18px] font-bold tracking-[0.01em] text-ink">
          题库如何参与出题？
        </h3>
      </div>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            className="flex flex-1 items-center gap-4"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.15 + i * 0.12 }}
          >
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-ink">
                <span className="mr-2 font-mono text-[13px] text-terra">{`0${i + 1}`}</span>
                {s.title}
              </p>
              <p className="mt-1 text-[13px] leading-[1.7] text-ink-2">{s.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight
                className="hidden h-4 w-4 shrink-0 text-ink-3 md:mx-2 md:block"
                strokeWidth={1.75}
              />
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-7 border-t border-ink/10 pt-5">
        <motion.span whileTap={{ scale: 0.97 }} className="inline-block">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-5 text-[14px] font-medium text-ink transition-all duration-200 hover:-translate-y-px hover:shadow-card"
          >
            回到工作台分析一份简历
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </motion.span>
      </div>
    </motion.section>
  )
}

/* ---------- Section 5 — 空态 ---------- */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <SearchX className="h-10 w-10 text-ink-3" strokeWidth={1.5} />
      </motion.span>
      <motion.h2
        className="mt-4 font-serif text-[20px] font-bold text-ink"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
      >
        没有匹配的题目
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.18 }}
        className="mt-5"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onClear}
          className="h-10 rounded-[10px] border border-line bg-surface px-5 text-[14px] font-medium text-ink transition-all duration-200 hover:-translate-y-px hover:shadow-card"
        >
          清除全部筛选
        </motion.button>
      </motion.div>
    </div>
  )
}

/* ---------- 页面 ---------- */

export default function Kb() {
  const { data, isLoading } = trpc.kb.list.useQuery(undefined)
  const items = useMemo(() => data?.items ?? [], [data])

  const [filters, setFilters] = useState<KbFilters>(EMPTY_FILTERS)
  const [keyword, setKeyword] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  const [searchParams, setSearchParams] = useSearchParams()
  const handledQ = useRef<string | null>(null)

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  // 各语言题数
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const it of items) map[it.language] = (map[it.language] ?? 0) + 1
    return map
  }, [items])

  // 当前语言下的 topic 列表
  const topics = useMemo(() => {
    const pool = filters.language === 'all' ? items : items.filter((it) => it.language === filters.language)
    return [...new Set(pool.map((it) => it.topic))]
  }, [items, filters.language])

  const filtered = useMemo(() => filterItems(items, filters, keyword), [items, filters, keyword])
  const groups = useMemo(() => groupByTopic(filtered), [filtered])

  const clearAll = () => {
    setFilters(EMPTY_FILTERS)
    setKeyword('')
  }

  const toggleOne = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // URL 深链：?q=<题目id> → 清筛选、展开、滚动定位、高亮 2s
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q || items.length === 0 || handledQ.current === q) return
    const target = items.find((it) => it.id === q)
    handledQ.current = q
    setSearchParams({}, { replace: true })
    if (!target) return
    setFilters(EMPTY_FILTERS)
    setKeyword('')
    setExpandedIds(new Set([q]))
    setHighlightId(q)
    const scrollTimer = setTimeout(() => {
      itemRefs.current.get(q)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 250)
    const highlightTimer = setTimeout(() => setHighlightId(null), 2300)
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(highlightTimer)
    }
  }, [searchParams, items, setSearchParams])

  const statPills = [
    { key: 'total', label: `共 ${items.length} 题`, color: '#2D2822' },
    ...(['java', 'python', 'cpp', 'llm', 'frontend', 'test', 'data', 'common'] as const).map((lang) => ({
      key: lang,
      label: `${LANGUAGE_META[lang].short} ${counts[lang] ?? 0}`,
      color: LANGUAGE_META[lang].color,
    })),
  ]

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-10 lg:px-10">
      {/* Section 1 — 页头 */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="mb-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[640px]">
            <h1 className="font-serif text-[28px] font-bold leading-[1.3] tracking-[0.01em] text-ink">
              面试题知识库
            </h1>
            <p className="mt-3 text-[15px] leading-[1.8] text-ink-2">
              分析简历时，系统会按求职方向从这里检索与简历技术栈最相关的题目，交给大模型改写生成面试题。标注
              <code className="mx-1 rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[12px] text-terra">
                kb:xxx
              </code>
              的题目即来源于此。
            </p>
          </div>
          {/* 统计胶囊行 */}
          <div className="flex flex-wrap gap-2">
            {statPills.map((p, i) => (
              <motion.span
                key={p.key}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 + i * 0.06 }}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink-2 shadow-card"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="font-mono tabular-nums">{p.label}</span>
              </motion.span>
            ))}
          </div>
        </div>
      </motion.header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="h-[420px] animate-pulse rounded-2xl bg-panel" />
          <div className="flex flex-col gap-3 lg:col-span-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[64px] animate-pulse rounded-[14px] bg-panel" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* 左：索引栏 */}
          <FilterRail
            filters={filters}
            onChange={setFilters}
            topics={topics}
            counts={counts}
            keyword={keyword}
            onClear={clearAll}
          />

          {/* 右：题目区 */}
          <div className="min-w-0 lg:col-span-3">
            {/* 搜索与计数 */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="mb-3 flex items-center gap-3"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
                  strokeWidth={1.75}
                />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索题目关键词，如：索引、事务、GIL…"
                  className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-4 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-terra/30"
                />
              </div>
              <span className="shrink-0 text-[12px] font-medium tracking-[0.06em] text-ink-3">
                匹配 <span className="font-mono tabular-nums">{filtered.length}</span> /{' '}
                <span className="font-mono tabular-nums">{items.length}</span> 题
              </span>
            </motion.div>

            {/* 工具行：全部展开 / 全部收起 */}
            <div className="mb-5 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setExpandedIds(new Set(filtered.map((it) => it.id)))}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              >
                <ChevronsUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                全部展开
              </button>
              <button
                type="button"
                onClick={() => setExpandedIds(new Set())}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              >
                <ChevronsDownUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                全部收起
              </button>
            </div>

            {/* 题目列表 / 空态 */}
            {filtered.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <QuestionList
                groups={groups}
                expandedIds={expandedIds}
                highlightId={highlightId}
                onToggle={toggleOne}
                registerRef={registerRef}
              />
            )}

            {/* 页尾说明卡 */}
            <FooterCard />
          </div>
        </div>
      )}
    </div>
  )
}

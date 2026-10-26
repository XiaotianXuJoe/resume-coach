import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Flame, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KBItem } from '@contracts/types'
import { DIFFICULTY_COLOR, FREQUENCY_COLOR } from './utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 徽标胶囊：8% 浓度底色 + 全浓度文字 */
function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5"
      style={{ backgroundColor: hexToRgba(color, 0.08), color }}
    >
      {children}
    </span>
  )
}

interface QuestionCardProps {
  item: KBItem
  open: boolean
  highlighted: boolean
  onToggle: (id: string) => void
  registerRef: (id: string, el: HTMLDivElement | null) => void
  index: number
}

function QuestionCard({ item, open, highlighted, onToggle, registerRef, index }: QuestionCardProps) {
  const freqColor = FREQUENCY_COLOR[item.frequency] ?? '#6E6455'
  const diffColor = DIFFICULTY_COLOR[item.difficulty] ?? '#6E6455'
  return (
    <motion.div
      ref={(el) => registerRef(item.id, el)}
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: Math.min(index, 10) * 0.03 }}
      className={cn(
        'overflow-hidden rounded-[14px] border bg-surface shadow-card transition-colors duration-300',
        highlighted ? 'border-terra ring-2 ring-terra/60' : 'border-line',
      )}
    >
      {/* 标题行 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(item.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(item.id)
          }
        }}
        className="flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-paper"
      >
        <code className="shrink-0 rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[12px] text-ink-2">
          {item.id}
        </code>
        <span className="min-w-0 flex-1 text-[15px] font-medium leading-[1.6] text-ink">
          {item.question}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Tag color={diffColor}>{item.difficulty}</Tag>
          <Tag color={freqColor}>
            {item.frequency === '高频' && (
              <Flame className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
            )}
            {item.frequency}
          </Tag>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300',
            open && 'rotate-180',
          )}
          strokeWidth={1.75}
        />
      </div>
      {/* 展开内容：答题要点 */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-4">
              <p className="mb-2.5 text-[12px] font-medium tracking-[0.06em] text-ink-3">
                答题要点
              </p>
              <ul className="flex flex-col gap-2">
                {item.answer_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.8] text-ink-2">
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-terra" />
                    {pt}
                  </li>
                ))}
              </ul>
              <p className="mt-4 inline-flex items-start gap-1.5 text-[12px] leading-[1.7] text-ink-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" strokeWidth={1.75} />
                该题在分析中可能被打捞并改写为贴合学生项目的追问。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface QuestionListProps {
  groups: { topic: string; items: KBItem[] }[]
  expandedIds: Set<string>
  highlightId: string | null
  onToggle: (id: string) => void
  registerRef: (id: string, el: HTMLDivElement | null) => void
}

/** Section 2.3 — 题目列表：按主题分组的手风琴 */
export default function QuestionList({
  groups,
  expandedIds,
  highlightId,
  onToggle,
  registerRef,
}: QuestionListProps) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((g, gi) => (
        <motion.section
          key={g.topic}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: gi * 0.04 }}
        >
          {/* 组头 */}
          <div className="mb-3 flex items-center gap-3">
            <h3 className="shrink-0 font-serif text-[16px] font-bold tracking-[0.02em] text-ink">
              {g.topic}
            </h3>
            <span className="shrink-0 rounded-full bg-panel px-2.5 py-0.5 font-mono text-[12px] tabular-nums text-ink-2">
              {g.items.length}
            </span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          {/* 组内题目卡 */}
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {g.items.map((item, i) => (
                <QuestionCard
                  key={item.id}
                  item={item}
                  index={i}
                  open={expandedIds.has(item.id)}
                  highlighted={highlightId === item.id}
                  onToggle={onToggle}
                  registerRef={registerRef}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      ))}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Quote, CheckCircle2, PencilLine, MoveRight, ClipboardCheck } from 'lucide-react'
import type { EvaluationResult, EvalIssue } from '@contracts/types'
import { ScoreRing, RadarChart, SeverityBadge, scoreColor } from '@/components/ui-ext'
import type { Severity } from '@/components/ui-ext'
import { cn } from '@/lib/utils'
import AccordionCard from './AccordionCard'

const SEVERITY_ORDER: Record<Severity, number> = { 高: 0, 中: 1, 低: 2 }
const SEVERITY_ACTIVE_CLS: Record<Severity, string> = {
  高: 'bg-softred text-surface border-softred',
  中: 'bg-brass text-surface border-brass',
  低: 'bg-dusty text-surface border-dusty',
}

interface ReportTabProps {
  evaluation: EvaluationResult
}

/** Tab ① 评价报告：评分卡 + 雷达卡 + 问题清单（severity 筛选 + 高→中→低 排序手风琴）。 */
export default function ReportTab({ evaluation }: ReportTabProps) {
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const [openKeys, setOpenKeys] = useState<Set<number>>(new Set([0]))

  const sortedIssues = useMemo(
    () =>
      [...evaluation.issues].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      ),
    [evaluation.issues],
  )
  const filtered = useMemo(
    () => (filter === 'all' ? sortedIssues : sortedIssues.filter((i) => i.severity === filter)),
    [sortedIssues, filter],
  )
  const counts = useMemo(() => {
    const c: Record<Severity, number> = { 高: 0, 中: 0, 低: 0 }
    for (const i of evaluation.issues) c[i.severity] += 1
    return c
  }, [evaluation.issues])

  const toggle = (key: number) =>
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const score = evaluation.overall_score

  return (
    <div className="space-y-10">
      {/* 上：评分卡 + 雷达卡 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 左列 · 评分卡 */}
        <div className="rounded-2xl border border-line bg-surface p-7 shadow-card lg:col-span-2">
          <div className="flex flex-col items-center">
            <ScoreRing score={score} size={160} />
            <p className="mt-3 font-serif text-[22px] font-bold" style={{ color: scoreColor(score) }}>
              综合评分
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6"
          >
            <Quote className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
            <p className="mt-2 text-[15px] leading-[1.8] text-ink">{evaluation.summary}</p>
          </motion.div>
          {evaluation.strengths.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[12px] font-medium tracking-[0.06em] text-ink-3">简历亮点</p>
              <ul className="mt-3 space-y-2.5">
                {evaluation.strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pine" strokeWidth={1.75} />
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 右列 · 雷达卡 */}
        <div className="rounded-2xl border border-line bg-surface p-7 shadow-card lg:col-span-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] font-bold tracking-[0.02em] text-ink">五维度评分</h3>
            <p className="text-[12px] text-ink-3">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-terra align-middle" />
              本次得分
            </p>
          </div>
          <RadarChart
            data={evaluation.dimensions.map((d) => ({ name: d.name, score: d.score }))}
            className="mt-4"
          />
          <ul className="mt-4 space-y-3.5 border-t border-line pt-5">
            {evaluation.dimensions.map((d, i) => (
              <motion.li
                key={d.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[14px] font-semibold text-ink">{d.name}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="h-full rounded-full bg-terra"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, d.score))}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.08 }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[13px] tabular-nums text-ink-2">
                    {d.score}
                  </span>
                </div>
                <p className="mt-1 pl-[92px] text-[13px] leading-relaxed text-ink-2">
                  {d.comment}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* 下：问题清单 */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-serif text-[20px] font-bold tracking-[0.01em] text-ink">
            <span className="h-[0.9em] w-1 rounded-sm bg-terra" />
            问题与修改建议
          </h2>
          <div className="flex gap-2">
            {(['all', '高', '中', '低'] as const).map((key) => {
              const active = filter === key
              const n = key === 'all' ? evaluation.issues.length : counts[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFilter(key)
                    setOpenKeys(new Set([0]))
                  }}
                  className={cn(
                    'h-8 rounded-full border px-3.5 text-[12px] font-medium transition-colors duration-200',
                    active
                      ? key === 'all'
                        ? 'border-ink bg-ink text-surface'
                        : SEVERITY_ACTIVE_CLS[key]
                      : 'border-line bg-surface text-ink-2 hover:text-ink',
                  )}
                >
                  {key === 'all' ? '全部' : key}({n})
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-line bg-surface px-8 py-12 text-center shadow-card">
            <ClipboardCheck className="h-8 w-8 text-pine" strokeWidth={1.5} />
            <p className="mt-3 font-serif text-[18px] font-bold text-ink">
              未发现明显问题，这份简历很扎实
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filtered.map((issue, i) => (
              <motion.div
                key={`${issue.severity}-${issue.location}-${i}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.05 }}
              >
                <IssueCard
                  issue={issue}
                  open={openKeys.has(i)}
                  onToggle={() => toggle(i)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function IssueCard({
  issue,
  open,
  onToggle,
}: {
  issue: EvalIssue
  open: boolean
  onToggle: () => void
}) {
  return (
    <AccordionCard
      open={open}
      onToggle={onToggle}
      header={
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <SeverityBadge level={issue.severity} />
          <span className="max-w-[220px] truncate font-mono text-[12px] text-ink-2">
            {issue.location}
          </span>
          <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
            {issue.problem}
          </span>
        </span>
      }
    >
      {/* 修改建议 */}
      <div>
        <p className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] text-ink-3">
          <PencilLine className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
          修改建议
        </p>
        <p className="mt-2 text-[15px] leading-[1.8] text-ink">{issue.suggestion}</p>
      </div>
      {/* 示例改写（红笔批注风） */}
      {issue.example_rewrite && (
        <div className="mt-4 rounded-lg border-l-[3px] border-terra bg-terra/[0.04] px-4 py-3">
          <p className="text-[12px] font-medium tracking-[0.06em] text-ink-3">示例改写</p>
          <RewriteView text={issue.example_rewrite} />
        </div>
      )}
    </AccordionCard>
  )
}

/**
 * 示例改写渲染：若文本含「→」则按「修改前 → 修改后」分段，
 * 修改后半段用松绿加粗显示；否则整段原文展示。
 */
function RewriteView({ text }: { text: string }) {
  const parts = text.split('→').map((s) => s.trim()).filter(Boolean)
  if (parts.length < 2) {
    return <p className="mt-2 text-[14px] leading-[1.8] text-ink-2">{text}</p>
  }
  return (
    <div className="mt-3 flex flex-wrap items-start gap-x-2 gap-y-2">
      <span className="rounded-md bg-paper px-2.5 py-1 font-mono text-[13px] leading-relaxed text-ink-2">
        {parts[0]}
      </span>
      <MoveRight className="mt-1.5 h-4 w-4 shrink-0 text-terra" strokeWidth={1.75} />
      <span className="rounded-md bg-pine/[0.08] px-2.5 py-1 text-[13px] font-semibold leading-relaxed text-pine">
        {parts.slice(1).join(' → ')}
      </span>
    </div>
  )
}

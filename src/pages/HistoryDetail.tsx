import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileClock,
  FileDown,
  FileJson,
  FileQuestion,
  FolderOpen,
  Trash2,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  MapPin,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { trpc } from '@/providers/trpc'
import {
  ScoreRing,
  RadarChart,
  SeverityBadge,
  SourceBadge,
  DirectionChip,
  scoreColor,
} from '@/components/ui-ext'
import { formatTime, normalizeDirection, normalizeResumeType } from '@/components/history/utils'
import { AnswerPoints, RewriteView } from '@/components/history/detail-blocks'
import InlineRename from '@/components/history/InlineRename'
import { archiveApi, invalidateArchives } from '@/components/history/archive-api'
import type { AnalysisDetail, EvalIssue, InterviewTier } from '@contracts/types'

/** history.get 返回的详情附带所属档案名（contracts 中 AnalysisDetail 未声明，按接口约定扩展） */
type DetailWithArchive = AnalysisDetail & { archiveName?: string | null }

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/* ---------- 区块头（印章红竖线 + 衬线标题） ---------- */

function Section({
  title,
  index,
  children,
  className,
}: {
  title: string
  index: number
  children: ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.12 + index * 0.07 }}
      className={className}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="h-[0.9em] w-1 rounded-sm bg-terra text-[18px]" aria-hidden />
        <h2 className="font-serif text-[20px] font-bold leading-[1.4] tracking-[0.01em] text-ink">
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  )
}

/* ---------- 评价报告（左栏） ---------- */

function EvaluationPanel({ detail }: { detail: AnalysisDetail }) {
  const { evaluation } = detail
  return (
    <div className="flex flex-col gap-5">
      {/* 总评 */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <p className="break-words text-[15px] leading-[1.75] text-ink-2">{evaluation.summary}</p>
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2.5 text-[13px] font-semibold text-ink">亮点</p>
          {evaluation.strengths.length === 0 ? (
            <p className="text-[13px] leading-[1.7] text-ink-3">暂未提炼出明确亮点。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] leading-[1.7] text-ink-2">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-pine" strokeWidth={1.75} />
                  <span className="min-w-0 break-words">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 五维雷达 + 维度明细 */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="flex justify-center">
          <RadarChart
            data={evaluation.dimensions.map((d) => ({ name: d.name, score: d.score }))}
            width={320}
            height={288}
          />
        </div>
        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5">
          {evaluation.dimensions.map((d, i) => (
            <div key={d.name}>
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] font-medium text-ink">{d.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: scoreColor(d.score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.3 + i * 0.06 }}
                  />
                </div>
                <span
                  className="w-8 text-right font-mono text-[13px] font-semibold tabular-nums"
                  style={{ color: scoreColor(d.score) }}
                >
                  {d.score}
                </span>
              </div>
              {d.comment && (
                <p className="mt-1.5 pl-[108px] text-[13px] leading-[1.7] text-ink-3">
                  {d.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- 问题清单（右栏，完整显示） ---------- */

const SEVERITY_ORDER = ['高', '中', '低'] as const

function IssueCard({ issue, index }: { issue: EvalIssue; index: number }) {
  const iconColor =
    issue.severity === '高' ? 'text-softred' : issue.severity === '中' ? 'text-brass' : 'text-dusty'
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.2 + index * 0.04 }}
      className="rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-hover"
    >
      <div className="flex items-start gap-2.5">
        <CircleAlert className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge level={issue.severity} />
            {issue.location && (
              <span className="inline-flex min-w-0 items-center gap-1 break-all text-[12px] text-ink-3">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {issue.location}
              </span>
            )}
          </div>
          {/* 问题描述完整展示，不换行截断 */}
          <p className="mt-2 break-words text-[14px] font-medium leading-[1.75] text-ink">
            {issue.problem}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3 text-[13px] leading-[1.8]">
        <p className="break-words text-ink-2">
          <span className="font-medium text-ink">修改建议：</span>
          {issue.suggestion}
        </p>
        {issue.example_rewrite && (
          <div className="rounded-[10px] bg-paper px-3.5 py-2.5">
            <RewriteView text={issue.example_rewrite} />
          </div>
        )}
      </div>
    </motion.article>
  )
}

function IssuePanel({ issues }: { issues: EvalIssue[] }) {
  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  )
  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-6 text-[14px] text-ink-3 shadow-card">
          <CircleCheck className="h-4 w-4 shrink-0 text-pine" strokeWidth={1.75} />
          没有发现问题，这份简历完成度很高。
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_ORDER.map((s) => {
              const count = issues.filter((i) => i.severity === s).length
              return (
                <span
                  key={s}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[12px] font-medium text-ink-2',
                    count === 0 && 'opacity-45',
                  )}
                >
                  <SeverityBadge level={s} />
                  <span className="font-mono tabular-nums">{count}</span>
                </span>
              )
            })}
          </div>
          {sorted.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </>
      )}
    </div>
  )
}

/* ---------- 面试题库（三档完整展示） ---------- */

const TIER_COLOR: Record<string, string> = {
  基础必考: '#5E7FA0',
  项目深挖: '#B9552E',
  八股与压力追问: '#B8892E',
}

function tierColor(tier: string): string {
  for (const key of Object.keys(TIER_COLOR)) {
    if (tier.includes(key)) return TIER_COLOR[key]
  }
  return '#6E6455'
}

function InterviewPanel({ tiers }: { tiers: InterviewTier[] }) {
  const navigate = useNavigate()
  const nonEmpty = tiers.filter((t) => t.questions.length > 0)
  if (nonEmpty.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-[14px] text-ink-3 shadow-card">
        本次分析未生成面试题。
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-8">
      {nonEmpty.map((t) => (
        <div key={t.tier}>
          {/* 档位分节标题 */}
          <div className="mb-3 flex items-center gap-2.5 border-b border-line pb-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tierColor(t.tier) }}
              aria-hidden
            />
            <h3 className="text-[16px] font-bold leading-[1.5] tracking-[0.02em] text-ink">
              {t.tier}
            </h3>
            <span className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[12px] tabular-nums text-ink-2">
              {t.questions.length} 题
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {t.questions.map((q, i) => (
              <article
                key={i}
                className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-[14px] font-medium leading-[1.75] text-ink">
                    <span className="mr-2 font-mono text-[12px] tabular-nums text-ink-3">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {q.question}
                  </p>
                  <SourceBadge
                    source={q.source}
                    className="mt-0.5 shrink-0"
                    onClick={() => {
                      if (q.source.startsWith('kb:')) {
                        navigate(`/kb?q=${encodeURIComponent(q.source.slice(3))}`)
                      }
                    }}
                  />
                </div>
                <p className="break-words text-[13px] leading-[1.8] text-ink-2">
                  <span className="font-medium text-ink">考察意图：</span>
                  {q.intent}
                </p>
                <div className="text-[13px] leading-[1.8]">
                  <span className="font-medium text-ink">回答方向：</span>
                  <div className="mt-1">
                    <AnswerPoints text={q.answer_direction} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- 页面 ---------- */

export default function HistoryDetail() {
  const params = useParams()
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const id = Number(params.id)
  const validId = Number.isInteger(id) && id > 0

  const detailQuery = trpc.history.get.useQuery({ id: validId ? id : 0 }, { enabled: validId })
  const detail = detailQuery.data as DetailWithArchive | undefined

  const [confirming, setConfirming] = useState(false)
  const removeMutation = trpc.history.remove.useMutation({
    onSuccess: () => {
      toast.success('已删除')
      utils.history.list.invalidate()
      invalidateArchives(utils)
      utils.history.get.invalidate({ id })
      navigate('/history')
    },
    onError: (err) => {
      toast.error(`删除失败：${err.message}`)
    },
  })

  const renameVersionMutation = archiveApi.history.renameVersion.useMutation({
    onSuccess: () => {
      toast.success('版本已重命名')
      utils.history.get.invalidate({ id })
      utils.history.list.invalidate()
      invalidateArchives(utils)
    },
    onError: (err) => {
      toast.error(`重命名失败：${err.message}`)
    },
  })

  const handleExport = () => {
    if (!detail) return
    const blob = new Blob([JSON.stringify(detail, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const base = detail.filename.replace(/\.[^.]+$/, '') || `analysis-${detail.id}`
    a.href = url
    a.download = `${base}-分析报告.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已导出 JSON')
  }

  /* 无效 id / 记录不存在 */
  if (!validId || detailQuery.isError) {
    return (
      <div className="mx-auto flex max-w-[1120px] flex-col items-center px-6 pb-24 pt-24 text-center lg:px-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-card">
          <FileQuestion className="h-6 w-6 text-ink-3" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 break-words font-serif text-[24px] font-bold text-ink">
          {detailQuery.isError ? detailQuery.error.message : '记录不存在'}
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">这条分析记录可能已被删除。</p>
        <Link
          to="/history"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-[10px] bg-terra px-5 text-[14px] font-medium text-surface transition-colors hover:bg-terra-deep"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          返回分析档案
        </Link>
      </div>
    )
  }

  const actionBtn =
    'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-all duration-200 disabled:opacity-60'

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-10 lg:px-10">
      {/* 页头 */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="mb-8"
      >
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          返回分析档案
        </Link>

        {detailQuery.isLoading || !detail ? (
          <div className="mt-5 flex flex-col gap-4">
            <div className="h-9 w-72 animate-pulse rounded-md bg-panel" />
            <div className="h-5 w-48 animate-pulse rounded-md bg-panel" />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <ScoreRing score={detail.evaluation.overall_score} size={104} className="shrink-0" />
              <div className="min-w-0">
                {/* 面包屑：档案「{archiveName}」 · {versionName}（版本名可内联改名） */}
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-medium tracking-[0.04em] text-ink-3">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    档案「{detail.archiveName ?? '未归档'}」
                  </span>
                  <span aria-hidden>·</span>
                  <InlineRename
                    value={detail.versionName ?? `版本 ${detail.id}`}
                    onSave={(name) =>
                      renameVersionMutation.mutate({ id: detail.id, versionName: name })
                    }
                    ariaLabel="重命名版本"
                    className="text-[12px] font-medium tracking-[0.04em] text-ink-3"
                    inputClassName="w-40 max-w-full text-[12px]"
                  />
                </div>
                <h1 className="break-all font-serif text-[28px] font-bold leading-[1.3] tracking-[0.01em] text-ink">
                  {detail.filename}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <DirectionChip direction={normalizeDirection(detail.direction)} />
                  {normalizeResumeType(detail.resumeType) && (
                    <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[12px] font-medium text-ink-2">
                      {normalizeResumeType(detail.resumeType)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-mono text-[12px] text-ink-3">
                    <FileClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {formatTime(detail.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作组 */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {detail.originalFileName && (
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={`/api/files/${detail.id}`}
                  title={`下载 ${detail.originalFileName}`}
                  className={cn(
                    actionBtn,
                    'bg-terra text-surface transition-colors hover:bg-terra-deep',
                  )}
                >
                  <FileDown className="h-4 w-4" strokeWidth={1.75} />
                  下载原始简历
                </motion.a>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                className={cn(
                  actionBtn,
                  'border border-line bg-surface text-ink hover:-translate-y-px hover:shadow-card',
                )}
              >
                <FileJson className="h-4 w-4" strokeWidth={1.75} />
                导出 JSON
              </motion.button>
              {confirming ? (
                <span className="inline-flex flex-wrap items-center gap-2 rounded-[10px] border border-softred/30 bg-softred/5 px-3 py-1.5">
                  <span className="text-[13px] font-medium text-ink">确认删除？</span>
                  <button
                    type="button"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate({ id: detail.id })}
                    className="h-7 rounded-[8px] bg-softred px-3 text-[12px] font-medium text-surface transition-colors hover:bg-softred/90 disabled:opacity-60"
                  >
                    {removeMutation.isPending ? '删除中…' : '确认删除'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="h-7 rounded-[8px] border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
                  >
                    取消
                  </button>
                </span>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirming(true)}
                  className={cn(
                    actionBtn,
                    'border border-line bg-surface text-ink-2 hover:border-softred/40 hover:bg-softred/5 hover:text-softred',
                  )}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  删除
                </motion.button>
              )}
            </div>
          </div>
        )}
      </motion.header>

      {detailQuery.isLoading || !detail ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[360, 480].map((h, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-panel" style={{ height: h }} />
          ))}
        </div>
      ) : (
        <>
          {/* 主体：评价报告 + 问题清单 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Section title="评价报告" index={0}>
              <EvaluationPanel detail={detail} />
            </Section>
            <Section title="问题清单" index={1}>
              <IssuePanel issues={detail.evaluation.issues} />
            </Section>
          </div>

          {/* 面试题库 */}
          <Section title="面试题库" index={2} className="mt-12">
            <InterviewPanel tiers={detail.interview.tiers} />
          </Section>

          {/* 知识库命中 */}
          {detail.kbIds.length > 0 && (
            <Section title="知识库命中" index={3} className="mt-12">
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <div className="flex flex-wrap gap-2">
                  {detail.kbIds.map((kbId) => (
                    <SourceBadge
                      key={kbId}
                      source={`kb:${kbId}`}
                      onClick={() => navigate(`/kb?q=${encodeURIComponent(kbId)}`)}
                    />
                  ))}
                </div>
                <p className="mt-3 inline-flex items-start gap-1.5 text-[12px] leading-[1.7] text-ink-3">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" strokeWidth={1.75} />
                  点击徽标可跳到知识库查看原题与答题要点。
                </p>
              </div>
            </Section>
          )}

          {/* 简历原文 */}
          <Section title="简历原文" index={4} className="mt-12">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <pre className="max-h-[560px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.7] text-ink-2">
                {detail.resumeText}
              </pre>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

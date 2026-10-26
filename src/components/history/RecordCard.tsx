import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Download, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreRing, DirectionChip, scoreColor } from '@/components/ui-ext'
import type { AnalysisSummary } from '@contracts/types'
import { formatTime, normalizeDirection, normalizeResumeType } from './utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

export interface CardOverview {
  /** severity 计数 */
  issues: { 高: number; 中: number; 低: number }
  /** 面试题总数 */
  interviews: number
}

interface RecordCardProps {
  record: AnalysisSummary
  overview?: CardOverview
  index: number
  deleting: boolean
  onOpen: (id: number) => void
  onExport: (id: number) => void
  onDelete: (id: number) => void
}

function ActionButtons({
  record,
  onOpen,
  onExport,
  onDelete,
  className,
}: {
  record: AnalysisSummary
  onOpen: (id: number) => void
  onExport: (id: number) => void
  onDelete: (id: number) => void
  className?: string
}) {
  const btn =
    'flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-3 transition-colors duration-200 hover:bg-panel hover:text-ink'
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        aria-label="查看详情"
        title="查看详情"
        className={btn}
        onClick={(e) => {
          e.stopPropagation()
          onOpen(record.id)
        }}
      >
        <Eye className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="导出 JSON"
        title="导出 JSON"
        className={btn}
        onClick={(e) => {
          e.stopPropagation()
          onExport(record.id)
        }}
      >
        <Download className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="删除记录"
        title="删除记录"
        className={cn(btn, 'hover:bg-softred/10 hover:text-softred')}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(record.id)
        }}
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

function IssueSummary({ overview }: { overview?: CardOverview }) {
  if (!overview) return null
  const { issues, interviews } = overview
  const items = [
    { n: issues.高, label: '高', color: '#B4402F' },
    { n: issues.中, label: '中', color: '#B8892E' },
    { n: issues.低, label: '低', color: '#5E7FA0' },
  ]
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium tracking-[0.02em] text-ink-3">
      <span className="inline-flex items-center gap-1.5">
        {items.map((it, i) => (
          <span key={it.label} className="inline-flex items-center gap-1">
            {i > 0 && <span className="mr-1 text-ink-3">·</span>}
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: it.color }} />
            <span className="tabular-nums">{it.n}</span>
            {it.label}
          </span>
        ))}
      </span>
      <span>面试题 {interviews} 道</span>
    </div>
  )
}

/** 卡片视图 */
export function RecordCard({
  record,
  overview,
  index,
  deleting,
  onOpen,
  onExport,
  onDelete,
}: RecordCardProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: (index % 6) * 0.06 }}
      animate={confirming ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      className={cn(
        'group relative cursor-pointer rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-hover',
        deleting && 'pointer-events-none opacity-60',
      )}
      onClick={() => onOpen(record.id)}
    >
      {confirming ? (
        /* 内联二次确认态 */
        <div className="flex h-full min-h-[96px] flex-col justify-center gap-3">
          <p className="text-[14px] font-medium text-ink">确认删除该记录？此操作不可恢复。</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              className="h-8 rounded-[10px] bg-softred px-4 text-[13px] font-medium text-surface transition-colors hover:bg-softred/90 disabled:opacity-60"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(record.id)
              }}
            >
              {deleting ? '删除中…' : '确认删除'}
            </button>
            <button
              type="button"
              className="h-8 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
              onClick={(e) => {
                e.stopPropagation()
                setConfirming(false)
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <ScoreRing score={record.overallScore} size={48} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink" title={record.filename}>
              {record.filename}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <DirectionChip direction={normalizeDirection(record.direction)} />
              {normalizeResumeType(record.resumeType) && (
                <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[12px] font-medium text-ink-2">
                  {normalizeResumeType(record.resumeType)}
                </span>
              )}
              <span className="font-mono text-[12px] text-ink-3">
                {formatTime(record.createdAt)}
              </span>
            </div>
            <IssueSummary overview={overview} />
          </div>
          {/* hover 显现的操作组 */}
          <ActionButtons
            record={record}
            onOpen={onOpen}
            onExport={onExport}
            onDelete={() => setConfirming(true)}
            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        </div>
      )}
    </motion.div>
  )
}

/** 紧凑行视图 */
export function RecordRow({
  record,
  overview,
  index,
  deleting,
  onOpen,
  onExport,
  onDelete,
}: RecordCardProps) {
  const [confirming, setConfirming] = useState(false)
  const color = scoreColor(record.overallScore)

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ scale: 0.98, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: (index % 8) * 0.04 }}
      animate={confirming ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      className={cn(
        'group flex h-[72px] cursor-pointer items-center gap-4 rounded-[14px] border border-line bg-surface px-5 shadow-card transition-colors duration-200 hover:bg-panel/50',
        deleting && 'pointer-events-none opacity-60',
      )}
      onClick={() => onOpen(record.id)}
    >
      {confirming ? (
        <div className="flex flex-1 items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-ink">确认删除该记录？</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              className="h-7 rounded-[8px] bg-softred px-3 text-[12px] font-medium text-surface transition-colors hover:bg-softred/90 disabled:opacity-60"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(record.id)
              }}
            >
              {deleting ? '删除中…' : '确认删除'}
            </button>
            <button
              type="button"
              className="h-7 rounded-[8px] border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
              onClick={(e) => {
                e.stopPropagation()
                setConfirming(false)
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 色阶分数点 + 分数 */}
          <span className="flex w-12 shrink-0 items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-[14px] font-semibold tabular-nums" style={{ color }}>
              {record.overallScore}
            </span>
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink" title={record.filename}>
            {record.filename}
          </span>
          {overview && (
            <span className="hidden shrink-0 text-[12px] text-ink-3 lg:inline">
              {overview.issues.高 + overview.issues.中 + overview.issues.低} 问题 · {overview.interviews} 题
            </span>
          )}
          <DirectionChip direction={normalizeDirection(record.direction)} className="shrink-0" />
          <span className="hidden shrink-0 font-mono text-[12px] text-ink-3 md:inline">
            {formatTime(record.createdAt)}
          </span>
          <ActionButtons
            record={record}
            onOpen={onOpen}
            onExport={onExport}
            onDelete={() => setConfirming(true)}
            className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        </>
      )}
    </motion.div>
  )
}

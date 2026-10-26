import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreRing, DirectionChip, scoreColor } from '@/components/ui-ext'
import type { AnalysisSummary, ArchiveSummary } from '@contracts/types'
import { formatTime, normalizeDirection } from './utils'
import InlineRename from './InlineRename'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** 默认展开的版本数 */
const COLLAPSED_COUNT = 3

export interface ArchiveCardProps {
  archive: ArchiveSummary
  /** 当前筛选条件下匹配的版本（已按时间倒序） */
  versions: AnalysisSummary[]
  index: number
  /** 合成「未归档」分组：禁用档案重命名 / 删除档案 */
  synthetic?: boolean
  renamingArchive?: boolean
  deletingArchive?: boolean
  renamingVersionId?: number | null
  deletingVersionId?: number | null
  onRenameArchive: (id: number, name: string) => void
  onDeleteArchive: (id: number) => void
  onRenameVersion: (id: number, versionName: string) => void
  onDeleteVersion: (id: number) => void
  onOpenVersion: (id: number) => void
}

/** 单个版本行：版本名（内联改名）+ 方向 + 分数 + 文件名 + 时间 + 删除 */
function VersionRow({
  version,
  renaming,
  deleting,
  onRename,
  onDelete,
  onOpen,
}: {
  version: AnalysisSummary
  renaming: boolean
  deleting: boolean
  onRename: (id: number, versionName: string) => void
  onDelete: (id: number) => void
  onOpen: (id: number) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const color = scoreColor(version.overallScore)
  const versionLabel = version.versionName ?? `版本 ${version.id}`

  if (confirming) {
    return (
      <motion.div
        animate={{ x: [0, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
      >
        <p className="min-w-0 text-[13px] font-medium text-ink">
          确认删除版本「{versionLabel}」？此操作不可恢复。
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(version.id)
            }}
            className="h-7 rounded-[8px] bg-softred px-3 text-[12px] font-medium text-surface transition-colors hover:bg-softred/90 disabled:opacity-60"
          >
            {deleting ? '删除中…' : '确认删除'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setConfirming(false)
            }}
            className="h-7 rounded-[8px] border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            取消
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(version.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(version.id)
      }}
      className={cn(
        'group/row flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors duration-200 hover:bg-panel/50',
        (deleting || renaming) && 'pointer-events-none opacity-60',
      )}
    >
      {/* 分数 */}
      <span className="flex w-12 shrink-0 items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-mono text-[14px] font-semibold tabular-nums" style={{ color }}>
          {version.overallScore}
        </span>
      </span>

      {/* 版本名 + 文件名 */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <InlineRename
            value={versionLabel}
            onSave={(name) => onRename(version.id, name)}
            ariaLabel="重命名版本"
            className="text-[14px] font-medium text-ink"
            inputClassName="w-48 max-w-full"
          />
          <DirectionChip direction={normalizeDirection(version.direction)} className="shrink-0" />
        </div>
        <p className="mt-0.5 truncate text-[12px] text-ink-3" title={version.filename}>
          {version.filename}
        </p>
      </div>

      {/* 时间 */}
      <span className="hidden shrink-0 font-mono text-[12px] text-ink-3 md:inline">
        {formatTime(version.createdAt)}
      </span>

      {/* 删除 */}
      <button
        type="button"
        aria-label="删除版本"
        title="删除版本"
        onClick={(e) => {
          e.stopPropagation()
          setConfirming(true)
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 opacity-0 transition-all duration-200 hover:bg-softred/10 hover:text-softred focus-visible:opacity-100 group-hover/row:opacity-100"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

/** 档案卡片：档案头（改名 / 统计 / 删除档案）+ 版本列表（默认 3 条，可展开） */
export default function ArchiveCard({
  archive,
  versions,
  index,
  synthetic = false,
  renamingArchive = false,
  deletingArchive = false,
  renamingVersionId = null,
  deletingVersionId = null,
  onRenameArchive,
  onDeleteArchive,
  onRenameVersion,
  onDeleteVersion,
  onOpenVersion,
}: ArchiveCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT)
  const hiddenCount = sorted.length - COLLAPSED_COUNT

  return (
    <motion.section
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      exit={{ scale: 0.97, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: (index % 6) * 0.06 }}
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-hover',
        (deletingArchive || renamingArchive) && 'pointer-events-none opacity-60',
      )}
    >
      {confirming && !synthetic ? (
        /* 删除档案二次确认态 */
        <motion.div
          animate={{ x: [0, -5, 5, -3, 3, 0] }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3 p-5"
        >
          <p className="text-[14px] font-medium leading-[1.7] text-ink">
            确认删除档案「{archive.name}」？
            <span className="text-softred">
              将删除该档案下 {archive.versionCount} 个版本及原始简历文件，
            </span>
            此操作不可恢复。
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deletingArchive}
              onClick={() => onDeleteArchive(archive.id)}
              className="h-8 rounded-[10px] bg-softred px-4 text-[13px] font-medium text-surface transition-colors hover:bg-softred/90 disabled:opacity-60"
            >
              {deletingArchive ? '删除中…' : '确认删除档案'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-8 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
            >
              取消
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* 档案头 */}
          <div className="flex items-start justify-between gap-4 p-5 pb-4">
            <div className="min-w-0">
              <InlineRename
                value={archive.name}
                onSave={(name) => onRenameArchive(archive.id, name)}
                disabled={synthetic}
                ariaLabel="重命名档案"
                className="font-serif text-[18px] font-bold leading-[1.4] text-ink"
                inputClassName="w-64 max-w-full"
              />
              <p className="mt-1 text-[12px] font-medium tracking-[0.04em] text-ink-3">
                {archive.versionCount} 个版本
                {archive.latestAt && (
                  <>
                    <span className="mx-1.5">·</span>
                    最近分析 {formatTime(archive.latestAt)}
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {archive.avgScore != null && (
                <span className="inline-flex flex-col items-center gap-1">
                  <ScoreRing score={archive.avgScore} size={44} />
                  <span className="text-[11px] font-medium tracking-[0.04em] text-ink-3">
                    平均分
                  </span>
                </span>
              )}
              {!synthetic && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:border-softred/40 hover:bg-softred/5 hover:text-softred"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  删除档案
                </button>
              )}
            </div>
          </div>

          {/* 版本列表 */}
          {visible.length > 0 && (
            <div className="divide-y divide-line border-t border-line">
              {visible.map((v) => (
                <VersionRow
                  key={v.id}
                  version={v}
                  renaming={renamingVersionId === v.id}
                  deleting={deletingVersionId === v.id}
                  onRename={onRenameVersion}
                  onDelete={onDeleteVersion}
                  onOpen={onOpenVersion}
                />
              ))}
            </div>
          )}

          {/* 展开 / 收起 */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex h-10 w-full items-center justify-center gap-1.5 border-t border-line text-[13px] font-medium text-ink-3 transition-colors duration-200 hover:bg-panel/50 hover:text-ink"
            >
              {expanded ? (
                <>
                  收起
                  <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
                </>
              ) : (
                <>
                  展开全部 {sorted.length} 个版本
                  <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          )}
        </>
      )}
    </motion.section>
  )
}

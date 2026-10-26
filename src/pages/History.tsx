import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/providers/trpc'
import { Toaster } from '@/components/ui/sonner'
import StatsBar from '@/components/history/StatsBar'
import type { ArchiveStats } from '@/components/history/StatsBar'
import Toolbar from '@/components/history/Toolbar'
import type { SortMode } from '@/components/history/Toolbar'
import ArchiveCard from '@/components/history/ArchiveCard'
import { archiveApi, invalidateArchives } from '@/components/history/archive-api'
import { normalizeDirection } from '@/components/history/utils'
import type { AnalysisSummary, ArchiveSummary } from '@contracts/types'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** 合成「未归档」分组 id（兼容期：archiveId 为空或档案缺失的版本） */
const ORPHAN_ARCHIVE_ID = -1

/** 空态（无档案 / 筛选无结果两种变体） */
function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <motion.img
        src="/empty-history.png"
        alt="打开的档案盒，飞出几张带分数圆环标记的文件卡片"
        className="w-[340px] max-w-full rounded-2xl"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      />
      <motion.h2
        className="mt-6 font-serif text-[22px] font-bold text-ink"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
      >
        {filtered ? '没有找到匹配的档案' : '还没有分析档案'}
      </motion.h2>
      <motion.p
        className="mt-2 text-[14px] text-ink-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.18 }}
      >
        {filtered ? '换个关键词或筛选条件试试' : '回到工作台，上传第一份学生简历'}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.26 }}
        className="mt-6"
      >
        {filtered ? (
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-[10px] px-5 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            清除筛选
          </button>
        ) : (
          <motion.span whileTap={{ scale: 0.97 }} className="inline-block">
            <Link
              to="/"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-terra px-5 text-[14px] font-medium text-surface transition-colors duration-200 hover:bg-terra-deep"
            >
              去工作台分析
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

interface ArchiveGroup {
  archive: ArchiveSummary
  synthetic: boolean
  versions: AnalysisSummary[]
}

export default function History() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const archivesQuery = archiveApi.archives.list.useQuery()
  const listQuery = trpc.history.list.useQuery()

  const archives = useMemo(() => archivesQuery.data ?? [], [archivesQuery.data])
  const list = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const [keyword, setKeyword] = useState('')
  const [direction, setDirection] = useState('全部')
  const [sort, setSort] = useState<SortMode>('newest')

  const [renamingArchiveId, setRenamingArchiveId] = useState<number | null>(null)
  const [deletingArchiveId, setDeletingArchiveId] = useState<number | null>(null)
  const [renamingVersionId, setRenamingVersionId] = useState<number | null>(null)
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null)

  /* ---------- 按 archiveId 分组（含「未归档」兜底分组） ---------- */

  const groups = useMemo<ArchiveGroup[]>(() => {
    const byArchive = new Map<number, AnalysisSummary[]>()
    const orphans: AnalysisSummary[] = []
    const known = new Set(archives.map((a) => a.id))
    for (const r of list) {
      if (r.archiveId != null && known.has(r.archiveId)) {
        const arr = byArchive.get(r.archiveId) ?? []
        arr.push(r)
        byArchive.set(r.archiveId, arr)
      } else {
        orphans.push(r)
      }
    }
    const result: ArchiveGroup[] = archives.map((a) => ({
      archive: a,
      synthetic: false,
      versions: byArchive.get(a.id) ?? [],
    }))
    if (orphans.length > 0) {
      const times = orphans.map((o) => new Date(o.createdAt).getTime())
      const latest = new Date(Math.max(...times))
      result.push({
        archive: {
          id: ORPHAN_ARCHIVE_ID,
          name: '未归档',
          createdAt: new Date(Math.min(...times)),
          updatedAt: latest,
          versionCount: orphans.length,
          avgScore: orphans.reduce((acc, o) => acc + o.overallScore, 0) / orphans.length,
          latestAt: latest,
        },
        synthetic: true,
        versions: orphans,
      })
    }
    return result
  }, [archives, list])

  /* ---------- 筛选（关键词匹配档案名/版本名/文件名；方向作用于版本） ---------- */

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const filtering = kw !== '' || direction !== '全部'
    const rows = groups
      .map((g) => {
        const archiveHit = kw !== '' && g.archive.name.toLowerCase().includes(kw)
        const versions = g.versions.filter((v) => {
          if (direction !== '全部' && normalizeDirection(v.direction) !== direction) return false
          if (kw && !archiveHit) {
            const hay = `${v.versionName ?? ''} ${v.filename}`.toLowerCase()
            if (!hay.includes(kw)) return false
          }
          return true
        })
        return { ...g, versions }
      })
      // 筛选条件下无匹配版本的档案卡片隐藏
      .filter((g) => !filtering || g.versions.length > 0)

    const time = (d: Date | string | null) => (d ? new Date(d).getTime() : 0)
    return rows.sort((a, b) => {
      if (sort === 'avgScore') return (b.archive.avgScore ?? -1) - (a.archive.avgScore ?? -1)
      if (sort === 'name') return a.archive.name.localeCompare(b.archive.name, 'zh-Hans-CN')
      return time(b.archive.latestAt) - time(a.archive.latestAt)
    })
  }, [groups, keyword, direction, sort])

  /* ---------- 统计（档案视角） ---------- */

  const stats = useMemo<ArchiveStats>(() => {
    const total = list.length
    const avg = total ? list.reduce((acc, r) => acc + r.overallScore, 0) / total : 0
    const latestAt = total
      ? new Date(Math.max(...list.map((r) => new Date(r.createdAt).getTime())))
      : null
    return { archives: archives.length, versions: total, avg, latestAt }
  }, [archives, list])

  const clearFilter = () => {
    setKeyword('')
    setDirection('全部')
  }

  /* ---------- Mutations（成功后同时失效 archives.list + history.list） ---------- */

  const invalidateAll = () => {
    invalidateArchives(utils)
    utils.history.list.invalidate()
  }

  const renameArchiveMutation = archiveApi.archives.rename.useMutation({
    onSuccess: () => {
      toast.success('档案已重命名')
      setRenamingArchiveId(null)
      invalidateAll()
    },
    onError: (err) => {
      setRenamingArchiveId(null)
      toast.error(`重命名失败：${err.message}`)
    },
  })

  const removeArchiveMutation = archiveApi.archives.remove.useMutation({
    onSuccess: () => {
      toast.success('档案已删除')
      setDeletingArchiveId(null)
      invalidateAll()
      utils.history.get.invalidate()
    },
    onError: (err) => {
      setDeletingArchiveId(null)
      toast.error(`删除失败：${err.message}`)
    },
  })

  const renameVersionMutation = archiveApi.history.renameVersion.useMutation({
    onSuccess: () => {
      toast.success('版本已重命名')
      setRenamingVersionId(null)
      invalidateAll()
    },
    onError: (err) => {
      setRenamingVersionId(null)
      toast.error(`重命名失败：${err.message}`)
    },
  })

  const removeVersionMutation = trpc.history.remove.useMutation({
    onSuccess: (_d, vars) => {
      toast.success('已删除')
      setDeletingVersionId(null)
      invalidateAll()
      utils.history.get.invalidate({ id: vars.id })
    },
    onError: (err) => {
      setDeletingVersionId(null)
      toast.error(`删除失败：${err.message}`)
    },
  })

  const handleRenameArchive = (id: number, name: string) => {
    setRenamingArchiveId(id)
    renameArchiveMutation.mutate({ id, name })
  }
  const handleDeleteArchive = (id: number) => {
    setDeletingArchiveId(id)
    removeArchiveMutation.mutate({ id })
  }
  const handleRenameVersion = (id: number, versionName: string) => {
    setRenamingVersionId(id)
    renameVersionMutation.mutate({ id, versionName })
  }
  const handleDeleteVersion = (id: number) => {
    setDeletingVersionId(id)
    removeVersionMutation.mutate({ id })
  }

  const isLoading = archivesQuery.isLoading || listQuery.isLoading
  const isEmpty = groups.length === 0

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-10 lg:px-10">
      <Toaster position="top-right" />
      {/* 页头 */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="mb-8"
      >
        <h1 className="font-serif text-[28px] font-bold leading-[1.3] tracking-[0.01em] text-ink">
          分析档案
        </h1>
        <p className="mt-2 text-[12px] font-medium tracking-[0.06em] text-ink-3">
          共 {stats.archives} 份档案 · {stats.versions} 个版本
        </p>
      </motion.header>

      {isLoading ? (
        /* 加载骨架 */
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-panel" />
            ))}
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="h-[220px] animate-pulse rounded-2xl bg-panel" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState filtered={false} onClear={clearFilter} />
      ) : (
        <>
          <div className="mb-8">
            <StatsBar stats={stats} />
          </div>
          <Toolbar
            keyword={keyword}
            onKeyword={setKeyword}
            direction={direction}
            onDirection={setDirection}
            sort={sort}
            onSort={setSort}
            matchCount={filtered.length}
          />
          {filtered.length === 0 ? (
            <EmptyState filtered onClear={clearFilter} />
          ) : (
            <motion.div layout className="mt-5 flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((g, i) => (
                  <ArchiveCard
                    key={g.archive.id}
                    archive={g.archive}
                    versions={g.versions}
                    index={i}
                    synthetic={g.synthetic}
                    renamingArchive={renamingArchiveId === g.archive.id}
                    deletingArchive={deletingArchiveId === g.archive.id}
                    renamingVersionId={renamingVersionId}
                    deletingVersionId={deletingVersionId}
                    onRenameArchive={handleRenameArchive}
                    onDeleteArchive={handleDeleteArchive}
                    onRenameVersion={handleRenameVersion}
                    onDeleteVersion={handleDeleteVersion}
                    onOpenVersion={(id) => navigate(`/history/${id}`)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

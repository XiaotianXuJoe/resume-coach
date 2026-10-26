import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, FileType2, Download, Check, RotateCcw } from 'lucide-react'
import { ScoreRing, DirectionChip } from '@/components/ui-ext'
import { directionChipLabel, resumeTypeLabel } from './config'
import { formatElapsed } from './parsing'
import type { AnalysisResult } from './types'

interface ResultHeaderProps {
  result: AnalysisResult
  onRestart: () => void
}

/** 结果头卡：文件名 + meta（方向/耗时/字符数）+ 迷你评分环 + 导出 JSON / 重新分析。 */
export default function ResultHeader({ result, onRestart }: ResultHeaderProps) {
  const [exported, setExported] = useState(false)
  const FileIcon = result.fileKind === 'pdf' ? FileText : FileType2

  const handleExport = () => {
    const payload = {
      filename: result.filename,
      direction: result.direction,
      detectedBy: result.detectedBy,
      durationMs: result.durationMs,
      charCount: result.charCount,
      evaluation: result.evaluation,
      interview: result.interview,
      retrievedKbIds: result.retrieved.map((k) => k.id),
      resumeText: result.resumeText,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const base = result.filename.replace(/\.(pdf|docx)$/i, '')
    a.href = url
    a.download = `简历分析_${base}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    window.setTimeout(() => setExported(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-surface p-6 shadow-card"
    >
      <span
        className={
          result.fileKind === 'pdf'
            ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-softred/10 text-softred'
            : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-dusty/10 text-dusty'
        }
      >
        <FileIcon className="h-6 w-6" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[16px] font-bold tracking-[0.02em] text-ink">
          {result.filename}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <DirectionChip direction={directionChipLabel(result.direction)} suffix=" 后端" />
          <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[12px] font-medium text-ink-2">
            {resumeTypeLabel(result.resumeType)}
          </span>
          <span className="font-mono text-[12px] text-ink-3">
            耗时 {formatElapsed(result.durationMs)}
          </span>
          <span className="text-[12px] text-ink-3">
            字符数 {result.charCount.toLocaleString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <ScoreRing score={result.evaluation.overall_score} size={72} />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-medium text-ink transition-shadow hover:shadow-card"
          >
            {exported ? (
              <Check className="h-4 w-4 text-pine" strokeWidth={2} />
            ) : (
              <Download className="h-4 w-4" strokeWidth={1.75} />
            )}
            导出报告 JSON
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] px-4 text-[13px] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            重新分析
          </button>
        </div>
      </div>
    </motion.div>
  )
}

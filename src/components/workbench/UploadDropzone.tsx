import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, ScanLine, FileText, FileType2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { detectFileKind, formatFileSize, MAX_FILE_SIZE } from './parsing'

export interface SelectedFile {
  file: File
  kind: 'pdf' | 'docx'
}

interface UploadDropzoneProps {
  selected: SelectedFile | null
  onSelect: (selected: SelectedFile) => void
  onRemove: () => void
  onError: (message: string) => void
}

/**
 * 拖拽上传卡：2px 虚线拖放区，drag-over 时虚线变赤陶；
 * 已选文件态显示文件卡片（PDF 柔红 / Word 尘蓝图标 + 移除按钮）。
 */
export default function UploadDropzone({ selected, onSelect, onRemove, onError }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return
      const kind = detectFileKind(file)
      if (!kind) {
        onError('仅支持 PDF / Word（.docx）文件')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        onError('文件超过 20MB，请压缩后再上传')
        return
      }
      onSelect({ file, kind })
    },
    [onSelect, onError],
  )

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  const FileIcon = selected?.kind === 'pdf' ? FileText : FileType2

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div
        role="button"
        tabIndex={0}
        aria-label="上传简历文件"
        onClick={() => !selected && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!selected && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex h-[288px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200',
          dragOver ? 'border-terra bg-terra/[0.04]' : 'border-line',
          !selected && 'cursor-pointer hover:border-terra hover:bg-terra/[0.04]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleInput}
        />
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="file"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="mx-6 flex w-full max-w-[380px] items-center gap-4 rounded-xl border border-line bg-paper px-5 py-4"
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px]',
                  selected.kind === 'pdf' ? 'bg-softred/10 text-softred' : 'bg-dusty/10 text-dusty',
                )}
              >
                <FileIcon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-ink">
                  {selected.file.name}
                </span>
                <span className="mt-0.5 block font-mono text-[12px] text-ink-3">
                  {selected.kind.toUpperCase()} · {formatFileSize(selected.file.size)}
                </span>
              </span>
              <button
                type="button"
                aria-label="移除文件"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-softred/10 hover:text-softred"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center px-8 text-center"
            >
              <motion.span
                animate={dragOver ? { y: [0, -6, 0] } : { y: 0 }}
                transition={
                  dragOver
                    ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-terra/10 text-terra"
              >
                <FileUp className="h-10 w-10" strokeWidth={1.5} />
              </motion.span>
              <p className="mt-5 text-[15px] font-medium text-ink">
                拖拽简历文件到此处，或点击选择
              </p>
              <p className="mt-1.5 text-[13px] text-ink-2">
                支持 PDF / Word（.docx），单文件 ≤ 20MB
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brass/[0.08] px-3 py-1 text-[12px] text-ink-2">
                <ScanLine className="h-3.5 w-3.5 text-brass" strokeWidth={1.75} />
                扫描件 PDF 将自动转图片，交给 K3 视觉识别
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

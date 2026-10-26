import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineRenameProps {
  /** 当前名称 */
  value: string
  /** 名称有效（非空且发生变化）时回调 */
  onSave: (name: string) => void
  /** 禁用编辑（如合成「未归档」分组） */
  disabled?: boolean
  /** 外层文字样式 */
  className?: string
  /** 编辑态 input 样式 */
  inputClassName?: string
  ariaLabel?: string
  maxLength?: number
}

/**
 * 内联重命名：默认显示名称 + 悬停显现的铅笔图标；
 * 点击进入编辑态，Enter / 失焦保存，Esc 取消。
 */
export default function InlineRename({
  value,
  onSave,
  disabled = false,
  className,
  inputClassName,
  ariaLabel = '重命名',
  maxLength = 64,
}: InlineRenameProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    setDraft(value)
    // 等待渲染后聚焦并全选
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [editing, value])

  const commit = () => {
    const name = draft.trim()
    setEditing(false)
    if (name && name !== value) onSave(name)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'h-7 min-w-0 rounded-[8px] border border-terra/40 bg-paper px-2 text-inherit [font:inherit] focus:outline-none focus:ring-2 focus:ring-terra/30',
          inputClassName,
        )}
      />
    )
  }

  return (
    <span className={cn('group/rename inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="min-w-0 truncate" title={value}>
        {value}
      </span>
      {!disabled && (
        <button
          type="button"
          aria-label={ariaLabel}
          title={ariaLabel}
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          className="shrink-0 rounded-[6px] p-1 text-ink-3 opacity-0 transition-opacity duration-200 hover:bg-panel hover:text-ink focus-visible:opacity-100 group-hover/rename:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      )}
    </span>
  )
}

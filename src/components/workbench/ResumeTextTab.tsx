import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ResumeTextTabProps {
  text: string
  charCount: number
}

/** Tab ④ 简历原文：纸面卡 + 等宽 <pre>（max-h 640 内部滚动）。 */
export default function ResumeTextTab({ text, charCount }: ResumeTextTabProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('简历原文已复制')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('复制失败，请检查浏览器剪贴板权限')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-ink-3">
          字符数 {charCount.toLocaleString('zh-CN')}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-3 text-[12px] font-medium text-ink transition-shadow hover:shadow-card"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-pine" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          复制原文
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-line bg-paper p-5">
        <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-[1.8] text-ink-2">
          {text}
        </pre>
      </div>
    </motion.div>
  )
}

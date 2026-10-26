import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionCardProps {
  open: boolean
  onToggle: () => void
  header: ReactNode
  children: ReactNode
  className?: string
}

/** 卡片式手风琴：标题行 56px，展开 height 动画 + 内容淡入，chevron 旋转 180°。 */
export default function AccordionCard({ open, onToggle, header, children, className }: AccordionCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-hover',
        className,
      )}
    >
      {/* 标题行用 div[role=button]：header 内可能含可点击徽标（如 kb 来源），避免嵌套 <button> */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-expanded={open}
        className="flex min-h-14 w-full cursor-pointer select-none items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-paper/60"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-ink-3"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
        </motion.span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.3 }, opacity: { duration: 0.25, delay: open ? 0.1 : 0 } }}
          >
            <div className="border-t border-line px-5 pb-5 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

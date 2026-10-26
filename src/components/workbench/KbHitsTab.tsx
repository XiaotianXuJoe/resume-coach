import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Info, ChevronRight } from 'lucide-react'
import type { KBItem } from '@contracts/types'

const DIFF_COLOR: Record<string, string> = {
  基础: '#5C7A67',
  中等: '#B8892E',
  困难: '#B4402F',
}
const FREQ_COLOR: Record<string, string> = {
  高频: '#B9552E',
  中频: '#B8892E',
  低频: '#5E7FA0',
}

function MiniPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4"
      style={{ backgroundColor: `${color}14`, color }}
    >
      {label}
    </span>
  )
}

interface KbHitsTabProps {
  retrieved: KBItem[]
}

/** Tab ③ 知识库命中：说明条 + 命中题目卡片行列表。 */
export default function KbHitsTab({ retrieved }: KbHitsTabProps) {
  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-dusty" strokeWidth={1.75} />
        <p className="text-[13px] leading-relaxed text-ink-2">
          以下 {retrieved.length} 道题是本次从内置知识库（98 题）检索到的参考题，用于生成「面试题库」中的题目
        </p>
      </div>

      {retrieved.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-ink-3">本次分析未命中知识库题目</p>
      ) : (
        <div className="mt-5 space-y-3">
          {retrieved.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <Link
                to={`/kb?q=${encodeURIComponent(item.id)}`}
                className="group flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4 shadow-card transition-all duration-200 hover:-translate-y-px hover:shadow-hover"
              >
                <span className="shrink-0 rounded-md border border-line bg-paper px-2 py-1 font-mono text-[12px] text-ink-2">
                  {item.id}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <MiniPill label={item.topic} color="#6E6455" />
                  <MiniPill label={item.difficulty} color={DIFF_COLOR[item.difficulty] ?? '#6E6455'} />
                  <MiniPill label={item.frequency} color={FREQ_COLOR[item.frequency] ?? '#6E6455'} />
                </span>
                <span className="min-w-0 flex-1 break-words text-[15px] font-medium leading-relaxed text-ink">
                  {item.question}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-terra"
                  strokeWidth={1.75}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

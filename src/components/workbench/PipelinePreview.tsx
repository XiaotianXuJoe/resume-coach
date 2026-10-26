import { motion } from 'framer-motion'
import { FileSearch, Compass, ClipboardCheck, LibraryBig } from 'lucide-react'

const NODES = [
  { icon: FileSearch, label: '解析简历' },
  { icon: Compass, label: '判定方向' },
  { icon: ClipboardCheck, label: '大模型评价' },
  { icon: LibraryBig, label: '检索出题' },
]

/** 上传卡下方横向四步流程预览（非交互），虚线缓慢流动。 */
export default function PipelinePreview() {
  return (
    <div className="flex items-start justify-center">
      {NODES.map(({ icon: Icon, label }, i) => (
        <div key={label} className="flex items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 + i * 0.08 }}
            className="flex w-[88px] flex-col items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-card">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="text-[12px] text-ink-2">{label}</span>
          </motion.div>
          {i < NODES.length - 1 && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="pipeline-dash mx-1 mt-5 h-px w-10 sm:w-16 lg:w-24"
            />
          )}
        </div>
      ))}
      {/* 流动虚线（局部样式，仅作用于本组件） */}
      <style>{`
        .pipeline-dash {
          background-image: linear-gradient(to right, #B9552E 45%, transparent 45%);
          background-size: 12px 1px;
          background-repeat: repeat-x;
          opacity: 0.45;
          animation: pipeline-dash-flow 8s linear infinite;
        }
        @keyframes pipeline-dash-flow {
          from { background-position-x: 0; }
          to { background-position-x: 96px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pipeline-dash { animation: none; }
        }
      `}</style>
    </div>
  )
}

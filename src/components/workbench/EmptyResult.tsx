import { motion } from 'framer-motion'

/** idle 态结果区占位：插图 + Serif 标题 + 说明 */
export default function EmptyResult() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-line bg-surface px-8 py-12 text-center shadow-card">
      <motion.img
        src="/empty-upload.png"
        alt=""
        className="w-[380px] max-w-full rounded-xl"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 font-serif text-[22px] font-bold tracking-[0.01em] text-ink"
      >
        上传一份简历，开始今天的辅导
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-ink-2"
      >
        系统将自动完成评价、修改建议与面试题生成，全程约 1–2 分钟
      </motion.p>
    </div>
  )
}

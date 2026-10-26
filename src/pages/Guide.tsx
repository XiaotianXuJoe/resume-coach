import { memo, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch,
  Compass,
  ClipboardCheck,
  LibraryBig,
  CircleAlert,
  Info,
  ShieldCheck,
  Pickaxe,
  Flame,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

/* ---------- 通用小件 ---------- */

/** 区块头：印章红竖线 + Serif H2 + 可选说明 caption */
function SectionHead({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <span className="h-[0.9em] w-1 rounded-sm bg-terra text-[20px]" aria-hidden />
        <h2 className="font-serif text-[20px] font-bold leading-[1.4] tracking-[0.01em] text-ink">
          {title}
        </h2>
      </div>
      {caption && (
        <p className="mt-2 pl-4 text-[12px] font-medium tracking-[0.06em] text-ink-3">{caption}</p>
      )}
    </div>
  )
}

/** 主按钮（赤陶）/ 次按钮（白底描边），Link 形态 */
function LinkButton({
  to,
  variant,
  children,
}: {
  to: string
  variant: 'primary' | 'secondary'
  children: React.ReactNode
}) {
  return (
    <motion.span whileTap={{ scale: 0.97 }} className="inline-block">
      <Link
        to={to}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-[10px] px-5 text-[14px] font-medium transition-all duration-200',
          variant === 'primary'
            ? 'bg-terra text-surface hover:bg-terra-deep'
            : 'border border-line bg-surface text-ink hover:-translate-y-px hover:shadow-card',
        )}
      >
        {children}
      </Link>
    </motion.span>
  )
}

/** Hero 插图呼吸动画（隔离 + memo，避免父级重渲染重置） */
const BreathingHero = memo(function BreathingHero() {
  return (
    <motion.img
      src="/guide-hero.png"
      alt="导师与学生隔桌而坐，一起看一份简历"
      className="h-auto w-full rounded-[20px] border border-line object-cover shadow-card"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
})

/* ---------- Section 1 · Hero ---------- */

const TITLE_WORDS = ['把', '十年', '的', '面试', '辅导', '经验', '，', '装进', '一个', '工作台']

function Hero() {
  return (
    <section className="grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-5">
      {/* 左：文字列 */}
      <div className="lg:col-span-3">
        <motion.p
          className="text-[12px] font-medium tracking-[0.12em] text-terra"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        >
          使用指南 · GUIDE
        </motion.p>
        <h1 className="mt-4 font-serif text-[34px] font-bold leading-[1.2] tracking-[0.01em] text-ink md:text-[40px]">
          {TITLE_WORDS.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.05 + i * 0.08 }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-5 max-w-[520px] text-[15px] leading-[1.9] text-ink-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.4 }}
        >
          上传学生简历，Kimi 大模型完成五维度评价与逐条修改建议，再结合内置题库生成三档面试题——你负责讲解，它负责备课。
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.5 }}
        >
          <LinkButton to="/" variant="primary">
            开始分析
          </LinkButton>
          <LinkButton to="/kb" variant="secondary">
            看看知识库
          </LinkButton>
        </motion.div>
      </div>
      {/* 右：插图列 */}
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.2 }}
      >
        <BreathingHero />
      </motion.div>
    </section>
  )
}

/* ---------- Section 2 · 四步流程 ---------- */

const FLOW_STEPS: { icon: LucideIcon; name: string; desc: string }[] = [
  { icon: FileSearch, name: '解析简历', desc: 'PDF/Word 提取文本，扫描件走视觉识别' },
  { icon: Compass, name: '判定方向', desc: '关键词自动检测 Java / Python / C++' },
  { icon: ClipboardCheck, name: '大模型评价', desc: '五维度打分 + 逐条修改建议' },
  { icon: LibraryBig, name: '检索出题', desc: '题库打捞 top 15，生成三档面试题' },
]

function HowItWorks() {
  return (
    <section className="py-16">
      <SectionHead title="一次分析的四步" caption="全程约 1–2 分钟" />
      <div className="relative">
        {/* 顶部互联虚线（从左至右绘制） */}
        <svg
          aria-hidden
          className="absolute -top-5 left-[12.5%] hidden h-px w-[75%] lg:block"
          preserveAspectRatio="none"
          viewBox="0 0 100 1"
        >
          <motion.line
            x1={0}
            y1={0.5}
            x2={100}
            y2={0.5}
            stroke="#E7DCCC"
            strokeWidth={2}
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </svg>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((s, i) => (
            <motion.div
              key={s.name}
              className="relative rounded-2xl border border-line bg-surface p-6 shadow-card"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: i * 0.12 }}
            >
              <motion.span
                className="pointer-events-none absolute right-5 top-4 font-serif text-[40px] font-bold leading-none text-terra/25"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
              >
                {String(i + 1).padStart(2, '0')}
              </motion.span>
              <s.icon className="h-6 w-6 text-terra" strokeWidth={1.75} />
              <h3 className="mt-4 text-[16px] font-bold leading-[1.5] tracking-[0.02em] text-ink">
                {s.name}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-2">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Section 3 · 五维度评分标准 ---------- */

const RUBRIC: { name: string; weight: string; def: string; pitfall: string }[] = [
  {
    name: '内容完整性',
    weight: '权重 25%',
    def: '教育背景、技能、项目、实习等必要板块是否齐全。',
    pitfall: '缺 GitHub/博客链接、教育背景无起止时间',
  },
  {
    name: '量化表达',
    weight: '权重 20%',
    def: '项目是否有 QPS、响应时间、数据量、提升百分比等硬指标。',
    pitfall: '「提升了系统性能」没有任何数字',
  },
  {
    name: '岗位匹配度',
    weight: '权重 20%',
    def: '技术栈与目标岗位生态的匹配程度。',
    pitfall: '投 Java 岗但通篇前端技术栈',
  },
  {
    name: '项目深度',
    weight: '权重 20%',
    def: '是否有真实难点与个人贡献边界。',
    pitfall: '「我们做了……」流水账，分不清「我」做了什么',
  },
  {
    name: '表达与结构',
    weight: '权重 15%',
    def: '排版逻辑、措辞专业度、篇幅控制。',
    pitfall: '应届生写「精通」，易被面试官重点拷打',
  },
]

function Rubric() {
  return (
    <section className="py-16">
      <SectionHead title="评价报告的五个维度" caption="每维 0–100 分，综合评分加权得出" />
      <div className="flex flex-col gap-3">
        {RUBRIC.map((r, i) => (
          <motion.div
            key={r.name}
            className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-card"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: i * 0.09 }}
          >
            {/* 左 4px 赤陶竖条 */}
            <motion.span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1 origin-top bg-terra"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.09 }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[16px] font-bold tracking-[0.02em] text-ink">{r.name}</h3>
              <span className="rounded-full bg-terra/[0.08] px-2.5 py-0.5 text-[12px] font-medium text-terra">
                {r.weight}
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-[1.75] text-ink">{r.def}</p>
            <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-[1.6] text-ink-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brass" strokeWidth={1.75} />
              <span>
                <span className="font-medium text-ink-2">典型扣分点：</span>
                {r.pitfall}
              </span>
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Section 4 · 模型配置说明 ---------- */

const MODEL_ROWS: { model: string; thinking: React.ReactNode; temp: string; advice: string }[] = [
  {
    model: 'kimi-k3（默认）',
    thinking: (
      <>
        始终思考，推理强度 <code className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[12px]">low / high / max</code> 三档
      </>
    ),
    temp: '固定 1.0，建议「自动」',
    advice: '评价与出题质量最高，推荐 max',
  },
  {
    model: 'kimi-k2.6',
    thinking: '思考开关（开/关）',
    temp: '思考 1.0 / 非思考 0.6',
    advice: '想省钱省时关闭思考',
  },
  {
    model: 'kimi-k2.5',
    thinking: '思考开关（开/关）',
    temp: '同上',
    advice: '备用',
  },
]

function ModelGuide() {
  return (
    <section className="py-16">
      <SectionHead title="模型与思考模式怎么选" />
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card md:p-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-paper">
                {['模型', '思考控制', 'Temperature 规则', '建议'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[12px] font-medium tracking-[0.06em] text-ink-3 first:rounded-l-lg last:rounded-r-lg"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_ROWS.map((row, i) => (
                <motion.tr
                  key={row.model}
                  className={i % 2 === 0 ? 'bg-surface' : 'bg-paper'}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: i * 0.08 }}
                >
                  <td className="h-12 px-4 font-mono text-[13px] font-semibold text-ink">
                    {row.model}
                  </td>
                  <td className="h-12 px-4 text-[13px] leading-[1.6] text-ink-2">{row.thinking}</td>
                  <td className="h-12 px-4 text-[13px] leading-[1.6] text-ink-2">{row.temp}</td>
                  <td className="h-12 px-4 text-[13px] leading-[1.6] text-ink-2">{row.advice}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <motion.div
          className="mt-5 flex items-start gap-2.5 rounded-[10px] border border-line bg-paper px-4 py-3"
          initial={{ scale: 0.98, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-dusty" strokeWidth={1.75} />
          <p className="text-[13px] leading-[1.6] text-ink-2">
            手动设置其他 temperature 值可能报错，日常使用保持「自动」即可。
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ---------- Section 5 · 辅导方法论 ---------- */

const MENTOR_CARDS: {
  icon: LucideIcon
  color: string
  bg: string
  title: string
  desc: string
}[] = [
  {
    icon: ShieldCheck,
    color: '#5C7A67',
    bg: 'rgba(92,122,103,0.08)',
    title: '先过「基础必考」',
    desc: '让学生脱稿答一遍自我介绍与项目概述，答不顺直接重写。',
  },
  {
    icon: Pickaxe,
    color: '#B9552E',
    bg: 'rgba(185,85,46,0.08)',
    title: '用「项目深挖」做模拟面试',
    desc: '按清单逐题追问，对着「回答方向」检查要点覆盖率。',
  },
  {
    icon: Flame,
    color: '#B8892E',
    bg: 'rgba(184,137,46,0.08)',
    title: '拿「八股与压力追问」做抗压训练',
    desc: '针对简历疑点的尖锐题，训练学生诚实且不自爆的表达方式。',
  },
]

function HowToMentor() {
  return (
    <section className="py-16">
      <SectionHead title="拿到报告后，这样带学生练" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {MENTOR_CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            className="rounded-2xl border border-line bg-surface p-7 shadow-card transition-shadow duration-200 hover:shadow-hover"
            initial={{ opacity: 0, y: 32, rotate: 1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: i * 0.12 }}
          >
            <motion.span
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: c.bg }}
              whileHover={{ rotate: -8, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <c.icon className="h-6 w-6" style={{ color: c.color }} strokeWidth={1.75} />
            </motion.span>
            <h3 className="mt-4 text-[16px] font-bold tracking-[0.02em] text-ink">{c.title}</h3>
            <p className="mt-2 text-[13px] leading-[1.7] text-ink-2">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Section 6 · FAQ ---------- */

const FAQS: { q: string; a: string }[] = [
  {
    q: 'API Key 存在哪里？安全吗？',
    a: '仅保存于本地服务端配置，不写入浏览器存储，不上传任何第三方。',
  },
  {
    q: '扫描件 PDF 能分析吗？',
    a: '能，系统自动转图片交给 K3 视觉识别转录，耗时略长。',
  },
  {
    q: '历史记录保存在哪？',
    a: '服务端本地 JSON 文件，可在历史记录页导出或删除。',
  },
  {
    q: '可以不粘贴 JD 吗？',
    a: '可以；粘贴 JD 后评价会增加岗位匹配维度权重，出题更贴目标公司。',
  },
  {
    q: '题库里的题会从哪来？',
    a: '内置 98 道高频真题（Java/Python/C++/通用四库），可在知识库页浏览。',
  },
]

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: index * 0.06 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-paper"
      >
        <span className="text-[15px] font-semibold text-ink">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          >
            <p className="border-t border-line px-5 pb-5 pt-4 text-[14px] leading-[1.8] text-ink-2">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Faq() {
  return (
    <section className="py-16">
      <SectionHead title="常见问题" />
      <div className="mx-auto flex max-w-[760px] flex-col gap-2.5">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ---------- Section 7 · 页尾 CTA ---------- */

function FinalCta() {
  return (
    <section className="py-16">
      <motion.div
        className="rounded-2xl border border-terra/15 bg-terra/[0.06] p-12 text-center"
        initial={{ scale: 0.97, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <h2 className="font-serif text-[24px] font-bold tracking-[0.01em] text-ink md:text-[28px]">
          现在，分析第一份简历
        </h2>
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.3 }}
        >
          <LinkButton to="/" variant="primary">
            去工作台
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </LinkButton>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ---------- 页面 ---------- */

export default function Guide() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-8 lg:px-10">
      <Hero />
      <HowItWorks />
      <Rubric />
      <ModelGuide />
      <HowToMentor />
      <Faq />
      <FinalCta />
    </div>
  )
}

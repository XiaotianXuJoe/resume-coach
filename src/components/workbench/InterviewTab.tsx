import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Pickaxe,
  Flame,
  Layers,
  Target,
  Compass,
  Copy,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { InterviewResult } from '@contracts/types'
import { SourceBadge } from '@/components/ui-ext'
import { cn } from '@/lib/utils'
import AccordionCard from './AccordionCard'
import { splitAnswerPoints } from './types'

interface TierMeta {
  icon: LucideIcon
  colorCls: string
  desc: string
}

const TIER_META: Record<string, TierMeta> = {
  基础必考: {
    icon: ShieldCheck,
    colorCls: 'text-pine',
    desc: '自我介绍、项目概述、岗位通用题——答不好直接挂',
  },
  项目深挖: {
    icon: Pickaxe,
    colorCls: 'text-terra',
    desc: '针对简历每个项目的选型、架构、难点与贡献追问',
  },
  八股与压力追问: {
    icon: Flame,
    colorCls: 'text-brass',
    desc: '题库高频八股贴合改写 + 针对简历疑点的尖锐追问',
  },
}

const FALLBACK_META: TierMeta = {
  icon: Layers,
  colorCls: 'text-dusty',
  desc: '结合简历与题库生成的面试题',
}

interface InterviewTabProps {
  interview: InterviewResult
}

/** Tab ② 面试题库：三档分节卡片 + 工具条（全部展开/收起、复制全部）。 */
export default function InterviewTab({ interview }: InterviewTabProps) {
  const navigate = useNavigate()
  const tiers = interview.tiers ?? []
  const total = tiers.reduce((sum, t) => sum + t.questions.length, 0)

  const allKeys = useMemo(() => {
    const keys: string[] = []
    tiers.forEach((t, ti) => t.questions.forEach((_, qi) => keys.push(`${ti}-${qi}`)))
    return keys
  }, [tiers])
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const expandAll = () => setOpenKeys(new Set(allKeys))
  const collapseAll = () => setOpenKeys(new Set())

  const copyAll = async () => {
    const text = tiers
      .map((t) => {
        const body = t.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')
        return `【${t.tier}】\n${body}`
      })
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`已复制 ${total} 道题`)
    } catch {
      toast.error('复制失败，请检查浏览器剪贴板权限')
    }
  }

  const goKb = (source: string) => {
    const id = source.replace(/^kb:/, '')
    navigate(`/kb?q=${encodeURIComponent(id)}`)
  }

  return (
    <div>
      {/* 工具条 */}
      <div className="sticky top-16 z-20 -mx-1 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-4 py-2.5 shadow-card backdrop-blur">
        <p className="text-[13px] text-ink-2">
          共 <span className="font-mono font-semibold text-ink">{total}</span> 题 ·{' '}
          {tiers.length} 个档次
        </p>
        <div className="flex items-center gap-1.5">
          <ToolButton onClick={expandAll} icon={ChevronsUpDown} label="全部展开" />
          <ToolButton onClick={collapseAll} icon={ChevronsDownUp} label="全部收起" />
          <ToolButton onClick={copyAll} icon={Copy} label="复制全部题目" primary />
        </div>
      </div>

      {/* 档次区块 */}
      <div className="mt-8 space-y-8">
        {tiers.map((tier, ti) => {
          const meta = TIER_META[tier.tier] ?? FALLBACK_META
          const Icon = meta.icon
          return (
            <motion.section
              key={`${tier.tier}-${ti}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: ti * 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Icon className={cn('h-5 w-5', meta.colorCls)} strokeWidth={1.75} />
                <h2 className="font-serif text-[20px] font-bold tracking-[0.01em] text-ink">
                  {tier.tier}
                </h2>
                <span className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[12px] text-ink-2">
                  {tier.questions.length} 题
                </span>
                <p className="w-full text-[12px] text-ink-3 sm:w-auto sm:flex-1 sm:text-right">
                  {meta.desc}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {tier.questions.map((q, qi) => {
                  const key = `${ti}-${qi}`
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.15 + qi * 0.05 }}
                    >
                      <AccordionCard
                        open={openKeys.has(key)}
                        onToggle={() => toggle(key)}
                        header={
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 font-mono text-[13px] text-ink-3">
                              {String(qi + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] font-semibold leading-relaxed text-ink">
                              {q.question}
                            </span>
                            <SourceBadge
                              source={q.source}
                              onClick={
                                q.source.startsWith('kb:')
                                  ? (e) => {
                                      e.stopPropagation()
                                      goKb(q.source)
                                    }
                                  : undefined
                              }
                              className="shrink-0"
                            />
                          </span>
                        }
                      >
                        <div className="space-y-4">
                          <div>
                            <p className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] text-ink-3">
                              <Target className="h-3.5 w-3.5 text-terra" strokeWidth={1.75} />
                              考察意图
                            </p>
                            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{q.intent}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] text-ink-3">
                              <Compass className="h-3.5 w-3.5 text-dusty" strokeWidth={1.75} />
                              回答方向
                            </p>
                            <ul className="mt-1.5 space-y-1.5">
                              {splitAnswerPoints(q.answer_direction).map((point, pi) => (
                                <li
                                  key={pi}
                                  className="flex items-start gap-2 text-[14px] leading-relaxed text-ink"
                                >
                                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-terra" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionCard>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>
          )
        })}
      </div>
    </div>
  )
}

function ToolButton({
  onClick,
  icon: Icon,
  label,
  primary,
}: {
  onClick: () => void
  icon: LucideIcon
  label: string
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-medium transition-colors',
        primary
          ? 'border border-line bg-surface text-ink hover:shadow-card'
          : 'text-ink-2 hover:bg-paper hover:text-ink',
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  )
}

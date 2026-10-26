import { ArrowDown } from 'lucide-react'
import { parseRewrite, splitAnswerPoints } from './parsers'

/**
 * 回答方向：拆成逐条列表（赤陶圆点），与工作台 InterviewTab 的
 * splitAnswerPoints 渲染效果一致；拆不出多条时回退为整段原文。
 */
export function AnswerPoints({ text }: { text: string }) {
  const points = splitAnswerPoints(text)
  if (points.length <= 1) {
    return <p className="break-words text-[13px] leading-[1.8] text-ink-2">{text}</p>
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {points.map((point, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.8] text-ink-2">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-terra" aria-hidden />
          <span className="min-w-0 break-words">{point}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * 示例改写：解析为「修改前 / 修改后」上下两个独立区块——
 * 修改前用删除线 + 灰调，修改后用松绿强调，各带标签小徽标，
 * 中间以 ↓ 区隔；解析失败时回退为整段原样显示。
 */
export function RewriteView({ text }: { text: string }) {
  const parts = parseRewrite(text)
  if (!parts) {
    return (
      <p className="break-words font-mono text-[12px] leading-[1.7] text-ink-2">{text}</p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-lg bg-panel/60 px-3 py-2">
        <span className="inline-flex items-center rounded-full border border-line bg-surface px-2 py-px text-[11px] font-medium tracking-[0.04em] text-ink-3">
          修改前
        </span>
        <p className="mt-1 break-words text-[13px] leading-[1.7] text-ink-3 line-through decoration-ink-3/50">
          {parts.before}
        </p>
      </div>
      <div className="flex justify-center py-0.5" aria-hidden>
        <ArrowDown className="h-3.5 w-3.5 text-ink-3" strokeWidth={1.75} />
      </div>
      <div className="rounded-lg bg-pine/[0.07] px-3 py-2">
        <span className="inline-flex items-center rounded-full bg-pine/10 px-2 py-px text-[11px] font-medium tracking-[0.04em] text-pine">
          修改后
        </span>
        <p className="mt-1 break-words text-[13px] font-medium leading-[1.7] text-ink">
          {parts.after}
        </p>
      </div>
    </div>
  )
}

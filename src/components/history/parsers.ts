/**
 * 历史详情页的文本解析工具：
 * - splitAnswerPoints：把 answer_direction 拆成逐条要点
 * - parseRewrite：把 example_rewrite 解析为「修改前 / 修改后」两段
 */

/** 编号标记：1) 1. 1、（1）(1) ①…⑳，后随内容（避免误伤 "8.0"、"2.5" 这类小数） */
const NUM_MARKER =
  /(?:^|[\s；;，,。])(?:[（(]\s*\d{1,2}\s*[）)]|\d{1,2}\s*[)）.．、](?!\s*\d)|[①-⑳])\s*/g

/**
 * 把 answer_direction 拆分为逐条要点。
 * 兼容编号格式 `1)`、`1.`、`1、`、`（1）`、`(1)`、`①②③…` 与分隔符 `；`、`;`、换行；
 * 会剥掉每条开头的编号。拆不出多条时返回单元素数组（原样展示）。
 */
export function splitAnswerPoints(text: string): string[] {
  const cleaned = text.trim()
  if (!cleaned) return []
  const unified = cleaned.replace(/\r/g, '').replace(NUM_MARKER, '；')
  return unified
    .split(/[；;\n]+/)
    .map((s) => s.trim().replace(/^[：:，,。、\s]+/, '').trim())
    .filter(Boolean)
}

export interface RewriteParts {
  before: string
  after: string
}

/**
 * 把 example_rewrite 解析为「修改前 / 修改后」两段。
 * 支持：「修改前：xxx → 修改后：yyy」、「xxx → yyy」、
 * 「修改前：xxx 修改后：yyy」（无箭头，需以空白/换行相隔）。
 * 不含该模式时返回 null，调用方回退为整段原样显示。
 */
export function parseRewrite(text: string): RewriteParts | null {
  const t = text.trim()
  if (!t) return null

  // 含「→」：标签可有可无
  const arrow = t.match(/^(?:修改前\s*[：:]\s*)?([\s\S]+?)\s*→\s*(?:修改后\s*[：:]\s*)?([\s\S]+)$/)
  if (arrow) {
    const before = arrow[1].trim()
    const after = arrow[2].trim()
    if (before && after) return { before, after }
  }

  // 无箭头，但有成对标签且以空白相隔
  const labeled = t.match(/^修改前\s*[：:]\s*([\s\S]+?)[\s\n]+修改后\s*[：:]\s*([\s\S]+)$/)
  if (labeled) {
    const before = labeled[1].trim()
    const after = labeled[2].trim()
    if (before && after) return { before, after }
  }

  return null
}

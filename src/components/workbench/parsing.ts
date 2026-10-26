/**
 * 客户端简历解析：mammoth（docx）/ pdfjs-dist（pdf）全部动态 import，不拖首屏。
 * 扫描件 PDF（平均每页字符 < 50）→ 逐页渲染为 PNG base64，交给服务端视觉转录。
 */

export type PdfParseOutcome =
  | { kind: 'text'; text: string; pageCount: number }
  | { kind: 'scan'; images: string[]; pageCount: number }

export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const SCAN_AVG_CHARS_THRESHOLD = 50

export function detectFileKind(file: File): 'pdf' | 'docx' | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  return null
}

/** docx → 纯文本（mammoth） */
export async function parseDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value.trim()
  if (!text) throw new Error('未能从 Word 文档中提取到文字，请确认文件内容完整')
  return text
}

/**
 * pdf → 文本；平均每页字符 < 50 判为扫描件，返回逐页 PNG（base64 无前缀）。
 */
export async function parsePdf(file: File): Promise<PdfParseOutcome> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pageCount = doc.numPages

  const pageTexts: string[] = []
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join('')
      .trim()
    pageTexts.push(pageText)
  }

  const totalChars = pageTexts.reduce((sum, t) => sum + t.length, 0)
  const avgChars = pageCount > 0 ? totalChars / pageCount : 0

  if (avgChars >= SCAN_AVG_CHARS_THRESHOLD) {
    const text = pageTexts.join('\n\n').trim()
    if (!text) throw new Error('未能从 PDF 中提取到文字，请确认文件内容完整')
    return { kind: 'text', text, pageCount }
  }

  // 扫描件分支：逐页渲染 canvas（scale 2）→ PNG base64（去前缀）
  const images: string[] = []
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) throw new Error('浏览器不支持 Canvas，无法识别扫描件')
    await page.render({ canvas, canvasContext, viewport }).promise
    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]
    if (base64) images.push(base64)
    canvas.width = 0
    canvas.height = 0
  }
  if (images.length === 0) throw new Error('扫描件页面渲染失败，请重试')
  return { kind: 'scan', images, pageCount }
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

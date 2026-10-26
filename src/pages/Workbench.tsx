import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import UploadDropzone from '@/components/workbench/UploadDropzone'
import type { SelectedFile } from '@/components/workbench/UploadDropzone'
import AnalysisOptions from '@/components/workbench/AnalysisOptions'
import PipelinePreview from '@/components/workbench/PipelinePreview'
import EmptyResult from '@/components/workbench/EmptyResult'
import AnalyzingPanel from '@/components/workbench/AnalyzingPanel'
import ResultHeader from '@/components/workbench/ResultHeader'
import ReportTab from '@/components/workbench/ReportTab'
import InterviewTab from '@/components/workbench/InterviewTab'
import KbHitsTab from '@/components/workbench/KbHitsTab'
import ResumeTextTab from '@/components/workbench/ResumeTextTab'
import { directionFullLabel, resumeTypeLabel } from '@/components/workbench/config'
import type { DirectionValue, ResumeTypeValue } from '@/components/workbench/config'
import { parseDocx, parsePdf } from '@/components/workbench/parsing'
import { initialSteps } from '@/components/workbench/types'
import type { AnalysisResult, PipelineStep, WorkbenchStatus } from '@/components/workbench/types'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

type ResultTabKey = 'report' | 'interview' | 'kb' | 'text'

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** File → base64（不含 data: 前缀），用于把原始简历文件随分析记录存入服务器 */
async function fileToBase64(f: File): Promise<string> {
  const bytes = new Uint8Array(await f.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export default function Workbench() {
  const [status, setStatus] = useState<WorkbenchStatus>('idle')
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [direction, setDirection] = useState<DirectionValue>('auto')
  const [resumeType, setResumeType] = useState<ResumeTypeValue>('auto')
  const [jd, setJd] = useState('')
  // 所属档案：null 表示「自动（按学生姓名归档）」
  const [archiveId, setArchiveId] = useState<number | null>(null)

  const [steps, setSteps] = useState<PipelineStep[]>(initialSteps)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<ResultTabKey>('report')

  const cancelledRef = useRef(false)
  const utils = trpc.useUtils()
  const evaluateMutation = trpc.resume.evaluate.useMutation()
  const interviewMutation = trpc.resume.interview.useMutation()
  const transcribeMutation = trpc.resume.transcribe.useMutation()
  const historyCreateMutation = trpc.history.create.useMutation()
  const archivesQuery = trpc.archives.list.useQuery()
  // 模型配置统一由服务端「设置」页保存，前端仅只读展示
  const settingsQuery = trpc.settings.get.useQuery()
  const settings = settingsQuery.data

  const setStepStatus = (index: number, stepStatus: PipelineStep['status']) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status: stepStatus } : s)))

  const addLog = (index: number, log: string) =>
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, logs: [...s.logs, log] } : s)),
    )

  /** 四步分析流程：解析 → 判定方向 → 大模型评价 → 检索出题 → 入库 */
  const runAnalysis = async () => {
    if (!file) return
    cancelledRef.current = false
    setAnalyzeError(null)
    setResult(null)
    setSteps(initialSteps())
    const start = Date.now()
    setStartedAt(start)
    setStatus('analyzing')

    try {
      // ① 解析简历（本地）
      setStepStatus(0, 'active')
      let resumeText = ''
      if (file.kind === 'docx') {
        resumeText = await parseDocx(file.file)
        addLog(0, `Word 文档，提取文本 ${resumeText.length.toLocaleString('zh-CN')} 字符`)
      } else {
        const outcome = await parsePdf(file.file)
        if (outcome.kind === 'text') {
          resumeText = outcome.text
          addLog(0, `PDF 文本型，提取文本 ${outcome.text.length.toLocaleString('zh-CN')} 字符`)
        } else {
          addLog(0, '扫描件，调用视觉识别转录文字……')
          const { text } = await transcribeMutation.mutateAsync({
            images: outcome.images,
            config: {},
          })
          resumeText = text
          addLog(0, `视觉识别完成，转录 ${text.length.toLocaleString('zh-CN')} 字符`)
        }
      }
      if (cancelledRef.current) return
      setStepStatus(0, 'done')

      // ② 判定技术方向
      setStepStatus(1, 'active')
      let finalDirection: Exclude<DirectionValue, 'auto'>
      let detectedBy: 'auto' | 'manual' = 'manual'
      let hits: AnalysisResult['hits']
      if (direction === 'auto') {
        const detected = await utils.resume.detectDirection.fetch({ resumeText })
        finalDirection = detected.lang
        detectedBy = 'auto'
        hits = detected.hits
        const hitWords = detected.hits[detected.lang] ?? []
        const shown = hitWords.slice(0, 6).join('、')
        addLog(
          1,
          `自动检测为 ${directionFullLabel(detected.lang)}（命中关键词：${shown}${hitWords.length > 6 ? '…' : ''}）`,
        )
      } else {
        finalDirection = direction
        addLog(1, `手动指定为 ${directionFullLabel(direction)}`)
      }
      if (cancelledRef.current) return

      // ②b 判定简历类型（校招/社招）
      let finalResumeType: Exclude<ResumeTypeValue, 'auto'>
      if (resumeType === 'auto') {
        const typeDetected = await utils.resume.detectResumeType.fetch({ resumeText })
        finalResumeType = typeDetected.type
        const typeHits =
          typeDetected.type === 'campus' ? typeDetected.campusHits : typeDetected.experiencedHits
        const typeShown = typeHits.slice(0, 6).join('、')
        addLog(
          1,
          `简历类型自动判断为 ${resumeTypeLabel(finalResumeType)}（命中特征：${typeShown || '无明显特征，默认校招'}${typeHits.length > 6 ? '…' : ''}）`,
        )
      } else {
        finalResumeType = resumeType
        addLog(1, `简历类型手动指定为 ${resumeTypeLabel(finalResumeType)}`)
      }
      if (cancelledRef.current) return
      setStepStatus(1, 'done')

      // ③ 大模型评价
      setStepStatus(2, 'active')
      addLog(2, 'Kimi 正在阅读并打分……')
      const evaluation = await evaluateMutation.mutateAsync({
        resumeText,
        direction: finalDirection,
        resumeType: finalResumeType,
        jd,
        config: {},
      })
      if (cancelledRef.current) return
      addLog(2, `总分：${evaluation.overall_score} 分`)
      setStepStatus(2, 'done')

      // ④ 检索知识库并生成面试题
      setStepStatus(3, 'active')
      const { interview, retrieved } = await interviewMutation.mutateAsync({
        resumeText,
        direction: finalDirection,
        jd,
        config: {},
      })
      if (cancelledRef.current) return
      addLog(3, `已从知识库匹配 ${retrieved.length} 道参考题`)
      setStepStatus(3, 'done')

      // 入库（失败不阻断结果展示）
      try {
        const originalFileBase64 = await fileToBase64(file.file)
        const created = await historyCreateMutation.mutateAsync({
          filename: file.file.name,
          direction: finalDirection,
          overallScore: Math.round(evaluation.overall_score),
          resumeText,
          evaluation,
          interview,
          kbIds: retrieved.map((k) => k.id),
          originalFile: { name: file.file.name, base64: originalFileBase64 },
          // 仅当用户选了具体档案时传 archiveId，否则服务端按学生姓名自动归档
          ...(archiveId !== null ? { archiveId } : {}),
        })
        // 档案名：优先用下拉选项缓存，否则按返回的 archiveId 拉一次列表推得
        let archiveName =
          archiveId !== null
            ? archivesQuery.data?.find((a) => a.id === created.archiveId)?.name
            : undefined
        if (!archiveName) {
          const archiveList = await utils.archives.list.fetch()
          archiveName = archiveList.find((a) => a.id === created.archiveId)?.name
        }
        utils.archives.list.invalidate()
        utils.history.list.invalidate()
        addLog(3, `已存入档案「${archiveName ?? '未命名档案'}」· ${created.versionName}`)
      } catch {
        toast.warning('历史记录保存失败，分析结果不受影响')
      }

      setResult({
        filename: file.file.name,
        fileKind: file.kind,
        resumeText,
        charCount: resumeText.length,
        direction: finalDirection,
        resumeType: finalResumeType,
        detectedBy,
        hits,
        evaluation,
        interview,
        retrieved,
        durationMs: Date.now() - start,
      })
      setActiveTab('report')
      // 全部完成后稍作停顿再切换到 done
      window.setTimeout(() => {
        if (!cancelledRef.current) setStatus('done')
      }, 400)
    } catch (err) {
      if (cancelledRef.current) return
      const message = errorMessage(err)
      // 在 updater 内定位当前进行中的步骤，避免闭包读到过期 state
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.status === 'active')
        const target = idx >= 0 ? idx : 0
        return prev.map((s, i) =>
          i === target ? { ...s, status: 'error', logs: [...s.logs, message] } : s,
        )
      })
      setAnalyzeError(message)
    }
  }

  const handleCancel = () => {
    cancelledRef.current = true
    setStatus('idle')
    setAnalyzeError(null)
    setSteps(initialSteps())
  }

  const handleRestart = () => {
    setResult(null)
    setFile(null)
    setAnalyzeError(null)
    setSteps(initialSteps())
    setStatus('idle')
  }

  const questionCount = useMemo(
    () =>
      result
        ? result.interview.tiers.reduce((sum, t) => sum + t.questions.length, 0)
        : 0,
    [result],
  )

  const tabs: { key: ResultTabKey; label: string; count?: number }[] = [
    { key: 'report', label: '评价报告' },
    { key: 'interview', label: '面试题库', count: questionCount },
    { key: 'kb', label: '知识库命中', count: result?.retrieved.length ?? 0 },
    { key: 'text', label: '简历原文' },
  ]

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8 lg:px-10">
      <Toaster position="top-right" richColors closeButton />

      {/* 页面头：标题 + 服务端模型状态（只读，点击跳转设置页） */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-[28px] font-bold leading-[1.3] tracking-[0.01em] text-ink">
            工作台
          </h1>
          <p className="mt-1 text-[14px] text-ink-2">上传简历，生成评价报告与面试题库</p>
        </div>
        <Link
          to="/settings"
          title="模型配置统一在设置页管理，点击前往"
          className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[12px] text-ink-2 transition-colors hover:border-terra/40 hover:text-ink"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-pine" />
          <span className="font-mono">模型：{settings?.model ?? '…'}</span>
          {settings && !settings.hasKey && (
            <span className="font-medium text-brass">未配置 Key</span>
          )}
        </Link>
      </motion.div>

      {/* 三态切换 */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          {status === 'analyzing' && (
            <AnalyzingPanel
              key="analyzing"
              filename={file?.file.name ?? ''}
              steps={steps}
              error={analyzeError}
              startedAt={startedAt}
              onCancel={handleCancel}
              onRetry={runAnalysis}
            />
          )}

          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="space-y-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-5"
              >
                <div className="lg:col-span-3">
                  <UploadDropzone
                    selected={file}
                    onSelect={setFile}
                    onRemove={() => setFile(null)}
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
                <div className="lg:col-span-2">
                  <AnalysisOptions
                    direction={direction}
                    onDirectionChange={setDirection}
                    resumeType={resumeType}
                    onResumeTypeChange={setResumeType}
                    jd={jd}
                    onJdChange={setJd}
                    archiveId={archiveId}
                    onArchiveChange={setArchiveId}
                    canStart={file !== null}
                    onStart={runAnalysis}
                  />
                </div>
              </motion.div>

              <PipelinePreview />
              <EmptyResult />
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="space-y-8"
            >
              <ResultHeader result={result} onRestart={handleRestart} />

              {/* 结果 Tabs（下划线式） */}
              <div>
                <div className="flex gap-1 border-b border-line">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          'relative flex h-11 items-center gap-1.5 px-4 text-[14px] font-medium transition-colors duration-200',
                          active ? 'text-ink' : 'text-ink-2 hover:text-ink',
                        )}
                      >
                        {tab.label}
                        {typeof tab.count === 'number' && (
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-px font-mono text-[11px] leading-4',
                              active ? 'bg-terra/[0.08] text-terra' : 'bg-paper text-ink-3',
                            )}
                          >
                            {tab.count}
                          </span>
                        )}
                        {active && (
                          <motion.span
                            layoutId="result-tab-underline"
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                            className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-terra"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeTab === 'report' && <ReportTab evaluation={result.evaluation} />}
                      {activeTab === 'interview' && <InterviewTab interview={result.interview} />}
                      {activeTab === 'kb' && <KbHitsTab retrieved={result.retrieved} />}
                      {activeTab === 'text' && (
                        <ResumeTextTab text={result.resumeText} charCount={result.charCount} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

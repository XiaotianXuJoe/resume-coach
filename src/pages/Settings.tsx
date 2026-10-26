import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Cpu,
  Brain,
  Thermometer,
  PlugZap,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

const DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1'
const DEFAULT_MODEL = 'kimi-k3'
const MODEL_PRESETS = ['kimi-k3', 'kimi-k2.6', 'kimi-k2.5']
const K3_LEVELS = ['low', 'high', 'max'] as const
type K3Level = (typeof K3_LEVELS)[number]

function isK3Model(model: string): boolean {
  const m = model.trim()
  return m === 'k3' || m.startsWith('kimi-k3')
}

/* ---------- 通用小件 ---------- */

function FieldLabel({ icon: Icon, children }: { icon: typeof KeyRound; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.02em] text-ink-2">
      <Icon className="h-3.5 w-3.5 text-ink-3" strokeWidth={1.75} />
      {children}
    </Label>
  )
}

const inputCls =
  'h-10 rounded-[10px] border-line bg-surface text-[14px] text-ink shadow-none focus-visible:ring-terra/30 focus-visible:border-terra/50'

/* ---------- 页面 ---------- */

type SavedView = {
  hasKey: boolean
  maskedKey: string
  baseUrl: string
  model: string
  thinking: string
  temperatureMode: 'auto' | 'manual'
  temperature: number
}

/** 配置表单：数据就绪后挂载，useState 初始化即完成回填（无需 effect） */
function SettingsForm({ saved }: { saved: SavedView }) {
  const utils = trpc.useUtils()

  const setMutation = trpc.settings.set.useMutation()
  const testMutation = trpc.settings.test.useMutation()

  /* 表单状态（Key 框始终留空，靠 maskedKey 展示状态） */
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl)
  const [model, setModel] = useState(saved.model)
  const [k3Level, setK3Level] = useState<K3Level>(
    K3_LEVELS.includes(saved.thinking as K3Level) ? (saved.thinking as K3Level) : 'max',
  )
  const [k2ThinkingOn, setK2ThinkingOn] = useState(saved.thinking === 'enabled')
  const [temperatureMode, setTemperatureMode] = useState<'auto' | 'manual'>(saved.temperatureMode)
  const [temperature, setTemperature] = useState(saved.temperature)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const k3 = isK3Model(model)
  const thinking = k3 ? k3Level : k2ThinkingOn ? 'enabled' : 'disabled'
  const saving = setMutation.isPending

  function currentPayload() {
    return {
      baseUrl: baseUrl.trim() || DEFAULT_BASE_URL,
      model: model.trim() || DEFAULT_MODEL,
      thinking,
      temperatureMode,
      temperature,
    }
  }

  async function handleSave() {
    const payload = currentPayload()
    try {
      new URL(payload.baseUrl)
    } catch {
      toast.error('Base URL 格式不正确')
      return
    }
    // Key 框留空 → 不传 apiKey，服务端保留已保存的 Key
    const trimmedKey = apiKey.trim()
    try {
      await setMutation.mutateAsync(
        trimmedKey ? { ...payload, apiKey: trimmedKey } : payload,
      )
      setApiKey('')
      setTestResult(null)
      await utils.settings.get.invalidate()
      toast.success('配置已保存')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    }
  }

  async function handleClearKey() {
    if (!saved?.hasKey) return
    try {
      // 仅清除 Key，其余字段沿用服务端已保存值，避免覆盖未保存的表单编辑
      await setMutation.mutateAsync({
        apiKey: '',
        baseUrl: saved.baseUrl,
        model: saved.model,
        thinking: saved.thinking,
        temperatureMode: saved.temperatureMode,
        temperature: saved.temperature,
      })
      setApiKey('')
      setTestResult(null)
      await utils.settings.get.invalidate()
      toast.success('已清除保存的 API Key')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '清除失败，请稍后重试')
    }
  }

  async function handleTest() {
    setTestResult(null)
    try {
      const r = await testMutation.mutateAsync()
      setTestResult(r)
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : '测试请求失败',
      })
    }
  }

  return (
      <motion.div
        className="mt-8 max-w-[640px] rounded-2xl border border-line bg-surface p-6 shadow-card md:p-8"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.18 }}
      >
        <div className="flex flex-col gap-6">
          {/* API Key */}
          <div className="flex flex-col gap-2">
            <FieldLabel icon={KeyRound}>Kimi API Key</FieldLabel>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                className={cn(inputCls, 'pr-11 font-mono')}
              />
              <button
                type="button"
                aria-label={showKey ? '隐藏 Key' : '显示 Key'}
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper hover:text-ink-2"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[12px] leading-[1.6] text-ink-3">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    saved?.hasKey ? 'bg-pine' : 'bg-brass',
                  )}
                />
                {saved?.hasKey ? (
                  <>
                    已保存{' '}
                    <span className="font-mono text-[12px] text-ink-2">{saved.maskedKey}</span>
                    ，留空表示不修改
                  </>
                ) : (
                  '未配置，可在 Kimi 开放平台获取'
                )}
              </p>
              {saved?.hasKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  disabled={saving}
                  className="flex items-center gap-1 text-[12px] font-medium text-softred transition-colors hover:underline disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  清除已保存的 Key
                </button>
              )}
            </div>
          </div>

          {/* Base URL */}
          <div className="flex flex-col gap-2">
            <FieldLabel icon={Link2}>Base URL</FieldLabel>
            <Input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_BASE_URL}
              className={cn(inputCls, 'font-mono')}
            />
          </div>

          {/* 模型 */}
          <div className="flex flex-col gap-2">
            <FieldLabel icon={Cpu}>模型</FieldLabel>
            <Input
              list="settings-model-presets"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={DEFAULT_MODEL}
              className={cn(inputCls, 'font-mono')}
            />
            <datalist id="settings-model-presets">
              {MODEL_PRESETS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* 思考模式（自适应） */}
          <div className="flex flex-col gap-2">
            <FieldLabel icon={Brain}>思考模式</FieldLabel>
            {k3 ? (
              <>
                <div className="flex h-10 items-center gap-1 rounded-[10px] border border-line bg-paper p-1">
                  {K3_LEVELS.map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setK3Level(lv)}
                      className={cn(
                        'h-full flex-1 rounded-[7px] font-mono text-[13px] transition-all duration-200',
                        k3Level === lv
                          ? 'bg-terra text-surface shadow-card'
                          : 'text-ink-2 hover:bg-surface hover:text-ink',
                      )}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] leading-[1.6] text-ink-3">
                  K3 始终开启思考，仅可调节推理强度
                </p>
              </>
            ) : (
              <>
                <div className="flex h-10 items-center justify-between rounded-[10px] border border-line bg-paper px-3.5">
                  <span className="text-[13px] text-ink-2">开启思考</span>
                  <Switch checked={k2ThinkingOn} onCheckedChange={setK2ThinkingOn} />
                </div>
                <p className="text-[12px] leading-[1.6] text-ink-3">
                  关闭后更快更便宜，复杂简历建议开启
                </p>
              </>
            )}
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-2">
            <FieldLabel icon={Thermometer}>Temperature</FieldLabel>
            <div className="flex h-10 items-center gap-1 rounded-[10px] border border-line bg-paper p-1">
              {(
                [
                  ['auto', '自动（推荐）'],
                  ['manual', '手动'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTemperatureMode(mode)}
                  className={cn(
                    'h-full flex-1 rounded-[7px] text-[13px] font-medium transition-all duration-200',
                    temperatureMode === mode
                      ? 'bg-terra text-surface shadow-card'
                      : 'text-ink-2 hover:bg-surface hover:text-ink',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {temperatureMode === 'manual' && (
                <motion.div
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                >
                  <div className="flex items-center gap-4 pt-2">
                    <Slider
                      className="flex-1"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={([v]) => setTemperature(Math.round(v * 10) / 10)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={temperature}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (!Number.isNaN(v)) setTemperature(Math.min(2, Math.max(0, v)))
                      }}
                      className={cn(inputCls, 'w-20 text-center font-mono tabular-nums')}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="flex items-start gap-1.5 text-[12px] leading-[1.6] text-ink-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              自动模式按模型规则下发：K3 固定 1.0；K2.6 思考 1.0 / 非思考 0.6，手动传其他值可能报错
            </p>
          </div>

          {/* 测试结果反馈 */}
          <AnimatePresence initial={false}>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className={cn(
                  'flex items-start gap-2.5 rounded-[10px] border px-4 py-3',
                  testResult.ok
                    ? 'border-pine/25 bg-pine/[0.08]'
                    : 'border-softred/25 bg-softred/[0.08]',
                )}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pine" strokeWidth={1.75} />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-softred" strokeWidth={1.75} />
                )}
                <p className="text-[13px] leading-[1.6] text-ink">{testResult.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 操作区 */}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-5 text-[14px] font-medium text-ink transition-all duration-200 hover:-translate-y-px hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-ink-3" strokeWidth={1.75} />
              ) : (
                <PlugZap className="h-4 w-4 text-ink-2" strokeWidth={1.75} />
              )}
              测试连接
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-terra px-5 text-[14px] font-medium text-surface transition-colors duration-200 hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.75} />
              )}
              保存设置
            </motion.button>
            <p className="text-[12px] leading-[1.6] text-ink-3">
              测试连接使用服务端已保存的配置，修改后请先保存
            </p>
          </div>
        </div>
      </motion.div>
  )
}

/* ---------- 页面 ---------- */

export default function Settings() {
  const settingsQuery = trpc.settings.get.useQuery()
  const saved = settingsQuery.data

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-16 lg:px-10">
      {/* 页头 */}
      <div className="pt-12">
        <motion.p
          className="text-[12px] font-medium tracking-[0.12em] text-terra"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        >
          设置 · SETTINGS
        </motion.p>
        <motion.h1
          className="mt-3 font-serif text-[28px] font-bold leading-[1.3] tracking-[0.01em] text-ink"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.05 }}
        >
          设置
        </motion.h1>
        <motion.p
          className="mt-2 text-[14px] leading-[1.75] text-ink-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.12 }}
        >
          大模型配置保存在服务器，分析时自动使用
        </motion.p>
      </div>

      {/* 配置卡片（数据就绪后挂载，挂载即回填） */}
      {saved ? (
        <SettingsForm saved={saved} />
      ) : (
        <div className="mt-8 flex h-64 max-w-[640px] items-center justify-center rounded-2xl border border-line bg-surface shadow-card">
          <Loader2 className="h-5 w-5 animate-spin text-ink-3" strokeWidth={1.75} />
        </div>
      )}
    </div>
  )
}

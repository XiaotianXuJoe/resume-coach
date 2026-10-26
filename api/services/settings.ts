import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import type { ModelConfig, SettingsView } from "@contracts/types";

/** settings 表中模型配置行的固定主键 */
export const MODEL_CONFIG_KEY = "model_config";

/** 硬默认值（解析链最后一级） */
export const MODEL_CONFIG_DEFAULTS = {
  baseUrl: "https://api.moonshot.cn/v1",
  model: "kimi-k3",
  thinking: "max",
  temperatureMode: "auto" as const,
  temperature: 0.6,
};

/** 读取服务端保存的模型配置；无记录返回 null */
export async function getModelConfig(): Promise<ModelConfig | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, MODEL_CONFIG_KEY))
    .limit(1);
  return rows[0]?.value ?? null;
}

/** upsert 保存完整 ModelConfig */
export async function saveModelConfig(cfg: ModelConfig): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: MODEL_CONFIG_KEY, value: cfg })
    .onDuplicateKeyUpdate({ set: { value: cfg } });
}

/** 脱敏：无 Key 空串；≤8 位全 *；否则 前3 + **** + 后4 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 3)}****${key.slice(-4)}`;
}

/** 转为设置页视图（绝不泄露完整 Key），字段缺失时回落到默认值 */
export function toSettingsView(cfg: ModelConfig | null): SettingsView {
  return {
    hasKey: Boolean(cfg?.apiKey),
    maskedKey: maskApiKey(cfg?.apiKey ?? ""),
    baseUrl: cfg?.baseUrl || MODEL_CONFIG_DEFAULTS.baseUrl,
    model: cfg?.model || MODEL_CONFIG_DEFAULTS.model,
    thinking: cfg?.thinking || MODEL_CONFIG_DEFAULTS.thinking,
    temperatureMode: cfg?.temperatureMode ?? MODEL_CONFIG_DEFAULTS.temperatureMode,
    temperature: cfg?.temperature ?? MODEL_CONFIG_DEFAULTS.temperature,
  };
}

/**
 * 解析生效的模型配置，优先级：
 *   请求体各字段（空字符串视为未提供）→ 服务端 settings 表保存值 → 环境变量/硬默认
 * （apiKey 的环境变量回退为 MOONSHOT_API_KEY）
 */
export async function resolveModelConfig(
  input?: Partial<ModelConfig> | null,
): Promise<ModelConfig> {
  const saved = await getModelConfig();

  const pickString = (
    fromInput: string | undefined,
    fromSaved: string | undefined,
    fallback: string,
  ): string => {
    const a = (fromInput ?? "").trim();
    if (a) return a;
    const b = (fromSaved ?? "").trim();
    if (b) return b;
    return fallback;
  };

  return {
    apiKey: pickString(
      input?.apiKey,
      saved?.apiKey,
      process.env.MOONSHOT_API_KEY ?? "",
    ),
    baseUrl: pickString(
      input?.baseUrl,
      saved?.baseUrl,
      MODEL_CONFIG_DEFAULTS.baseUrl,
    ),
    model: pickString(input?.model, saved?.model, MODEL_CONFIG_DEFAULTS.model),
    thinking: pickString(
      input?.thinking,
      saved?.thinking,
      MODEL_CONFIG_DEFAULTS.thinking,
    ),
    temperatureMode:
      input?.temperatureMode ??
      saved?.temperatureMode ??
      MODEL_CONFIG_DEFAULTS.temperatureMode,
    temperature:
      typeof input?.temperature === "number"
        ? input.temperature
        : (saved?.temperature ?? MODEL_CONFIG_DEFAULTS.temperature),
  };
}

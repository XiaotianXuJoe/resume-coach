import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  getModelConfig,
  resolveModelConfig,
  saveModelConfig,
  toSettingsView,
} from "../services/settings";
import type { ModelConfig, SettingsView } from "@contracts/types";

const setInputSchema = z.object({
  /**
   * 不传（undefined）= 保留已保存的 Key；
   * 空字符串 = 清除已保存的 Key；
   * 非空 = 更新为新 Key。
   */
  apiKey: z.string().max(256).optional(),
  baseUrl: z.string().url("Base URL 格式不正确").max(255),
  model: z.string().min(1, "模型名不能为空").max(64),
  thinking: z.string().max(16),
  temperatureMode: z.enum(["auto", "manual"]),
  temperature: z.number().min(0).max(2),
});

export const settingsRouter = createRouter({
  /** 读取当前设置（脱敏视图，绝不返回完整 Key） */
  get: publicQuery.query(async (): Promise<SettingsView> => {
    const saved = await getModelConfig();
    return toSettingsView(saved);
  }),

  /** 保存设置，返回最新脱敏视图 */
  set: publicQuery
    .input(setInputSchema)
    .mutation(async ({ input }): Promise<SettingsView> => {
      const existing = await getModelConfig();
      const cfg: ModelConfig = {
        apiKey:
          input.apiKey === undefined
            ? (existing?.apiKey ?? "")
            : input.apiKey.trim(),
        baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
        model: input.model.trim(),
        thinking: input.thinking.trim(),
        temperatureMode: input.temperatureMode,
        temperature: input.temperature,
      };
      await saveModelConfig(cfg);
      return toSettingsView(cfg);
    }),

  /**
   * 用当前生效的配置（保存值 → 环境变量）GET {baseUrl}/models 验证 Key 可用性。
   * 超时 15 秒；任何失败都以中文摘要返回，不抛错。
   */
  test: publicQuery.mutation(
    async (): Promise<{ ok: boolean; message: string }> => {
      const cfg = await resolveModelConfig(null);
      if (!cfg.apiKey) {
        return {
          ok: false,
          message:
            "尚未配置 API Key：请先填写并保存 Key，或在服务端环境变量中配置 MOONSHOT_API_KEY",
        };
      }
      const baseUrl = cfg.baseUrl.replace(/\/+$/, "");
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/models`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/timeout|timed?\s*out|abort/i.test(msg)) {
          return {
            ok: false,
            message: "连接超时（15 秒）：请检查 Base URL 是否正确、网络是否可达",
          };
        }
        return {
          ok: false,
          message: `连接失败：${msg.slice(0, 200)}，请检查 Base URL 与网络`,
        };
      }
      if (res.ok) {
        return { ok: true, message: "连接成功，API Key 可用" };
      }
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          message: `鉴权失败（HTTP ${res.status}）：API Key 无效或已过期，请检查后重新保存`,
        };
      }
      return {
        ok: false,
        message: `请求失败（HTTP ${res.status}）：${(text || res.statusText).slice(0, 200)}`,
      };
    },
  ),
});

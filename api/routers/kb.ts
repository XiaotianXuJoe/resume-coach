import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as kb from "../services/kb";
import type { KBItem } from "@contracts/types";

export const kbRouter = createRouter({
  /** 题库列表（可按语言过滤），附带 topic 列表供前端筛选 */
  list: publicQuery
    .input(z.object({ language: z.string().optional() }).optional())
    .query(({ input }) => {
      const items: KBItem[] = kb.listByLanguage(input?.language);
      const topics = [...new Set(items.map((it) => it.topic))];
      return { items, topics };
    }),
});

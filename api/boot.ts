import { readFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { analyses } from "@db/schema";

const app = new Hono<{ Bindings: HttpBindings }>();

const FILE_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** 下载某条分析记录的原始简历文件 */
app.get("/api/files/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Not Found" }, 404);
  }
  const db = getDb();
  const rows = await db
    .select({
      originalFileName: analyses.originalFileName,
      originalFilePath: analyses.originalFilePath,
    })
    .from(analyses)
    .where(eq(analyses.id, id))
    .limit(1);
  const row = rows[0];
  if (!row?.originalFileName || !row.originalFilePath) {
    return c.json({ error: "Not Found" }, 404);
  }
  let buffer: Buffer;
  try {
    buffer = await readFile(row.originalFilePath);
  } catch {
    return c.json({ error: "Not Found" }, 404);
  }
  const ext = path.extname(row.originalFileName).slice(1).toLowerCase();
  c.header("Content-Type", FILE_CONTENT_TYPES[ext] ?? "application/octet-stream");
  c.header(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(row.originalFileName)}`,
  );
  return c.body(buffer);
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

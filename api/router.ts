import { createRouter, publicQuery } from "./middleware";
import { resumeRouter } from "./routers/resume";
import { kbRouter } from "./routers/kb";
import { historyRouter } from "./routers/history";
import { archivesRouter } from "./routers/archives";
import { settingsRouter } from "./routers/settings";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  resume: resumeRouter,
  kb: kbRouter,
  history: historyRouter,
  archives: archivesRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/authRouter";
import { projectRouter } from "./routers/projectRouter";
import { responseRouter } from "./routers/responseRouter";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  projects: projectRouter,
  responses: responseRouter,
});

export type AppRouter = typeof appRouter;

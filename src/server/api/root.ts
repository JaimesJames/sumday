import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { categoryRouter } from "@/server/api/routers/category";
import { timeLogRouter } from "@/server/api/routers/time-log";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  timeLog: timeLogRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

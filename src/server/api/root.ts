import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { categoryRouter } from "@/server/api/routers/category";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

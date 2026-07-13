import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { calendarRouter } from "@/server/api/routers/calendar";
import { categoryRouter } from "@/server/api/routers/category";
import { moneyRouter } from "@/server/api/routers/money";
import { timeLogRouter } from "@/server/api/routers/time-log";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  timeLog: timeLogRouter,
  money: moneyRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

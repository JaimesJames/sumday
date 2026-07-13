import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createCalendarSlot,
  createManualLog,
  deleteLog,
  listTimeLogs,
  startTimer,
  stopTimer,
  updateLog,
  updateRunningLog,
} from "@/server/services/time-log-service";
import {
  calendarSlotSchema,
  manualLogSchema,
  runningLogUpdateSchema,
  startTimerSchema,
  stopTimerSchema,
} from "@/server/validators/time-log";

export const timeLogRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      }),
    )
    .query(({ ctx, input }) => listTimeLogs(ctx.user.id, input)),

  createManual: protectedProcedure
    .input(manualLogSchema)
    .mutation(({ ctx, input }) => createManualLog(ctx.user.id, input)),

  update: protectedProcedure
    .input(manualLogSchema.and(z.object({ id: z.string().uuid() })))
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;
      return updateLog(ctx.user.id, id, rest);
    }),

  updateRunning: protectedProcedure
    .input(runningLogUpdateSchema.extend({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;
      return updateRunningLog(ctx.user.id, id, rest);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteLog(ctx.user.id, input.id)),

  startTimer: protectedProcedure
    .input(startTimerSchema)
    .mutation(({ ctx, input }) => startTimer(ctx.user.id, input)),

  stopTimer: protectedProcedure
    .input(stopTimerSchema)
    .mutation(({ ctx, input }) => stopTimer(ctx.user.id, input)),

  createCalendarSlot: protectedProcedure
    .input(calendarSlotSchema)
    .mutation(({ ctx, input }) => createCalendarSlot(ctx.user.id, input)),
});

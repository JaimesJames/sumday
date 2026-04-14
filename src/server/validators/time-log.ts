import { z } from "zod";

export const manualLogSchema = z
  .object({
    categoryId: z.string().uuid(),
    title: z.string().max(140).optional(),
    note: z.string().max(1000).optional(),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date(),
  })
  .refine((value) => value.endedAt > value.startedAt, {
    message: "End time must be later than start time",
    path: ["endedAt"],
  });

export const startTimerSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().max(140).optional(),
  note: z.string().max(1000).optional(),
});

export const stopTimerSchema = z.object({
  logId: z.string().uuid(),
});

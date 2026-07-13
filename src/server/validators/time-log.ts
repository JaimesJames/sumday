import { z } from "zod";

export const manualLogSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
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
  categoryId: z.string().uuid().optional(),
  title: z.string().max(140).optional(),
  note: z.string().max(1000).optional(),
});

export const stopTimerSchema = z.object({
  logId: z.string().uuid(),
});

export const runningLogUpdateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().max(140).optional(),
  note: z.string().max(1000).optional(),
});

export const calendarSlotSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    title: z.string().max(140).optional(),
    note: z.string().max(1000).optional(),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date().optional(),
    mode: z.enum(["instant", "running"]),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "instant") {
      if (!value.endedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endedAt"],
          message: "End time is required for instant slots.",
        });
        return;
      }
      if (value.endedAt <= value.startedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endedAt"],
          message: "End time must be later than start time.",
        });
      }
    }
  });

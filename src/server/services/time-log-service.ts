import { and, desc, eq, gte, lte } from "drizzle-orm";
import { differenceInSeconds } from "date-fns";
import type { z } from "zod";
import { db } from "@/server/db";
import { categories, timeLogs } from "@/server/db/schema";
import type {
  calendarSlotSchema,
  manualLogSchema,
  runningLogUpdateSchema,
  startTimerSchema,
  stopTimerSchema,
} from "@/server/validators/time-log";

type ManualLogInput = z.infer<typeof manualLogSchema>;
type StartTimerInput = z.infer<typeof startTimerSchema>;
type StopTimerInput = z.infer<typeof stopTimerSchema>;
type CalendarSlotInput = z.infer<typeof calendarSlotSchema>;
type RunningLogUpdateInput = z.infer<typeof runningLogUpdateSchema>;

const RUNNING_TIMER_ERROR = "You already have a running timer.";

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code
    ?? (error as { code?: string })?.code;
  return code === "23505";
}

async function ensureCategoryOwnership(userId: string, categoryId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!category) {
    throw new Error("Category not found.");
  }
}

export async function listTimeLogs(
  userId: string,
  filters?: { categoryId?: string; from?: Date; to?: Date },
) {
  const conditions = [eq(timeLogs.userId, userId)];
  if (filters?.categoryId) conditions.push(eq(timeLogs.categoryId, filters.categoryId));
  if (filters?.from) conditions.push(gte(timeLogs.startedAt, filters.from));
  if (filters?.to) conditions.push(lte(timeLogs.startedAt, filters.to));

  return db
    .select({
      log: timeLogs,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(timeLogs)
    .leftJoin(categories, eq(categories.id, timeLogs.categoryId))
    .where(and(...conditions))
    .orderBy(desc(timeLogs.startedAt));
}

export async function createManualLog(userId: string, input: ManualLogInput) {
  if (input.categoryId) {
    await ensureCategoryOwnership(userId, input.categoryId);
  }

  const durationSeconds = differenceInSeconds(input.endedAt, input.startedAt);
  const [created] = await db
    .insert(timeLogs)
    .values({
      userId,
      categoryId: input.categoryId,
      title: input.title,
      note: input.note,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationSeconds,
      isRunning: false,
    })
    .returning();
  return created;
}

export async function startTimer(userId: string, input: StartTimerInput) {
  if (input.categoryId) {
    await ensureCategoryOwnership(userId, input.categoryId);
  }

  const [running] = await db
    .select({ id: timeLogs.id })
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), eq(timeLogs.isRunning, true)))
    .limit(1);
  if (running) {
    throw new Error(RUNNING_TIMER_ERROR);
  }

  try {
    const [created] = await db
      .insert(timeLogs)
      .values({
        userId,
        categoryId: input.categoryId,
        title: input.title,
        note: input.note,
        startedAt: new Date(),
        isRunning: true,
        endedAt: null,
        durationSeconds: null,
      })
      .returning();
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(RUNNING_TIMER_ERROR);
    }
    throw error;
  }
}

export async function stopTimer(userId: string, input: StopTimerInput) {
  const [runningLog] = await db
    .select()
    .from(timeLogs)
    .where(
      and(
        eq(timeLogs.id, input.logId),
        eq(timeLogs.userId, userId),
        eq(timeLogs.isRunning, true),
      ),
    )
    .limit(1);
  if (!runningLog) throw new Error("Running timer not found.");

  const endedAt = new Date();
  const durationSeconds = differenceInSeconds(endedAt, runningLog.startedAt);

  const [updated] = await db
    .update(timeLogs)
    .set({ endedAt, durationSeconds, isRunning: false, updatedAt: new Date() })
    .where(and(eq(timeLogs.id, input.logId), eq(timeLogs.userId, userId)))
    .returning();
  return updated;
}

export async function createCalendarSlot(userId: string, input: CalendarSlotInput) {
  if (input.categoryId) {
    await ensureCategoryOwnership(userId, input.categoryId);
  }

  if (input.mode === "running") {
    const [running] = await db
      .select({ id: timeLogs.id })
      .from(timeLogs)
      .where(and(eq(timeLogs.userId, userId), eq(timeLogs.isRunning, true)))
      .limit(1);

    if (running) {
      throw new Error(RUNNING_TIMER_ERROR);
    }

    try {
      const [createdRunning] = await db
        .insert(timeLogs)
        .values({
          userId,
          categoryId: input.categoryId,
          title: input.title,
          note: input.note,
          startedAt: input.startedAt,
          isRunning: true,
          endedAt: null,
          durationSeconds: null,
        })
        .returning();
      return createdRunning;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error(RUNNING_TIMER_ERROR);
      }
      throw error;
    }
  }

  const durationSeconds = differenceInSeconds(input.endedAt!, input.startedAt);
  const [createdInstant] = await db
    .insert(timeLogs)
    .values({
      userId,
      categoryId: input.categoryId,
      title: input.title,
      note: input.note,
      startedAt: input.startedAt,
      endedAt: input.endedAt!,
      durationSeconds,
      isRunning: false,
    })
    .returning();
  return createdInstant;
}

export async function updateLog(userId: string, logId: string, input: ManualLogInput) {
  if (input.categoryId) {
    await ensureCategoryOwnership(userId, input.categoryId);
  }
  const durationSeconds = differenceInSeconds(input.endedAt, input.startedAt);

  const [updated] = await db
    .update(timeLogs)
    .set({
      categoryId: input.categoryId ?? null,
      title: input.title ?? null,
      note: input.note ?? null,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationSeconds,
      isRunning: false,
      updatedAt: new Date(),
    })
    .where(and(eq(timeLogs.id, logId), eq(timeLogs.userId, userId)))
    .returning();
  return updated;
}

export async function updateRunningLog(userId: string, logId: string, input: RunningLogUpdateInput) {
  if (input.categoryId) {
    await ensureCategoryOwnership(userId, input.categoryId);
  }

  const [updated] = await db
    .update(timeLogs)
    .set({
      categoryId: input.categoryId ?? null,
      title: input.title ?? null,
      note: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(timeLogs.id, logId),
        eq(timeLogs.userId, userId),
        eq(timeLogs.isRunning, true),
      ),
    )
    .returning();
  return updated;
}

export async function deleteLog(userId: string, logId: string) {
  const [deleted] = await db
    .delete(timeLogs)
    .where(and(eq(timeLogs.id, logId), eq(timeLogs.userId, userId)))
    .returning();
  return deleted;
}

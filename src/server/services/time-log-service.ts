import { and, desc, eq, gte, lte } from "drizzle-orm";
import { differenceInSeconds } from "date-fns";
import { db } from "@/server/db";
import { categories, timeLogs } from "@/server/db/schema";
import {
  manualLogSchema,
  startTimerSchema,
  stopTimerSchema,
} from "@/server/validators/time-log";

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
    .innerJoin(categories, eq(categories.id, timeLogs.categoryId))
    .where(and(...conditions))
    .orderBy(desc(timeLogs.startedAt));
}

export async function createManualLog(userId: string, rawInput: unknown) {
  const input = manualLogSchema.parse(rawInput);
  await ensureCategoryOwnership(userId, input.categoryId);

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

export async function startTimer(userId: string, rawInput: unknown) {
  const input = startTimerSchema.parse(rawInput);
  await ensureCategoryOwnership(userId, input.categoryId);

  const [running] = await db
    .select({ id: timeLogs.id })
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), eq(timeLogs.isRunning, true)))
    .limit(1);
  if (running) {
    throw new Error("You already have a running timer.");
  }

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
}

export async function stopTimer(userId: string, rawInput: unknown) {
  const input = stopTimerSchema.parse(rawInput);

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

export async function updateLog(userId: string, logId: string, rawInput: unknown) {
  const input = manualLogSchema.parse(rawInput);
  await ensureCategoryOwnership(userId, input.categoryId);
  const durationSeconds = differenceInSeconds(input.endedAt, input.startedAt);

  const [updated] = await db
    .update(timeLogs)
    .set({
      categoryId: input.categoryId,
      title: input.title,
      note: input.note,
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

export async function deleteLog(userId: string, logId: string) {
  const [deleted] = await db
    .delete(timeLogs)
    .where(and(eq(timeLogs.id, logId), eq(timeLogs.userId, userId)))
    .returning();
  return deleted;
}

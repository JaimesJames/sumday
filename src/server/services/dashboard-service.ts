import { and, desc, eq, gte, lt } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/server/db";
import { categories, timeLogs } from "@/server/db/schema";

function getTodayRangeUtc(timeZone: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(now).split("-");
  const start = fromZonedTime(`${year}-${month}-${day}T00:00:00`, timeZone);
  const end = fromZonedTime(`${year}-${month}-${day}T23:59:59`, timeZone);
  return { start, end };
}

export async function getDashboardSummary(userId: string, timeZone: string) {
  const { start, end } = getTodayRangeUtc(timeZone);
  const logs = await db
    .select({
      id: timeLogs.id,
      title: timeLogs.title,
      durationSeconds: timeLogs.durationSeconds,
      startedAt: timeLogs.startedAt,
      endedAt: timeLogs.endedAt,
      isRunning: timeLogs.isRunning,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(timeLogs)
    .leftJoin(categories, eq(categories.id, timeLogs.categoryId))
    .where(
      and(
        eq(timeLogs.userId, userId),
        gte(timeLogs.startedAt, start),
        lt(timeLogs.startedAt, end),
      ),
    )
    .orderBy(desc(timeLogs.startedAt));

  const totalSeconds = logs.reduce((total, item) => total + (item.durationSeconds ?? 0), 0);
  const breakdownMap = new Map<string, { color: string; seconds: number }>();

  for (const log of logs) {
    const key = log.categoryName ?? "No category";
    const prev = breakdownMap.get(key) ?? { color: log.categoryColor ?? "#7f7f7f", seconds: 0 };
    prev.seconds += log.durationSeconds ?? 0;
    breakdownMap.set(key, prev);
  }

  const runningTimer = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), eq(timeLogs.isRunning, true)))
    .limit(1);

  return {
    totalSeconds,
    recentLogs: logs.slice(0, 6),
    breakdown: Array.from(breakdownMap.entries()).map(([name, value]) => ({
      name,
      color: value.color,
      seconds: value.seconds,
    })),
    runningTimer: runningTimer[0] ?? null,
  };
}

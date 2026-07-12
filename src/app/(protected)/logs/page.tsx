import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { Play } from "lucide-react";
import {
  startTimerAction,
} from "@/app/(protected)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WeekCalendar } from "@/components/logs/week-calendar";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/services/category-service";
import { listTimeLogs } from "@/server/services/time-log-service";

type LogsPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const user = await requireUser();
  const filters = await searchParams;
  const baseDate = filters.week ? new Date(`${filters.week}T00:00:00`) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const categories = await listCategories(user.id);
  const logs = await listTimeLogs(user.id, {
    from: weekStart,
    to: weekEnd,
  });
  const weekStartParam = format(weekStart, "yyyy-MM-dd");
  const prevWeekParam = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextWeekParam = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <Card className="shrink-0 rounded-[28px] border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-[#f1f1f1]">
              Week: {format(weekStart, "dd MMM")} - {format(weekEnd, "dd MMM yyyy")}
            </div>
            <div className="flex gap-2">
              <a href={`/logs?week=${prevWeekParam}`} className="rounded-[8px] border border-[#3f3f3f] px-3 py-1 text-sm text-[#f1f1f1]">
                Prev
              </a>
              <a href={`/logs?week=${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")}`} className="rounded-[8px] border border-[#3f3f3f] px-3 py-1 text-sm text-[#f1f1f1]">
                This week
              </a>
              <a href={`/logs?week=${nextWeekParam}`} className="rounded-[8px] border border-[#3f3f3f] px-3 py-1 text-sm text-[#f1f1f1]">
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 rounded-[28px] border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-6 p-4">
          <form
            action={startTimerAction}
            className="shrink-0 flex items-center gap-3 px-1 py-1"
          >
            <Input
              name="title"
              placeholder="What are you working on?"
              className="h-8 flex-1 border-none bg-transparent px-1 text-[#f1f1f1] placeholder:text-[#7f7f7f] shadow-none focus-visible:ring-0"
            />
            <select
              name="categoryId"
              required
              aria-label="Category"
              defaultValue=""
              className="h-8 min-w-[120px] rounded-[10px] border border-[#3a3a3a] bg-[#2B2B2B] px-2 text-sm text-[#d7d7d7] outline-none"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="icon"
              className="size-10 rounded-full bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
              aria-label="Start log"
            >
              <Play className="size-5 fill-current" />
            </Button>
          </form>
          <WeekCalendar
            weekStartIso={weekStartParam}
            categories={categories.map((category) => ({ id: category.id, name: category.name, color: category.color }))}
            logs={logs.map(({ log, categoryName, categoryColor }) => ({
              id: log.id,
              title: log.title,
              startedAt: log.startedAt.toISOString(),
              endedAt: log.endedAt ? log.endedAt.toISOString() : null,
              isRunning: log.isRunning,
              categoryId: log.categoryId,
              categoryName,
              categoryColor,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

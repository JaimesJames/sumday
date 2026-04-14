import { endOfMonth, endOfWeek, format, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import { Play } from "lucide-react";
import {
  deleteLogAction,
  startTimerAction,
  updateLogAction,
} from "@/app/(protected)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/time";
import { requireUser } from "@/server/auth/session";
import { listCategories } from "@/server/services/category-service";
import { listTimeLogs } from "@/server/services/time-log-service";

type LogsPageProps = {
  searchParams: Promise<{ categoryId?: string; from?: string; to?: string; month?: string }>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const user = await requireUser();
  const filters = await searchParams;
  const monthDate = filters.month ? new Date(`${filters.month}-01T00:00:00`) : new Date();
  const effectiveFrom = filters.from ? new Date(filters.from) : startOfMonth(monthDate);
  const effectiveTo = filters.to ? new Date(filters.to) : endOfMonth(monthDate);
  const categories = await listCategories(user.id);
  const logs = await listTimeLogs(user.id, {
    categoryId: filters.categoryId,
    from: effectiveFrom,
    to: effectiveTo,
  });
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const logsByWeekDay = weekLabels.map((_, index) =>
    logs
      .filter(({ log }) => {
        const weekdayIndex = (log.startedAt.getDay() + 6) % 7;
        return weekdayIndex === index && isWithinInterval(log.startedAt, { start: currentWeekStart, end: currentWeekEnd });
      })
      .sort((a, b) => a.log.startedAt.getTime() - b.log.startedAt.getTime()),
  );

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <Card className="shrink-0 rounded-[28px] border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
        <CardContent className="p-3">
          <form className="grid gap-2 md:grid-cols-4">
            <div className="text-sm text-[#f1f1f1] md:col-span-1 md:self-center">Month</div>
            <Input
              type="month"
              name="month"
              defaultValue={filters.month ?? format(new Date(), "yyyy-MM")}
              className="border-[#3f3f3f] bg-[#2B2B2B] text-[#f1f1f1] md:col-span-2"
            />
            <Button className="rounded-xl bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90 md:col-span-1">Apply month</Button>
          </form>
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
              size="icon"
              className="size-10 rounded-full bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
              aria-label="Start log"
            >
              <Play className="size-5 fill-current" />
            </Button>
          </form>

          <div className="grid min-h-0 flex-1 grid-cols-7 overflow-hidden rounded-[20px] border border-[#3a3a3a] bg-[#2B2B2B]">
            {weekLabels.map((day) => (
              <div key={day} className="border-r border-[#3f3f3f] px-3 py-2 text-center text-xs tracking-wide text-[#f1f1f1] last:border-r-0">
                {day}
              </div>
            ))}
            {logsByWeekDay.map((dayLogs, dayIndex) => (
              <div
                key={weekLabels[dayIndex]}
                className="space-y-2 overflow-hidden border-r border-dashed border-[#3f3f3f] p-2.5 last:border-r-0"
              >
                {dayLogs.map(({ log, categoryColor, categoryName }) => (
                  <form
                    key={log.id}
                    action={updateLogAction}
                    className="space-y-1 rounded-xl border border-[#D0FF00] bg-[#303717] p-2"
                    style={{ minHeight: `${Math.max(42, Math.round((log.durationSeconds ?? 1800) / 65))}px` }}
                  >
                    <input type="hidden" name="id" value={log.id} />
                    <div className="flex items-center justify-between gap-1">
                      <Badge className="border-0 text-[11px] text-[#1f2312]" style={{ backgroundColor: categoryColor }}>
                        {categoryName}
                      </Badge>
                      <button
                        formAction={deleteLogAction}
                        className="cursor-pointer text-[10px] text-[#FF5C5C] opacity-80 transition hover:opacity-100"
                      >
                        delete
                      </button>
                    </div>
                    <Input
                      name="title"
                      defaultValue={log.title ?? ""}
                      placeholder="Title"
                      className="h-7 border-[#3f3f3f] bg-[#2B2B2B] text-[11px] text-[#f1f1f1]"
                    />
                    <div className="text-[10px] text-[#e8e8e8]/90">
                      {format(log.startedAt, "HH:mm")} - {log.endedAt ? format(log.endedAt, "HH:mm") : "ongoing"}
                    </div>
                    <div className="text-[10px] text-[#e8e8e8]/80">{formatDuration(log.durationSeconds ?? 0)}</div>
                  </form>
                ))}
              </div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="shrink-0 rounded-xl border border-dashed border-[#3f3f3f] p-4 text-sm text-[#f1f1f1]">No logs found for current filters.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

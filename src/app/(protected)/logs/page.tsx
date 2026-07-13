import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartLogForm } from "@/components/logs/quick-start-log-form";
import { WeekCalendar } from "@/components/logs/week-calendar";
import { requireUser } from "@/server/auth/session";
import { HydrateClient, trpcServer } from "@/trpc/server";

type LogsPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  await requireUser();
  const filters = await searchParams;
  const baseDate = filters.week ? new Date(`${filters.week}T00:00:00`) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const weekStartParam = format(weekStart, "yyyy-MM-dd");
  const prevWeekParam = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextWeekParam = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  await trpcServer.category.list.prefetch();
  await trpcServer.timeLog.list.prefetch({ from: weekStart, to: weekEnd });

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
          <HydrateClient>
            <QuickStartLogForm />
            <WeekCalendar weekStartIso={weekStartParam} />
          </HydrateClient>
        </CardContent>
      </Card>
    </div>
  );
}

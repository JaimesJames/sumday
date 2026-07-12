import { format } from "date-fns";
import { cookies } from "next/headers";
import { startTimerAction, stopTimerAction } from "@/app/(protected)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/lib/time";
import { requireUser } from "@/server/auth/session";
import { getDashboardSummary } from "@/server/services/dashboard-service";
import { listCategories } from "@/server/services/category-service";

export default async function DashboardPage() {
  const user = await requireUser();
  const cookieStore = await cookies();
  const userTimezone = cookieStore.get("dayly_tz")?.value ?? "UTC";
  const categories = await listCategories(user.id);
  const summary = await getDashboardSummary(user.id, userTimezone);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 rounded-3xl">
        <CardHeader>
          <CardTitle>Today at a glance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold text-violet-600">{formatDuration(summary.totalSeconds)}</p>
          <p className="text-sm text-slate-500">Total logged time today</p>
          {summary.runningTimer ? (
            <form action={stopTimerAction} className="flex items-center gap-2">
              <input type="hidden" name="logId" value={summary.runningTimer.id} />
              <Badge className="bg-emerald-500 text-white">Running</Badge>
              <Button type="submit" className="rounded-full">Stop Timer</Button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">No timer running now</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Quick start timer</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={startTimerAction} className="space-y-3">
            <Label>Category</Label>
            <select name="categoryId" defaultValue="" className="w-full rounded-md border bg-white px-3 py-2 text-sm">
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input name="title" placeholder="Title (optional)" />
            <Button type="submit" className="w-full rounded-full">Start</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Category breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="font-medium">{formatDuration(item.seconds)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 rounded-3xl">
        <CardHeader>
          <CardTitle>Recent logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.recentLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
              <div>
                <p className="font-medium">{log.title || log.categoryName || "Untitled"}</p>
                <p className="text-sm text-slate-500">{format(log.startedAt, "PPP p")}</p>
              </div>
              <Badge style={{ backgroundColor: log.categoryColor ?? "#7f7f7f" }}>
                {log.categoryName ?? "No category"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

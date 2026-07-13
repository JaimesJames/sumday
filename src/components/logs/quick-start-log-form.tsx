"use client";

import { endOfWeek } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { z } from "zod";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/react";
import type { AppRouter } from "@/server/api/root";
import type { startTimerSchema } from "@/server/validators/time-log";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LogListItem = RouterOutputs["timeLog"]["list"][number];
type StartTimerInput = z.infer<typeof startTimerSchema>;

export function QuickStartLogForm({ weekStartIso }: { weekStartIso: string }) {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.category.list.useQuery();

  const weekStart = new Date(weekStartIso);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const listInput = { from: weekStart, to: weekEnd };

  const startTimer = trpc.timeLog.startTimer.useMutation({
    onMutate: async (input: StartTimerInput) => {
      const now = new Date();
      // Starting a timer always begins "now" — only worth an optimistic
      // insert if the currently viewed week actually contains today.
      if (now < weekStart || now > weekEnd) return undefined;

      await utils.timeLog.list.cancel(listInput);
      const previous = utils.timeLog.list.getData(listInput);
      const category = input.categoryId ? categories.find((c) => c.id === input.categoryId) : undefined;
      const optimisticItem: LogListItem = {
        log: {
          id: `optimistic-${Date.now()}`,
          userId: "",
          categoryId: input.categoryId ?? null,
          title: input.title ?? null,
          note: null,
          startedAt: now,
          endedAt: null,
          durationSeconds: null,
          isRunning: true,
          createdAt: now,
          updatedAt: now,
        },
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
      };
      utils.timeLog.list.setData(listInput, (old) => [optimisticItem, ...(old ?? [])]);
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) utils.timeLog.list.setData(listInput, context.previous);
      toast.error(error.message);
    },
    onSettled: () => {
      utils.timeLog.list.invalidate();
      utils.dashboard.summary.invalidate();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") || "") || undefined;
        const categoryId = String(formData.get("categoryId") || "") || undefined;
        startTimer.mutate({ title, categoryId });
        event.currentTarget.reset();
      }}
      className="shrink-0 flex items-center gap-3 px-1 py-1"
    >
      <Input
        name="title"
        placeholder="What are you working on?"
        className="h-8 flex-1 border-none bg-transparent px-1 text-[#f1f1f1] placeholder:text-[#7f7f7f] shadow-none focus-visible:ring-0"
      />
      <select
        name="categoryId"
        aria-label="Category"
        defaultValue=""
        className="h-8 min-w-[120px] rounded-[10px] border border-[#3a3a3a] bg-[#2B2B2B] px-2 text-sm text-[#d7d7d7] outline-none"
      >
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="icon"
        disabled={startTimer.isPending}
        className="size-10 rounded-full bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
        aria-label="Start log"
      >
        <Play className="size-5 fill-current" />
      </Button>
    </form>
  );
}

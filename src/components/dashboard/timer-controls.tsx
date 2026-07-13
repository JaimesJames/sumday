"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";

type Category = { id: string; name: string; color: string };

export function TimerControls({ runningTimerId }: { runningTimerId: string | null }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const stopTimer = trpc.timeLog.stopTimer.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      router.refresh();
    },
  });

  if (runningTimerId) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-500 text-white">Running</Badge>
        <Button
          type="button"
          className="rounded-full"
          disabled={stopTimer.isPending}
          onClick={() => stopTimer.mutate({ logId: runningTimerId })}
        >
          Stop Timer
        </Button>
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-500">No timer running now</p>
  );
}

export function QuickStartCard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const startTimer = trpc.timeLog.startTimer.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const categoryId = String(formData.get("categoryId") || "") || undefined;
        const title = String(formData.get("title") || "") || undefined;
        startTimer.mutate({ categoryId, title });
      }}
      className="space-y-3"
    >
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
      <Button type="submit" className="w-full rounded-full" disabled={startTimer.isPending}>
        {startTimer.isPending ? "Starting..." : "Start"}
      </Button>
    </form>
  );
}

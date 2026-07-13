"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CalendarCategory, CalendarLog } from "@/components/logs/week-calendar";
import { trpc } from "@/trpc/react";

export function EditLogDialog({
  log,
  categories,
  open,
  onOpenChange,
}: {
  log: CalendarLog | null;
  categories: CalendarCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const updateLog = trpc.timeLog.update.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      onOpenChange(false);
    },
  });
  const updateRunningLog = trpc.timeLog.updateRunning.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      onOpenChange(false);
    },
  });
  const deleteLog = trpc.timeLog.delete.useMutation({
    onSuccess: () => {
      utils.timeLog.list.invalidate();
      onOpenChange(false);
    },
  });

  if (!log) return null;

  const startValue = format(new Date(log.startedAt), "yyyy-MM-dd'T'HH:mm");
  const endValue = log.endedAt ? format(new Date(log.endedAt), "yyyy-MM-dd'T'HH:mm") : "";
  const isSaving = updateLog.isPending || updateRunningLog.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
        <DialogHeader>
          <DialogTitle>Edit slot</DialogTitle>
        </DialogHeader>
        <form
          id="edit-slot-form"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const categoryId = String(formData.get("categoryId") || "") || undefined;
            const title = String(formData.get("title") || "") || undefined;
            if (log.isRunning) {
              updateRunningLog.mutate({ id: log.id, categoryId, title });
              return;
            }
            const startedAt = new Date(String(formData.get("startedAt")));
            const endedAt = new Date(String(formData.get("endedAt")));
            updateLog.mutate({ id: log.id, categoryId, title, startedAt, endedAt });
          }}
          className="space-y-3"
        >
          <select
            name="categoryId"
            defaultValue={log.categoryId ?? ""}
            className="h-10 w-full rounded-[8px] border border-[#3f3f3f] bg-[#242424] px-2"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Input
            name="title"
            placeholder="Untitled"
            defaultValue={log.title ?? ""}
            className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]"
          />
          <div>
            <label className="mb-1 block text-xs text-[#bbbbbb]">Start</label>
            <Input
              type="datetime-local"
              name="startedAt"
              required={!log.isRunning}
              defaultValue={startValue}
              disabled={log.isRunning}
              className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1] disabled:opacity-50"
            />
          </div>
          {!log.isRunning && (
            <div>
              <label className="mb-1 block text-xs text-[#bbbbbb]">End</label>
              <Input
                type="datetime-local"
                name="endedAt"
                required
                defaultValue={endValue}
                className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]"
              />
            </div>
          )}
          {log.isRunning && <p className="text-xs text-[#9b9b9b]">This timer is still running.</p>}
        </form>
        <DialogFooter className="bg-transparent">
          <Button
            type="button"
            variant="destructive"
            disabled={deleteLog.isPending}
            onClick={() => {
              if (!window.confirm("Delete this log?")) return;
              deleteLog.mutate({ id: log.id });
            }}
          >
            Delete
          </Button>
          <Button
            type="submit"
            form="edit-slot-form"
            disabled={isSaving}
            className="rounded-[8px] bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

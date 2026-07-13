"use client";

import { format } from "date-fns";
import { updateLogAction, updateRunningLogAction } from "@/app/(protected)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteLogAction } from "@/app/(protected)/actions";
import type { CalendarCategory, CalendarLog } from "@/components/logs/week-calendar";

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
  if (!log) return null;

  const startValue = format(new Date(log.startedAt), "yyyy-MM-dd'T'HH:mm");
  const endValue = log.endedAt ? format(new Date(log.endedAt), "yyyy-MM-dd'T'HH:mm") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
        <DialogHeader>
          <DialogTitle>Edit slot</DialogTitle>
        </DialogHeader>
        <form
          id="edit-slot-form"
          action={async (formData) => {
            if (log.isRunning) {
              await updateRunningLogAction(formData);
            } else {
              await updateLogAction(formData);
            }
            onOpenChange(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={log.id} />
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
              required
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
            onClick={async () => {
              if (!window.confirm("Delete this log?")) return;
              const fd = new FormData();
              fd.set("id", log.id);
              await deleteLogAction(fd);
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
          <Button
            type="submit"
            form="edit-slot-form"
            className="rounded-[8px] bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

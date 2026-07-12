"use client";

import { addDays, differenceInMinutes, format, startOfDay } from "date-fns";
import { Plus, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { createCalendarSlotAction, stopTimerAction } from "@/app/(protected)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CalendarCategory = {
  id: string;
  name: string;
  color: string;
};

type CalendarLog = {
  id: string;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  isRunning: boolean;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const SLOT_HEIGHT = 40;
const DAY_HEIGHT = SLOT_HEIGHT * 24;

export function WeekCalendar({
  weekStartIso,
  categories,
  logs,
}: {
  weekStartIso: string;
  categories: CalendarCategory[];
  logs: CalendarLog[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState(`${format(new Date(), "yyyy-MM-dd")}T09:00`);
  const [selectedEnd, setSelectedEnd] = useState(`${format(new Date(), "yyyy-MM-dd")}T10:00`);
  const [mode, setMode] = useState<"instant" | "running">("instant");
  const weekStart = useMemo(() => new Date(weekStartIso), [weekStartIso]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const now = new Date();

  const openCreateSlot = (slotDate: Date) => {
    const startValue = format(slotDate, "yyyy-MM-dd'T'HH:mm");
    const endValue = format(new Date(slotDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
    setSelectedStart(startValue);
    setSelectedEnd(endValue);
    setMode("instant");
    setOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="rounded-[8px] bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90" />}>
            <Plus className="size-4" />
            Add slot
          </DialogTrigger>
          <DialogContent className="border border-[#3a3a3a] bg-[#2B2B2B] text-[#f1f1f1]">
            <DialogHeader>
              <DialogTitle>Create slot</DialogTitle>
            </DialogHeader>
            <form id="create-slot-form" action={createCalendarSlotAction} className="space-y-3">
              <select
                name="categoryId"
                required
                defaultValue=""
                className="h-10 w-full rounded-[8px] border border-[#3f3f3f] bg-[#242424] px-2"
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="title" placeholder="Title" className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]" />
              <div>
                <label className="mb-1 block text-xs text-[#bbbbbb]">Start</label>
                <Input
                  type="datetime-local"
                  name="startedAt"
                  required
                  value={selectedStart}
                  onChange={(event) => {
                    setSelectedStart(event.target.value);
                    if (mode === "instant" && selectedEnd <= event.target.value) {
                      setSelectedEnd(event.target.value);
                    }
                  }}
                  className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#bbbbbb]">Mode</label>
                <select
                  name="mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as "instant" | "running")}
                  className="h-10 w-full rounded-[8px] border border-[#3f3f3f] bg-[#242424] px-2"
                >
                  <option value="instant">Instant slot (start + end)</option>
                  <option value="running">Running slot (start only)</option>
                </select>
              </div>
              {mode === "instant" && (
                <div>
                  <label className="mb-1 block text-xs text-[#bbbbbb]">End</label>
                  <Input
                    type="datetime-local"
                    name="endedAt"
                    required
                    value={selectedEnd}
                    onChange={(event) => setSelectedEnd(event.target.value)}
                    className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]"
                  />
                </div>
              )}
            </form>
            <DialogFooter className="bg-transparent">
              <Button type="submit" form="create-slot-form" className="rounded-[8px] bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90">
                Save slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[12px] border border-[#3a3a3a]">
        <div className="grid min-w-[980px]" style={{ gridTemplateColumns: "70px repeat(7, minmax(0,1fr))" }}>
          <div className="border-r border-[#3f3f3f]" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="border-r border-[#3f3f3f] p-2 text-center text-xs last:border-r-0">
              <div className="text-[#f1f1f1]">{format(day, "EEE")}</div>
              <div className="text-[#a5a5a5]">{format(day, "dd MMM")}</div>
            </div>
          ))}

          <div className="relative border-r border-[#3f3f3f]">
            {HOUR_LABELS.map((label, index) => (
              <div
                key={label}
                className="absolute left-2 text-[10px] text-[#9f9f9f]"
                style={{ top: `${index * SLOT_HEIGHT - 6}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <div key={`col-${day.toISOString()}`} className="relative border-r border-[#3f3f3f] last:border-r-0" style={{ height: DAY_HEIGHT }}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const slotDate = new Date(day);
                slotDate.setHours(hour, 0, 0, 0);
                return (
                  <button
                    key={`${day.toISOString()}-${hour}`}
                    type="button"
                    onClick={() => openCreateSlot(slotDate)}
                    className="absolute left-0 right-0 border-t border-[#343434] transition hover:bg-[#313131]"
                    style={{ top: `${hour * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                  />
                );
              })}

              {logs
                .filter((entry) => format(new Date(entry.startedAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                .map((entry) => {
                  const start = new Date(entry.startedAt);
                  const end = entry.endedAt ? new Date(entry.endedAt) : now;
                  const minutesFromDayStart = differenceInMinutes(start, startOfDay(day));
                  const durationMinutes = Math.max(30, differenceInMinutes(end, start));
                  const top = (minutesFromDayStart / 60) * SLOT_HEIGHT;
                  const height = (durationMinutes / 60) * SLOT_HEIGHT;

                  return (
                    <div
                      key={entry.id}
                      className="absolute left-1 right-1 z-10 rounded-[8px] border border-[#D0FF00] bg-[#2f3716] p-1 text-[10px]"
                      style={{ top, height }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <span className="truncate font-semibold" style={{ color: entry.categoryColor }}>
                          {entry.categoryName}
                        </span>
                        {entry.isRunning ? (
                          <form action={stopTimerAction}>
                            <input type="hidden" name="logId" value={entry.id} />
                            <button className="text-[#FF5C5C]" type="submit">
                              <Square className="size-3 fill-current" />
                            </button>
                          </form>
                        ) : (
                          <span className="text-[#9b9b9b]">{format(end, "HH:mm")}</span>
                        )}
                      </div>
                      <div className="truncate text-[#f1f1f1]">{entry.title || "Untitled"}</div>
                      <div className="text-[#bbbbbb]">{format(start, "HH:mm")} {entry.isRunning ? "• running" : `- ${format(end, "HH:mm")}`}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

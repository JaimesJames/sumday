"use client";

import { addDays, addMinutes, differenceInMinutes, endOfWeek, format, startOfDay } from "date-fns";
import { Plus, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { EditLogDialog } from "@/components/logs/edit-log-dialog";
import { trpc } from "@/trpc/react";

export type CalendarCategory = {
  id: string;
  name: string;
  color: string;
};

export type CalendarLog = {
  id: string;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  isRunning: boolean;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const SLOT_HEIGHT = 40;
const DAY_HEIGHT = SLOT_HEIGHT * 24;
const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapMinutes(raw: number) {
  return Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
}

function yToMinutes(offsetY: number) {
  const raw = (offsetY / SLOT_HEIGHT) * 60;
  return clamp(snapMinutes(raw), 0, 1440);
}

function xToDayIndex(clientX: number, columnRects: (DOMRect | null)[], fallback: number) {
  for (let index = 0; index < columnRects.length; index += 1) {
    const rect = columnRects[index];
    if (rect && clientX >= rect.left && clientX < rect.right) return index;
  }
  const first = columnRects.find((rect) => rect !== null) ?? null;
  const last = [...columnRects].reverse().find((rect) => rect !== null) ?? null;
  if (first && clientX < first.left) return 0;
  if (last && clientX >= last.right) return columnRects.length - 1;
  return fallback;
}

function computeOverlapLayout(
  items: { id: string; start: number; end: number }[],
): Map<string, { column: number; columnCount: number }> {
  const layout = new Map<string, { column: number; columnCount: number }>();
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);

  let cluster: typeof sorted = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const columnByItem = new Map<string, number>();
    for (const item of cluster) {
      let column = columnEnds.findIndex((end) => end <= item.start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[column] = item.end;
      }
      columnByItem.set(item.id, column);
    }
    const columnCount = columnEnds.length;
    for (const item of cluster) {
      layout.set(item.id, { column: columnByItem.get(item.id)!, columnCount });
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) {
      flushCluster();
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flushCluster();

  return layout;
}

type DragKind = "move" | "resize-top" | "resize-bottom";

type Draft = {
  id: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
};

type Gesture = {
  pointerId: number;
  entry: CalendarLog;
  kind: DragKind;
  startX: number;
  startY: number;
  moved: boolean;
  originDayIndex: number;
  originStartMinutes: number;
  originEndMinutes: number;
  columnRects: (DOMRect | null)[];
};

export function WeekCalendar({ weekStartIso }: { weekStartIso: string }) {
  const [open, setOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState(`${format(new Date(), "yyyy-MM-dd")}T09:00`);
  const [selectedEnd, setSelectedEnd] = useState(`${format(new Date(), "yyyy-MM-dd")}T10:00`);
  const [mode, setMode] = useState<"instant" | "running">("instant");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const dayColRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gestureCleanupRef = useRef<(() => void) | null>(null);

  const weekStart = useMemo(() => new Date(weekStartIso), [weekStartIso]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.category.list.useQuery();
  const { data: rawLogs = [] } = trpc.timeLog.list.useQuery({ from: weekStart, to: weekEnd });
  const logs: CalendarLog[] = useMemo(
    () =>
      rawLogs.map(({ log, categoryName, categoryColor }) => ({
        id: log.id,
        title: log.title,
        startedAt: log.startedAt.toISOString(),
        endedAt: log.endedAt ? log.endedAt.toISOString() : null,
        isRunning: log.isRunning,
        categoryId: log.categoryId,
        categoryName: categoryName ?? "No category",
        categoryColor: categoryColor ?? "#7f7f7f",
      })),
    [rawLogs],
  );

  function invalidateLogs() {
    utils.timeLog.list.invalidate();
    utils.dashboard.summary.invalidate();
  }

  const createCalendarSlot = trpc.timeLog.createCalendarSlot.useMutation({
    onSuccess: () => invalidateLogs(),
  });
  const updateLog = trpc.timeLog.update.useMutation({ onSuccess: () => invalidateLogs() });
  const stopTimer = trpc.timeLog.stopTimer.useMutation({ onSuccess: () => invalidateLogs() });

  function updateDraft(next: Draft | null) {
    draftRef.current = next;
    setDraft(next);
  }

  useEffect(() => {
    return () => {
      gestureCleanupRef.current?.();
    };
  }, []);

  const now = new Date();

  const editingLog = logs.find((entry) => entry.id === editingLogId) ?? null;

  const openCreateSlot = (slotDate: Date) => {
    const startValue = format(slotDate, "yyyy-MM-dd'T'HH:mm");
    const endValue = format(new Date(slotDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
    setSelectedStart(startValue);
    setSelectedEnd(endValue);
    setMode("instant");
    setOpen(true);
  };

  function getDisplayForEntry(entry: CalendarLog) {
    if (draft && draft.id === entry.id) {
      return { dayIndex: draft.dayIndex, startMinutes: draft.startMinutes, endMinutes: draft.endMinutes };
    }
    const start = new Date(entry.startedAt);
    const end = entry.endedAt ? new Date(entry.endedAt) : now;
    const dayKey = format(start, "yyyy-MM-dd");
    const dayIndex = weekDays.findIndex((day) => format(day, "yyyy-MM-dd") === dayKey);
    return {
      dayIndex: dayIndex === -1 ? 0 : dayIndex,
      startMinutes: differenceInMinutes(start, startOfDay(start)),
      endMinutes: differenceInMinutes(end, startOfDay(start)),
    };
  }

  function commitLogChange(entry: CalendarLog, dayIndex: number, startMinutes: number, endMinutes: number) {
    const dayDate = weekDays[dayIndex];
    const startedAt = addMinutes(startOfDay(dayDate), startMinutes);
    const endedAt = addMinutes(startOfDay(dayDate), endMinutes);
    updateLog.mutate({
      id: entry.id,
      categoryId: entry.categoryId ?? undefined,
      title: entry.title ?? undefined,
      startedAt,
      endedAt,
    });
  }

  function applyGestureMove(gesture: Gesture, clientX: number, clientY: number) {
    const dx = clientX - gesture.startX;
    const dy = clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
    gesture.moved = true;

    const deltaMinutes = snapMinutes(((clientY - gesture.startY) / SLOT_HEIGHT) * 60);

    if (gesture.kind === "move") {
      const duration = gesture.originEndMinutes - gesture.originStartMinutes;
      const startMinutes = clamp(gesture.originStartMinutes + deltaMinutes, 0, 1440 - duration);
      const dayIndex = xToDayIndex(clientX, gesture.columnRects, gesture.originDayIndex);
      updateDraft({ id: gesture.entry.id, dayIndex, startMinutes, endMinutes: startMinutes + duration });
    } else if (gesture.kind === "resize-bottom") {
      const endMinutes = clamp(
        gesture.originEndMinutes + deltaMinutes,
        gesture.originStartMinutes + MIN_DURATION_MINUTES,
        1440,
      );
      updateDraft({ id: gesture.entry.id, dayIndex: gesture.originDayIndex, startMinutes: gesture.originStartMinutes, endMinutes });
    } else {
      const startMinutes = clamp(
        gesture.originStartMinutes + deltaMinutes,
        0,
        gesture.originEndMinutes - MIN_DURATION_MINUTES,
      );
      updateDraft({ id: gesture.entry.id, dayIndex: gesture.originDayIndex, startMinutes, endMinutes: gesture.originEndMinutes });
    }
  }

  function beginGesture(event: React.PointerEvent<HTMLElement>, entry: CalendarLog, kind: DragKind) {
    event.stopPropagation();
    event.preventDefault();
    const display = getDisplayForEntry(entry);
    const columnRects = dayColRefs.current.map((el) => el?.getBoundingClientRect() ?? null);
    const gesture: Gesture = {
      pointerId: event.pointerId,
      entry,
      kind,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      originDayIndex: display.dayIndex,
      originStartMinutes: display.startMinutes,
      originEndMinutes: display.endMinutes,
      columnRects,
    };
    gestureRef.current = gesture;

    // Track on window, not the entry element: moving the block to a different
    // day column unmounts/remounts its DOM node (different parent in the JSX
    // tree), which would silently kill pointer capture/listeners bound to it.
    function onWindowMove(nativeEvent: PointerEvent) {
      if (nativeEvent.pointerId !== gesture.pointerId) return;
      applyGestureMove(gesture, nativeEvent.clientX, nativeEvent.clientY);
    }

    function cleanup() {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
      gestureCleanupRef.current = null;
    }

    function onWindowUp(nativeEvent: PointerEvent) {
      if (nativeEvent.pointerId !== gesture.pointerId) return;
      cleanup();
      gestureRef.current = null;

      const finalDraft = draftRef.current;
      if (!finalDraft || finalDraft.id !== gesture.entry.id) {
        updateDraft(null);
        setEditingLogId(gesture.entry.id);
        return;
      }

      const { dayIndex, startMinutes, endMinutes } = finalDraft;
      updateDraft(null);
      commitLogChange(gesture.entry, dayIndex, startMinutes, endMinutes);
    }

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);
    gestureCleanupRef.current = cleanup;
  }

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
            <form
              id="create-slot-form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const categoryId = String(formData.get("categoryId") || "") || undefined;
                const title = String(formData.get("title") || "") || undefined;
                createCalendarSlot.mutate(
                  {
                    categoryId,
                    title,
                    startedAt: new Date(selectedStart),
                    endedAt: mode === "instant" ? new Date(selectedEnd) : undefined,
                    mode,
                  },
                  { onSuccess: () => setOpen(false) },
                );
              }}
              className="space-y-3"
            >
              <select
                name="categoryId"
                defaultValue=""
                className="h-10 w-full rounded-[8px] border border-[#3f3f3f] bg-[#242424] px-2"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="title" placeholder="Untitled" className="border-[#3f3f3f] bg-[#242424] text-[#f1f1f1]" />
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
              <Button
                type="submit"
                form="create-slot-form"
                disabled={createCalendarSlot.isPending}
                className="rounded-[8px] bg-[#D0FF00] text-[#202609] hover:bg-[#D0FF00]/90"
              >
                Save slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto rounded-[12px] border border-[#3a3a3a]"
        style={draft ? { userSelect: "none", WebkitUserSelect: "none" } : undefined}
      >
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

          {weekDays.map((day, dayIndex) => (
            <div
              key={`col-${day.toISOString()}`}
              ref={(el) => {
                dayColRefs.current[dayIndex] = el;
              }}
              className="relative border-r border-[#3f3f3f] last:border-r-0"
              style={{ height: DAY_HEIGHT }}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const minutes = yToMinutes(event.clientY - rect.top);
                openCreateSlot(addMinutes(startOfDay(day), minutes));
              }}
            >
              {HOUR_LABELS.map((_, hour) => (
                <div
                  key={hour}
                  className="pointer-events-none absolute left-0 right-0 border-t border-[#343434]"
                  style={{ top: `${hour * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                />
              ))}

              {(() => {
                const dayEntries = logs
                  .map((entry) => ({ entry, display: getDisplayForEntry(entry) }))
                  .filter(({ display }) => display.dayIndex === dayIndex);
                const layout = computeOverlapLayout(
                  dayEntries.map(({ entry, display }) => ({
                    id: entry.id,
                    start: display.startMinutes,
                    end: Math.max(display.startMinutes + MIN_DURATION_MINUTES, display.endMinutes),
                  })),
                );
                return dayEntries.map(({ entry, display }) => {
                  const durationMinutes = Math.max(MIN_DURATION_MINUTES, display.endMinutes - display.startMinutes);
                  const top = (display.startMinutes / 60) * SLOT_HEIGHT;
                  const height = (durationMinutes / 60) * SLOT_HEIGHT;
                  const isDragging = draft?.id === entry.id;
                  const position = layout.get(entry.id) ?? { column: 0, columnCount: 1 };
                  const widthPercent = 100 / position.columnCount;
                  const leftPercent = widthPercent * position.column;

                  return (
                    <div
                      key={entry.id}
                      className="absolute rounded-[8px] border border-[#D0FF00] bg-[#2f3716] p-1 text-[10px]"
                      style={{
                        top,
                        height,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                        zIndex: isDragging ? 20 : 10,
                        transition: isDragging
                          ? "top 100ms ease-out, height 100ms ease-out, left 100ms ease-out, width 100ms ease-out"
                          : undefined,
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        cursor: entry.isRunning ? "pointer" : "grab",
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (entry.isRunning) setEditingLogId(entry.id);
                      }}
                      onPointerDown={
                        entry.isRunning
                          ? undefined
                          : (event) => beginGesture(event, entry, "move")
                      }
                    >
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <span className="truncate font-semibold" style={{ color: entry.categoryColor }}>
                          {entry.categoryName}
                        </span>
                        {entry.isRunning ? (
                          <button
                            className="text-[#FF5C5C]"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              stopTimer.mutate({ logId: entry.id });
                            }}
                          >
                            <Square className="size-3 fill-current" />
                          </button>
                        ) : (
                          <span className="text-[#9b9b9b]">
                            {format(addMinutes(startOfDay(weekDays[display.dayIndex]), display.endMinutes), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[#f1f1f1]">{entry.title || "Untitled"}</div>
                      <div className="text-[#bbbbbb]">
                        {format(addMinutes(startOfDay(weekDays[display.dayIndex]), display.startMinutes), "HH:mm")}{" "}
                        {entry.isRunning
                          ? "• running"
                          : `- ${format(addMinutes(startOfDay(weekDays[display.dayIndex]), display.endMinutes), "HH:mm")}`}
                      </div>

                      {!entry.isRunning && (
                        <>
                          <div
                            className="absolute inset-x-0 top-0 h-2"
                            style={{ cursor: "ns-resize", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
                            onPointerDown={(event) => beginGesture(event, entry, "resize-top")}
                          />
                          <div
                            className="absolute inset-x-0 bottom-0 h-2"
                            style={{ cursor: "ns-resize", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
                            onPointerDown={(event) => beginGesture(event, entry, "resize-bottom")}
                          />
                        </>
                      )}
                      {isDragging && <div className="pointer-events-none absolute inset-0 rounded-[8px] ring-2 ring-[#D0FF00]" />}
                    </div>
                  );
                });
              })()}
            </div>
          ))}
        </div>
      </div>

      <EditLogDialog
        log={editingLog}
        categories={categories}
        open={editingLogId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingLogId(null);
        }}
      />
    </div>
  );
}

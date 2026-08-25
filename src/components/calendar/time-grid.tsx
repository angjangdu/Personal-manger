"use client";

import { useMemo } from "react";
import { AlarmClock, CheckCircle2, CalendarDays, Zap } from "lucide-react";
import type { CalendarItem } from "@/lib/calendar-selectors";
import { cn } from "@/lib/utils";
import { hourLabel } from "@/lib/date-utils";

const HOUR_HEIGHT = 48;
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => i);

export interface TimeGridItem extends CalendarItem {
  col: number;
  cols: number;
}

/**
 * Greedy column packing inside overlapping clusters.
 * Returns a map id -> {col, cols} for side-by-side rendering.
 */
export function layoutOverlaps<T extends CalendarItem>(items: T[]): Map<string, { col: number; cols: number }> {
  const sorted = [...items].sort((a, b) => a.startMs - b.startMs || b.endMs - a.endMs);
  const layout = new Map<string, { col: number; cols: number }>();
  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    for (const item of cluster) {
      let col = colEnds.findIndex((end) => end <= item.startMs);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.endMs);
      } else {
        colEnds[col] = item.endMs;
      }
      layout.set(item.id, { col, cols: 1 });
    }
    for (const item of cluster) {
      layout.get(item.id)!.cols = colEnds.length;
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (cluster.length && item.startMs >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMs);
  }
  flush();
  return layout;
}

interface TimeGridProps {
  days: Date[];
  items: CalendarItem[];
  nowMs: number;
  onItemClick: (item: CalendarItem) => void;
  onSlotClick?: (date: Date, startMinutes: number) => void;
  /** Drag-and-drop move support for event blocks. */
  onDropMove?: (
    itemId: string,
    durationMin: number,
    date: Date,
    startMinutes: number
  ) => void;
}

export function TimeGrid({
  days,
  items,
  nowMs,
  onItemClick,
  onSlotClick,
  onDropMove,
}: TimeGridProps) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const day of days) map.set(day.toDateString(), []);
    for (const item of items) {
      const dayKey = new Date(item.startMs).toDateString();
      map.get(dayKey)?.push(item);
    }
    return map;
  }, [days, items]);

  const now = new Date(nowMs);
  const showNowLine = days.some(
    (d) =>
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
  );
  const nowOffset =
    ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Day headers */}
      <div
        className="grid border-b bg-muted/40"
        style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <span />
        {days.map((day) => {
          const isToday =
            day.getFullYear() === now.getFullYear() &&
            day.getMonth() === now.getMonth() &&
            day.getDate() === now.getDate();
          return (
            <div key={day.toISOString()} className="px-2 py-2 text-center">
              <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Timed grid */}
      <div className="relative max-h-[65vh] overflow-y-auto">
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {/* Hour gutter */}
          <div className="border-r">
            {HOUR_LABELS.map((hour) => (
              <div
                key={hour}
                className="text-muted-foreground relative h-12 pr-2 text-right text-[10px] tabular-nums"
              >
                {hour > 0 && (
                  <span className="absolute -top-1.5 right-2">
                    {hourLabel(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayItems = byDay.get(day.toDateString()) ?? [];
            const timedItems = dayItems.filter((i) => !i.allDay);
            const layout = layoutOverlaps(timedItems);
            const isToday =
              day.getFullYear() === now.getFullYear() &&
              day.getMonth() === now.getMonth() &&
              day.getDate() === now.getDate();

            return (
              <div
                key={day.toISOString()}
                className={cn("relative border-r last:border-r-0", isToday && "bg-primary/[0.03]")}
                onClick={(e) => {
                  if (!onSlotClick) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const minutes = Math.max(0, Math.floor((y / HOUR_HEIGHT) * 60 / 30) * 30);
                  onSlotClick(day, minutes);
                }}
                onDragOver={(e) => {
                  if (onDropMove) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!onDropMove) return;
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const payload = JSON.parse(
                      e.dataTransfer.getData("text/plain")
                    ) as { id: string; durationMin: number };
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const minutes = Math.max(0, Math.floor((y / HOUR_HEIGHT) * 60 / 30) * 30);
                    onDropMove(payload.id, payload.durationMin, day, minutes);
                  } catch {
                    // Malformed payload — ignore.
                  }
                }}
                role={onSlotClick ? "button" : undefined}
                aria-label={`Add event on ${day.toDateString()}`}
              >
                {/* Hour lines */}
                {HOUR_LABELS.map((hour) => (
                  <div key={hour} className="border-border/60 h-12 border-b" />
                ))}

                {/* Blocks */}
                {timedItems.map((item) => {
                  const startPos = ((new Date(item.startMs).getHours() * 60 + new Date(item.startMs).getMinutes()) / 60) * HOUR_HEIGHT;
                  const rawHeight = ((item.endMs - item.startMs) / 3600000) * HOUR_HEIGHT;
                  const height = Math.max(20, Math.min(rawHeight, 24 * HOUR_HEIGHT - startPos));
                  const pos = layout.get(item.id) ?? { col: 0, cols: 1 };
                  return (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      draggable={item.kind === "event"}
                      onDragStart={(e) => {
                        if (item.kind !== "event") return;
                        e.dataTransfer.setData(
                          "text/plain",
                          JSON.stringify({
                            id: item.id,
                            durationMin: Math.max(
                              15,
                              Math.round((item.endMs - item.startMs) / 60000)
                            ),
                          })
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className={cn(
                        "absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors",
                        item.className,
                        item.kind === "event" &&
                          onDropMove &&
                          "cursor-grab active:cursor-grabbing"
                      )}
                      style={{
                        top: startPos,
                        height,
                        left: `calc(${(pos.col / pos.cols) * 100}% + 2px)`,
                        width: `calc(${(1 / pos.cols) * 100}% - 4px)`,
                        zIndex: item.running ? 10 : 5,
                      }}
                    >
                      <span className="flex items-center gap-1 font-medium">
                        {item.kind === "task" ? (
                          item.done ? (
                            <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                          ) : (
                            <AlarmClock className="size-3 shrink-0" aria-hidden />
                          )
                        ) : item.kind === "activity" ? (
                          <Zap className="size-3 shrink-0" aria-hidden />
                        ) : (
                          <CalendarDays className="size-3 shrink-0" aria-hidden />
                        )}
                        <span className="truncate">{item.title}</span>
                      </span>
                      {height >= 34 && (
                        <span className="block opacity-70 tabular-nums">
                          {hourLabel(new Date(item.startMs).getHours())}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Now line */}
                {isToday && showNowLine && nowOffset < 24 * HOUR_HEIGHT && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: nowOffset }}
                    aria-hidden
                  >
                    <span className="size-2 -ml-1 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500/70" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All-day strip */}
      {items.some((i) => i.allDay) && (
        <div className="border-t bg-muted/30">
          <div
            className="grid"
            style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <span className="text-muted-foreground px-2 py-1.5 text-[10px] uppercase">All-day</span>
            {days.map((day) => (
              <div key={day.toISOString()} className="space-y-1 px-1 py-1.5">
                {byDay
                  .get(day.toDateString())
                  ?.filter((i) => i.allDay)
                  .map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => onItemClick(item)}
                      className={cn(
                        "block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px]",
                        item.className
                      )}
                    >
                      {item.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

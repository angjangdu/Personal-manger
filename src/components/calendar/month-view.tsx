"use client";

import { useMemo } from "react";
import { AlarmClock, CalendarDays, CheckCircle2, Zap } from "lucide-react";
import type { CalendarItem } from "@/lib/calendar-selectors";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  /** Six-week grid cells covering the displayed month. */
  cells: Date[];
  month: number;
  items: CalendarItem[];
  nowMs: number;
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;

export function MonthView({ cells, month, items, nowMs, onDayClick, onItemClick }: MonthViewProps) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const cell of cells) map.set(cell.toDateString(), []);
    for (const item of items) {
      // Multi-day items appear on every day they touch.
      for (const cell of cells) {
        const dayStart = cell.getTime();
        const dayEnd = dayStart + 86399999;
        if (item.startMs <= dayEnd && item.endMs >= dayStart) {
          map.get(cell.toDateString())?.push(item);
        }
      }
    }
    return map;
  }, [cells, items]);

  const today = new Date(nowMs);
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-muted-foreground px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const inMonth = cell.getMonth() === month;
          const dayItems = byDay.get(cell.toDateString()) ?? [];
          return (
            <button
              key={cell.toISOString()}
              type="button"
              onClick={() => onDayClick(cell)}
              className={cn(
                "min-h-24 border-border/60 space-y-1 overflow-hidden border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/20"
              )}
              aria-label={`Open ${cell.toLocaleDateString("en-GB", { month: "long", day: "numeric" })}`}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  !inMonth && "text-muted-foreground/50",
                  isToday(cell) && "bg-primary text-primary-foreground"
                )}
              >
                {cell.getDate()}
              </span>
              {dayItems.slice(0, MAX_CHIPS).map((item) => (
                <span
                  key={`${item.kind}-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onItemClick(item);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 truncate rounded border px-1 py-px text-[10px] leading-tight",
                    item.className,
                    !inMonth && "opacity-60"
                  )}
                >
                  {item.kind === "task" ? (
                    item.done ? (
                      <CheckCircle2 className="size-2.5 shrink-0" aria-hidden />
                    ) : (
                      <AlarmClock className="size-2.5 shrink-0" aria-hidden />
                    )
                  ) : item.kind === "activity" ? (
                    <Zap className="size-2.5 shrink-0" aria-hidden />
                  ) : (
                    <CalendarDays className="size-2.5 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">{item.title}</span>
                </span>
              ))}
              {dayItems.length > MAX_CHIPS && (
                <span className="text-muted-foreground block text-[10px] tabular-nums">
                  +{dayItems.length - MAX_CHIPS} more
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

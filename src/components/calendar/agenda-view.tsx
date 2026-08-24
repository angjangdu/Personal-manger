"use client";

import { AlarmClock, CalendarDays, CheckCircle2, Zap } from "lucide-react";
import type { CalendarItem } from "@/lib/calendar-selectors";
import { cn } from "@/lib/utils";

interface AgendaViewProps {
  /** Items spanning the agenda range, pre-sorted ascending. */
  items: CalendarItem[];
  rangeStart: Date;
  days: number;
  onItemClick: (item: CalendarItem) => void;
}

export function AgendaView({ items, rangeStart, days, onItemClick }: AgendaViewProps) {
  const byDay: { date: Date; items: CalendarItem[] }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    const key = d.toDateString();
    byDay.push({
      date: d,
      items: items.filter((item) => new Date(item.startMs).toDateString() === key),
    });
  }

  return (
    <div className="space-y-4">
      {byDay.map(({ date, items: dayItems }) => (
        <section key={date.toISOString()}>
          <h3 className="text-muted-foreground mb-1.5 text-xs font-semibold uppercase tracking-wide">
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h3>
          {dayItems.length === 0 ? (
            <p className="text-muted-foreground/70 rounded-lg border border-dashed px-3 py-2 text-xs">
              Nothing scheduled
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border">
              {dayItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className="hover:bg-accent/40 flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                        item.className
                      )}
                    >
                      {item.kind === "task" ? (
                        item.done ? (
                          <CheckCircle2 className="size-3.5" aria-hidden />
                        ) : (
                          <AlarmClock className="size-3.5" aria-hidden />
                        )
                      ) : item.kind === "activity" ? (
                        <Zap className="size-3.5" aria-hidden />
                      ) : (
                        <CalendarDays className="size-3.5" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          item.done && "text-muted-foreground line-through"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="text-muted-foreground block text-[11px] capitalize">
                        {item.kind}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {new Date(item.startMs).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {item.kind !== "task" &&
                        ` – ${new Date(item.endMs).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

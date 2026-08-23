"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CalendarEvent } from "@/types";
import { formatTime } from "@/lib/date-utils";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

interface TodaysScheduleCardProps {
  events: CalendarEvent[];
  className?: string;
}

export function TodaysScheduleCard({ events, className }: TodaysScheduleCardProps) {
  // 30s tick — enough for "In progress" markers.
  const now = useNow(30000);

  return (
    <section className={cn("rounded-xl border", className)}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Today&apos;s schedule</h3>
        <Link
          href="/calendar"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
        >
          Calendar <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      <ol className="relative space-y-0 px-4 py-2">
        {events.map((event) => {
          const start = new Date(event.startAt).getTime();
          const end = new Date(event.endAt).getTime();
          const isNow = now >= start && now <= end;
          const isPast = now > end;
          return (
            <li key={event.id} className="flex gap-3 py-2">
              <div className="w-24 shrink-0 pt-0.5 text-right">
                <p className={cn("text-xs font-medium tabular-nums", isPast && !isNow && "text-muted-foreground line-through")}>
                  {formatTime(new Date(event.startAt))}
                </p>
                <p className="text-muted-foreground text-[11px] tabular-nums">
                  {formatTime(new Date(event.endAt))}
                </p>
              </div>
              <div className="border-border relative flex-1 border-l pl-3">
                {isNow && (
                  <span className="bg-background absolute -left-[5px] top-1.5 size-2 rounded-full border-2 border-blue-500" aria-label="Happening now" />
                )}
                <p className={cn("truncate text-sm", isNow ? "font-semibold" : isPast && "text-muted-foreground")}>
                  {event.title}
                </p>
                {isNow && (
                  <p className="text-xs font-medium text-blue-500">In progress</p>
                )}
              </div>
            </li>
          );
        })}
        {events.length === 0 && (
          <li className="text-muted-foreground py-8 text-center text-sm">
            No events today.
          </li>
        )}
      </ol>
    </section>
  );
}

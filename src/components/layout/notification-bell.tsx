"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  Bell,
  CalendarClock,
  ClipboardCheck,
  Flame,
  Target,
  Timer,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  buildNotifications,
  newCount,
  type AppNotification,
} from "@/lib/notification-utils";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<AppNotification["severity"], string> = {
  urgent: "bg-red-500",
  warn: "bg-yellow-500",
  info: "bg-blue-400",
};

function kindIcon(item: AppNotification) {
  if (item.id.startsWith("overdue") || item.id.startsWith("due-today"))
    return <AlarmClock className="size-3.5" aria-hidden />;
  if (item.id.startsWith("event-"))
    return <CalendarClock className="size-3.5" aria-hidden />;
  if (item.id.startsWith("goal"))
    return <Target className="size-3.5" aria-hidden />;
  if (item.id.startsWith("habits-"))
    return <Flame className="size-3.5" aria-hidden />;
  if (item.id.startsWith("review-"))
    return <ClipboardCheck className="size-3.5" aria-hidden />;
  return <Timer className="size-3.5" aria-hidden />;
}

export function NotificationBell() {
  const state = useAppState();
  const nowMs = useNow(30000);
  const router = useRouter();

  const items = useMemo(() => buildNotifications(state, nowMs), [state, nowMs]);
  const unread = newCount(items, state.settings.lastNotificationsRead);

  function openPanel() {
    appStore.updateSettings({
      lastNotificationsRead: new Date().toISOString(),
    });
  }

  return (
    <Popover onOpenChange={(open) => open && openPanel()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Notifications${unread > 0 ? ` (${unread} new)` : ""}`}
          className="relative"
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
                items.some((i) => i.severity === "urgent")
                  ? "bg-red-500"
                  : "bg-primary"
              )}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-muted-foreground text-xs tabular-nums">
            {items.length}
          </span>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  openPanel();
                  router.push(item.href);
                }}
                className="hover:bg-accent flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
              >
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    SEVERITY_DOT[item.severity]
                  )}
                  aria-label={item.severity}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {kindIcon(item)}
                    <span className="truncate">{item.title}</span>
                  </span>
                  {item.detail && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {item.detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-muted-foreground px-3 py-8 text-center text-sm">
              All clear. Nothing needs attention.
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

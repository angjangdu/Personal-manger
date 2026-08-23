"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Check, Flame, MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitDetailDialog } from "@/components/habits/habit-detail-dialog";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  completedDayKeys,
  computeStreak,
  consistency,
  isCompletedOn,
  isHabitDueOn,
} from "@/lib/habit-utils";
import { addDays, startOfDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitsPage() {
  const state = useAppState();
  const now = new Date(useNow(60000));

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | undefined>(undefined);
  const [detail, setDetail] = useState<Habit | null>(null);

  const habits = state.habits.filter((h) => h.archived === (tab === "archived"));
  const dueToday = state.habits.filter(
    (h) => !h.archived && isHabitDueOn(h, now)
  );
  const doneToday = dueToday.filter((h) =>
    isCompletedOn(completedDayKeys(state.habitLogs, h.id), now)
  );

  return (
    <>
      <PageHeader
        title="Habits"
        description={`${doneToday.length}/${dueToday.length} done today`}
      >
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus aria-hidden /> New habit
        </Button>
      </PageHeader>

      {/* Today's checklist */}
      <section className="mb-8">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Repeat className="size-4" aria-hidden /> Today
        </h3>
        {dueToday.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Repeat aria-hidden />
              </EmptyMedia>
              <EmptyTitle>Nothing scheduled today</EmptyTitle>
              <EmptyDescription>Rest is part of the program — no habits are due.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {dueToday.map((habit) => (
              <TodayHabitRow key={habit.id} habit={habit} now={now} onOpenDetail={() => setDetail(habit)} />
            ))}
          </ul>
        )}
      </section>

      {/* All habits */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">All habits</h3>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                <span className="text-muted-foreground ml-1.5 tabular-nums">
                  {state.habits.filter((h) => h.archived).length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {habits.length === 0 ? (
          <Empty className="rounded-lg border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Repeat aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{tab === "active" ? "No habits yet" : "Nothing archived"}</EmptyTitle>
              <EmptyDescription>
                {tab === "active"
                  ? "Start with one small daily action you can't say no to."
                  : "Archived habits are kept here with their history."}
              </EmptyDescription>
            </EmptyHeader>
            {tab === "active" && (
              <EmptyContent>
                <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
                  <Plus aria-hidden /> Create habit
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {habits.map((habit) => {
              const keys = completedDayKeys(state.habitLogs, habit.id);
              return (
                <li key={habit.id} className="group hover:bg-accent/40 flex items-center gap-3 px-4 py-3 transition-colors">
                  <button
                    type="button"
                    onClick={() => setDetail(habit)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium">{habit.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {habit.schedule === "daily"
                        ? "Every day"
                        : habit.weekdays?.map((d) => WEEKDAY_LETTERS[d]).join(" · ") + " weekly"}
                    </span>
                  </button>
                  <span className="text-muted-foreground hidden shrink-0 items-center gap-1 text-xs tabular-nums sm:flex">
                    <Flame className="size-3.5 text-orange-500" aria-hidden />
                    {computeStreak(habit, keys, now)} · {consistency(habit, keys, now)}%
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${habit.name}`} className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100">
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(habit); setFormOpen(true); }}>
                        <Pencil aria-hidden /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setDetail(habit); }}>
                        History
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          appStore.updateHabit(habit.id, { archived: !habit.archived });
                          toast(habit.archived ? "Habit restored" : "Habit archived");
                        }}
                      >
                        {habit.archived ? (
                          <>
                            <ArchiveRestore aria-hidden /> Restore
                          </>
                        ) : (
                          <>
                            <Archive aria-hidden /> Archive
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          appStore.deleteHabit(habit.id);
                          toast("Habit deleted");
                        }}
                      >
                        <Trash2 aria-hidden /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} habit={editing} />
      <HabitDetailDialog habit={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </>
  );
}

function TodayHabitRow({
  habit,
  now,
  onOpenDetail,
}: {
  habit: Habit;
  now: Date;
  onOpenDetail: () => void;
}) {
  const keys = completedDayKeys(useAppState().habitLogs, habit.id);
  const done = isCompletedOn(keys, now);

  // Last 7 days mini-strip.
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(now), i - 6));

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Uncheck ${habit.name}` : `Complete ${habit.name}`}
        onClick={() => appStore.toggleHabitLog(habit.id, now)}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </button>

      <button type="button" onClick={onOpenDetail} className="min-w-0 flex-1 text-left">
        <span className={cn("block truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {habit.name}
        </span>
        <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
          <Flame className="size-3 text-orange-500" aria-hidden />
          {computeStreak(habit, keys, now)} day streak · {consistency(habit, keys, now)}% consistent
        </span>
      </button>

      <div className="flex shrink-0 gap-1" aria-hidden>
        {week.map((day) => {
          const due = isHabitDueOn(habit, day);
          const hit = isCompletedOn(keys, day);
          return (
            <span
              key={day.toISOString()}
              title={day.toDateString()}
              className={cn(
                "size-2.5 rounded-full",
                !due && "bg-muted/50",
                due && !hit && "bg-red-500/30",
                due && hit && "bg-emerald-500"
              )}
            />
          );
        })}
      </div>
    </li>
  );
}

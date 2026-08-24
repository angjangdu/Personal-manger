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
import {
  ReasonDialog,
  type MoveReason,
} from "@/components/calendar/reason-dialog";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  completedDayKeys,
  computeStreak,
  consistency,
  graceDayKeys,
  isCompletedOn,
  isHabitDueOn,
  unexcusedMisses,
} from "@/lib/habit-utils";
import { addDays, startOfDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

const HABIT_MISS_REASONS = [
  { value: "forgot", label: "I forgot" },
  { value: "too_busy", label: "Too busy" },
  { value: "too_tired", label: "Too tired / low energy" },
  { value: "not_feeling_well", label: "Not feeling well" },
  { value: "other", label: "Other" },
] as const;

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
                    {computeStreak(
                      habit,
                      keys,
                      now,
                      graceDayKeys(state.habitGraceLogs, habit.id)
                    )}{" "}
                    · {consistency(habit, keys, now)}%
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
  const state = useAppState();
  const keys = completedDayKeys(state.habitLogs, habit.id);
  const graceKeys = graceDayKeys(state.habitGraceLogs, habit.id);
  const done = isCompletedOn(keys, now);
  const streak = computeStreak(habit, keys, now, graceKeys);
  const misses = unexcusedMisses(habit, keys, graceKeys, now);

  // Grace flow (review §13): missed yesterday? ask why — excused misses
  // don't break the streak.
  const yesterday = addDays(startOfDay(now), -1);
  const missedYesterday =
    isHabitDueOn(habit, yesterday) &&
    !isCompletedOn(keys, yesterday) &&
    !graceKeys.has(
      `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`
    );
  const [askWhyOpen, setAskWhyOpen] = useState(false);

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
        <span className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums">
          <span className="flex items-center gap-1">
            <Flame className="size-3 text-orange-500" aria-hidden />
            {streak}d
          </span>
          <span>{consistency(habit, keys, now)}%</span>
          {misses > 0 && (
            <span
              className={cn(
                "size-2 rounded-full",
                misses >= 2 ? "bg-red-500" : "bg-yellow-500"
              )}
              aria-label={`${misses} unexcused miss${misses > 1 ? "es" : ""} this week`}
            />
          )}
        </span>
      </button>

      {missedYesterday && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-yellow-500/60 px-2 text-[11px] text-yellow-700 dark:text-yellow-400"
            onClick={() => setAskWhyOpen(true)}
          >
            Missed yesterday · why?
          </Button>
          <ReasonDialog
            open={askWhyOpen}
            onOpenChange={setAskWhyOpen}
            heading={`Missed “${habit.name}” yesterday`}
            title="Excused misses don't break your streak."
            options={HABIT_MISS_REASONS as unknown as { value: string; label: string }[]}
            onConfirm={(move: MoveReason) => {
              appStore.addHabitGraceLog({
                habitId: habit.id,
                dateKey: `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`,
                reason: move.reason as "forgot",
                note: move.note,
              });
              toast("Noted — that day is excused");
              setAskWhyOpen(false);
            }}
          />
        </>
      )}

      <div className="flex shrink-0 gap-1" aria-hidden>
        {week.map((day) => {
          const due = isHabitDueOn(habit, day);
          const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const hit = isCompletedOn(keys, day);
          const excused = graceKeys.has(dayKey);
          return (
            <span
              key={day.toISOString()}
              title={day.toDateString()}
              className={cn(
                "size-2.5 rounded-full",
                !due && "bg-muted/50",
                due && !hit && !excused && "bg-red-500/30",
                due && hit && "bg-emerald-500",
                excused && "bg-yellow-400"
              )}
            />
          );
        })}
      </div>
    </li>
  );
}

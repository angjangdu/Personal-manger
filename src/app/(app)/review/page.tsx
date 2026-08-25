"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Save,
  Target,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { appStore } from "@/services/app-store";
import { selectGoalProgress } from "@/lib/selectors";
import {
  completedDayKeys,
  isCompletedOn,
  isHabitDueOn,
  toDayKey,
} from "@/lib/habit-utils";
import { addDays, formatMinutes, isSameDay, startOfDay } from "@/lib/date-utils";

export default function ReviewPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const [cursor, setCursor] = useState(() => new Date());
  const dayStart = useMemo(() => startOfDay(cursor), [cursor]);

  const review = state.dailyReviews.find(
    (r) => r.date.slice(0, 10) === toDayKey(dayStart)
  );

  // ── Day recap metrics (live-derived) ──
  const tasksCompleted = state.tasks.filter(
    (t) => t.completedAt && isSameDay(new Date(t.completedAt), dayStart)
  ).length;
  const tasksDueThatDay = state.tasks.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate), dayStart)
  );

  let focusMinutes = 0;
  for (const activity of state.activities) {
    if (!isSameDay(new Date(activity.startedAt), dayStart)) continue;
    if (activity.endedAt) {
      focusMinutes += activity.durationMinutes ?? 0;
    } else if (isSameDay(dayStart, new Date(nowMs))) {
      focusMinutes += Math.round(
        (nowMs - new Date(activity.startedAt).getTime() - activity.totalPausedMs) / 60000
      );
    }
  }

  const studyMinutes = state.studySessions
    .filter((s) => isSameDay(new Date(s.date), dayStart))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const dueHabits = state.habits.filter((h) => !h.archived && isHabitDueOn(h, dayStart));
  const habitsDone = dueHabits.filter((h) =>
    isCompletedOn(completedDayKeys(state.habitLogs, h.id), dayStart)
  );
  const activeGoals = state.goals.filter((g) => !g.archived);
  const avgGoalProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + selectGoalProgress(state, g), 0) /
            activeGoals.length
        )
      : 0;

  const [wentWell, setWentWell] = useState<string | null>(null);
  const [wentWrong, setWentWrong] = useState<string | null>(null);
  const [toImprove, setToImprove] = useState<string | null>(null);
  const [tomorrowPriority, setTomorrowPriority] = useState<string | null>(null);

  const valueOr = (field: string | null, fallback?: string) =>
    field !== null ? field : (fallback ?? "");

  function save() {
    appStore.upsertDailyReview({
      date: dayStart.toISOString(),
      tasksCompletedCount: tasksCompleted,
      focusMinutes,
      studyMinutes,
      wentWell: wentWell ?? review?.wentWell ?? "",
      wentWrong: wentWrong ?? review?.wentWrong ?? "",
      toImprove: toImprove ?? review?.toImprove ?? "",
      tomorrowPriority: tomorrowPriority ?? review?.tomorrowPriority ?? "",
    });
    toast("Review saved", { description: dayStart.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }) });
  }

  return (
    <>
      <PageHeader
        title="Daily review"
        description="Close the loop — what happened, and what's next."
      >
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addDays(cursor, -1))} aria-label="Previous day">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addDays(cursor, 1))} aria-label="Next day">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </PageHeader>

      <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
        {dayStart.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        {review ? (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-normal">
            <Check className="size-3.5 text-emerald-500" aria-hidden /> reviewed
          </span>
        ) : null}
      </p>

      {/* Recap tiles */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RecapTile
          icon={<Check className="size-4" aria-hidden />}
          label="Tasks completed"
          value={`${tasksCompleted}`}
          hint={`of ${tasksDueThatDay.length} scheduled`}
        />
        <RecapTile
          icon={<Timer className="size-4" aria-hidden />}
          label="Focus time"
          value={formatMinutes(focusMinutes)}
        />
        <RecapTile
          icon={<BookOpen className="size-4" aria-hidden />}
          label="Study time"
          value={formatMinutes(studyMinutes)}
        />
        <RecapTile
          icon={<Flame className="size-4" aria-hidden />}
          label="Habits"
          value={`${habitsDone.length}/${dueHabits.length}`}
        />
      </div>

      {/* Goal progress snapshot */}
      <section className="mb-8 rounded-xl border p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Target className="size-4" aria-hidden /> Goals
          <span className="text-muted-foreground ml-auto font-normal tabular-nums">
            avg {avgGoalProgress}%
          </span>
        </h3>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {activeGoals.map((goal) => (
            <div key={goal.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm">{goal.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {selectGoalProgress(state, goal)}%
                </span>
              </div>
              <Progress value={selectGoalProgress(state, goal)} aria-label={`${goal.title} progress`} />
            </div>
          ))}
          {activeGoals.length === 0 && (
            <p className="text-muted-foreground text-sm">No active goals.</p>
          )}
        </div>
      </section>

      {/* Reflections */}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h3 className="text-sm font-semibold">Reflection</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ReflectionField
            id="went-well"
            label="What went well?"
            value={valueOr(wentWell, review?.wentWell)}
            onChange={setWentWell}
            placeholder="Wins, progress, good calls…"
          />
          <ReflectionField
            id="went-wrong"
            label="What went wrong?"
            value={valueOr(wentWrong, review?.wentWrong)}
            onChange={setWentWrong}
            placeholder="Friction, misses, surprises…"
          />
          <ReflectionField
            id="to-improve"
            label="What should improve?"
            value={valueOr(toImprove, review?.toImprove)}
            onChange={setToImprove}
            placeholder="One concrete adjustment…"
          />
          <ReflectionField
            id="tomorrow-priority"
            label="Tomorrow's #1 priority"
            value={valueOr(tomorrowPriority, review?.tomorrowPriority)}
            onChange={setTomorrowPriority}
            placeholder="The single thing that must happen…"
          />
        </div>
        <Button type="submit">
          <Save aria-hidden /> {review ? "Update review" : "Save review"}
        </Button>
      </form>
    </>
  );
}

function RecapTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

function ReflectionField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

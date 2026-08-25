"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Flag,
  FolderKanban,
  ListTodo,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { selectGoalProgress, selectVisibleTasks, sortTasksBy } from "@/lib/selectors";
import { goalHealth, HEALTH_META } from "@/lib/health-utils";
import type { Task } from "@/types";

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const state = useAppState();
  const now = useNow(60000);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState("");

  const goal = state.goals.find((g) => g.id === params.id);

  const linkedProjects = useMemo(
    () => state.projects.filter((p) => p.goalId === params.id),
    [state.projects, params.id]
  );

  const tasks = useMemo(
    () => sortTasksBy(
        selectVisibleTasks(state, now).filter((t) => t.goalId === params.id),
        "due"
      ),
    [state, now, params.id]
  );

  if (!goal) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Target aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Goal not found</EmptyTitle>
          <EmptyDescription>
            It may have been deleted. Head back to the goals list.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/goals">
            <ArrowLeft aria-hidden /> All goals
          </Link>
        </Button>
      </Empty>
    );
  }

  const percent = selectGoalProgress(state, goal);
  const milestoneDone = goal.milestones.filter((m) => m.completedAt).length;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - now) / 86400000)
    : null;

  function addMilestone() {
    if (!goal || !milestoneDraft.trim()) return;
    appStore.addMilestone(goal.id, milestoneDraft);
    setMilestoneDraft("");
  }

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
          <Link href="/goals">
            <ArrowLeft aria-hidden /> Goals
          </Link>
        </Button>
      </div>

      <PageHeader title={goal.title} description={goal.description}>
        {goal.category ? (
          <Badge variant="secondary">{goal.category}</Badge>
        ) : null}
        {(() => {
          const meta = HEALTH_META[goalHealth(state, goal, now)];
          return meta.label ? (
            <Badge variant="outline" className={meta.className}>
              {meta.label}
            </Badge>
          ) : null;
        })()}
        <Badge variant={goal.archived ? "secondary" : "outline"}>
          {goal.archived ? "Archived" : "Active"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setGoalDialogOpen(true)}>
          <Pencil aria-hidden /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (!window.confirm(`Delete goal "${goal.title}"? Its projects and tasks will be kept.`)) return;
            appStore.deleteGoal(goal.id);
            toast("Goal deleted");
            router.push("/goals");
          }}
        >
          <Trash2 aria-hidden /> Delete
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Progress</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{percent}%</p>
            <Progress value={percent} className="mt-2" aria-label={`${goal.title} progress`} />
            <p className="text-muted-foreground mt-2 text-xs">
              Derived from milestones, projects & tasks
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Deadline</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              {goal.deadline
                ? new Date(goal.deadline).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "None set"}
            </p>
            {daysLeft !== null && (
              <p
                className={`mt-2 text-xs ${
                  daysLeft <= 7
                    ? "font-medium text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground"
                }`}
              >
                {daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Milestones</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {milestoneDone}/{goal.milestones.length}
            </p>
            <Progress
              value={goal.milestones.length > 0 ? (milestoneDone / goal.milestones.length) * 100 : 0}
              className="mt-2"
              aria-label="Milestone progress"
            />
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold">Milestones</h3>
        <ul className="divide-y overflow-hidden rounded-xl border">
          {goal.milestones.map((milestone) => (
            <li key={milestone.id} className="group flex items-center gap-3 px-4 py-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={Boolean(milestone.completedAt)}
                aria-label={`Toggle ${milestone.title}`}
                onClick={() => appStore.toggleMilestone(goal.id, milestone.id)}
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  milestone.completedAt
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted-foreground/40 hover:border-primary"
                }`}
              >
                {milestone.completedAt && <Check className="size-3" strokeWidth={3} aria-hidden />}
              </button>
              <span
                className={`flex-1 truncate text-sm ${
                  milestone.completedAt ? "text-muted-foreground line-through" : ""
                }`}
              >
                {milestone.title}
              </span>
              <span className="text-muted-foreground hidden w-24 shrink-0 text-right text-[11px] tabular-nums sm:inline">
                {milestone.completedAt
                  ? `done ${new Date(milestone.completedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
                  : ""}
              </span>
              <button
                type="button"
                onClick={() => appStore.deleteMilestone(goal.id, milestone.id)}
                aria-label={`Remove ${milestone.title}`}
                className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
          {goal.milestones.length === 0 && (
            <li className="text-muted-foreground px-4 py-4 text-center text-sm">
              No milestones yet — break the goal into checkpoints below.
            </li>
          )}
        </ul>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Add a milestone…"
            value={milestoneDraft}
            onChange={(e) => setMilestoneDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMilestone();
              }
            }}
          />
          <Button variant="secondary" onClick={addMilestone} disabled={!milestoneDraft.trim()}>
            <Plus aria-hidden /> Add
          </Button>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FolderKanban className="size-4" aria-hidden /> Projects ({linkedProjects.length})
        </h3>
        {linkedProjects.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-4 text-center text-sm">
            Link a project to this goal from the project&apos;s edit dialog — its task progress will feed this goal.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {linkedProjects.map((project) => {
              const projectTasks = state.tasks.filter((t) => t.projectId === project.id);
              const projectDone = projectTasks.filter((t) => t.status === "completed").length;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="hover:bg-accent/40 rounded-xl border p-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color ?? "var(--primary)" }}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-medium">{project.name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                      {projectTasks.length > 0
                        ? Math.round((projectDone / projectTasks.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {projectDone}/{projectTasks.length} tasks
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <ListTodo className="size-4" aria-hidden /> Direct tasks ({tasks.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTask(undefined);
              setTaskDialogOpen(true);
            }}
          >
            <Plus aria-hidden /> Add task
          </Button>
        </h3>
        {tasks.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Flag aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No direct tasks</EmptyTitle>
              <EmptyDescription>
                Tasks assigned straight to this goal (without a project) appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setTaskDialogOpen(true);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingTask(undefined);
          setTaskDialogOpen(open);
        }}
        task={editingTask}
        defaultGoalId={goal.id}
      />
      <GoalFormDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} goal={goal} />
    </>
  );
}

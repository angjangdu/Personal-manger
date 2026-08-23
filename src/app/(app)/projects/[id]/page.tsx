"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  ArrowLeft,
  CalendarClock,
  ListTodo,
  Pencil,
  Plus,
  Target,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { sortTasksBy } from "@/lib/selectors";
import { formatMinutes } from "@/lib/date-utils";
import type { Task } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const state = useAppState();
  // Minute tick is plenty for day-level countdowns.
  const now = useNow(60000);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const project = state.projects.find((p) => p.id === params.id);

  const tasks = useMemo(
    () =>
      sortTasksBy(state.tasks.filter((t) => t.projectId === params.id), "due"),
    [state.tasks, params.id]
  );

  const activities = useMemo(
    () =>
      [...state.activities]
        .filter((a) => a.projectId === params.id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [state.activities, params.id]
  );

  if (!project) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            It may have been deleted. Head back to the projects list.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/projects">
            <ArrowLeft aria-hidden /> All projects
          </Link>
        </Button>
      </Empty>
    );
  }

  const done = tasks.filter((t) => t.status === "completed").length;
  const percent = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const focusMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);
  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - now) / 86400000)
    : null;
  const goal = state.goals.find((g) => g.id === project.goalId);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
          <Link href="/projects">
            <ArrowLeft aria-hidden /> Projects
          </Link>
        </Button>
      </div>

      <PageHeader title={project.name} description={project.description}>
        <Badge variant={project.archived ? "secondary" : "outline"}>
          {project.archived ? "Archived" : "Active"}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setProjectDialogOpen(true)}
        >
          <Pencil aria-hidden /> Edit
        </Button>
        <Button onClick={() => { setEditingTask(undefined); setTaskDialogOpen(true); }}>
          <Plus aria-hidden /> Add task
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Progress</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{percent}%</p>
            <Progress value={percent} className="mt-2" aria-label={`${project.name} progress`} />
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Tasks</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{done}/{tasks.length}</p>
            <p className="text-muted-foreground mt-2 text-xs">{tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length} remaining</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Deadline</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : "None set"}
            </p>
            {daysLeft !== null && (
              <p className={`mt-2 text-xs ${daysLeft <= 7 ? "font-medium text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                {daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Focus time</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <Timer className="size-4 shrink-0" aria-hidden />
              {formatMinutes(focusMinutes)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">{activities.length} recorded activities</p>
          </CardContent>
        </Card>
      </div>

      {goal && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border p-3">
          <Target className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground text-xs">Linked goal:</span>
          <span className="truncate text-sm font-medium">{goal.title}</span>
          <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
            {goal.progressPercent}% complete
          </span>
        </div>
      )}

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold">Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListTodo aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No tasks in this project yet</EmptyTitle>
              <EmptyDescription>Break the project down into concrete next actions.</EmptyDescription>
            </EmptyHeader>
            <Button size="sm" onClick={() => { setEditingTask(undefined); setTaskDialogOpen(true); }}>
              <Plus aria-hidden /> Add task
            </Button>
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Activity history</h3>
        {activities.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ActivityIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No activity recorded</EmptyTitle>
              <EmptyDescription>
                Time tracking sessions linked to this project will appear here (Phase 10).
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-center gap-3 px-4 py-3">
                <ActivityIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm">{activity.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {formatMinutes(activity.durationMinutes ?? 0)}
                </span>
                <span className="text-muted-foreground hidden w-24 shrink-0 text-right text-xs sm:inline">
                  {new Date(activity.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
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
        defaultProjectId={project.id}
      />
      <ProjectFormDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} project={project} />
    </>
  );
}

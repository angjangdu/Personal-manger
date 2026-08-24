"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListTodo } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskToolbar, type ToolbarState } from "@/components/tasks/task-toolbar";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  filterTasks,
  selectTaskCounts,
  selectTasksForView,
  selectVisibleTasks,
  sortTasksBy,
  type TaskViewKey,
} from "@/lib/selectors";
import type { Task } from "@/types";

const VIEWS: { key: TaskViewKey; label: string; empty: string }[] = [
  { key: "all", label: "All", empty: "No tasks yet. Capture your first one — a title is all it takes." },
  { key: "today", label: "Today", empty: "Nothing due today. Enjoy the clear runway." },
  { key: "upcoming", label: "Upcoming", empty: "No future-dated tasks yet." },
  { key: "inbox", label: "Inbox", empty: "Inbox zero. Everything has been triaged." },
  { key: "completed", label: "Completed", empty: "No completed tasks yet — they will collect here." },
  { key: "overdue", label: "Overdue", empty: "Nothing overdue. You are on top of it." },
];

export default function TasksPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const [view, setView] = useState<TaskViewKey>("all");
  const [toolbar, setToolbar] = useState<ToolbarState>({
    query: "",
    projectId: "",
    tagId: "",
    sort: "due",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);

  // Recurring templates expanded into independent occurrences.
  const allTasks = selectVisibleTasks(state, nowMs);

  const viewCounts = useMemo(() => {
    const counts = {} as Record<TaskViewKey, number>;
    for (const v of VIEWS) {
      counts[v.key] = selectTasksForView(allTasks, v.key).length;
    }
    return counts;
  }, [allTasks]);

  const visibleTasks = useMemo(() => {
    const inView = selectTasksForView(allTasks, view);
    const filtered = filterTasks(inView, toolbar, state);
    return sortTasksBy(filtered, toolbar.sort);
  }, [allTasks, state, view, toolbar]);

  const overall = selectTaskCounts(allTasks);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${overall.active} active · ${overall.done} done`}
      >
        <Button onClick={openCreate}>
          <Plus aria-hidden /> New task
        </Button>
      </PageHeader>

      <Tabs value={view} onValueChange={(v) => setView(v as TaskViewKey)} className="mb-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:flex-nowrap sm:overflow-x-auto">
          {VIEWS.map((v) => (
            <TabsTrigger key={v.key} value={v.key} className="shrink-0">
              {v.label}
              <span className="text-muted-foreground ml-1.5 tabular-nums">
                {viewCounts[v.key]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-4">
        <TaskToolbar
          state={toolbar}
          onChange={(patch) => setToolbar((prev) => ({ ...prev, ...patch }))}
          projects={state.projects}
          tags={state.tags}
        />
      </div>

      <p className="text-muted-foreground mb-2 text-xs tabular-nums" role="status">
        Showing {visibleTasks.length} of {allTasks.length} tasks
      </p>

      {visibleTasks.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodo aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{VIEWS.find((v) => v.key === view)?.label}: nothing here</EmptyTitle>
            <EmptyDescription>
              {toolbar.query || toolbar.projectId || toolbar.tagId
                ? "No tasks match the current search and filters."
                : VIEWS.find((v) => v.key === view)?.empty}
            </EmptyDescription>
          </EmptyHeader>
          {view === "all" && !toolbar.query && !toolbar.projectId && !toolbar.tagId ? (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus aria-hidden /> Create task
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={openEdit} />
          ))}
        </ul>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
          setDialogOpen(open);
        }}
        task={editing}
      />
    </>
  );
}

"use client";

import { useState } from "react";
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
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { useAppState } from "@/hooks/use-app-state";
import { selectTaskCounts, sortTasks } from "@/lib/selectors";
import type { Task } from "@/types";

export default function TasksPage() {
  const state = useAppState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);

  const sorted = sortTasks(state.tasks);
  const counts = selectTaskCounts(state.tasks);

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
      <PageHeader title="Tasks" description={`${counts.active} active · ${counts.done} done`}>
        <Button onClick={openCreate}>
          <Plus aria-hidden /> New task
        </Button>
      </PageHeader>

      {sorted.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodo aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No tasks yet</EmptyTitle>
            <EmptyDescription>
              Capture your first task — a title is all it takes.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={openCreate}>
              <Plus aria-hidden /> Create task
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {sorted.map((task) => (
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

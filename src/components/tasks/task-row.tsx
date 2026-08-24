"use client";

import { CalendarClock, MoreHorizontal, Pencil, Repeat, Star, Trash2, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskStatus } from "@/types";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { formatMinutes } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "Inbox",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  urgent: "border-red-500/50 text-red-600 dark:text-red-400",
  high: "border-orange-500/50 text-orange-600 dark:text-orange-400",
  medium: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
  low: "text-muted-foreground",
};

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskRow({ task, onEdit }: TaskRowProps) {
  const state = useAppState();
  const project = state.projects.find((p) => p.id === task.projectId);
  const done = task.status === "completed";
  const cancelled = task.status === "cancelled";
  const subDone = task.subtasks.filter((s) => s.completed).length;
  const templateId = task.virtual?.templateId ?? task.id;

  function remove() {
    // Occurrence menu offers Skip instead; delete here removes the series.
    appStore.deleteTask(templateId);
    toast("Task series deleted");
  }

  return (
    <li className="hover:bg-accent/40 group flex items-start gap-3 px-4 py-3 transition-colors">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => appStore.toggleTaskComplete(task.id)}
        className={cn(
          "mt-0.5 size-[18px] shrink-0 rounded-full border-2 transition-colors",
          done
            ? "border-emerald-500 bg-emerald-500"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {done && (
          <svg viewBox="0 0 24 24" className="size-full text-white" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden>
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              done && "text-muted-foreground line-through",
              cancelled && "text-muted-foreground/60 line-through"
            )}
          >
            {task.title}
          </span>
          {(task.repeat || task.virtual) && (
            <Repeat className="text-muted-foreground size-3.5 shrink-0" aria-label="Recurring" />
          )}
          {task.mit && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-500" aria-label="Most important task" />
          )}
          <Badge variant="outline" className={cn("shrink-0 text-[10px]", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </Badge>
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {project && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: project.color ?? "var(--primary)" }} aria-hidden />
              {project.name}
            </span>
          )}
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarClock className="size-3" aria-hidden />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              {task.dueTime ? `, ${task.dueTime}` : ""}
            </span>
          )}
          {task.estimatedDurationMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Timer className="size-3" aria-hidden />
              {formatMinutes(task.estimatedDurationMinutes)}
            </span>
          ) : null}
          {task.subtasks.length > 0 && (
            <span className="tabular-nums">
              ☑ {subDone}/{task.subtasks.length}
            </span>
          )}
          {state.tags
            .filter((tag) => task.tagIds.includes(tag.id))
            .map((tag) => (
              <span key={tag.id} className="bg-muted rounded px-1.5 py-0.5 text-[10px]">
                {tag.name}
              </span>
            ))}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${task.title}`}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil aria-hidden /> Edit
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={status === task.status}
                  onClick={() => appStore.setTaskStatus(task.id, status)}
                >
                  {STATUS_LABELS[status]}
                </DropdownMenuItem>
              ))}
              {task.virtual && (
                <DropdownMenuItem onClick={() => appStore.setTaskStatus(task.id, "cancelled")}>
                  <XCircle aria-hidden /> Skip this occurrence
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={remove}>
            <Trash2 aria-hidden /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

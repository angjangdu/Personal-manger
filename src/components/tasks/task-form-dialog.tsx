"use client";

import { useState } from "react";
import { ListPlus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { appStore, type TaskInput } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import type { Priority, RecurrenceRule, Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

type RepeatChoice =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly"
  | "custom";

const REPEAT_OPTIONS: { value: RepeatChoice; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
  { value: "custom", label: "Custom days…" },
];

const WEEKDAY_CHIPS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
];

function ruleToChoice(rule?: RecurrenceRule): RepeatChoice {
  if (!rule) return "none";
  return rule.freq;
}

function choiceToRule(
  choice: RepeatChoice,
  weekdays: number[]
): RecurrenceRule | undefined {
  switch (choice) {
    case "none":
      return undefined;
    case "daily":
    case "weekdays":
    case "weekly":
    case "biweekly":
    case "monthly":
    case "yearly":
      return { freq: choice };
    case "custom":
      return weekdays.length > 0 ? { freq: "custom", weekdays } : undefined;
  }
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set the dialog edits this task instead of creating one. */
  task?: Task;
  /** Preset project for newly created tasks (e.g. adding from a project page). */
  defaultProjectId?: string;
  /** Preset goal for newly created tasks (e.g. adding from a goal page). */
  defaultGoalId?: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  defaultGoalId,
}: TaskFormDialogProps) {
  const state = useAppState();
  // Editing an occurrence edits its series (the template).
  const template = task?.virtual
    ? state.tasks.find((t) => t.id === task.virtual!.templateId)
    : task;
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Keyed remount initializes form state per open/task without effects. */}
      {open ? (
        <TaskFormFields
          key={template?.id ?? "__new__"}
          task={template}
          defaultProjectId={defaultProjectId}
          defaultGoalId={defaultGoalId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

interface TaskFormFieldsProps {
  task?: Task;
  defaultProjectId?: string;
  defaultGoalId?: string;
  onClose: () => void;
}

function TaskFormFields({ task, defaultProjectId, defaultGoalId, onClose }: TaskFormFieldsProps) {
  const state = useAppState();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "inbox");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [duration, setDuration] = useState(
    task?.estimatedDurationMinutes ? String(task.estimatedDurationMinutes) : ""
  );
  const [projectId, setProjectId] = useState(task?.projectId ?? defaultProjectId ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? defaultGoalId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? []);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [newSubtasks, setNewSubtasks] = useState<{ id: string; title: string }[]>([]);
  const [showDetails, setShowDetails] = useState(Boolean(task));
  const [mit, setMit] = useState(task?.mit ?? false);
  const [repeatChoice, setRepeatChoice] = useState<RepeatChoice>(
    ruleToChoice(task?.repeat)
  );
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>(
    task?.repeat?.weekdays ?? []
  );

  const editingTask = task
    ? state.tasks.find((t) => t.id === task.id) ?? null
    : null;

  function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const input: TaskInput = {
      title: trimmedTitle,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate + "T00:00:00").toISOString() : "",
      dueTime,
      estimatedDurationMinutes: Number(duration) || 0,
      projectId: projectId === "none" ? "" : projectId,
      goalId: goalId === "none" ? "" : goalId,
      tagIds,
      repeat: choiceToRule(repeatChoice, repeatWeekdays),
      mit,
    };

    if (editingTask) {
      appStore.updateTask(editingTask.id, input);
      toast("Task updated");
    } else {
      const created = appStore.addTask(input);
      for (const sub of newSubtasks) appStore.addSubtask(created.id, sub.title);
      toast("Task created");
    }
    onClose();
  }

  function addDraftSubtask() {
    const trimmed = subtaskDraft.trim();
    if (!trimmed) return;
    if (editingTask) {
      appStore.addSubtask(editingTask.id, trimmed);
    } else {
      setNewSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: trimmed }]);
    }
    setSubtaskDraft("");
  }

  const subtasksList = editingTask
    ? editingTask.subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed }))
    : newSubtasks.map((s) => ({ ...s, completed: false }));

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{editingTask ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>
          {editingTask
            ? "Update the details of this task."
            : "Type a title and press Enter to capture it fast."}
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            autoFocus
            required
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!showDetails && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
            <ListPlus aria-hidden /> Add details
          </Button>
        )}

        {showDetails && (
          <>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                rows={2}
                placeholder="Notes, links, context…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-time">Due time</Label>
                <Input
                  id="task-due-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="task-duration">Duration (min)</Label>
                <Input
                  id="task-duration"
                  type="number"
                  min={0}
                  placeholder="45"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="size-4 text-yellow-500" aria-hidden /> Most Important Task
            </p>
            <p className="text-muted-foreground text-xs">
              Highlighted on the Dashboard
            </p>
          </div>
          <Switch checked={mit} onCheckedChange={setMit} aria-label="Most important task" />
        </div>

        <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={projectId || "none"}
                  onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {state.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Select
                  value={goalId || "none"}
                  onValueChange={(v) => setGoalId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {state.goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {state.tags.map((tag) => {
                  const active = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select
                  value={repeatChoice}
                  onValueChange={(v) => setRepeatChoice(v as RepeatChoice)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(repeatChoice === "custom" || repeatChoice === "weekly") && (
                  <div className="flex gap-1.5 pt-1">
                    {WEEKDAY_CHIPS.map((day, idx) => {
                      const active = repeatWeekdays.includes(day.value);
                      return (
                        <button
                          key={`${day.label}-${idx}`}
                          type="button"
                          aria-pressed={active}
                          aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.value]}
                          onClick={() =>
                            setRepeatWeekdays((prev) =>
                              prev.includes(day.value)
                                ? prev.filter((d) => d !== day.value)
                                : [...prev, day.value]
                            )
                          }
                          className={cn(
                            "size-8 rounded-full border text-xs font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {repeatChoice !== "none" && (
                  <p className="text-muted-foreground text-[11px]">
                    Each occurrence is independent — completing or skipping one
                    day never affects the others.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subtasks</Label>
              <ul className="space-y-1">
                {subtasksList.map((sub) => (
                  <li key={sub.id} className="group flex items-center gap-2 text-sm">
                    {editingTask ? (
                      <Checkbox
                        checked={sub.completed}
                        onCheckedChange={() =>
                          appStore.toggleSubtask(editingTask.id, sub.id)
                        }
                        aria-label={`Toggle ${sub.title}`}
                      />
                    ) : (
                      <span className="bg-muted size-2 rounded-full" aria-hidden />
                    )}
                    <span className={cn("flex-1 truncate", sub.completed && "text-muted-foreground line-through")}>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        editingTask
                          ? appStore.deleteSubtask(editingTask.id, sub.id)
                          : setNewSubtasks((prev) => prev.filter((s) => s.id !== sub.id))
                      }
                      className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${sub.title}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Input
                placeholder="Add a subtask…"
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addDraftSubtask();
                  }
                }}
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            {editingTask ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

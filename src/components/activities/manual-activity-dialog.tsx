"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { ACTIVITY_CATEGORIES } from "@/components/activities/categories";
import type { ActivityCategory } from "@/types";

interface ManualActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Review §10: users must be able to manually add an activity they forgot to track. */
export function ManualActivityDialog({ open, onOpenChange }: ManualActivityDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ManualActivityFields onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function ManualActivityFields({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("none");
  const [projectId, setProjectId] = useState("none");
  const [category, setCategory] = useState<ActivityCategory>("other");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const nowHour = new Date().getHours();
  const [startTime, setStartTime] = useState(
    `${String(Math.max(0, nowHour - 1)).padStart(2, "0")}:00`
  );
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  const activeTasks = state.tasks.filter(
    (t) => t.status !== "cancelled"
  );

  function pickTask(value: string) {
    setTaskId(value);
    if (value !== "none") {
      const task = activeTasks.find((t) => t.id === value);
      if (task?.title) setTitle(task.title);
      setProjectId(task?.projectId ?? "none");
    }
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed || Number(duration) <= 0) return;
    const created = appStore.addManualActivity({
      title: trimmed,
      taskId: taskId === "none" ? undefined : taskId,
      projectId: projectId === "none" ? undefined : projectId,
      category,
      date,
      startTime,
      durationMinutes: Number(duration),
      notes,
    });
    if (!created) {
      toast("A session is currently running — stop it first.");
      return;
    }
    toast("Session added", { description: `${duration} min on ${date}.` });
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add past session</DialogTitle>
        <DialogDescription>
          Forgot to hit start? Log it retroactively — it counts toward reports.
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
          <Label htmlFor="manual-title">What did you work on?</Label>
          <Input
            id="manual-title"
            autoFocus
            required
            placeholder="Session title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Task (optional)</Label>
            <Select value={taskId} onValueChange={pickTask}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">None</SelectItem>
                {activeTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <span className="max-w-[200px] truncate">{task.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {taskId === "none" && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
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
          )}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ActivityCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="manual-date">Date</Label>
            <Input
              id="manual-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-start">Started</Label>
            <Input
              id="manual-start"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-duration">Minutes</Label>
            <Input
              id="manual-duration"
              type="number"
              min={1}
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-notes">Notes</Label>
          <Textarea
            id="manual-notes"
            rows={2}
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || Number(duration) <= 0}>
            <Plus aria-hidden /> Add session
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

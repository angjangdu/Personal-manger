"use client";

import { useState } from "react";
import { Play } from "lucide-react";
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
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import {
  ACTIVITY_CATEGORIES,
} from "@/components/activities/categories";
import type { ActivityCategory } from "@/types";

interface StartActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartActivityDialog({ open, onOpenChange }: StartActivityDialogProps) {
  const state = useAppState();
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("other");
  const [title, setTitle] = useState("");

  if (!open) return null;

  const activeTasks = state.tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  function pickTask(value: string) {
    setTaskId(value);
    if (value === "none") {
      setProjectId("");
      return;
    }
    const task = activeTasks.find((t) => t.id === value);
    if (task) {
      setTitle(task.title);
      setProjectId(task.projectId ?? "");
    }
  }

  function start() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = appStore.startActivity({
      title: trimmed,
      taskId: taskId === "none" ? "" : taskId,
      projectId: projectId === "none" ? "" : projectId,
      category,
    });
    if (!created) {
      toast("A session is already running", {
        description: "Stop it before starting a new one.",
      });
      return;
    }
    toast("Session started", { description: trimmed });
    onOpenChange(false);
  }

  const canStart =
    title.trim().length > 0 &&
    (taskId === "" || taskId === "none" ? true : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start activity</DialogTitle>
          <DialogDescription>
            One session at a time. Duration is computed from timestamps when you stop.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <div className="space-y-2">
            <Label>Task (optional)</Label>
            <Select value={taskId || "none"} onValueChange={pickTask}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Free-form session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Free-form session</SelectItem>
                {activeTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {taskId === "none" && (
            <div className="space-y-2">
              <Label>Project (optional)</Label>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="activity-title">Title</Label>
            <Input
              id="activity-title"
              autoFocus
              required
              placeholder="e.g. Mathematical Physics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canStart}>
              <Play aria-hidden /> Start
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

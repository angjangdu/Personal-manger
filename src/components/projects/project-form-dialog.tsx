"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { appStore, type ProjectInput } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { PROJECT_STATUS_LABELS } from "@/lib/health-utils";
import type { Project, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

const COLOR_SWATCHES = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#64748b",
];

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ProjectFormFields
        key={project?.id ?? "__new__"}
        project={project}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function ProjectFormFields({ project, onClose }: { project?: Project; onClose: () => void }) {
  const state = useAppState();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? COLOR_SWATCHES[0]);
  const [deadline, setDeadline] = useState(
    project?.deadline ? project.deadline.slice(0, 10) : ""
  );
  const [goalId, setGoalId] = useState(project?.goalId ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "active"
  );

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const input: ProjectInput = {
      name: trimmed,
      description,
      color,
      deadline: deadline ? new Date(deadline + "T00:00:00").toISOString() : "",
      goalId: goalId === "none" ? "" : goalId,
      status,
    };

    if (project) {
      appStore.updateProject(project.id, input);
      toast("Project updated");
    } else {
      appStore.addProject(input);
      toast("Project created");
    }
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        <DialogDescription>
          Projects group tasks into meaningful outcomes.
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
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            autoFocus
            required
            placeholder="e.g. Mathematical Physics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            rows={2}
            placeholder="What is this about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform",
                  color === swatch
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="project-deadline">Deadline</Label>
            <Input
              id="project-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? "" : v)}>
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

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {project ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

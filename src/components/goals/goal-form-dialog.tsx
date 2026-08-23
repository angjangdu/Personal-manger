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
import { Textarea } from "@/components/ui/textarea";
import { appStore, type GoalInput } from "@/services/app-store";
import type { Goal } from "@/types";

const CATEGORY_SUGGESTIONS = ["Academic", "Career", "Health", "Project", "Personal"];

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}

export function GoalFormDialog({ open, onOpenChange, goal }: GoalFormDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <GoalFormFields key={goal?.id ?? "__new__"} goal={goal} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function GoalFormFields({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [category, setCategory] = useState(goal?.category ?? "");
  const [deadline, setDeadline] = useState(
    goal?.deadline ? goal.deadline.slice(0, 10) : ""
  );

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    const input: GoalInput = {
      title: trimmed,
      description,
      category,
      deadline: deadline ? new Date(deadline + "T00:00:00").toISOString() : "",
    };

    if (goal) {
      appStore.updateGoal(goal.id, input);
      toast("Goal updated");
    } else {
      appStore.addGoal(input);
      toast("Goal created");
    }
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
        <DialogDescription>
          Goals are long-term outcomes — progress is derived from milestones, projects, and tasks.
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
          <Label htmlFor="goal-title">Title</Label>
          <Input
            id="goal-title"
            autoFocus
            required
            placeholder="e.g. Ace this semester"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal-description">Description</Label>
          <Textarea
            id="goal-description"
            rows={2}
            placeholder="What does success look like?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="goal-category">Category</Label>
            <Input
              id="goal-category"
              list="goal-category-suggestions"
              placeholder="e.g. Academic"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="goal-category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Deadline</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            {goal ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

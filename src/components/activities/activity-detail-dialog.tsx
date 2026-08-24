"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appStore } from "@/services/app-store";
import { useNow } from "@/hooks/use-now";
import {
  ACTIVITY_CATEGORIES,
  categoryLabel,
} from "@/components/activities/categories";
import type { Activity, ActivityCategory } from "@/types";

interface ActivityDetailDialogProps {
  activity: Activity | null;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailDialog({
  activity,
  onOpenChange,
}: ActivityDetailDialogProps) {
  const [notes, setNotes] = useState(activity?.notes ?? "");
  const [category, setCategory] = useState<ActivityCategory>(
    activity?.category ?? "other"
  );
  const now = useNow(1000);

  if (!activity) return null;

  const start = new Date(activity.startedAt);
  const end = activity.endedAt ? new Date(activity.endedAt) : null;
  const pausedMinutes =
    activity.totalPausedMs > 0
      ? Math.round(activity.totalPausedMs / 60000)
      : 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{activity.title}</DialogTitle>
          <DialogDescription>Session details</DialogDescription>
        </DialogHeader>

        <dl className="space-y-2 rounded-lg border p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground shrink-0">Started</dt>
            <dd className="tabular-nums">
              {start.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground shrink-0">Ended</dt>
            <dd className="tabular-nums">
              {end
                ? end.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Running"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground shrink-0">Tracked</dt>
            <dd className="font-semibold tabular-nums">
              {activity.durationMinutes ?? Math.round((now - start.getTime() - activity.totalPausedMs) / 60000)} min
            </dd>
          </div>
          {pausedMinutes > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground shrink-0">Paused</dt>
              <dd className="tabular-nums">{pausedMinutes} min</dd>
            </div>
          )}
        </dl>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ActivityCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{categoryLabel(category) || "Other"}</SelectValue>
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

        <div className="space-y-2">
          <Label htmlFor="activity-notes">Notes</Label>
          <Textarea
            id="activity-notes"
            rows={3}
            placeholder="What happened in this session?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              appStore.deleteActivity(activity.id);
              toast("Activity deleted");
              onOpenChange(false);
            }}
          >
            <Trash2 aria-hidden /> Delete
          </Button>
          <span className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              <X aria-hidden /> Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                appStore.updateActivity(activity.id, { notes, category, title: activity.title });
                toast("Saved");
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

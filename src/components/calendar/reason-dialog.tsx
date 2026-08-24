"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

const REASONS = [
  { value: "not_enough_time", label: "Not enough time" },
  { value: "higher_priority", label: "Higher-priority task came up" },
  { value: "unexpected_event", label: "Unexpected event" },
  { value: "too_tired", label: "Too tired" },
  { value: "took_longer", label: "Task took longer than expected" },
  { value: "personal", label: "Personal reason" },
  { value: "other", label: "Other" },
] as const;

export interface MoveReason {
  reason: (typeof REASONS)[number]["value"];
  note?: string;
}

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is being moved, shown for context. */
  title: string;
  onConfirm: (move: MoveReason) => void;
}

/** Captures why a scheduled item is being moved — feeds reschedule reports. */
export function ReasonDialog({ open, onOpenChange, title, onConfirm }: ReasonDialogProps) {
  const [reason, setReason] = useState<MoveReason["reason"] | null>(null);
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why are you moving this?</DialogTitle>
          <DialogDescription className="truncate">“{title}”</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5" role="radiogroup" aria-label="Reason">
          {REASONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={reason === option.value}
              onClick={() => setReason(option.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                reason === option.value
                  ? "border-primary bg-primary/10"
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="move-note">Note (optional)</Label>
          <Input
            id="move-note"
            placeholder="Details…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel move
          </Button>
          <Button disabled={!reason} onClick={() => reason && onConfirm({ reason, note: note.trim() || undefined })}>
            Confirm move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

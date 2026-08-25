"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";

interface TagPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  /** Called with the full new selection whenever a tag toggles/creates. */
  onChange: (tagIds: string[]) => void;
  heading?: string;
}

/** Reusable tag selector with inline creation (adds to the shared tag pool). */
export function TagPickerDialog({
  open,
  onOpenChange,
  selected,
  onChange,
  heading = "Tags",
}: TagPickerDialogProps) {
  const state = useAppState();
  const [newName, setNewName] = useState("");

  if (!open) return null;

  function toggle(tagId: string) {
    onChange(
      selected.includes(tagId)
        ? selected.filter((id) => id !== tagId)
        : [...selected, tagId]
    );
  }

  function create() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const tag = appStore.addTag(trimmed);
    if (!selected.includes(tag.id)) onChange([...selected, tag.id]);
    setNewName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            Tags are shared across tasks, notes and files.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {state.tags.map((tag) => {
            const active = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {tag.name}
              </button>
            );
          })}
          {state.tags.length === 0 && (
            <p className="text-muted-foreground text-sm">No tags yet — create one below.</p>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <Input
            placeholder="New tag name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!newName.trim()}>
            <Plus aria-hidden /> Add
          </Button>
        </form>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

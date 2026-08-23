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
import { appStore, type SubjectInput } from "@/services/app-store";
import type { StudySubject } from "@/types";
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

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: StudySubject;
}

export function SubjectFormDialog({ open, onOpenChange, subject }: SubjectFormDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SubjectFormFields key={subject?.id ?? "__new__"} subject={subject} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function SubjectFormFields({ subject, onClose }: { subject?: StudySubject; onClose: () => void }) {
  const [name, setName] = useState(subject?.name ?? "");
  const [description, setDescription] = useState(subject?.description ?? "");
  const [color, setColor] = useState(subject?.color ?? COLOR_SWATCHES[0]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const input: SubjectInput = { name: trimmed, description, color };
    if (subject) {
      appStore.updateSubject(subject.id, input);
      toast("Subject updated");
    } else {
      appStore.addSubject(input);
      toast("Subject created");
    }
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{subject ? "Edit subject" : "New subject"}</DialogTitle>
        <DialogDescription>
          A course you are studying — units and topics live inside it.
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
          <Label htmlFor="subject-name">Name</Label>
          <Input
            id="subject-name"
            autoFocus
            required
            placeholder="e.g. Mathematical Physics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject-description">Description</Label>
          <Textarea
            id="subject-description"
            rows={2}
            placeholder="Optional"
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
                  color === swatch ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {subject ? "Save changes" : "Create subject"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { appStore } from "@/services/app-store";

interface QuickCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Review §15: save an idea without requiring immediate organization.
 * First line becomes the title; everything lands in the Inbox folder.
 */
export function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
  const [content, setContent] = useState("");

  if (!open) return null;

  function save() {
    const trimmed = content.trim();
    if (!trimmed) return;
    const [firstLine, ...rest] = trimmed.split("\n");
    appStore.addNote({
      title: firstLine.slice(0, 80),
      content: rest.length > 0 ? rest.join("\n").trim() : firstLine,
      tagIds: [],
      folder: "Inbox",
      linkedTaskIds: [],
      linkedProjectIds: [],
    });
    toast("Captured", { description: "Filed to Inbox — organize later." });
    setContent("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-yellow-500" aria-hidden /> Quick capture
          </DialogTitle>
          <DialogDescription>
            First line = title. Organize it later — or never.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={5}
          placeholder={"Idea title\nOptional details…"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              save();
            }
          }}
          aria-label="Quick note"
        />
        <DialogFooter>
          <span className="text-muted-foreground mr-auto text-[11px]">Ctrl+Enter to save</span>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!content.trim()}>
            Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

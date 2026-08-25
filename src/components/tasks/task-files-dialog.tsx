"use client";

import { Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadButton } from "@/components/files/upload-button";
import {
  AttachmentList,
  attachmentsFor,
} from "@/components/files/attachment-list";
import { useAppState } from "@/hooks/use-app-state";
import type { Task } from "@/types";

interface TaskFilesDialogProps {
  task: Task | null;
  onClose: () => void;
}

/** Attach reference files to a task (or its whole recurring series). */
export function TaskFilesDialog({ task, onClose }: TaskFilesDialogProps) {
  const state = useAppState();
  if (!task) return null;
  const templateId = task.virtual?.templateId ?? task.id;

  const files = attachmentsFor(state, { taskId: templateId });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="size-4" aria-hidden /> Files
          </DialogTitle>
          <DialogDescription className="truncate">
            {task.title}
            {task.virtual ? " · series" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs tabular-nums">
            {files.length} file{files.length === 1 ? "" : "s"}
          </span>
          <UploadButton links={{ taskId: templateId }} label="Add file" />
        </div>
        <AttachmentList
          attachments={files}
          emptyText="No files attached — add briefs, rubrics or references."
        />
      </DialogContent>
    </Dialog>
  );
}

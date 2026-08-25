"use client";

import { Download, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { appStore } from "@/services/app-store";
import { deleteFileBlob, getFileBlob } from "@/services/file-store";
import { formatBytes } from "@/lib/file-utils";
import type { Attachment } from "@/types";
import type { AppState } from "@/services/app-store";

interface AttachmentListProps {
  attachments: Attachment[];
  emptyText?: string;
}

/** Compact rows with open/download/delete — reused across sections. */
export function AttachmentList({ attachments, emptyText }: AttachmentListProps) {

  async function openFile(id: string, name: string, download = false) {
    const blob = await getFileBlob(id);
    if (!blob) {
      toast("File data missing", {
        description: "It may have been cleared from this browser.",
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    if (download) a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    await deleteFileBlob(id);
    appStore.deleteAttachment(id);
    toast("File deleted");
  }

  if (attachments.length === 0) {
    return emptyText ? (
      <p className="text-muted-foreground py-1 text-xs">{emptyText}</p>
    ) : null;
  }

  return (
    <ul className="divide-y overflow-hidden rounded-lg border">
      {attachments.map((file) => (
        <li key={file.id} className="group flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => void openFile(file.id, file.name)}
            className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
          >
            {file.name}
          </button>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatBytes(file.sizeBytes)}
          </span>
          <button
            type="button"
            aria-label={`Open ${file.name}`}
            onClick={() => void openFile(file.id, file.name)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Download ${file.name}`}
            onClick={() => void openFile(file.id, file.name, true)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Download className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Delete ${file.name}`}
            onClick={() => void remove(file.id, file.name)}
            className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function attachmentsFor(
  state: Pick<AppState, "attachments">,
  links: Partial<Pick<Attachment, "noteId" | "taskId" | "projectId" | "studySubjectId" | "studyTopicId">>
): Attachment[] {
  return state.attachments.filter((attachment) =>
    Object.entries(links).every(
      ([key, value]) =>
        value === undefined || attachment[key as keyof Attachment] === value
    )
  );
}

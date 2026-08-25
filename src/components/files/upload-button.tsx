"use client";

import { useRef, useState } from "react";
import { FolderUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { appStore } from "@/services/app-store";
import { putFileBlob } from "@/services/file-store";
import { detectFileKind, MAX_FILE_BYTES } from "@/lib/file-utils";
import type { Attachment } from "@/types";

interface UploadButtonProps {
  /** Entity links baked into every uploaded file. */
  links?: Partial<
    Pick<Attachment, "noteId" | "taskId" | "projectId" | "studySubjectId" | "studyTopicId">
  >;
  tagIds?: string[];
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon-sm";
  disabled?: boolean;
}

const ACCEPT =
  ".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.xls,.xlsx,.csv,.ods,.ppt,.pptx,.odp,image/*";

/** Uploads files into IndexedDB + store metadata with preset links/tags. */
export function UploadButton({
  links = {},
  tagIds = [],
  label = "Upload files",
  variant = "outline",
  size = "sm",
  disabled,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    let added = 0;
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        toast(`${file.name} is too large`, { description: "Max 50 MB per file." });
        continue;
      }
      const id = crypto.randomUUID();
      try {
        await putFileBlob(id, file);
        appStore.addAttachment({
          id,
          name: file.name,
          ext: file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "",
          mime: file.type || "application/octet-stream",
          sizeBytes: file.size,
          kind: detectFileKind(file.name, file.type),
          tagIds,
          ...links,
        });
        added++;
      } catch {
        toast(`Could not store ${file.name}`);
      }
    }
    setBusy(false);
    if (added > 0) toast(`${added} file${added > 1 ? "s" : ""} attached`);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPT}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        variant={variant}
        size={size}
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        <FolderUp aria-hidden /> {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FolderUp,
  Image as ImageIcon,
  Presentation,
  Search,
  Sheet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appStore } from "@/services/app-store";
import { TagPickerDialog } from "@/components/shared/tag-picker-dialog";
import { useAppState } from "@/hooks/use-app-state";
import { deleteFileBlob, getFileBlob, putFileBlob } from "@/services/file-store";
import {
  detectFileKind,
  FILE_KIND_META,
  formatBytes,
  MAX_FILE_BYTES,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";

export default function FilesPage() {
  const state = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([]);
  const [tagPickerId, setTagPickerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const files = state.attachments
    .filter((a) => !kindFilter || kindFilter === "all" || a.kind === kindFilter)
    .filter((a) => tagFilterIds.every((id) => a.tagIds.includes(id)))
    .filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const totalBytes = state.attachments.reduce((sum, a) => sum + a.sizeBytes, 0);

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
          tagIds: [],
        });
        added++;
      } catch {
        toast(`Could not store ${file.name}`, {
          description: "Browser storage refused the write.",
        });
      }
    }
    setBusy(false);
    if (added > 0) toast(`${added} file${added > 1 ? "s" : ""} uploaded`);
  }

  async function openFile(id: string, name: string, download = false) {
    const blob = await getFileBlob(id);
    if (!blob) {
      toast("File data missing", { description: "It may have been cleared from this browser." });
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

  return (
    <>
      <PageHeader
        title="Files"
        description={`${state.attachments.length} documents · ${formatBytes(totalBytes)} stored locally`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.xls,.xlsx,.csv,.ods,.ppt,.pptx,.odp,image/*"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          <FolderUp aria-hidden /> {busy ? "Uploading…" : "Upload files"}
        </Button>
      </PageHeader>

      <p className="text-muted-foreground mb-4 text-xs">
        PDFs, Word/Sheets/PowerPoint files, images and more — stored in this browser and
        synced to cloud storage when the backend arrives.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search files…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search files"
          />
        </div>
        <Select value={kindFilter || "all"} onValueChange={(v) => setKindFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(FILE_KIND_META) as (keyof typeof FILE_KIND_META)[]).map((kind) => (
              <SelectItem key={kind} value={kind}>
                {FILE_KIND_META[kind].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TagButtonFilter
          selected={tagFilterIds}
          onChange={setTagFilterIds}
          activeCount={tagFilterIds.length}
        />
        <span className="text-muted-foreground ml-auto text-xs tabular-nums" role="status">
          {files.length} shown
        </span>
      </div>

      {files.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderUp aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {state.attachments.length === 0 ? "No files yet" : "No matches"}
            </EmptyTitle>
            <EmptyDescription>
              Upload assignment PDFs, lecture slides, spreadsheets, notes exports or
              reference images — then open them anywhere in your workspace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
              <FolderUp aria-hidden /> Choose files
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {files.map((file) => {
            const meta = FILE_KIND_META[file.kind];
            const note = state.notes.find((n) => n.id === file.noteId);
            const project = state.projects.find((p) => p.id === file.projectId);
            const subject = state.studySubjects.find(
              (s) => s.id === file.studySubjectId
            );
            return (
              <li key={file.id} className="group hover:bg-accent/40 flex items-center gap-3 px-4 py-3 transition-colors">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${meta.className}`}
                  aria-hidden
                >
                  <KindGlyph kind={file.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="text-muted-foreground block truncate text-xs tabular-nums">
                    {formatBytes(file.sizeBytes)} ·{" "}
                    {new Date(file.uploadedAt).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                    {note ? ` · 📄 ${note.title}` : ""}
                    {project ? ` · ${project.name}` : ""}
                    {subject ? ` · ${subject.name}` : ""}
                  </span>
                </span>
                <Badge variant="outline" className={meta.className}>
                  {file.ext.toUpperCase() || meta.label}
                </Badge>
                <FileTagChips tagIds={file.tagIds} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Tag ${file.name}`}
                  onClick={() => setTagPickerId(file.id)}
                >
                  <TagsIcon aria-hidden />
                </Button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open ${file.name}`}
                    onClick={() => void openFile(file.id, file.name)}
                  >
                    <ExternalLink aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${file.name}`}
                    onClick={() => void openFile(file.id, file.name, true)}
                  >
                    <Download aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${file.name}`}
                    className="text-destructive hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => void remove(file.id, file.name)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TagPickerDialog
        open={Boolean(tagPickerId)}
        onOpenChange={(o) => !o && setTagPickerId(null)}
        selected={state.attachments.find((a) => a.id === tagPickerId)?.tagIds ?? []}
        onChange={(tagIds) =>
          tagPickerId && appStore.updateAttachmentLinks(tagPickerId, { tagIds })
        }
        heading="File tags"
      />
    </>
  );
}

function KindGlyph({ kind }: { kind: keyof typeof FILE_KIND_META }) {
  switch (kind) {
    case "image":
      return <ImageIcon className="size-4" />;
    case "sheet":
      return <Sheet className="size-4" />;
    case "presentation":
      return <Presentation className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
}

function FileTagChips({ tagIds }: { tagIds: string[] }) {
  const state = useAppState();
  if (tagIds.length === 0) return null;
  return (
    <span className="hidden shrink-0 gap-1 lg:flex">
      {state.tags
        .filter((tag) => tagIds.includes(tag.id))
        .map((tag) => (
          <span key={tag.id} className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
            {tag.name}
          </span>
        ))}
    </span>
  );
}

function TagsIcon() {
  return <TagsGlyph aria-hidden />;
}

function TagsGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5" {...props}>
      <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
      <path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="6.5" cy="9.5" r=".5" fill="currentColor" />
    </svg>
  );
}

/** Filter button that opens the shared tag picker (selection = filter). */
function TagButtonFilter({
  selected,
  onChange,
  activeCount,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const state = useAppState();
  const names = state.tags
    .filter((t) => selected.includes(t.id))
    .map((t) => t.name)
    .join(", ");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
          activeCount > 0
            ? "border-primary/50 bg-primary/10 text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <TagsGlyph /> Tag filter {activeCount > 0 ? `(${activeCount})` : ""}
        {names && <span className="hidden max-w-[160px] truncate md:inline">· {names}</span>}
      </button>
      <TagPickerDialog
        open={open}
        onOpenChange={setOpen}
        selected={selected}
        onChange={onChange}
        heading="Filter files by tags"
      />
    </>
  );
}

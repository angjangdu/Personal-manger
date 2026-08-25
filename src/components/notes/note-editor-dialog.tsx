"use client";

import { useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, ChevronDown, Paperclip, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { appStore, type NoteInput } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import {
  deleteFileBlob,
  putFileBlob,
} from "@/services/file-store";
import {
  detectFileKind,
  formatBytes,
  MAX_FILE_BYTES,
} from "@/lib/file-utils";
import type { Note } from "@/types";

interface NoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note;
}

export function NoteEditorDialog({ open, onOpenChange, note }: NoteEditorDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <NoteEditorFields key={note?.id ?? "__new__"} note={note} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function NoteEditorFields({ note, onClose }: { note?: Note; onClose: () => void }) {
  const state = useAppState();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagIds, setTagIds] = useState<string[]>(note?.tagIds ?? []);
  const [folder, setFolder] = useState(note?.folder ?? "");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [taskIds, setTaskIds] = useState<string[]>(note?.linkedTaskIds ?? []);
  const [projectIds, setProjectIds] = useState<string[]>(note?.linkedProjectIds ?? []);
  const [topicId, setTopicId] = useState(note?.linkedStudyTopicId ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const noteAttachments = useMemo(
    () => state.attachments.filter((a) => a.noteId === note?.id),
    [state.attachments, note?.id]
  );

  async function handleAttach(files: FileList | null) {
    if (!files || files.length === 0 || !note) return;
    setUploading(true);
    for (const file of Array.from(files)) {
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
          noteId: note.id,
        });
      } catch {
        toast(`Could not store ${file.name}`);
      }
    }
    setUploading(false);
    toast("Attached");
  }

  async function detach(attachmentId: string, name: string) {
    await deleteFileBlob(attachmentId);
    appStore.deleteAttachment(attachmentId);
    toast(`Removed ${name}`);
  }

  const activeTasks = state.tasks.filter((t) => t.status !== "cancelled");

  const linkedSummary = useMemo(
    () =>
      [
        taskIds.length ? `${taskIds.length} tasks` : null,
        projectIds.length ? `${projectIds.length} projects` : null,
        topicId && topicId !== "none" ? "1 topic" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    [taskIds.length, projectIds.length, topicId]
  );

  function toggleFrom(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function submit() {
    if (!title.trim() && !content.trim()) return;
    const input: NoteInput = {
      title,
      content,
      folder,
      pinned,
      tagIds,
      linkedTaskIds: taskIds,
      linkedProjectIds: projectIds,
      linkedStudyTopicId: topicId === "none" || topicId === "" ? "" : topicId,
    };
    if (note) {
      appStore.updateNote(note.id, input);
      toast("Note saved");
    } else {
      appStore.addNote(input);
      toast("Note created");
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            Markdown supported · link the note to related work
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
            aria-label="Title"
          />
          <Input
            list="note-folder-suggestions"
            placeholder="Folder (e.g. Physics)"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            aria-label="Folder"
          />
          <datalist id="note-folder-suggestions">
            {[...new Set(state.notes.map((n) => n.folder).filter(Boolean))].map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-current size-4"
          />
          Pin to top
        </label>

          <Tabs defaultValue="edit">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <div className="ml-auto flex items-center gap-2 pr-2">
                {/* Tags */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Tags {tagIds.length > 0 ? `(${tagIds.length})` : ""}
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {state.tags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={tagIds.includes(tag.id)}
                        onCheckedChange={() => setTagIds((prev) => toggleFrom(prev, tag.id))}
                      >
                        {tag.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {state.tags.length === 0 && (
                      <span className="text-muted-foreground px-2 py-1.5 text-xs">No tags yet</span>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Task links */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Tasks {taskIds.length > 0 ? `(${taskIds.length})` : ""}
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                    {activeTasks.map((task) => (
                      <DropdownMenuCheckboxItem
                        key={task.id}
                        checked={taskIds.includes(task.id)}
                        onCheckedChange={() => setTaskIds((prev) => toggleFrom(prev, task.id))}
                      >
                        <span className="max-w-[240px] truncate">{task.title}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                    {activeTasks.length === 0 && (
                      <span className="text-muted-foreground px-2 py-1.5 text-xs">No tasks</span>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Project links */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Projects {projectIds.length > 0 ? `(${projectIds.length})` : ""}
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {state.projects.map((project) => (
                      <DropdownMenuCheckboxItem
                        key={project.id}
                        checked={projectIds.includes(project.id)}
                        onCheckedChange={() => setProjectIds((prev) => toggleFrom(prev, project.id))}
                      >
                        {project.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Study topic */}
                <Select value={topicId || "none"} onValueChange={setTopicId}>
                  <SelectTrigger size="sm" className="w-[130px]" aria-label="Link study topic">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">No topic</SelectItem>
                    {state.studyTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsList>

            <TabsContent value="edit">
              <Textarea
                rows={12}
                placeholder={"# Heading\n\nWrite in **markdown**…\n\n- lists\n- `code`\n- [links](https://example.com)"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm"
                aria-label="Note content"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose prose-sm dark:prose-invert max-h-[50vh] max-w-none overflow-y-auto rounded-lg border p-4">
                {content.trim() ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-muted-foreground text-xs">
            Linked to: {linkedSummary || "nothing yet"}
          </p>

          {note ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Paperclip className="size-3.5" aria-hidden /> Attachments
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    void handleAttach(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Add file"}
                </Button>
              </div>
              <ul className="space-y-1">
                {noteAttachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="group flex items-center gap-2 text-sm"
                  >
                    <Paperclip className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {formatBytes(attachment.sizeBytes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void detach(attachment.id, attachment.name)}
                      aria-label={`Remove ${attachment.name}`}
                      className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
                {noteAttachments.length === 0 && (
                  <li className="text-muted-foreground py-1 text-xs">
                    No files attached yet.
                  </li>
                )}
              </ul>
            </div>
          ) : null}

          <DialogFooter className={note ? "justify-between sm:justify-between" : ""}>
            {note ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  appStore.deleteNote(note.id);
                  toast("Note deleted");
                  onClose();
                }}
              >
                <Trash2 aria-hidden /> Delete
              </Button>
            ) : (
              <span />
            )}
            <span className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() && !content.trim()}>
                <Check aria-hidden /> {note ? "Save" : "Create"}
              </Button>
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

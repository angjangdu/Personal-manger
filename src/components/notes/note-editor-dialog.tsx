"use client";

import { useMemo, useState } from "react";
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
import { UploadButton } from "@/components/files/upload-button";
import {
  AttachmentList,
  attachmentsFor,
} from "@/components/files/attachment-list";
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

  const noteAttachments = useMemo(
    () => (note ? attachmentsFor(state, { noteId: note.id }) : []),
    [state, note]
  );

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
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            Markdown supported · link the note to related work
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
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
                <UploadButton links={{ noteId: note.id }} label="Add file" />
              </div>
              <AttachmentList
                attachments={noteAttachments}
                emptyText="No files attached yet."
              />
            </div>
          ) : null}

          </div>
          <DialogFooter className={note ? "shrink-0 justify-between border-t px-6 py-4 sm:justify-between" : "shrink-0 border-t px-6 py-4"}>
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

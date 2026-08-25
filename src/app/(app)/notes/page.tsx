"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ListTodo,
  Paperclip,
  Pin,
  Plus,
  Search,
  Zap as ZapIcon,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { attachmentsFor } from "@/components/files/attachment-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { QuickCaptureDialog } from "@/components/notes/quick-capture-dialog";
import { useAppState } from "@/hooks/use-app-state";
import { searchNotes } from "@/lib/note-utils";
import type { Note } from "@/types";

export default function NotesPage() {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | undefined>(undefined);
  const [captureOpen, setCaptureOpen] = useState(false);

  // React Compiler auto-memoizes.
  const visible = searchNotes(state.notes, query)
    .filter((note) => !tagFilter || note.tagIds.includes(tagFilter))
    .filter((note) => !folderFilter || (note.folder ?? "") === folderFilter)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const folders = (
    state.notes.map((n) => n.folder).filter(Boolean) as string[]
  ).sort();

  return (
    <>
      <PageHeader title="Notes" description={`${state.notes.length} notes across your workspace`}>
        <Button variant="outline" onClick={() => setCaptureOpen(true)}>
          <ZapIcon aria-hidden /> Quick capture
        </Button>
        <Button onClick={() => { setEditing(undefined); setEditorOpen(true); }}>
          <Plus aria-hidden /> New note
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search title and content…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search notes"
          />
        </div>
        <Select value={tagFilter || "all"} onValueChange={(v) => setTagFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by tag">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {state.tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {folders.length > 0 && (
          <Select
            value={folderFilter || "all"}
            onValueChange={(v) => setFolderFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[150px]" aria-label="Filter by folder">
              <SelectValue placeholder="All folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums" role="status">
          {visible.length} shown
        </span>
      </div>

      {visible.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {state.notes.length === 0 ? "No notes yet" : "No matches"}
            </EmptyTitle>
            <EmptyDescription>
              {state.notes.length === 0
                ? "Capture knowledge in markdown and link it to tasks, projects, and study topics."
                : "Try a different search or tag filter."}
            </EmptyDescription>
          </EmptyHeader>
          {state.notes.length === 0 && (
            <EmptyContent>
              <Button onClick={() => { setEditing(undefined); setEditorOpen(true); }}>
                <Plus aria-hidden /> Create note
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((note) => (
            <NoteCard key={note.id} note={note} onOpen={() => { setEditing(note); setEditorOpen(true); }} />
          ))}
        </div>
      )}

      <NoteEditorDialog open={editorOpen} onOpenChange={setEditorOpen} note={editing} />
      <QuickCaptureDialog open={captureOpen} onOpenChange={setCaptureOpen} />
    </>
  );
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const state = useAppState();
  const tasks = state.tasks.filter((t) => note.linkedTaskIds.includes(t.id));
  const projects = state.projects.filter((p) => note.linkedProjectIds.includes(p.id));
  const topic = state.studyTopics.find((t) => t.id === note.linkedStudyTopicId);
  const fileCount = attachmentsFor(state, { noteId: note.id }).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group hover:border-primary/40 relative flex h-full flex-col rounded-xl border p-4 text-left transition-colors"
    >
      {note.pinned && (
        <Pin
          className="text-yellow-500 absolute right-3 top-3 size-3.5 fill-current"
          aria-label="Pinned"
        />
      )}
      {note.folder && (
        <span className="bg-muted text-muted-foreground mb-1.5 w-fit rounded px-1.5 py-0.5 text-[10px] font-medium">
          {note.folder}
        </span>
      )}
      <h3 className="truncate pr-6 text-sm font-semibold">{note.title || "Untitled"}</h3>

      {fileCount > 0 && (
        <span className="text-muted-foreground absolute right-3 top-9 flex items-center gap-1 text-[10px] tabular-nums">
          <Paperclip className="size-3" aria-hidden /> {fileCount}
        </span>
      )}

      <div className="prose prose-sm dark:prose-invert mt-1 line-clamp-4 max-w-none text-xs opacity-80 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <Markdown remarkPlugins={[remarkGfm]}>
          {note.content.split("\n").slice(0, 8).join("\n")}
        </Markdown>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px]">
        {tasks.slice(0, 2).map((task) => (
          <Link
            key={task.id}
            href="/tasks"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ListTodo className="size-3" aria-hidden />
            <span className="max-w-[120px] truncate">{task.title}</span>
          </Link>
        ))}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: project.color ?? "var(--primary)" }}
              aria-hidden
            />
            <span className="max-w-[110px] truncate">{project.name}</span>
          </Link>
        ))}
        {topic && (
          <Link
            href={`/study/${topic.subjectId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <BookOpen className="size-3" aria-hidden />
            <span className="max-w-[120px] truncate">{topic.name}</span>
          </Link>
        )}
        <span className="text-muted-foreground ml-auto tabular-nums">
          {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {state.tags
          .filter((tag) => note.tagIds.includes(tag.id))
          .map((tag) => (
            <span key={tag.id} className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
              {tag.name}
            </span>
          ))}
      </div>
    </button>
  );
}

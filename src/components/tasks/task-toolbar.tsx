"use client";

import { FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskSortKey } from "@/lib/selectors";
import type { AppState } from "@/services/app-store";

export interface ToolbarState {
  query: string;
  projectId: string;
  tagId: string;
  sort: TaskSortKey;
}

const SORT_OPTIONS: { value: TaskSortKey; label: string }[] = [
  { value: "due", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "created", label: "Newest" },
  { value: "title", label: "Title A–Z" },
];

interface TaskToolbarProps {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
  projects: AppState["projects"];
  tags: AppState["tags"];
}

export function TaskToolbar({ state, onChange, projects, tags }: TaskToolbarProps) {
  const hasFilters = Boolean(state.query || state.projectId || state.tagId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search tasks…"
          className="pl-8"
          value={state.query}
          onChange={(e) => onChange({ query: e.target.value })}
          aria-label="Search tasks"
        />
      </div>

      <Select value={state.projectId || "all"} onValueChange={(v) => onChange({ projectId: v === "all" ? "" : v })}>
        <SelectTrigger className="w-[150px]" aria-label="Filter by project">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.tagId || "all"} onValueChange={(v) => onChange({ tagId: v === "all" ? "" : v })}>
        <SelectTrigger className="w-[130px]" aria-label="Filter by tag">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={state.sort} onValueChange={(v) => onChange({ sort: v as TaskSortKey })}>
        <SelectTrigger className="w-[140px]" aria-label="Sort tasks">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ query: "", projectId: "", tagId: "" })}
        >
          <FilterX aria-hidden /> Clear
        </Button>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { appStore } from "@/services/app-store";
import { useNow } from "@/hooks/use-now";
import { projectDeadlineHealth, PROJECT_STATUS_LABELS } from "@/lib/health-utils";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  counts: { total: number; completed: number };
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, counts, onEdit }: ProjectCardProps) {
  // Minute tick is plenty for day-level countdowns.
  const now = useNow(60000);
  const percent =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
  const health = projectDeadlineHealth(project, percent, now);
  const statusLabel =
    project.status && project.status !== "active"
      ? PROJECT_STATUS_LABELS[project.status]
      : null;
  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - now) / 86400000)
    : null;

  return (
    <div className="group hover:bg-accent/40 relative rounded-xl border p-4 transition-colors">
      <div className="mb-3 flex items-start gap-2">
        <span
          className="mt-1 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? "var(--primary)" }}
          aria-hidden
        />
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          {statusLabel ? (
            <p className="text-muted-foreground mt-0.5 text-xs">{statusLabel}</p>
          ) : project.description ? (
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
              {project.description}
            </p>
          ) : null}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${project.name}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil aria-hidden /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                appStore.setProjectArchived(project.id, !project.archived);
                toast(project.archived ? "Project restored" : "Project archived");
              }}
            >
              {project.archived ? (
                <>
                  <ArchiveRestore aria-hidden /> Restore
                </>
              ) : (
                <>
                  <Archive aria-hidden /> Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                appStore.deleteProject(project.id);
                toast("Project deleted — its tasks were kept");
              }}
            >
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Progress value={percent} aria-label={`${project.name} progress`} />

      <p className="text-muted-foreground mt-2.5 flex items-center justify-between text-xs">
        <span className="tabular-nums">
          {counts.completed}/{counts.total} tasks · {percent}%
        </span>
        {health?.state !== "on_track" && health?.message ? (
          <span
            className={cn(
              "rounded border px-1.5 py-px text-[10px] font-semibold",
              health.state === "behind"
                ? "border-red-500/50 text-red-600 dark:text-red-400"
                : "border-yellow-500/60 text-yellow-700 dark:text-yellow-400"
            )}
          >
            {health.message}
          </span>
        ) : daysLeft !== null ? (
          <span className={cn(daysLeft <= 7 && "font-medium text-orange-600 dark:text-orange-400")}>
            {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`}
          </span>
        ) : null}
      </p>

      {!project.archived && (
        <Link
          href={`/projects/${project.id}`}
          className="absolute inset-0"
          aria-label={`Open ${project.name}`}
        />
      )}
    </div>
  );
}

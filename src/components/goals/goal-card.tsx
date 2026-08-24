"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, CalendarClock, Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { selectGoalProgress } from "@/lib/selectors";
import { goalHealth, HEALTH_META } from "@/lib/health-utils";
import type { Goal } from "@/types";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const state = useAppState();
  // Minute tick keeps day-level countdowns fresh.
  const now = useNow(60000);
  const percent = selectGoalProgress(state, goal);
  const healthMeta = HEALTH_META[goalHealth(state, goal, now)];
  const projectCount = state.projects.filter((p) => p.goalId === goal.id).length;
  const milestoneDone = goal.milestones.filter((m) => m.completedAt).length;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - now) / 86400000)
    : null;

  return (
    <div className="group hover:bg-accent/40 relative rounded-xl border p-4 transition-colors">
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/goals/${goal.id}`} className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{goal.title}</h3>
            </Link>
            {goal.category ? (
              <Badge variant="secondary" className="text-[10px]">{goal.category}</Badge>
            ) : null}
            {healthMeta.label ? (
              <Badge variant="outline" className={`text-[10px] ${healthMeta.className}`}>
                {healthMeta.label}
              </Badge>
            ) : null}
          </div>
          {goal.description ? (
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{goal.description}</p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${goal.title}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(goal)}>
              <Pencil aria-hidden /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                appStore.setGoalArchived(goal.id, !goal.archived);
                toast(goal.archived ? "Goal restored" : "Goal archived");
              }}
            >
              {goal.archived ? (
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
                appStore.deleteGoal(goal.id);
                toast("Goal deleted — projects and tasks were kept");
              }}
            >
              <Trash2 aria-hidden /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Progress value={percent} aria-label={`${goal.title} progress`} />

      <p className="text-muted-foreground mt-2.5 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-3 tabular-nums">
          {percent}%
          <span className="inline-flex items-center gap-1">
            <Flag className="size-3" aria-hidden />
            {milestoneDone}/{goal.milestones.length} milestones
          </span>
          {projectCount > 0 && <span>{projectCount} project{projectCount > 1 ? "s" : ""}</span>}
        </span>
        {daysLeft !== null && (
          <span className={`inline-flex items-center gap-1 ${daysLeft <= 7 && !goal.archived ? "font-medium text-orange-600 dark:text-orange-400" : ""}`}>
            <CalendarClock className="size-3" aria-hidden />
            {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d over`}
          </span>
        )}
      </p>

      {!goal.archived && (
        <Link href={`/goals/${goal.id}`} className="absolute inset-0" aria-label={`Open ${goal.title}`} />
      )}
    </div>
  );
}

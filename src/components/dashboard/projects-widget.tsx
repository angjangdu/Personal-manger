import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { Project } from "@/types";
import { Progress } from "@/components/ui/progress";

interface ProjectsWidgetProps {
  projects: Project[];
  taskCounts: Record<string, { total: number; completed: number }>;
  className?: string;
}

export function ProjectsWidget({ projects, taskCounts, className }: ProjectsWidgetProps) {
  return (
    <section className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active projects</h3>
        <Link href="/projects" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium">
          All projects <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => {
          const counts = taskCounts[project.id] ?? { total: 0, completed: 0 };
          const percent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
          const deadline = project.deadline
            ? new Date(project.deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
            : null;
          return (
            <Link
              key={project.id}
              href="/projects"
              className="hover:bg-accent/50 rounded-xl border p-3 transition-colors"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color ?? "var(--primary)" }} aria-hidden />
                <span className="truncate text-sm font-medium">{project.name}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">{percent}%</span>
              </div>
              <Progress value={percent} aria-label={`${project.name} progress`} />
              <p className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                <span>{counts.completed}/{counts.total} tasks</span>
                {deadline && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" aria-hidden /> {deadline}
                  </span>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

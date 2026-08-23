"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useAppState } from "@/hooks/use-app-state";
import { selectProjectTaskCounts } from "@/lib/selectors";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const state = useAppState();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);

  const counts = useMemo(() => selectProjectTaskCounts(state), [state]);
  const projects = state.projects.filter((p) => p.archived === (tab === "archived"));

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${state.projects.filter((p) => !p.archived).length} active · ${
          state.projects.filter((p) => p.archived).length
        } archived`}
      >
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus aria-hidden /> New project
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            <span className="text-muted-foreground ml-1.5 tabular-nums">
              {state.projects.filter((p) => p.archived).length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {projects.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {tab === "active" ? "No projects yet" : "Nothing archived"}
            </EmptyTitle>
            <EmptyDescription>
              {tab === "active"
                ? "Create a project to group related tasks and track progress toward an outcome."
                : "Archived projects will appear here."}
            </EmptyDescription>
          </EmptyHeader>
          {tab === "active" && (
            <EmptyContent>
              <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
                <Plus aria-hidden /> Create project
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              counts={counts[project.id] ?? { total: 0, completed: 0 }}
              onEdit={(p) => { setEditing(p); setDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />
    </>
  );
}

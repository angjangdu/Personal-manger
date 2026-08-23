"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
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
import { GoalCard } from "@/components/goals/goal-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useAppState } from "@/hooks/use-app-state";
import type { Goal } from "@/types";

export default function GoalsPage() {
  const state = useAppState();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>(undefined);

  const goals = state.goals.filter((g) => g.archived === (tab === "archived"));
  const activeCount = state.goals.filter((g) => !g.archived).length;
  const archivedCount = state.goals.length - activeCount;

  return (
    <>
      <PageHeader title="Goals" description={`${activeCount} active · ${archivedCount} archived`}>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus aria-hidden /> New goal
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            <span className="text-muted-foreground ml-1.5 tabular-nums">{archivedCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {goals.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Target aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {tab === "active" ? "No goals yet" : "Nothing archived"}
            </EmptyTitle>
            <EmptyDescription>
              {tab === "active"
                ? "Define an outcome worth working toward — projects and tasks roll up into it."
                : "Archived goals will appear here."}
            </EmptyDescription>
          </EmptyHeader>
          {tab === "active" && (
            <EmptyContent>
              <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
                <Plus aria-hidden /> Create goal
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => { setEditing(g); setDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      <GoalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
    </>
  );
}

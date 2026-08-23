"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, ArchiveRestore, BookOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SubjectFormDialog } from "@/components/study/subject-form-dialog";
import { LogSessionDialog } from "@/components/study/log-session-dialog";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { subjectStats } from "@/lib/study-utils";
import { formatMinutes } from "@/lib/date-utils";
import type { StudySubject } from "@/types";

export default function StudyPage() {
  const state = useAppState();
  const nowMs = useNow(60000);

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudySubject | undefined>(undefined);
  const [logOpen, setLogOpen] = useState(false);

  const subjects = state.studySubjects.filter(
    (s) => s.archived === (tab === "archived")
  );

  return (
    <>
      <PageHeader
        title="Study"
        description="Subjects → units → topics → sessions → revisions"
      >
        <Button variant="outline" onClick={() => setLogOpen(true)} disabled={state.studySubjects.length === 0}>
          Log session
        </Button>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus aria-hidden /> New subject
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            <span className="text-muted-foreground ml-1.5 tabular-nums">
              {state.studySubjects.filter((s) => s.archived).length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subjects.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{tab === "active" ? "No subjects yet" : "Nothing archived"}</EmptyTitle>
            <EmptyDescription>
              {tab === "active"
                ? "Add a course you're studying to organize its units, topics, and sessions."
                : "Archived subjects keep their history here."}
            </EmptyDescription>
          </EmptyHeader>
          {tab === "active" && (
            <EmptyContent>
              <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
                <Plus aria-hidden /> Create subject
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const stats = subjectStats(state, subject, nowMs);
            return (
              <div key={subject.id} className="group hover:bg-accent/40 relative rounded-xl border p-4 transition-colors">
                <div className="mb-3 flex items-start gap-2">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color ?? "var(--primary)" }}
                    aria-hidden
                  />
                  <Link href={`/study/${subject.id}`} className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{subject.name}</h3>
                    {stats.topics.length > 0 && (
                      <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                        {stats.units.length} units · {stats.topics.length} topics ·{" "}
                        {stats.learning} learning
                      </p>
                    )}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${subject.name}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(subject); setFormOpen(true); }}>
                        <Pencil aria-hidden /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          appStore.updateSubject(subject.id, { archived: !subject.archived });
                          toast(subject.archived ? "Subject restored" : "Subject archived");
                        }}
                      >
                        {subject.archived ? (
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
                          appStore.deleteSubject(subject.id);
                          toast("Subject deleted with its topics and sessions");
                        }}
                      >
                        <Trash2 aria-hidden /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Progress value={stats.progress} aria-label={`${subject.name} progress`} />

                <p className="text-muted-foreground mt-2.5 flex items-center justify-between text-xs tabular-nums">
                  <span>
                    {stats.mastered}/{stats.topics.length || 0} mastered ·{" "}
                    {formatMinutes(stats.totalMinutes)}
                  </span>
                  {stats.dueRevision.length > 0 ? (
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {stats.dueRevision.length} due revision
                    </span>
                  ) : null}
                </p>

                {!subject.archived && (
                  <Link
                    href={`/study/${subject.id}`}
                    className="absolute inset-0"
                    aria-label={`Open ${subject.name}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <SubjectFormDialog open={formOpen} onOpenChange={setFormOpen} subject={editing} />
      <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} />
    </>
  );
}

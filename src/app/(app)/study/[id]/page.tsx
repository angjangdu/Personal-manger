"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ListTree,
  Pencil,
  Plus,
  Repeat,
  Timer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { SubjectFormDialog } from "@/components/study/subject-form-dialog";
import { LogSessionDialog } from "@/components/study/log-session-dialog";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { subjectStats, unitProgress } from "@/lib/study-utils";
import { formatMinutes } from "@/lib/date-utils";
import type { StudyTopic, StudyTopicStatus } from "@/types";

const STATUS_META: Record<StudyTopicStatus, { label: string; className: string }> = {
  todo: { label: "To learn", className: "text-muted-foreground border-muted-foreground/30" },
  learning: { label: "Learning", className: "border-blue-500/50 text-blue-600 dark:text-blue-400" },
  mastered: { label: "Mastered", className: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" },
};

const STATUS_CYCLE: StudyTopicStatus[] = ["todo", "learning", "mastered"];

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const state = useAppState();
  const nowMs = useNow(60000);

  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logTopicId, setLogTopicId] = useState<string | undefined>(undefined);
  const [unitDraft, setUnitDraft] = useState("");
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});

  const subject = state.studySubjects.find((s) => s.id === params.id);

  const unitsWithTopics = useMemo(() => {
    if (!subject) return [];
    const topics = state.studyTopics.filter((t) => t.subjectId === subject.id);
    const units = topics.filter((t) => !t.parentId);
    return units.map((unit) => ({
      unit,
      topics: topics.filter((t) => t.parentId === unit.id),
    }));
  }, [state.studyTopics, subject]);

  if (!subject) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Subject not found</EmptyTitle>
          <EmptyDescription>It may have been deleted.</EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/study">
            <ArrowLeft aria-hidden /> All subjects
          </Link>
        </Button>
      </Empty>
    );
  }

  const stats = subjectStats(state, subject, nowMs);

  function startStudyTimer(topic?: StudyTopic) {
    if (!subject) return;
    const running = state.activities.find((a) => !a.endedAt);
    if (running) {
      toast("A session is already running", {
        description: "Stop it before starting a study timer.",
      });
      return;
    }
    const activity = appStore.startActivity({
      title: topic
        ? `${subject.name} · ${topic.name}`
        : `${subject.name}`,
      category: "study",
    });
    if (!activity) return;
    appStore.updateActivity(activity.id, {
      studySubjectId: subject.id,
      studyTopicId: topic?.id,
    });
    toast("Study timer started", {
      description: "A study session is recorded automatically when you stop.",
    });
  }

  function addUnit() {
    if (!subject || !unitDraft.trim()) return;
    appStore.addTopic({ subjectId: subject.id, name: unitDraft });
    setUnitDraft("");
    toast("Unit added");
  }

  function addTopicFor(unitId: string) {
    if (!subject) return;
    const name = (topicDrafts[unitId] ?? "").trim();
    if (!name) return;
    appStore.addTopic({ subjectId: subject.id, parentId: unitId, name });
    setTopicDrafts((prev) => ({ ...prev, [unitId]: "" }));
  }

  function cycleStatus(topic: StudyTopic) {
    const next =
      STATUS_CYCLE[(STATUS_CYCLE.indexOf(topic.status) + 1) % STATUS_CYCLE.length];
    appStore.updateTopicStatus(topic.id, next);
  }

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
          <Link href="/study">
            <ArrowLeft aria-hidden /> Subjects
          </Link>
        </Button>
      </div>

      <PageHeader title={subject.name} description={subject.description}>
        <Badge variant={subject.archived ? "secondary" : "outline"}>
          {subject.archived ? "Archived" : "Active"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil aria-hidden /> Edit
        </Button>
        <Button
          onClick={() => {
            setLogTopicId(undefined);
            setLogOpen(true);
          }}
        >
          Log session
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Mastery</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{stats.progress}%</p>
          <Progress value={stats.progress} className="mt-2" aria-label="Subject mastery" />
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ListTree className="size-3" aria-hidden /> Topics
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {stats.mastered}
            <span className="text-muted-foreground text-base">/{stats.topics.length}</span>
          </p>
          <p className="text-muted-foreground mt-2 text-xs">{stats.learning} in progress</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Timer className="size-3" aria-hidden /> Time invested
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMinutes(stats.totalMinutes)}</p>
          <p className="text-muted-foreground mt-2 text-xs tabular-nums">{stats.sessions.length} sessions</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Repeat className="size-3" aria-hidden /> Due revision
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{stats.dueRevision.length}</p>
          <p className="text-muted-foreground mt-2 truncate text-xs">
            {stats.dueRevision.length > 0
              ? stats.dueRevision.slice(0, 2).map((t) => t.name).join(", ") +
                (stats.dueRevision.length > 2 ? ` +${stats.dueRevision.length - 2}` : "")
              : "Nothing pending"}
          </p>
        </div>
      </div>

      {/* Units & topics */}
      {/* Syllabus progress (review §14) */}
      <section className="mb-8 rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Syllabus</h3>
          <Button size="sm" variant="secondary" onClick={() => startStudyTimer()}>
            Start study timer
          </Button>
        </div>
        <div className="space-y-2.5">
          {unitsWithTopics.map(({ unit, topics }) => (
            <div key={unit.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium">{unit.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {topics.filter((t) => t.status === "mastered").length}/{topics.length}
                </span>
              </div>
              <Progress value={unitProgress(topics, unit.id)} aria-label={`${unit.name} progress`} />
            </div>
          ))}
          {unitsWithTopics.length === 0 && (
            <p className="text-muted-foreground text-sm">Add units below to build your syllabus.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold">Units &amp; topics</h3>

        {unitsWithTopics.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListTree aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No units yet</EmptyTitle>
              <EmptyDescription>Add the first unit below to start structuring this subject.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {unitsWithTopics.map(({ unit, topics }) => (
              <div key={unit.id} className="rounded-xl border p-4">
                <div className="group/unit flex items-center gap-2">
                  <button type="button" onClick={() => cycleStatus(unit)} className="min-w-0 flex-1 text-left">
                    <span className="truncate text-sm font-semibold">{unit.name}</span>
                  </button>
                  <Badge variant="outline" className={STATUS_META[unit.status].className}>
                    {STATUS_META[unit.status].label}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${unit.name}`} className="opacity-0 transition-opacity group-hover/unit:opacity-100">
                        <X aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          appStore.deleteTopic(unit.id);
                          toast("Unit deleted with its topics");
                        }}
                      >
                        Delete unit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ul className="mt-2 space-y-1">
                  {topics.map((topic) => (
                    <li key={topic.id} className="group/topic flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                      <button
                        type="button"
                        onClick={() => cycleStatus(topic)}
                        aria-label={`Cycle status of ${topic.name}`}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                          borderColor:
                            topic.status === "mastered"
                              ? "#10b981"
                              : topic.status === "learning"
                                ? "#3b82f6"
                                : "var(--muted-foreground)",
                          backgroundColor:
                            topic.status === "mastered" ? "#10b981" : topic.status === "learning" ? "#3b82f6" : "transparent",
                        }}
                      >
                        {topic.status === "mastered" && <Check className="size-3 text-white" strokeWidth={3} aria-hidden />}
                      </button>
                      <span className="min-w-0 flex-1 truncate text-sm">{topic.name}</span>
                      {topic.lastRevisedAt && (
                        <span className="text-muted-foreground hidden shrink-0 text-[11px] tabular-nums sm:inline">
                          rev {new Date(topic.lastRevisedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover/topic:opacity-100 focus-visible:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          startStudyTimer(topic);
                        }}
                      >
                        Timer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover/topic:opacity-100 focus-visible:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogTopicId(topic.id);
                          setLogOpen(true);
                        }}
                      >
                        Revise
                      </Button>
                      <button
                        type="button"
                        aria-label={`Delete ${topic.name}`}
                        onClick={() => appStore.deleteTopic(topic.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover/topic:opacity-100"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Add topic…"
                    value={topicDrafts[unit.id] ?? ""}
                    onChange={(e) =>
                      setTopicDrafts((prev) => ({ ...prev, [unit.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTopicFor(unit.id);
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add a unit…"
            value={unitDraft}
            onChange={(e) => setUnitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUnit();
              }
            }}
            className="max-w-sm"
          />
          <Button variant="secondary" onClick={addUnit} disabled={!unitDraft.trim()}>
            <Plus aria-hidden /> Add unit
          </Button>
        </div>
      </section>

      {/* Sessions */}
      <section>
        <h3 className="mb-2 text-sm font-semibold">
          Sessions
          <span className="text-muted-foreground ml-2 font-normal tabular-nums">
            {formatMinutes(stats.totalMinutes)} total
          </span>
        </h3>
        {stats.sessions.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Timer aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No sessions logged</EmptyTitle>
              <EmptyDescription>Study and revision sessions will collect here.</EmptyDescription>
            </EmptyHeader>
            <Button size="sm" onClick={() => setLogOpen(true)}>
              <Plus aria-hidden /> Log first session
            </Button>
          </Empty>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {[...stats.sessions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 15)
              .map((session) => {
                const topic = state.studyTopics.find((t) => t.id === session.topicId);
                return (
                  <li key={session.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Badge variant="outline" className={session.type === "revision" ? "border-violet-500/50 text-violet-600 dark:text-violet-400" : "border-blue-500/50 text-blue-600 dark:text-blue-400"}>
                      {session.type === "revision" ? "Rev" : "Study"}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {topic?.name ?? session.notes ?? "Session"}
                    </span>
                    <span className="text-muted-foreground hidden w-24 shrink-0 text-right text-xs tabular-nums sm:inline">
                      {new Date(session.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatMinutes(session.durationMinutes)}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete session"
                      onClick={() => appStore.deleteSession(session.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <SubjectFormDialog open={editOpen} onOpenChange={setEditOpen} subject={subject} />
      <LogSessionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        defaultSubjectId={subject.id}
        defaultTopicId={logTopicId}
      />
    </>
  );
}

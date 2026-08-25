"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Eye,
  EyeOff,
  Flame,
  Lightbulb,
  MoveRight,
  Target,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarLabels } from "@/components/charts/bar-chart";
import { DonutChart, type DonutSlice } from "@/components/charts/donut-chart";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { buildReport, reasonLabel } from "@/lib/report-utils";
import { formatMinutes } from "@/lib/date-utils";

const DONUT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

type PeriodKey = "7" | "14" | "30";

const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: "7", label: "Weekly" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "Monthly" },
];

function ReportSection({
  id,
  title,
  description,
  hidden,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  hidden: Set<string>;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  if (hidden.has(id)) return null;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{description}</CardDescription>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Hide ${title}`}
          onClick={() => onToggle(id)}
        >
          <EyeOff aria-hidden />
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface SectionDef {
  id: string;
  label: string;
}

const SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview" },
  { id: "time", label: "Where time went" },
  { id: "planned", label: "Planned vs actual" },
  { id: "reschedules", label: "Rescheduling" },
  { id: "patterns", label: "Patterns" },
  { id: "reflections", label: "What worked / change" },
];

export default function ReportsPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const [period, setPeriod] = useState<PeriodKey>("7");

  const days = Number(period) as 7 | 14 | 30;
  const report = useMemo(() => buildReport(state, days, nowMs), [state, days, nowMs]);
  const hidden = useMemo(() => new Set(state.settings.hiddenReportSections ?? []), [state.settings.hiddenReportSections]);

  function toggleSection(id: string) {
    const next = hidden.has(id)
      ? [...hidden].filter((x) => x !== id)
      : [...hidden, id];
    appStore.updateSettings({ hiddenReportSections: next });
    toast(hidden.has(id) ? "Section shown" : "Section hidden");
  }

  const slices: DonutSlice[] = report.timeByProject.map((p, i) => ({
    label: p.label,
    value: p.minutes,
    color: p.color?.startsWith("#") ? p.color : DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const diff = report.actualMinutes - report.plannedMinutes;

  return (
    <>
      <PageHeader
        title="Reports"
        description="What did I plan? What did I actually do? Where did my time go?"
      >
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <TabsList>
            {PERIODS.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>

      {/* Customization row */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 inline-flex items-center gap-1 text-xs">
          <Eye className="size-3.5" aria-hidden /> Sections:
        </span>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => toggleSection(section.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              hidden.has(section.id)
                ? "text-muted-foreground hover:bg-accent border-dashed"
                : "border-primary/50 bg-primary/10 text-foreground"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportSection hidden={hidden} onToggle={toggleSection} id="overview" title="Overview" description={`${report.days} days ending today`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric icon={<CalendarCheck className="size-4" aria-hidden />} label="Tasks completed" value={String(report.tasksCompleted)} />
            <Metric icon={<Timer className="size-4" aria-hidden />} label="Focus time" value={formatMinutes(report.focusMinutes)} />
            <Metric icon={<Target className="size-4" aria-hidden />} label="Study time" value={formatMinutes(report.studyMinutes)} />
            <Metric icon={<Flame className="size-4" aria-hidden />} label="Sessions" value={String(report.sessionCount)} />
            <Metric
              icon={<Lightbulb className="size-4" aria-hidden />}
              label="Best day"
              value={report.bestDay ? `${report.bestDay.completions} done` : "—"}
              hint={report.bestDay?.label}
            />
            <Metric
              icon={<MoveRight className="size-4" aria-hidden />}
              label="Rescheduled"
              value={String(report.reschedules.total)}
            />
          </div>
          <div className="mt-4">
            <BarChart bars={report.byDay.map((d) => ({ label: d.label, value: d.completions }))} heightPx={80} />
            <BarLabels labels={report.byDay.map((d) => d.label)} every={Math.ceil(report.days / 7)} />
          </div>
        </ReportSection>

        <ReportSection hidden={hidden} onToggle={toggleSection} id="time" title="Where time went" description="Focus hours by project">
          {slices.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">No tracked time in this period.</p>
          ) : (
            <>
              <DonutChart
                slices={slices}
                centerLabel={formatMinutes(report.focusMinutes)}
                centerSublabel="tracked"
              />
              <ul className="mt-4 space-y-1 text-xs tabular-nums">
                {slices.slice(0, 6).map((slice) => (
                  <li key={slice.label} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
                      <span className="truncate">{slice.label}</span>
                    </span>
                    <span>{formatMinutes(slice.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ReportSection>

        <ReportSection hidden={hidden} onToggle={toggleSection} id="planned" title="Planned vs actual" description="Estimates on completed tasks vs tracked time">
          {report.plannedMinutes === 0 && report.actualMinutes === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No estimated tasks or tracked sessions to compare yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Planned</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{formatMinutes(report.plannedMinutes)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Actual</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{formatMinutes(report.actualMinutes)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Difference</p>
                  <p
                    className={`mt-1 text-lg font-bold tabular-nums ${
                      diff > 15 ? "text-orange-600 dark:text-orange-400" : diff < -15 ? "text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  >
                    {diff > 0 ? "+" : ""}
                    {formatMinutes(Math.abs(diff))}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {diff > 15
                  ? "Tasks are taking longer than estimated — consider padding estimates."
                  : diff < -15
                    ? "You're finishing faster than planned — estimates may be too generous."
                    : "Estimates are tracking reality well."}
              </p>
            </>
          )}
        </ReportSection>

        <ReportSection hidden={hidden} onToggle={toggleSection} id="reschedules" title="Rescheduling analysis" description="Why things moved">
          {report.reschedules.total === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No reschedules recorded — drag a calendar block with a reason to feed this report.
            </p>
          ) : (
            <>
              <p className="mb-3 text-2xl font-bold tabular-nums">{report.reschedules.total}</p>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(report.reschedules.byReason)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <li key={reason} className="flex items-center justify-between gap-2">
                      <span>{reasonLabel(reason)}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </li>
                  ))}
              </ul>
              {report.reschedules.recent.length > 0 && (
                <ul className="mt-4 space-y-1 border-t pt-3 text-xs">
                  {report.reschedules.recent.map((log) => (
                    <li key={log.id} className="text-muted-foreground flex items-center gap-2">
                      <MoveRight className="size-3 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{log.title}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </ReportSection>

        <ReportSection hidden={hidden} onToggle={toggleSection} id="patterns" title="Productivity patterns" description="Detected from your data">
          <ul className="space-y-3 text-sm">
            {report.peakWindow && (
              <li className="flex gap-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" aria-hidden />
                You usually complete tasks between{" "}
                <strong>
                  {fmtHour(report.peakWindow.from)} and {fmtHour(report.peakWindow.to)}
                </strong>{" "}
                — protect that window for hard work.
              </li>
            )}
            {report.bestDay && (
              <li className="flex gap-2">
                <Flame className="mt-0.5 size-4 shrink-0 text-orange-500" aria-hidden />
                Your best day was{" "}
                <strong>{report.bestDay.label}</strong> with {report.bestDay.completions} completions.
              </li>
            )}
            {report.studyMinutes > 0 && (
              <li className="flex gap-2">
                <Timer className="mt-0.5 size-4 shrink-0 text-violet-500" aria-hidden />
                You logged <strong>{formatMinutes(report.studyMinutes)}</strong> of study this period.
              </li>
            )}
            {!report.peakWindow && !report.bestDay && (
              <li className="text-muted-foreground">Complete a few more tasks to unlock patterns.</li>
            )}
          </ul>
        </ReportSection>

        <ReportSection hidden={hidden} onToggle={toggleSection} id="reflections" title="What worked / what to change" description="From your daily reviews">
          {report.reviews.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No reviews in this period — write some on the Review page.
            </p>
          ) : (
            <ul className="space-y-3">
              {report.reviews.slice(0, 4).map((review) => (
                <li key={review.id} className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground mb-1.5 text-xs">
                    {new Date(review.date).toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  {review.wentWell && (
                    <p className="truncate">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Worked:</span> {review.wentWell}
                    </p>
                  )}
                  {review.toImprove && (
                    <p className="truncate">
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">Change:</span> {review.toImprove}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ReportSection>
      </div>

      {SECTIONS.every((s) => hidden.has(s.id)) && (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          All sections hidden — click a section chip above to bring them back.
        </div>
      )}
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground truncate text-[11px]">{hint}</p>}
    </div>
  );
}

function fmtHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

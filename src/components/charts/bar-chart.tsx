import { cn } from "@/lib/utils";

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  bars: Bar[];
  heightPx?: number;
  /** Formats values inside hover titles. */
  formatValue?: (value: number) => string;
  className?: string;
}

/** Dependency-free CSS bar chart. Bars scale to the max value. */
export function BarChart({ bars, heightPx = 120, formatValue, className }: BarChartProps) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className={cn("flex items-end gap-1", className)} style={{ height: heightPx }}>
      {bars.map((bar, i) => (
        <div key={`${bar.label}-${i}`} className="group relative flex h-full flex-1 flex-col justify-end">
          <div
            role="img"
            aria-label={`${bar.label}: ${formatValue ? formatValue(bar.value) : bar.value}`}
            title={formatValue ? `${bar.label}: ${formatValue(bar.value)}` : undefined}
            className={cn(
              "w-full rounded-t-sm transition-colors",
              bar.value > 0 ? "bg-primary/60 group-hover:bg-primary" : "bg-muted",
              (bar.highlight || i === bars.length - 1) && bar.value > 0 && "bg-primary"
            )}
            style={{ height: `${Math.max(2, (bar.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/** Sparse x-axis labels under a chart (shows every nth). */
export function BarLabels({
  labels,
  every = 1,
}: {
  labels: string[];
  every?: number;
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {labels.map((label, i) => (
        <span
          key={`${label}-${i}`}
          className={cn(
            "text-muted-foreground flex-1 text-center text-[9px] tabular-nums",
            i % every !== 0 && "invisible"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

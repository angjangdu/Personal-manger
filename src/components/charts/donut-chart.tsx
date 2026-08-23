import { cn } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  sizePx?: number;
  centerLabel?: string;
  centerSublabel?: string;
  className?: string;
}

const R = 15.9155; // circumference = 100

/** Dependency-free SVG donut with legend. */
export function DonutChart({
  slices,
  sizePx = 160,
  centerLabel,
  centerSublabel,
  className,
}: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 25; // start at 12 o'clock

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: sizePx, height: sizePx }}>
        <svg viewBox="0 0 42 42" className="size-full -rotate-90">
          <circle cx="21" cy="21" r={R} fill="none" strokeWidth="4" className="stroke-muted" />
          {total > 0 &&
            slices.map((slice) => {
              if (slice.value <= 0) return null;
              const pct = (slice.value / total) * 100;
              const dash = `${pct} ${100 - pct}`;
              const el = (
                <circle
                  key={slice.label}
                  cx="21"
                  cy="21"
                  r={R}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="4"
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                >
                  <title>{`${slice.label}: ${Math.round(pct)}%`}</title>
                </circle>
              );
              offset -= pct;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold tabular-nums">{centerLabel}</span>
          {centerSublabel && (
            <span className="text-muted-foreground text-[10px]">{centerSublabel}</span>
          )}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
        {slices.length === 0 && (
          <li className="text-muted-foreground">No data in range.</li>
        )}
      </ul>
    </div>
  );
}

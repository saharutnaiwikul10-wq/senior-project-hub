import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types";

const FILL_CLASSES: Record<StatusTone, string> = {
  draft: "bg-draft",
  warning: "bg-warning",
  progress: "bg-progress",
  info: "bg-info",
  success: "bg-success",
  destructive: "bg-destructive",
};

interface ProgressBarProps {
  /** Percentage from 0 to 100. */
  value: number;
  tone?: StatusTone;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/** Token-colored progress bar with an animated fill and tabular percent label. */
export function ProgressBar({
  value,
  tone = "progress",
  className,
  showLabel = true,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        tabIndex={0}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "ความคืบหน้า"}
      >
        <div
          className={cn(
            "h-full origin-left rounded-full animate-progress-grow",
            FILL_CLASSES[tone],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <span className="tabular w-10 shrink-0 text-right text-xs font-semibold text-muted-foreground">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}

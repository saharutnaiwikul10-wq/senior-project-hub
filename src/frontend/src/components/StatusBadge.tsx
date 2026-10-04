import { cn } from "@/lib/utils";
import type { StatusTone } from "@/types";

const TONE_CLASSES: Record<StatusTone, string> = {
  draft: "bg-draft/15 text-draft border-draft/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  progress: "bg-progress/15 text-progress border-progress/30",
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  draft: "bg-draft",
  warning: "bg-warning",
  progress: "bg-progress",
  info: "bg-info",
  success: "bg-success",
  destructive: "bg-destructive",
};

interface StatusBadgeProps {
  label: string;
  labelEn?: string;
  tone: StatusTone;
  className?: string;
  /** Renders the seal-style brass ring treatment for hero status stamps. */
  seal?: boolean;
}

/**
 * Seal-style status badge: a token-colored pill with a leading dot and an
 * optional Latin gloss, echoing a stamped academic dossier.
 */
export function StatusBadge({
  label,
  labelEn,
  tone,
  className,
  seal = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone],
        seal && "ring-1 ring-accent/40 ring-offset-1 ring-offset-card",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])}
      />
      <span>{label}</span>
      {labelEn ? (
        <span className="font-body text-[10px] font-normal uppercase tracking-wider opacity-70">
          {labelEn}
        </span>
      ) : null}
    </span>
  );
}

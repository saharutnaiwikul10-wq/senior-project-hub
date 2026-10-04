import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  className?: string;
}

const SKELETON_IDS = Array.from({ length: 6 }, (_, i) => `loading-row-${i}`);

/** Layout-matched skeleton block for data-dense views. */
export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {SKELETON_IDS.slice(0, rows).map((id) => (
        <div
          key={id}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

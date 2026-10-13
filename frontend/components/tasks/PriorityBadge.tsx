import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";
import { PRIORITY_LABELS } from "@/types/task";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const PRIORITY_STYLES: Record<TaskPriority, { text: string; dot: string }> = {
  low: {
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  medium: {
    text: "text-amber-800",
    dot: "bg-amber-600",
  },
  high: {
    text: "text-rose-800",
    dot: "bg-rose-600",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100",
        style.text,
        className
      )}
      aria-label={`Priority: ${PRIORITY_LABELS[priority]}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

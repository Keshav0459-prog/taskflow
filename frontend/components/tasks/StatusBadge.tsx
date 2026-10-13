import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/task";
import { STATUS_LABELS } from "@/types/task";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-300",
  in_progress: "bg-slate-200 text-slate-900 border-slate-400 font-semibold",
  completed: "bg-slate-800 text-white border-slate-800 font-semibold",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

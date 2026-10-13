"use client";

import { IconCalendar, IconCheck } from "@/components/icons";
import type { Task } from "@/types/task";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { UserAvatar } from "@/components/users/UserAvatar";
import { formatDate, isOverdue, timeAgo, cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left bg-[#fafafc] rounded border border-slate-300 p-3 hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
      aria-label={`Task: ${task.title}`}
    >
      {/* Title */}
      <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-normal">
          {task.description}
        </p>
      )}

      {/* Priority + Status */}
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>

      {/* Footer: creator + due date */}
      <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-200">
        {task.creator ? (
          <div className="flex items-center gap-1.5" title={`Created by ${task.creator.name}`}>
            <UserAvatar user={task.creator} size="sm" />
            <span className="text-[11px] text-slate-600 truncate max-w-[110px]">
              {task.creator.name}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">TaskFlow</span>
        )}

        {task.status === "completed" && (task.completed_at || task.updated_at) ? (
          <span
            className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium"
            title={`Completed: ${formatDate(task.completed_at || task.updated_at)}`}
          >
            <IconCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            Done {timeAgo(task.completed_at || task.updated_at)}
          </span>
        ) : task.due_date ? (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px]",
              overdue ? "text-rose-700 font-semibold" : "text-slate-500"
            )}
            aria-label={`Due: ${formatDate(task.due_date)}${overdue ? " (overdue)" : ""}`}
          >
            <IconCalendar className="w-3 h-3 text-slate-500" aria-hidden="true" />
            {formatDate(task.due_date)}
          </span>
        ) : null}
      </div>
    </button>
  );
}

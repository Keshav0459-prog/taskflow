import type { Task, TaskStatus } from "@/types/task";
import { STATUS_LABELS } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  loading?: boolean;
  onTaskClick: (task: Task) => void;
  timeframeLabel?: string;
}

const COLUMN_ACCENTS: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-600",
  completed: "bg-emerald-600",
};

export function TaskColumn({ status, tasks, loading, onTaskClick, timeframeLabel }: TaskColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] flex-1 max-w-sm">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${COLUMN_ACCENTS[status]}`} aria-hidden="true" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {STATUS_LABELS[status]}
        </h2>
        {status === "completed" && timeframeLabel && (
          <span className="text-[10px] text-slate-500 font-medium">
            ({timeframeLabel})
          </span>
        )}
        <span className="ml-auto text-xs text-slate-600 font-bold bg-slate-200/80 px-2 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex flex-col gap-2 bg-[#eaecee] rounded-md p-2 min-h-[140px] border border-slate-300">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500 font-medium">
            Loading column...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-2">
            <p className="text-xs text-slate-500 font-medium">
              {status === "completed" && timeframeLabel
                ? `No tasks completed in ${timeframeLabel.toLowerCase()}`
                : `No ${STATUS_LABELS[status].toLowerCase()} tasks`}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  );
}

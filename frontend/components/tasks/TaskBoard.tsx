"use client";

import { useMemo, useState } from "react";
import { IconSearch, IconPlus, IconTasks } from "@/components/icons";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";
import { TaskColumn } from "./TaskColumn";
import { TaskModal } from "./TaskModal";
import { TaskDrawer } from "./TaskDrawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateTaskPayload, UpdateTaskPayload } from "@/types/task";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/types/task";

interface TaskBoardProps {
  tasks: Task[];
  loading: boolean;
  currentUserId: string;
  onCreateTask: (data: CreateTaskPayload) => Promise<Task>;
  onUpdateTask: (id: string, data: UpdateTaskPayload) => Promise<Task>;
  onCompleteTask: (id: string) => Promise<Task>;
  onDeleteTask: (id: string) => Promise<void>;
}

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "completed"];

function isWithinDays(dateStr: string | null | undefined, days: number): boolean {
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return false;
  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function TaskBoard({
  tasks,
  loading,
  currentUserId,
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onDeleteTask,
}: TaskBoardProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("me");
  const [completedWindow, setCompletedWindow] = useState<string>("14");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Extract unique assignees from tasks for the assignee filter
  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      if (t.assignee && t.assignee.id !== currentUserId) {
        map.set(t.assignee.id, t.assignee.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks, currentUserId]);

  // Filter tasks by assignee, search query, status, priority, and completion timeframe
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Assignee filter: defaults to "me" (My Tasks)
      if (filterAssignee === "me") {
        if (task.assigned_to !== currentUserId) return false;
      } else if (filterAssignee !== "all") {
        if (task.assigned_to !== filterAssignee) return false;
      }

      // Status filter
      if (filterStatus !== "all" && task.status !== filterStatus) return false;

      // Priority filter
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;

      // Search query
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      if (!matchesSearch) return false;

      // Completed / previous tasks timeframe window (using real timestamps)
      if (task.status === "completed" && completedWindow !== "all") {
        const days = parseInt(completedWindow, 10);
        const refDate = task.completed_at || task.updated_at || task.created_at;
        return isWithinDays(refDate, days);
      }

      return true;
    });
  }, [tasks, search, filterStatus, filterPriority, filterAssignee, completedWindow, currentUserId]);

  const activeColumns = useMemo(() => {
    if (filterStatus === "all") return COLUMNS;
    return [filterStatus];
  }, [filterStatus]);

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce((acc, status) => {
      acc[status] = filteredTasks.filter((t) => t.status === status);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [filteredTasks]);

  // When a task is updated, sync the selected task if it's the one being viewed
  const handleUpdate = async (id: string, data: UpdateTaskPayload) => {
    const updated = await onUpdateTask(id, data);
    if (selectedTask?.id === id) setSelectedTask(updated);
    return updated;
  };

  const handleComplete = async (id: string) => {
    const completed = await onCompleteTask(id);
    if (selectedTask?.id === id) setSelectedTask(completed);
    return completed;
  };

  const hasNoTasksAtAll = !loading && tasks.length === 0;
  const hasNoMatchingFiltered = !loading && tasks.length > 0 && filteredTasks.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 bg-[#fafafc] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700 text-slate-800"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus((v as TaskStatus) || "all")}
        >
          <SelectTrigger className="w-28 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded border border-slate-300">
            <SelectItem value="all">All Statuses</SelectItem>
            {(["todo", "in_progress", "completed"] as TaskStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filterPriority}
          onValueChange={(v) => setFilterPriority((v as TaskPriority) || "all")}
        >
          <SelectTrigger className="w-28 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="rounded border border-slate-300">
            <SelectItem value="all">All Priorities</SelectItem>
            {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={filterAssignee}
          onValueChange={(v) => setFilterAssignee(v || "me")}
        >
          <SelectTrigger className="w-32 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter by assignee">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent className="rounded border border-slate-300">
            <SelectItem value="me">Assigned to Me</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
            {uniqueAssignees.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Previous Tasks Timeframe Window */}
        <Select
          value={completedWindow}
          onValueChange={(val) => setCompletedWindow(val || "14")}
        >
          <SelectTrigger className="w-36 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter completed tasks by timeframe">
            <SelectValue placeholder="Completed Timeframe" />
          </SelectTrigger>
          <SelectContent className="rounded border border-slate-300">
            <SelectItem value="14">Done: Past 14 days</SelectItem>
            <SelectItem value="20">Done: Past 20 days</SelectItem>
            <SelectItem value="30">Done: Past 30 days</SelectItem>
            <SelectItem value="all">Done: All Past Tasks</SelectItem>
          </SelectContent>
        </Select>

        {/* Create button */}
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs px-3 h-8"
        >
          <IconPlus className="w-3.5 h-3.5 mr-1" />
          Create Task
        </Button>
      </div>

      {/* Main Content Area: Kanban columns or dedicated Empty State */}
      {hasNoTasksAtAll ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto">
          <div className="w-10 h-10 rounded border border-slate-300 bg-slate-100 flex items-center justify-center mb-3 text-slate-700">
            <IconTasks className="w-5 h-5 text-slate-700" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
            There are no active or previous tasks yet. Create your first task to start organizing your work.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs px-3.5 h-8"
          >
            <IconPlus className="w-3.5 h-3.5 mr-1.5" />
            Create First Task
          </Button>
        </div>
      ) : hasNoMatchingFiltered ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto">
          <div className="w-10 h-10 rounded border border-slate-300 bg-slate-100 flex items-center justify-center mb-3 text-slate-700">
            <IconSearch className="w-5 h-5 text-slate-700" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No matching tasks</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
            No tasks match your current search, status, priority, or assignee filter.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterPriority("all");
              setFilterAssignee("me");
              setCompletedWindow("all");
            }}
            className="text-xs font-semibold rounded px-3 h-8 border-slate-300 bg-white hover:bg-slate-100 text-slate-800"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Kanban columns: horizontally scrollable on mobile */
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {activeColumns.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] || []}
              loading={loading}
              onTaskClick={setSelectedTask}
              timeframeLabel={
                status === "completed" && completedWindow !== "all"
                  ? `Past ${completedWindow} days`
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Create task modal */}
      <TaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => { await onCreateTask(data); }}
      />

      {/* Task detail drawer */}
      <TaskDrawer
        task={selectedTask}
        currentUserId={currentUserId}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdate}
        onComplete={handleComplete}
        onDelete={onDeleteTask}
      />
    </div>
  );
}

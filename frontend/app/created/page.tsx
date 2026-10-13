"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useHydrated } from "@/hooks/useHydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { UserAvatar } from "@/components/users/UserAvatar";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSearch, IconPlus, IconCreated } from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus, UpdateTaskPayload } from "@/types/task";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/types/task";

export default function CreatedByMePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHydrated();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { tasks, loading, createTask, updateTask, completeTask, deleteTask } = useTasks();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  // Tasks created by the currently authenticated user
  const createdTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => t.created_by === user.id);
  }, [tasks, user]);

  const filteredTasks = useMemo(() => {
    return createdTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === "all" || task.status === filterStatus;
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [createdTasks, search, filterStatus, filterPriority]);

  const handleUpdate = async (id: string, data: UpdateTaskPayload) => {
    const updated = await updateTask(id, data);
    if (selectedTask?.id === id) setSelectedTask(updated);
    return updated;
  };

  const handleComplete = async (id: string) => {
    const completed = await completeTask(id);
    if (selectedTask?.id === id) setSelectedTask(completed);
    return completed;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Created by Me" />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Created by Me</h1>
              <p className="mt-1 text-xs text-slate-600">
                Tasks you assigned to yourself or teammates.
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs px-3 h-8 self-start sm:self-auto"
            >
              <IconPlus className="w-3.5 h-3.5 mr-1" />
              Create Task
            </Button>
          </div>

          {!mounted || authLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-medium text-slate-600">Verifying session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto max-w-md mx-auto">
              <h2 className="text-sm font-semibold text-slate-900">Authentication Required</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Please log in to view tasks you created.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search created tasks..."
                    aria-label="Search created tasks"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 bg-[#fafafc] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700 text-slate-800"
                  />
                </div>

                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}
                >
                  <SelectTrigger className="w-32 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter by status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded border border-slate-300">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(["todo", "in_progress", "completed"] as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterPriority}
                  onValueChange={(v) => setFilterPriority(v as TaskPriority | "all")}
                >
                  <SelectTrigger className="w-32 text-xs bg-[#fafafc] border-slate-300 rounded" aria-label="Filter by priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded border border-slate-300">
                    <SelectItem value="all">All Priorities</SelectItem>
                    {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task table / list */}
              {loading ? (
                <div className="bg-[#fafafc] rounded-md border border-slate-300 p-8 text-center text-xs text-slate-500">
                  Loading created tasks...
                </div>
              ) : createdTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center">
                  <div className="w-10 h-10 rounded border border-slate-300 bg-slate-100 flex items-center justify-center mb-3 text-slate-700">
                    <IconCreated className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No tasks created yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                    You haven&apos;t assigned any tasks yet. Create a task to delegate work to your teammates.
                  </p>
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs px-3.5 h-8"
                  >
                    <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                    Create Task
                  </Button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="bg-[#fafafc] rounded-md border border-slate-300 p-8 text-center text-xs text-slate-500">
                  No created tasks match your current filters.
                </div>
              ) : (
                <div className="bg-[#fafafc] rounded-md border border-slate-300 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          <th className="py-2.5 px-4">Task</th>
                          <th className="py-2.5 px-4">Assigned To</th>
                          <th className="py-2.5 px-4">Priority</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredTasks.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="hover:bg-slate-100/70 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900 truncate max-w-xs">{task.title}</p>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{task.description}</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {task.assignee ? (
                                <div className="flex items-center gap-2">
                                  <UserAvatar user={task.assignee} size="sm" />
                                  <span className="font-medium text-slate-800">{task.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <PriorityBadge priority={task.priority} />
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={task.status} />
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {formatDate(task.due_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <TaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => { await createTask(data); }}
      />

      <TaskDrawer
        task={selectedTask}
        currentUserId={user?.id || ""}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdate}
        onComplete={handleComplete}
        onDelete={deleteTask}
      />
    </div>
  );
}

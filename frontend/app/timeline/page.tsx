"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { useTasks } from "@/hooks/useTasks";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { STATUS_LABELS, getTaskProject } from "@/types/task";
import type { Task } from "@/types/task";

const DAY = 86_400_000;
const toDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`);
const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());
const addDays = (value: Date, amount: number) =>
  new Date(value.getTime() + amount * DAY);
const format = (value: Date, options: Intl.DateTimeFormatOptions) =>
  value.toLocaleDateString(undefined, options);

function TimelineRow({
  task,
  start,
  span,
}: {
  task: Task;
  start: Date;
  span: number;
}) {
  const begin = task.created_at ? toDate(task.created_at) : start;
  const finish = task.due_date ? toDate(task.due_date) : addDays(begin, 7);
  const left = Math.max(
    0,
    ((begin.getTime() - start.getTime()) / DAY / span) * 100
  );
  const right = Math.min(
    100,
    ((finish.getTime() - start.getTime()) / DAY / span) * 100
  );
  const width = Math.max(2, right - left);
  const color =
    task.status === "completed"
      ? "bg-emerald-500"
      : task.status === "in_progress"
      ? "bg-indigo-500"
      : "bg-slate-400";

  return (
    <div className="grid min-w-[760px] grid-cols-[280px_1fr] border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <div className="px-4 py-3">
        <p className="truncate text-xs font-semibold text-slate-900">
          {task.title}
        </p>
        <p className="mt-1 truncate text-[10px] text-slate-500">
          {task.assignee?.name || "Unassigned"} ·{" "}
          <span
            className={
              task.status === "completed"
                ? "text-emerald-600 font-medium"
                : task.status === "in_progress"
                ? "text-indigo-600 font-medium"
                : "text-slate-500"
            }
          >
            {STATUS_LABELS[task.status]}
          </span>
          {task.due_date && (
            <span className="ml-1 text-slate-400">
              · Due {format(toDate(task.due_date), { month: "short", day: "numeric" })}
            </span>
          )}
        </p>
      </div>
      <div
        className="relative my-3 mr-4 h-9 rounded bg-slate-50"
        aria-label={`${task.title}: ${format(begin, {
          month: "short",
          day: "numeric",
        })} to ${format(finish, { month: "short", day: "numeric" })}`}
      >
        <div
          className={`absolute top-2 h-5 rounded shadow-sm ${color} transition-all`}
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`${task.title} (${format(begin, {
            month: "short",
            day: "numeric",
          })} – ${format(finish, { month: "short", day: "numeric" })})`}
        />
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("All Projects");
  const mounted = useHydrated();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { tasks, loading } = useTasks();

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.push("/login");
  }, [mounted, authLoading, isAuthenticated, router]);

  // Distinct projects
  const projects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(getTaskProject(t)));
    return Array.from(set).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (selectedProject === "All Projects") return tasks;
    return tasks.filter((t) => getTaskProject(t) === selectedProject);
  }, [tasks, selectedProject]);

  // Grouped tasks by project
  const tasksByProject = useMemo(() => {
    const groups = new Map<string, Task[]>();
    filteredTasks.forEach((t) => {
      const p = getTaskProject(t);
      const list = groups.get(p) ?? [];
      list.push(t);
      groups.set(p, list);
    });
    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items: items.sort((a, b) =>
        (a.due_date || "9999").localeCompare(b.due_date || "9999")
      ),
      completed: items.filter((i) => i.status === "completed").length,
    }));
  }, [filteredTasks]);

  // Calculate timeline date range
  const range = useMemo(() => {
    const today = startOfDay(new Date());
    const dated = filteredTasks.flatMap((task) =>
      [task.created_at, task.due_date]
        .filter(Boolean)
        .map((value) => toDate(value as string).getTime())
    );
    const from = dated.length
      ? new Date(Math.min(today.getTime(), ...dated))
      : addDays(today, -7);
    const to = dated.length
      ? new Date(Math.max(addDays(today, 30).getTime(), ...dated))
      : addDays(today, 30);
    const start = startOfDay(from);
    const end = startOfDay(to);
    return {
      start,
      span: Math.max(30, Math.ceil((end.getTime() - start.getTime()) / DAY)),
    };
  }, [filteredTasks]);

  const ticks = Array.from(
    { length: Math.ceil(range.span / 7) + 1 },
    (_, index) => addDays(range.start, index * 7)
  ).filter(
    (date) => date.getTime() <= range.start.getTime() + range.span * DAY
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Project Timeline"
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {/* Header & Filter */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Project Timeline
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Keep track of task dates, deadlines, and team schedules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="timeline-project-filter"
                className="text-xs font-medium text-slate-500 whitespace-nowrap"
              >
                Project:
              </label>
              <select
                id="timeline-project-filter"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All Projects">
                  All Projects ({tasks.length} tasks)
                </option>
                {projects.map((p) => {
                  const count = tasks.filter(
                    (t) => getTaskProject(t) === p
                  ).length;
                  return (
                    <option key={p} value={p}>
                      {p} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {!mounted || authLoading || loading ? (
            <div className="rounded border border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
              Loading project timeline…
            </div>
          ) : !isAuthenticated ? (
            <div className="rounded border border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
              Sign in to view the project timeline.
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded border border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
              No tasks found for this project filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-300 bg-white shadow-sm">
              {/* Header dates row */}
              <div className="grid min-w-[760px] grid-cols-[280px_1fr] border-b border-slate-200 bg-slate-50">
                <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Task / Assignee
                </div>
                <div className="mr-4 grid grid-flow-col auto-cols-fr">
                  {ticks.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="border-l border-slate-200 px-1 py-3 text-[10px] font-medium text-slate-500"
                    >
                      {format(date, { month: "short", day: "numeric" })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grouped project rows */}
              {tasksByProject.map((group) => {
                const percent = Math.round(
                  (group.completed / group.items.length) * 100
                );
                return (
                  <div key={group.name} className="border-b border-slate-200 last:border-0">
                    {/* Project Header Row */}
                    <div className="bg-slate-100/70 px-4 py-2 flex items-center justify-between border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          📁 {group.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {group.items.length} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {group.completed} of {group.items.length} done
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {/* Tasks in this project */}
                    {group.items.map((task) => (
                      <TimelineRow
                        key={task.id}
                        task={task}
                        start={range.start}
                        span={range.span}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500 items-center">
            <span className="font-semibold text-slate-600">Status:</span>
            <span className="flex items-center">
              <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-slate-400" />
              To do
            </span>
            <span className="flex items-center">
              <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-indigo-500" />
              In progress
            </span>
            <span className="flex items-center">
              <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-emerald-500" />
              Completed
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

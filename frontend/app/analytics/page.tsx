"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useHydrated } from "@/hooks/useHydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getTaskProject } from "@/types/task";
import type { Task } from "@/types/task";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ── Colour Palette ──────────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#6366f1",
  completed: "#10b981",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#fafafc] rounded-md border border-slate-200 p-4 flex flex-col gap-1 transition-all hover:border-slate-300">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className="text-2xl lg:text-3xl font-bold text-slate-900"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    </div>
  );
}

/* ── Mini Gantt SVG ─────────────────────────────────────────── */
const DAY_MS = 86_400_000;
const toMs = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`).getTime();

function MiniGantt({ tasks }: { tasks: Task[] }) {
  const datedTasks = tasks.filter((t) => t.due_date);
  if (datedTasks.length === 0)
    return (
      <p className="text-xs text-slate-400 text-center py-8">
        No project tasks with due dates in this view.
      </p>
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const allMs = datedTasks.flatMap((t) => [
    toMs(t.created_at),
    toMs(t.due_date!),
  ]);
  const minMs = Math.min(todayMs - 7 * DAY_MS, ...allMs);
  const maxMs = Math.max(todayMs + 14 * DAY_MS, ...allMs);
  const span = Math.max(DAY_MS * 10, maxMs - minMs);

  const pct = (ms: number) =>
    `${Math.max(0, Math.min(100, ((ms - minMs) / span) * 100)).toFixed(2)}%`;
  const todayPct = pct(todayMs);
  const ROW_H = 38;
  const svgH = datedTasks.length * ROW_H + 28;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" height={svgH} style={{ minWidth: 600 }}>
        <line
          x1={todayPct}
          y1="0"
          x2={todayPct}
          y2={svgH}
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={todayPct}
          y="11"
          fontSize="9"
          fill="#6366f1"
          textAnchor="middle"
          fontWeight="600"
        >
          Today
        </text>
        {datedTasks.map((task, i) => {
          const startMs = toMs(task.created_at);
          const endMs = toMs(task.due_date!);
          const left = pct(startMs);
          const width = `${Math.max(2, ((endMs - startMs) / span) * 100).toFixed(2)}%`;
          const y = 28 + i * ROW_H;
          const color =
            task.status === "completed"
              ? "#10b981"
              : task.status === "in_progress"
              ? "#6366f1"
              : "#94a3b8";
          const proj = getTaskProject(task);
          return (
            <g key={task.id || i}>
              <text
                x={left}
                y={y + 3}
                fontSize="9.5"
                fill="#475569"
                fontWeight="500"
              >
                [{proj}] {task.title.length > 36 ? task.title.slice(0, 36) + "…" : task.title}
              </text>
              <rect
                x={left}
                y={y + 8}
                width={width}
                height={18}
                rx="4"
                fill={color}
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function AnalyticsPage() {
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

  // Filtered tasks by selected project
  const filteredTasks = useMemo(() => {
    if (selectedProject === "All Projects") return tasks;
    return tasks.filter((t) => getTaskProject(t) === selectedProject);
  }, [tasks, selectedProject]);

  const total = filteredTasks.length;

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { todo: 0, in_progress: 0, completed: 0 };
    filteredTasks.forEach((t) => {
      map[t.status] = (map[t.status] || 0) + 1;
    });
    return Object.entries(map).map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      value,
      color: STATUS_COLORS[key] ?? "#94a3b8",
    }));
  }, [filteredTasks]);

  const byPriority = useMemo(() => {
    const map: Record<string, number> = { low: 0, medium: 0, high: 0 };
    filteredTasks.forEach((t) => {
      map[t.priority] = (map[t.priority] || 0) + 1;
    });
    return Object.entries(map).map(([key, value]) => ({
      name: PRIORITY_LABELS[key] ?? key,
      value,
      color: PRIORITY_COLORS[key] ?? "#94a3b8",
    }));
  }, [filteredTasks]);

  const completedCount = byStatus.find((s) => s.name === "Completed")?.value ?? 0;
  const completionRate = total ? Math.round((completedCount / total) * 100) : 0;
  const openTasks =
    (byStatus.find((s) => s.name === "Todo")?.value ?? 0) +
    (byStatus.find((s) => s.name === "In Progress")?.value ?? 0);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredTasks.filter(
      (t) =>
        t.due_date &&
        t.status !== "completed" &&
        new Date(t.due_date).getTime() < today.getTime()
    ).length;
  }, [filteredTasks]);

  // Project cards breakdown
  const projectStats = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; inProgress: number; todo: number }
    >();
    tasks.forEach((t) => {
      const proj = getTaskProject(t);
      const cur = map.get(proj) ?? { total: 0, done: 0, inProgress: 0, todo: 0 };
      cur.total += 1;
      if (t.status === "completed") cur.done += 1;
      else if (t.status === "in_progress") cur.inProgress += 1;
      else cur.todo += 1;
      map.set(proj, cur);
    });
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats,
      percent: stats.total ? Math.round((stats.done / stats.total) * 100) : 0,
    }));
  }, [tasks]);

  // Team Workload
  const workloadData = useMemo(() => {
    const map = new Map<string, { open: number; done: number }>();
    filteredTasks.forEach((t) => {
      const name = t.assignee?.name ?? "Unassigned";
      const cur = map.get(name) ?? { open: 0, done: 0 };
      if (t.status === "completed") cur.done += 1;
      else cur.open += 1;
      map.set(name, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name: name.split(" ")[0], ...v }))
      .sort((a, b) => b.open + b.done - (a.open + a.done))
      .slice(0, 6);
  }, [filteredTasks]);

  const isLoading = !mounted || authLoading || loading;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Project Analytics" />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Project Analytics
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Track task progress, team workload, and project timelines.
              </p>
            </div>

            {/* Project Filter Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="project-filter" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                Project:
              </label>
              <select
                id="project-filter"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All Projects">All Projects ({tasks.length})</option>
                {projects.map((p) => {
                  const count = tasks.filter((t) => getTaskProject(t) === p).length;
                  return (
                    <option key={p} value={p}>
                      {p} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Loading project analytics…</p>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <p className="text-xs text-slate-500">Please log in to view analytics.</p>
          ) : (
            <div className="space-y-6">
              {/* Project Portfolio Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {projectStats.map((p) => {
                  const isSelected = selectedProject === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() =>
                        setSelectedProject(isSelected ? "All Projects" : p.name)
                      }
                      className={`text-left rounded-md border p-4 transition-all bg-white ${
                        isSelected
                          ? "border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {p.percent}% done
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${p.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{p.done} completed</span>
                        <span>{p.inProgress} in progress</span>
                        <span>{p.todo} to do</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* KPI Cards for active view */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Total Tasks"
                  value={total}
                  sub={selectedProject === "All Projects" ? "All projects" : selectedProject}
                />
                <StatCard
                  label="Completed"
                  value={`${completionRate}%`}
                  sub={`${completedCount} tasks done`}
                  color="#10b981"
                />
                <StatCard
                  label="In Progress"
                  value={openTasks}
                  sub="Active to-dos"
                  color="#6366f1"
                />
                <StatCard
                  label="Overdue"
                  value={overdueTasks}
                  sub={overdueTasks > 0 ? "Past due date" : "All on schedule"}
                  color={overdueTasks > 0 ? "#ef4444" : "#10b981"}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donut – Status */}
                <div className="bg-[#fafafc] rounded-md border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Tasks by Status
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {selectedProject}
                    </span>
                  </div>
                  {total === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">No tasks found.</p>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={byStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {byStatus.map((entry, index) => (
                              <Cell key={index} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any, name: any) => [`${val ?? 0} tasks`, String(name || "")]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 flex-wrap justify-center">
                        {byStatus.map((s) => (
                          <div
                            key={s.name}
                            className="flex items-center gap-1.5 text-xs text-slate-600"
                          >
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: s.color }}
                            />
                            {s.name}{" "}
                            <strong className="text-slate-900 ml-0.5">{s.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bar – Priority */}
                <div className="bg-[#fafafc] rounded-md border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Tasks by Priority
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {selectedProject}
                    </span>
                  </div>
                  {total === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12">No tasks found.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={byPriority}
                        barSize={42}
                        margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(val: any, name: any) => [`${val ?? 0} tasks`, String(name || "")]} />
                        <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                          {byPriority.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Team Workload */}
              <div className="bg-[#fafafc] rounded-md border border-slate-200 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-4">
                  Team Workload
                </h2>
                {workloadData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={workloadData}
                      barGap={4}
                      barSize={22}
                      margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      <Bar dataKey="open" name="Open" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="done" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gantt */}
              <div className="bg-[#fafafc] rounded-md border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Project Timeline
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedProject}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Visual timeline from task creation to deadline. The dashed line marks today.
                </p>
                <MiniGantt tasks={filteredTasks} />
                <div className="mt-3 flex gap-4 flex-wrap text-[10px] text-slate-500">
                  <span>
                    <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-slate-400" />
                    Todo
                  </span>
                  <span>
                    <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-indigo-500" />
                    In Progress
                  </span>
                  <span>
                    <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-emerald-500" />
                    Completed
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

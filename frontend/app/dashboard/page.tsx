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
import { formatDate, timeAgo } from "@/lib/utils";
import Link from "next/link";

function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name?.trim().split(/\s+/)[0];
  return `${greeting}${firstName ? `, ${firstName}` : ""} 👋`;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHydrated();
  const { user, session, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { tasks, loading: tasksLoading } = useTasks();

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  const currentUserId = user?.id || "";
  const displayName =
    user?.name ||
    session?.user.user_metadata?.full_name ||
    session?.user.user_metadata?.name ||
    session?.user.email?.split("@")[0];

  // Metric derivations
  const totalTasks = tasks.length;
  const assignedToMe = useMemo(
    () => tasks.filter((t) => t.assigned_to === currentUserId),
    [tasks, currentUserId]
  );
  const createdByMe = useMemo(
    () => tasks.filter((t) => t.created_by === currentUserId),
    [tasks, currentUserId]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "in_progress"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks]
  );

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date && t.status !== "completed")
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5),
    [tasks]
  );

  const recentActivity = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        .slice(0, 5),
    [tasks]
  );

  const summaryCards = [
    { label: "Total Tasks", value: totalTasks },
    { label: "Assigned To Me", value: assignedToMe.length },
    { label: "In Progress", value: inProgressTasks.length },
    { label: "Completed", value: completedTasks.length },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Dashboard" />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {!mounted || authLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-medium text-slate-600">Verifying session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto max-w-md mx-auto">
              <h2 className="text-sm font-semibold text-slate-900">Authentication Required</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Please log in to access your task dashboard and analytics.
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
              {/* Personalized Greeting */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {getGreeting(displayName)}
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Here&apos;s what&apos;s happening with your tasks.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {summaryCards.map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-[#fafafc] rounded-md border border-slate-300 p-4"
                  >
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {label}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">
                      {tasksLoading ? "..." : value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 4 Clean Sections: My Tasks, Created by Me, Upcoming, Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. My Tasks */}
                <div className="bg-[#fafafc] rounded-md border border-slate-300 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 bg-slate-100/60">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      My Tasks ({assignedToMe.length})
                    </h2>
                    <Link
                      href="/tasks"
                      className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline"
                    >
                      View board
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-200 flex-1">
                    {tasksLoading ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Loading tasks...
                      </div>
                    ) : assignedToMe.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-500">No tasks currently assigned to you.</p>
                      </div>
                    ) : (
                      assignedToMe.slice(0, 4).map((task) => (
                        <Link
                          key={task.id}
                          href="/tasks"
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <PriorityBadge priority={task.priority} />
                              {task.due_date && (
                                <span className="text-[11px] text-slate-500">
                                  Due {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={task.status} className="ml-3 flex-shrink-0" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Created by Me */}
                <div className="bg-[#fafafc] rounded-md border border-slate-300 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 bg-slate-100/60">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Created by Me ({createdByMe.length})
                    </h2>
                    <Link
                      href="/created"
                      className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-200 flex-1">
                    {tasksLoading ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Loading tasks...
                      </div>
                    ) : createdByMe.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-500">You haven&apos;t created any tasks yet.</p>
                        <Link
                          href="/created"
                          className="mt-1 inline-block text-xs text-slate-800 underline font-medium"
                        >
                          Create your first task
                        </Link>
                      </div>
                    ) : (
                      createdByMe.slice(0, 4).map((task) => (
                        <Link
                          key={task.id}
                          href="/created"
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Assigned to {task.assignee?.name || "Unassigned"}
                            </p>
                          </div>
                          <StatusBadge status={task.status} className="ml-3 flex-shrink-0" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Upcoming Deadlines */}
                <div className="bg-[#fafafc] rounded-md border border-slate-300 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 bg-slate-100/60">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Upcoming
                    </h2>
                    <span className="text-[11px] text-slate-500 font-medium">Next due dates</span>
                  </div>
                  <div className="divide-y divide-slate-200 flex-1">
                    {tasksLoading ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Loading upcoming...
                      </div>
                    ) : upcomingTasks.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-500">No active tasks with due dates.</p>
                      </div>
                    ) : (
                      upcomingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <PriorityBadge priority={task.priority} />
                              <span className="text-[11px] text-slate-500">
                                {task.assigned_to === currentUserId ? "Assigned to you" : `Assigned to ${task.assignee?.name || "team"}`}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-700 ml-3 flex-shrink-0 font-medium">
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Recent Activity */}
                <div className="bg-[#fafafc] rounded-md border border-slate-300 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 bg-slate-100/60">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Recent Activity
                    </h2>
                    <span className="text-[11px] text-slate-500 font-medium">Latest updates</span>
                  </div>
                  <div className="divide-y divide-slate-200 flex-1">
                    {tasksLoading ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Loading activity...
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-500">No task activity yet.</p>
                      </div>
                    ) : (
                      recentActivity.map((task) => {
                        const isDone = task.status === "completed";
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {task.creator && <UserAvatar user={task.creator} size="sm" />}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {task.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {isDone
                                    ? `Marked completed ${timeAgo(task.completed_at || task.updated_at)}`
                                    : `Created by ${task.creator?.name || "User"} · ${timeAgo(task.created_at)}`}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={task.status} className="ml-3 flex-shrink-0" />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

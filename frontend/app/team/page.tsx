"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserAvatar } from "@/components/users/UserAvatar";
import { getUsers, getTasks } from "@/lib/api";
import type { UserProfile, Task } from "@/types/task";

export default function TeamPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHydrated();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([getUsers(), getTasks()])
      .then(([u, t]) => {
        setUsers(u);
        setTasks(t);
      })
      .catch((err) => {
        console.warn("Could not load team directory data:", err);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Compute assigned task count and completed task count per user
  const statsByUser = useMemo(() => {
    const stats: Record<string, { assigned: number; completed: number }> = {};
    for (const task of tasks) {
      if (task.assigned_to) {
        if (!stats[task.assigned_to]) {
          stats[task.assigned_to] = { assigned: 0, completed: 0 };
        }
        stats[task.assigned_to].assigned += 1;
        if (task.status === "completed") {
          stats[task.assigned_to].completed += 1;
        }
      }
    }
    return stats;
  }, [tasks]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Team" />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {!mounted || authLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-medium text-slate-600">Verifying session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto max-w-md mx-auto">
              <h2 className="text-sm font-semibold text-slate-900">Authentication Required</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Please log in to view the team directory.
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
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Directory</h1>
                <p className="mt-1 text-xs text-slate-600">
                  Registered members available for task assignments.
                </p>
              </div>

              <div className="bg-[#fafafc] rounded-md border border-slate-300 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4 text-center">Assigned Tasks</th>
                        <th className="py-2.5 px-4 text-center">Completed Tasks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            Loading team directory...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No team members found.
                          </td>
                        </tr>
                      ) : (
                        users.map((member) => {
                          const userStats = statsByUser[member.id] || { assigned: 0, completed: 0 };
                          const isCurrentUser = member.id === user?.id;
                          return (
                            <tr key={member.id} className="hover:bg-slate-100/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar user={member} size="sm" />
                                  <span className="font-semibold text-slate-900">
                                    {member.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                {member.email}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-800 font-medium">
                                {userStats.assigned}
                              </td>
                              <td className="py-3 px-4 text-center text-emerald-700 font-medium">
                                {userStats.completed}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

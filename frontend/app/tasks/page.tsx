"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { useTasks } from "@/hooks/useTasks";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TaskBoard } from "@/components/tasks/TaskBoard";

export default function TasksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHydrated();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { tasks, loading, createTask, updateTask, completeTask, deleteTask } = useTasks();

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="My Tasks" />

        <main className="flex-1 overflow-hidden px-4 lg:px-8 py-6 flex flex-col">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
            <p className="mt-1 text-xs text-slate-600">
              Tasks assigned to you. Track progress and update statuses.
            </p>
          </div>

          {!mounted || authLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-medium text-slate-600">Verifying session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto">
              <h2 className="text-sm font-semibold text-slate-900">Authentication Required</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                Please log in to view and manage your assigned tasks.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <TaskBoard
              tasks={tasks}
              loading={loading}
              currentUserId={user?.id || ""}
              onCreateTask={createTask}
              onUpdateTask={updateTask}
              onCompleteTask={completeTask}
              onDeleteTask={deleteTask}
            />
          )}
        </main>
      </div>
    </div>
  );
}

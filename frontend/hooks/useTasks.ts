"use client";

/** Hook for managing the authenticated user's tasks with a short-lived cache. */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} from "@/lib/api";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types/task";

interface UserTaskCache {
  tasks: Task[];
  fetchedAt: number;
}

const taskCache = new Map<string, UserTaskCache>();
const ongoingFetches = new Map<string, Promise<Task[]>>();
const taskListeners = new Map<string, Set<(tasks: Task[]) => void>>();

function getCachedTasks(userId: string): Task[] | null {
  const mem = taskCache.get(userId);
  if (mem) return mem.tasks;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(`taskflow_cache_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        taskCache.set(userId, { tasks: parsed, fetchedAt: Date.now() - 5000 });
        return parsed;
      }
    } catch {
      // sessionStorage unavailable
    }
  }
  return null;
}

function publishTasks(userId: string, tasks: Task[]) {
  taskCache.set(userId, { tasks, fetchedAt: Date.now() });
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`taskflow_cache_${userId}`, JSON.stringify(tasks));
    } catch {
      // Ignore quota errors
    }
  }
  taskListeners.get(userId)?.forEach((listener) => listener(tasks));
}

export function useTasks() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.id ?? null : null;
  const [, setTasks] = useState(0);
  const [loading, setLoading] = useState(() => {
    if (!userId) return false;
    return getCachedTasks(userId) === null;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!userId) {
      setLoading(false);
      setError(null);
      return;
    }

    const cached = getCachedTasks(userId);
    const lastFetched = taskCache.get(userId)?.fetchedAt || 0;
    if (!force && cached && Date.now() - lastFetched < 15_000) {
      setTasks((revision) => revision + 1);
      setLoading(false);
      return;
    }

    let pending = ongoingFetches.get(userId);
    if (!pending) {
      if (!cached) setLoading(true);
      pending = getTasks().then((data) => {
        publishTasks(userId, data);
        return data;
      }).finally(() => {
        ongoingFetches.delete(userId);
      });
      ongoingFetches.set(userId, pending);
    }

    try {
      await pending;
      setTasks((revision) => revision + 1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let listeners = taskListeners.get(userId);
    if (!listeners) {
      listeners = new Set();
      taskListeners.set(userId, listeners);
    }
    const listener = () => setTasks((revision) => revision + 1);
    listeners.add(listener);
    queueMicrotask(() => void fetchTasks());

    return () => {
      listeners?.delete(listener);
      if (listeners?.size === 0) taskListeners.delete(userId);
    };
  }, [authLoading, fetchTasks, userId]);

  const requireUserId = () => {
    if (!userId) throw new Error("Please log in to manage tasks.");
    return userId;
  };

  const handleCreateTask = async (data: CreateTaskPayload): Promise<Task> => {
    const id = requireUserId();
    const task = await createTask(data);
    publishTasks(id, [task, ...(taskCache.get(id)?.tasks ?? [])]);
    // The create response is a flat row; refresh so creator/assignee joins are present.
    await fetchTasks(true);
    return task;
  };

  const handleUpdateTask = async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const user = requireUserId();
    const updated = await updateTask(id, data);
    publishTasks(user, (taskCache.get(user)?.tasks ?? []).map((task) => task.id === id ? updated : task));
    return updated;
  };

  const handleCompleteTask = async (id: string): Promise<Task> => {
    const user = requireUserId();
    const completed = await completeTask(id);
    publishTasks(user, (taskCache.get(user)?.tasks ?? []).map((task) => task.id === id ? completed : task));
    return completed;
  };

  const handleDeleteTask = async (id: string): Promise<void> => {
    const user = requireUserId();
    await deleteTask(id);
    publishTasks(user, (taskCache.get(user)?.tasks ?? []).filter((task) => task.id !== id));
  };

  return {
    // Never render a previous account's local state during an account switch.
    tasks: userId ? taskCache.get(userId)?.tasks ?? [] : [],
    loading: userId ? loading : authLoading,
    error,
    refresh: () => fetchTasks(true),
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    completeTask: handleCompleteTask,
    deleteTask: handleDeleteTask,
  };
}

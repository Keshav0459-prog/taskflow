/**
 * API client module for interacting with the backend REST endpoints.
 */

import { supabase } from "./supabase";
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  UserProfile,
} from "@/types/task";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Fetch the current Supabase JWT access token for attaching to requests. */
async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("No active session. Please log in.");
  }
  return data.session.access_token;
}

/** Build common headers including the Authorization token. */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Generic fetch wrapper.
 * Throws an ApiError with a user-readable message on non-2xx responses.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
  } catch (networkError) {
    throw new Error(
      networkError instanceof Error
        ? networkError.message
        : "Failed to connect to backend server."
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      errorMessage = body?.error?.message || errorMessage;
    } catch {
      // Response body isn't JSON: use the status message
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content (e.g. DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Fetch and upsert the current user's profile. Called after login. */
export async function getCurrentUser(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/me");
}

// ─── Users ───────────────────────────────────────────────────────────────────

/** Return all registered users (for the assignee picker). */
export async function getUsers(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/api/users");
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

/** Return tasks where the current user is creator or assignee. */
export async function getTasks(): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks");
}

/** Return a single task by ID. */
export async function getTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`);
}

/** Create a new task. */
export async function createTask(data: CreateTaskPayload): Promise<Task> {
  return apiFetch<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update task fields (title, description, status, priority, assignee, due_date). */
export async function updateTask(
  id: string,
  data: UpdateTaskPayload
): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Mark a task as completed. Triggers completion email on backend. */
export async function completeTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}/complete`, { method: "PATCH" });
}

/** Delete a task (creator only). */
export async function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

/**
 * Task domain types and display configuration.
 */

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;       // ISO date string "YYYY-MM-DD"
  completed_at: string | null;   // ISO timestamp
  created_at: string;
  updated_at: string;
  // Joined from profiles table
  creator?: UserProfile;
  assignee?: UserProfile | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigned_to: string;
  priority: TaskPriority;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}

// Labels used for display — maps enum values to human-readable strings
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Extracts project name from task description tag [Project: ...] or returns a default */
export function getTaskProject(task: { description?: string | null; title?: string }): string {
  if (task.description) {
    const match = task.description.match(/\[Project:\s*([^\]]+)\]/i);
    if (match) return match[1].trim();
  }
  const title = (task.title || "").toLowerCase();
  if (title.includes("mobile") || title.includes("ci/cd") || title.includes("uat")) {
    return "Mobile Client App";
  }
  if (title.includes("onboarding") || title.includes("retrospective") || title.includes("notes") || title.includes("documentation")) {
    return "Customer Success & Docs";
  }
  return "TaskFlow Web Platform";
}

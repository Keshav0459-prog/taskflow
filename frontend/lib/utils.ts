import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TaskStatus } from "@/types/task";

/** Merge class names with Tailwind conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string for display. Returns "No due date" if null. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Return a relative time description (e.g. "2 days ago"). */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [intervalSeconds, label] of intervals) {
    const count = Math.floor(seconds / intervalSeconds);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

/** Check if a due date is overdue. */
export function isOverdue(
  dueDateStr: string | null | undefined,
  status: TaskStatus
): boolean {
  if (!dueDateStr || status === "completed") return false;
  return new Date(dueDateStr) < new Date();
}

/** Get initials from a name (for avatar fallback). */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

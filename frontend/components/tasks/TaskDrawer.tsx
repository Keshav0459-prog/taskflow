"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { IconClose, IconCheck, IconSpinner, IconTrash } from "@/components/icons";
import type { Task, TaskStatus, UpdateTaskPayload } from "@/types/task";
import { STATUS_LABELS } from "@/types/task";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { addTaskComment, getTaskComments } from "@/lib/api";
import type { TaskComment } from "@/types/comment";

interface TaskDrawerProps {
  task: Task | null;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (id: string, data: UpdateTaskPayload) => Promise<Task>;
  onComplete: (id: string) => Promise<Task>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskDrawer({
  task,
  currentUserId,
  onClose,
  onUpdate,
  onComplete,
  onDelete,
}: TaskDrawerProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) drawerRef.current?.focus();
  }, [task]);

  useEffect(() => {
    if (!task) return;
    let active = true;
    setCommentsLoading(true);
    getTaskComments(task.id).then((items) => { if (active) setComments(items); })
      .catch(() => { if (active) toast.error("Could not load comments."); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [task?.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!task) return null;

  const isCreator = task.created_by === currentUserId;
  const isAssignee = task.assigned_to === currentUserId;
  const canChangeStatus = isCreator || isAssignee;
  const canComplete = (isCreator || isAssignee) && task.status !== "completed";
  const canDelete = isCreator;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setUpdatingStatus(true);
    try {
      await onUpdate(task.id, { status: newStatus });
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(task.id);
      toast.success("Task marked as completed!");
      onClose();
    } catch {
      toast.error("Failed to complete task.");
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      toast.success("Task deleted.");
      onClose();
    } catch {
      toast.error("Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setCommentSaving(true);
    try {
      await addTaskComment(task.id, commentText);
      setCommentText("");
      setComments(await getTaskComments(task.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add comment.");
    } finally {
      setCommentSaving(false);
    }
  };

  return (
    <>
      {/* Flat backdrop without liquid glass / blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flat Drawer */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-label={`Task detail: ${task.title}`}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#fafafc] border-l border-slate-300 z-50 flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-300 bg-slate-100/50">
          <div className="flex-1 pr-3">
            <h2 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{timeAgo(task.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200"
            aria-label="Close task detail"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-xs text-slate-800 leading-relaxed bg-[#f2f4f8] p-3 rounded border border-slate-300">{task.description}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No description provided.</p>
          )}

          {/* Meta fields */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            {/* Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Status</span>
              {canChangeStatus ? (
                <Select
                  value={task.status}
                  onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="h-7 text-xs w-36 py-0 bg-[#f4f5f8] border-slate-300 rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["todo", "in_progress", "completed"] as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge status={task.status} />
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Priority</span>
              <PriorityBadge priority={task.priority} />
            </div>

            {/* Assignee */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Assignee</span>
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <UserAvatar user={task.assignee} size="sm" />
                  <span className="text-xs font-medium text-slate-800">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Unassigned</span>
              )}
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Created by</span>
              {task.creator ? (
                <div className="flex items-center gap-1.5">
                  <UserAvatar user={task.creator} size="sm" />
                  <span className="text-xs font-medium text-slate-800">{task.creator.name}</span>
                </div>
              ) : null}
            </div>

            {/* Due date */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Due date</span>
              <span className="text-xs text-slate-800 font-medium">{formatDate(task.due_date)}</span>
            </div>

            {/* Completed at */}
            {task.completed_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Completed</span>
                <span className="text-xs text-slate-800 font-medium">{formatDate(task.completed_at)}</span>
              </div>
            )}
          </div>

          <section className="pt-3 border-t border-slate-200">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">Team comments</h3>
            <div className="space-y-3 mb-4">
              {commentsLoading ? <p className="text-xs text-slate-500">Loading comments…</p> : comments.length === 0 ? <p className="text-xs text-slate-500">No comments yet. Start the conversation.</p> : comments.map((comment) => (
                <article key={comment.id} className="rounded border border-slate-200 bg-white p-3">
                  <div className="flex justify-between gap-2 text-[11px] text-slate-500"><strong className="text-slate-700">{comment.author?.name || "Team member"}</strong><time>{timeAgo(comment.created_at)}</time></div>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-800">{comment.body}</p>
                </article>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={2000} rows={3} placeholder="Write a comment…" aria-label="Write a comment" className="w-full resize-y rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700" />
              <div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">{commentText.length}/2000</span><Button type="submit" disabled={commentSaving || !commentText.trim()} size="sm" className="rounded bg-slate-900 text-xs text-white hover:bg-slate-800">{commentSaving ? "Posting…" : "Post comment"}</Button></div>
            </form>
          </section>
        </div>

        {/* Actions footer */}
        <div className="px-5 py-3 border-t border-slate-300 bg-slate-100/50 flex items-center gap-2">
          {canComplete && (
            <Button
              onClick={handleComplete}
              disabled={completing}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white flex-1 font-medium rounded text-xs"
            >
              {completing ? (
                <><IconSpinner className="w-3.5 h-3.5 mr-1.5" /> Completing...</>
              ) : (
                <><IconCheck className="w-3.5 h-3.5 mr-1.5" /> Mark Complete</>
              )}
            </Button>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border text-rose-700 border-rose-300 bg-rose-50/50 hover:bg-rose-100 disabled:opacity-50"
                disabled={deleting}
              >
                <IconTrash className="w-3.5 h-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-md border border-slate-300 bg-[#fafafc]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Permanently delete <strong>{task.title}</strong>. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-rose-700 hover:bg-rose-800 text-white rounded"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </>
  );
}

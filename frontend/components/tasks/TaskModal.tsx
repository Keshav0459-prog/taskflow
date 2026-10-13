"use client";

import { useState } from "react";
import { IconSpinner } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserSelector } from "@/components/users/UserSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateTaskPayload, TaskPriority } from "@/types/task";
import { PRIORITY_LABELS } from "@/types/task";
import { toast } from "sonner";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskPayload) => Promise<void>;
}

interface FormErrors {
  title?: string;
  assigned_to?: string;
  priority?: string;
}

export function TaskModal({ open, onClose, onSubmit }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("");
    setDueDate("");
    setErrors({});
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!assignedTo) newErrors.assigned_to = "Please select an assignee.";
    if (!priority) newErrors.priority = "Please select a priority.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: assignedTo,
        priority: priority as TaskPriority,
        due_date: dueDate || undefined,
      });
      toast.success("Task created successfully!");
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#fafafc] border border-slate-300 rounded-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-sm font-bold uppercase tracking-wider">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 mt-2">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-bold text-slate-700 mb-1">
              Title <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement database schema"
              autoFocus
              className="w-full rounded border border-slate-300 bg-[#f4f5f8] px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-xs text-rose-600" role="alert">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or notes about this task..."
              rows={3}
              className="w-full rounded border border-slate-300 bg-[#f4f5f8] px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700 resize-none"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign to <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <UserSelector
              value={assignedTo}
              onChange={setAssignedTo}
              disabled={submitting}
            />
            {errors.assigned_to && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.assigned_to}</p>
            )}
          </div>

          {/* Priority + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
                disabled={submitting}
              >
                <SelectTrigger className="bg-[#f4f5f8] border-slate-300 rounded text-xs" aria-label="Select priority" aria-invalid={!!errors.priority}>
                  <SelectValue placeholder="Priority..." />
                </SelectTrigger>
                <SelectContent className="rounded border border-slate-300">
                  {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="mt-1 text-xs text-rose-600" role="alert">{errors.priority}</p>
              )}
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-bold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded border border-slate-300 bg-[#f4f5f8] px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 bg-[#f0f2f5] hover:bg-slate-200 border-slate-300 text-slate-700 rounded text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs h-8"
            >
              {submitting ? (
                <><IconSpinner className="w-3.5 h-3.5 mr-1.5" /> Creating...</>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "./UserAvatar";
import { getUsers } from "@/lib/api";
import type { UserProfile } from "@/types/task";

interface UserSelectorProps {
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function UserSelector({
  value,
  onChange,
  disabled,
  placeholder = "Select assignee",
}: UserSelectorProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((loadedUsers) => {
        if (!cancelled) setUsers(loadedUsers);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load team members.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
    <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled || loading || !!loadError}>
      <SelectTrigger className="w-full bg-[#f4f5f8] border-slate-300 rounded text-xs" aria-label="Select assignee">
        <SelectValue placeholder={loading ? "Loading users..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded border border-slate-300">
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <UserAvatar user={user} size="sm" />
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </SelectItem>
        ))}
        {!loading && !loadError && users.length === 0 && (
          <SelectItem value="__no_teammates" disabled>
            No teammates yet — ask them to sign in first.
          </SelectItem>
        )}
      </SelectContent>
    </Select>
    {loadError && <p className="mt-1 text-xs text-rose-600" role="alert">Could not load teammates: {loadError}</p>}
    {!loading && !loadError && users.length === 0 && <p className="mt-1 text-xs text-slate-500">No teammates are registered yet. Each teammate must sign in once before you can assign them a task.</p>}
    </div>
  );
}

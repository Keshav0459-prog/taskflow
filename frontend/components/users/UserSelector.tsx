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

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled || loading}>
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
      </SelectContent>
    </Select>
  );
}

import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/task";
import Image from "next/image";

interface UserAvatarProps {
  user: UserProfile;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  if (user.avatar_url && failedAvatarUrl !== user.avatar_url) {
    return (
      <div className={cn("relative rounded overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-300", sizeClass, className)}>
        <Image
          src={user.avatar_url}
          alt={`${user.name}'s avatar`}
          fill
          unoptimized
          onError={() => setFailedAvatarUrl(user.avatar_url)}
          className="object-cover"
          referrerPolicy="no-referrer"
          sizes="40px"
        />
      </div>
    );
  }

  // Fallback: colored circle with initials
  return (
    <div
      className={cn(
        "rounded flex items-center justify-center font-bold flex-shrink-0 border border-slate-300",
        "bg-slate-200 text-slate-800",
        sizeClass,
        className
      )}
      aria-label={user.name}
      title={user.name}
    >
      {getInitials(user.name)}
    </div>
  );
}

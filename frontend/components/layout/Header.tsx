"use client";

import { IconMenu, IconBell } from "@/components/icons";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { UserAvatar } from "@/components/users/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, signOut } = useAuth();
  const mounted = useHydrated();

  return (
    <header className="h-12 bg-[#f8f9fb] border-b border-slate-300 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200"
        aria-label="Open navigation menu"
      >
        <IconMenu className="w-4 h-4" />
      </button>

      {/* Page title */}
      {title && (
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 hidden sm:block">{title}</h2>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <button
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200"
          aria-label="Notifications"
        >
          <IconBell className="w-4 h-4" />
        </button>

        {mounted && user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded hover:bg-slate-200 cursor-pointer"
              aria-label="User menu"
            >
              <UserAvatar user={user} size="sm" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:block">
                {user.name.split(" ")[0]}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#fafafc] border border-slate-300 rounded">
              <div className="px-3 py-2 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
              </div>
              <DropdownMenuItem onClick={signOut} className="text-xs text-rose-700 hover:bg-rose-50 cursor-pointer font-medium">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

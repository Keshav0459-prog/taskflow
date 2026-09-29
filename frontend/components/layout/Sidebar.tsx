"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconTasks,
  IconCreated,
  IconUsers,
  IconSettings,
  IconLogout,
  IconClose,
  IconLogoMark,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { UserAvatar } from "@/components/users/UserAvatar";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/tasks", label: "My Tasks", icon: IconTasks },
  { href: "/created", label: "Created by Me", icon: IconCreated },
  { href: "/team", label: "Team", icon: IconUsers },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const mounted = useHydrated();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-56 bg-[#f4f6f9] border-r border-slate-300 z-30 flex flex-col",
          "lg:relative lg:translate-x-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-300">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center flex-shrink-0 text-white">
              <IconLogoMark className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base">TaskFlow</span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              aria-label="Close sidebar"
            >
              <IconClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded text-xs font-semibold",
                  isActive
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-slate-900" : "text-slate-500")} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-slate-300 space-y-1">
          {mounted && user && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{user.email}</p>
              </div>
            </div>
          )}
          {mounted && (
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-rose-100 hover:text-rose-800"
            >
              <IconLogout className="w-4 h-4 text-slate-500" />
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

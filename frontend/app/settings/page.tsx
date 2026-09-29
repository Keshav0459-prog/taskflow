"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@/components/icons";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHydrated();
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Settings" />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h1>
            <p className="mt-1 text-xs text-slate-600">
              Manage your connected Google account and session.
            </p>
          </div>

          {!mounted || authLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-medium text-slate-600">Verifying session...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-[#fafafc] border border-slate-300 rounded text-center my-auto max-w-md mx-auto">
              <h2 className="text-sm font-semibold text-slate-900">Authentication Required</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Please log in to view account settings.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* Profile Card */}
              <div className="bg-[#fafafc] rounded-md border border-slate-300 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-300 bg-slate-100/60">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">User Profile</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Profile information synced from your authenticated Google account.
                  </p>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-4">
                    {user && <UserAvatar user={user} size="lg" className="w-14 h-14 text-base" />}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Google OAuth 2.0 Connected
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Display Name</label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="w-full rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification & Account Actions */}
              <div className="bg-[#fafafc] rounded-md border border-slate-300 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-300 bg-slate-100/60">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Account Session</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage session authentication and security.
                  </p>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Sign Out</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      End your active Supabase session on this device.
                    </p>
                  </div>
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-xs font-semibold h-8 rounded"
                  >
                    <IconLogout className="w-3.5 h-3.5 mr-1.5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

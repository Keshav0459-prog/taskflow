"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { IconLogoMark, IconSpinner } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const { signInWithGoogle, loading, isAuthenticated } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign in failed. Please try again.");
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
              <IconLogoMark className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              TaskFlow
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 text-center tracking-tight">
            Sign in to TaskFlow
          </h1>
          <p className="mt-1 text-xs text-slate-600 text-center">
            Organize work. Move faster. Stay in sync.
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-[#fafafc] rounded-md border border-slate-300 p-6">
          {error && (
            <div className="mb-4 rounded bg-rose-50 border border-rose-300 px-3 py-2">
              <p className="text-xs text-rose-800">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="w-full h-10 bg-[#f4f5f8] hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium rounded text-sm"
            variant="outline"
          >
            {signingIn ? (
              <>
                <IconSpinner className="w-4 h-4 mr-2" />
                Signing in...
              </>
            ) : (
              <>
                {/* Monochrome Google mark */}
                <svg className="w-4 h-4 mr-2.5 fill-current text-slate-700" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.65 0 3.15.675 4.245 1.77l2.25-2.25C17.07 3.87 14.82 3 12.24 3 7.275 3 3.24 7.035 3.24 12s4.035 9 9 9c5.19 0 8.85-3.645 8.85-8.82 0-.675-.06-1.32-.18-1.895h-8.67z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-[11px] text-slate-500 text-center mt-3">
            Use your Google account to continue.
          </p>

          <div className="mt-5 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
            <p>Your account authenticates via Google OAuth 2.0.</p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-600 underline">
              <Dialog>
                <DialogTrigger className="hover:text-slate-900 cursor-pointer">
                  Terms of Service
                </DialogTrigger>
                <DialogContent className="max-w-md bg-[#fafafc] border border-slate-300 rounded-md">
                  <DialogHeader>
                    <DialogTitle>Terms of Service</DialogTitle>
                  </DialogHeader>
                  <div className="text-xs text-slate-700 space-y-2 max-h-60 overflow-y-auto pt-2">
                    <p><strong>1. Acceptance:</strong> By accessing TaskFlow, you agree to these Terms of Service.</p>
                    <p><strong>2. Account Usage:</strong> You are responsible for safeguarding your credentials and using the service for lawful collaborative task management.</p>
                    <p><strong>3. Data Ownership:</strong> Content and tasks created within TaskFlow remain your intellectual property.</p>
                    <p><strong>4. Availability:</strong> Service is provided on an as-is basis without warranties of uninterrupted uptime.</p>
                  </div>
                </DialogContent>
              </Dialog>

              <span>·</span>

              <Dialog>
                <DialogTrigger className="hover:text-slate-900 cursor-pointer">
                  Privacy Policy
                </DialogTrigger>
                <DialogContent className="max-w-md bg-[#fafafc] border border-slate-300 rounded-md">
                  <DialogHeader>
                    <DialogTitle>Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <div className="text-xs text-slate-700 space-y-2 max-h-60 overflow-y-auto pt-2">
                    <p><strong>1. Information Collection:</strong> We collect your name, email, and avatar provided via Google OAuth authentication.</p>
                    <p><strong>2. Purpose:</strong> This information is strictly used for identity verification and assigning tasks to team members.</p>
                    <p><strong>3. Data Protection:</strong> We do not sell or monetize personal information with third parties.</p>
                    <p><strong>4. Inquiries:</strong> Contact your team administrator for account or data deletion requests.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          TaskFlow: Built for software teams
        </p>
      </div>
    </div>
  );
}

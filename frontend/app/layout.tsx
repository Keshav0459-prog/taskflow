import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TaskFlow: Organize work. Move faster.",
  description:
    "A modern SaaS task management app for software teams. Create, assign, and track tasks with real-time collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#f0f2f5] text-slate-900 antialiased min-h-screen" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

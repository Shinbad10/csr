"use client";

import { usePathname } from "next/navigation";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname.startsWith("/kham/") || pathname.startsWith("/tu-van") || pathname.startsWith("/theo-doi");

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-bg)] overflow-hidden relative" suppressHydrationWarning>
      <Topbar />
      <main className={`flex-1 relative min-w-0 ${isFullBleed ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto px-4 sm:px-6 py-6"}`}>
        {children}
      </main>
      <div id="modal-root" className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden" suppressHydrationWarning />
    </div>
  );
}

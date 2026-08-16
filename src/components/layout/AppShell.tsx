"use client";

import { usePathname } from "next/navigation";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname.startsWith("/kham/") || pathname.startsWith("/tu-van") || pathname.startsWith("/theo-doi") || pathname === "/buoi-kham";

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[var(--surface-bg)] overflow-hidden relative" suppressHydrationWarning>
      <Topbar />
      <main className={`flex-1 relative min-w-0 ${isFullBleed ? `flex flex-col min-h-0 overflow-hidden ${pathname === "/buoi-kham" ? "px-2.5 sm:px-6 py-2 sm:py-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]" : ""}` : "overflow-y-auto px-3 sm:px-6 py-3.5 sm:py-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"}`}>
        {children}
      </main>
      <div id="modal-root" className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden" suppressHydrationWarning />
    </div>
  );
}

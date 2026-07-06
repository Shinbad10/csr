"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = usePathname();
  const isFullBleed = pathname.startsWith("/kham/") || pathname.startsWith("/tu-van") || pathname.startsWith("/theo-doi");

  return (
    <div className="flex h-screen bg-[var(--surface-bg)] overflow-hidden relative" suppressHydrationWarning>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`flex-1 relative ${isFullBleed ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto px-4 sm:px-6 py-6"}`}>
          {children}
        </main>
      </div>
      <div id="modal-root" className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden" suppressHydrationWarning />
    </div>
  );
}

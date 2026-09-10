"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Topbar from "./Topbar";
import TopPageProgress from "./TopPageProgress";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname.startsWith("/kham/") || pathname.startsWith("/tu-van") || pathname.startsWith("/theo-doi") || pathname === "/buoi-kham";

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[var(--surface-bg)] overflow-hidden relative" suppressHydrationWarning>
      {/* useSearchParams() bên trong buộc phải có Suspense, nếu không mọi trang
          prerender tĩnh sẽ fail khi `next build`. */}
      <Suspense fallback={null}>
        <TopPageProgress />
      </Suspense>
      <Topbar />
      <main className={`flex-1 relative min-w-0 ${isFullBleed ? `flex flex-col min-h-0 overflow-hidden ${pathname === "/buoi-kham" ? "px-2.5 sm:px-6 py-2 sm:py-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]" : ""}` : "overflow-y-auto px-3 sm:px-6 py-3.5 sm:py-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"}`}>
        <div className={`w-full ${isFullBleed ? "h-full flex flex-col min-h-0" : ""}`}>
          {children}
        </div>
      </main>
      <div id="modal-root" className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden" suppressHydrationWarning />
    </div>
  );
}


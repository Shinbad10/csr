"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, UserRound, ShieldCheck, Menu } from "lucide-react";
import { roleLabel } from "@/lib/permissions";

export default function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isLoading = status === "loading";
  const name = session?.user?.name || (isLoading ? "..." : "Nhân viên");
  const initial = isLoading ? "" : (name.trim().split(" ").pop()?.[0]?.toUpperCase() ?? "?");

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <header className="h-[72px] shrink-0 bg-white border-b border-[var(--line)] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {onToggleSidebar && (
          <button className="lg:hidden p-1.5 -ml-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] rounded-md" onClick={onToggleSidebar}>
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div id="topbar-title-portal" className="flex-1 min-w-0 mr-4" />
      </div>

      <div className="relative shrink-0" ref={ref}>
        <button onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2.5 rounded-[var(--r-md)] pl-2.5 pr-2 py-1.5 transition-colors ${open ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-hover)]"}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-bold flex items-center justify-center text-[13px]">{initial}</div>
          <div className="text-left leading-tight hidden sm:block">
            {isLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3.5 bg-[var(--surface-hover)] rounded w-24"></div>
                <div className="h-2.5 bg-[var(--surface-hover)] rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="text-[13px] font-bold text-[var(--ink)] max-w-[160px] truncate">{name}</div>
                <div className="text-[11px] text-[var(--mute)]">{roleLabel(session?.user?.role)}</div>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-[var(--mute)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-[252px] bg-white border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">
            <div className="px-4 py-3.5 bg-[var(--surface-soft)] border-b border-[var(--line)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-bold flex items-center justify-center text-[15px] shrink-0">{initial}</div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[var(--ink)] truncate">{name}</div>
                <div className="text-[11px] font-mono text-[var(--mute)]">{session?.user?.id}</div>
              </div>
            </div>
            <div className="px-4 py-2.5 space-y-1.5 border-b border-[var(--line-soft)] text-[12.5px]">
              <div className="flex items-center gap-2 text-[var(--ink-soft)]"><ShieldCheck className="w-4 h-4 text-[var(--teal-deep)]" /> Vai trò: <b>{roleLabel(session?.user?.role)}</b></div>
              <div className="flex items-center gap-2 text-[var(--ink-soft)]"><UserRound className="w-4 h-4 text-[var(--navy)]" /> {session?.user?.coSoId ? `Cơ sở: ${session.user.coSoId}` : "Toàn hệ thống"}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-3 flex items-center gap-2.5 text-[13px] font-semibold text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

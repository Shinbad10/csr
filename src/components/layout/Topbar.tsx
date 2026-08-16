"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, UserRound, ShieldCheck, KeyRound, Radio } from "lucide-react";
import { roleLabel } from "@/lib/permissions";
import { ChangePasswordModal } from "@/components/layout/ChangePasswordModal";
import TopbarNav from "@/components/layout/TopbarNav";
import FacilitySwitcher from "@/components/layout/FacilitySwitcher";
import { useRealtime } from "@/lib/useRealtime";

export default function Topbar() {
  const { data: session, status } = useSession();
  const { isConnected } = useRealtime();
  const [open, setOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
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
    <header className="h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] shrink-0 bg-gradient-to-r from-[#010833] via-[#031da6] to-[#020f5c] text-white shadow-md border-b border-white/10 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 min-w-0 z-40 relative">
      {/* Menu chức năng (dropdown theo nhóm) + drawer mobile */}
      <div className="order-1 lg:order-3">
        <TopbarNav />
      </div>

      {/* Thương hiệu */}
      <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group order-2 lg:order-1 select-none">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--teal)]/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VISI" className="relative w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow" />
        </div>
        <div className="leading-tight">
          <div className="font-serif font-black text-[16px] sm:text-[17px] tracking-[-0.02em] text-white whitespace-nowrap group-hover:text-[var(--teal)] transition-colors flex items-center">
            <span>VISI</span>
            <span className="text-[var(--teal)] ml-1">CSR</span>
          </div>
          <div className="font-mono font-bold text-[9px] uppercase tracking-[0.2em] text-white/75 whitespace-nowrap hidden sm:block">
            Khám cộng đồng
          </div>
        </div>
      </Link>

      <div className="w-px h-7 bg-white/15 shrink-0 hidden lg:block order-2 mx-1" />

      {/* Realtime Live Indicator */}
      <div className="order-4 hidden sm:flex items-center">
        {isConnected ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 select-none shadow-xs"
            title="Hệ thống đang kết nối thời gian thực (SSE). Dữ liệu được cập nhật tức thì."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-mono font-bold text-[10px] tracking-wider">LIVE</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] font-semibold text-amber-300 select-none"
            title="Đang kết nối lại thời gian thực..."
          >
            <Radio className="w-3 h-3 animate-pulse text-amber-400" />
            <span className="font-mono text-[10px]">Đang nối...</span>
          </div>
        )}
      </div>

      <div className="flex-1 order-4" />

      {/* Facility Switcher */}
      <div className="hidden md:block md:w-[280px] max-w-[280px] order-5">
        <FacilitySwitcher />
      </div>

      {/* User Profile Chip */}
      <div className="relative shrink-0 order-6" ref={ref}>
        <button
          suppressHydrationWarning
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2.5 rounded-xl pl-2 pr-2.5 py-1.5 transition-all border cursor-pointer ${
            open
              ? "bg-white/20 border-white/30 text-white shadow-inner"
              : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/25"
          }`}
        >
          <div suppressHydrationWarning className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--teal)] to-[var(--teal-deep)] text-[var(--navy-ink)] font-mono font-black flex items-center justify-center text-[13px] shadow-sm ring-1 ring-white/30">
            {initial}
          </div>
          <div className="text-left leading-tight hidden sm:block" suppressHydrationWarning>
            {isLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3.5 bg-white/20 rounded w-20"></div>
                <div className="h-2.5 bg-white/15 rounded w-14"></div>
              </div>
            ) : (
              <>
                <div className="text-[12.5px] font-bold text-white max-w-[150px] truncate" suppressHydrationWarning>{name}</div>
                <div className="text-[10px] font-medium text-[var(--teal)] opacity-90">{roleLabel(session?.user?.role)}</div>
              </>
            )}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-[260px] bg-white border border-[var(--line-strong)] rounded-2xl shadow-2xl overflow-hidden animate-dropdown text-[var(--ink)]">
            <div className="px-4 py-3.5 bg-[var(--surface-soft)] border-b border-[var(--line)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-[var(--teal)] font-mono font-bold flex items-center justify-center text-[15px] shrink-0 shadow-sm">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[var(--ink)] truncate">{name}</div>
                <div className="text-[11px] font-mono text-[var(--mute)]">{session?.user?.id}</div>
              </div>
            </div>
            <div className="px-4 py-2.5 space-y-1.5 border-b border-[var(--line-soft)] text-[12px]">
              <div className="flex items-center gap-2 text-[var(--ink-soft)]">
                <ShieldCheck className="w-4 h-4 text-[var(--teal-deep)]" /> Vai trò: <b className="text-[var(--ink)]">{roleLabel(session?.user?.role)}</b>
              </div>
              <div className="flex items-center gap-2 text-[var(--ink-soft)]">
                <UserRound className="w-4 h-4 text-[var(--navy)]" /> {session?.user?.coSoId ? `Cơ sở: ${session.user.coSoId}` : "Toàn hệ thống"}
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); setChangePwOpen(true); }}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--line-soft)] cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[var(--teal-deep)]" /> Đổi mật khẩu
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-3 flex items-center gap-2.5 text-[12.5px] font-semibold text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        userId={session?.user?.id || ""}
      />
    </header>
  );
}

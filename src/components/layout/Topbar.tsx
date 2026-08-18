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
    <header className="h-[calc(3.25rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] shrink-0 bg-gradient-to-r from-[#010833] via-[#031da6] to-[#020f5c] text-white shadow-sm border-b border-white/10 flex items-center gap-2 sm:gap-3.5 px-3 sm:px-5 min-w-0 z-40 relative">
      {/* Menu chức năng (dropdown theo nhóm) + drawer mobile */}
      <div className="order-1 lg:order-3">
        <TopbarNav />
      </div>

      {/* Thương hiệu */}
      <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group order-2 lg:order-1 select-none">
        <div className="relative flex items-center">
          <div className="absolute inset-0 bg-[var(--teal)]/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VISI" className="relative w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow" />
        </div>
        <div className="leading-none">
          <div className="font-serif font-black text-[15px] sm:text-[16px] tracking-[-0.02em] text-white whitespace-nowrap group-hover:text-[var(--teal)] transition-colors flex items-center">
            <span>VISI</span>
            <span className="text-[var(--teal)] ml-0.5">CSR</span>
          </div>
          <div className="font-mono font-bold text-[8.5px] uppercase tracking-[0.18em] text-white/75 whitespace-nowrap hidden sm:block mt-0.5">
            Khám cộng đồng
          </div>
        </div>
      </Link>

      <div className="w-px h-6 bg-white/15 shrink-0 hidden lg:block order-2 mx-0.5" />

      <div className="flex-1 order-4" />

      {/* Facility Switcher */}
      <div className="hidden md:block md:w-[260px] max-w-[260px] order-5">
        <FacilitySwitcher />
      </div>

      {/* User Profile Chip */}
      <div className="relative shrink-0 order-6" ref={ref}>
        <button
          suppressHydrationWarning
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-lg pl-1.5 pr-2 py-1 transition-all border cursor-pointer ${
            open
              ? "bg-white/20 border-white/30 text-white shadow-inner"
              : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/25"
          }`}
        >
          <div suppressHydrationWarning className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--teal)] to-[var(--teal-deep)] text-[var(--navy-ink)] font-mono font-black flex items-center justify-center text-[12px] shadow-xs ring-1 ring-white/30">
            {initial}
          </div>
          <div className="text-left leading-tight hidden sm:block" suppressHydrationWarning>
            {isLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3 bg-white/20 rounded w-16"></div>
                <div className="h-2 bg-white/15 rounded w-12"></div>
              </div>
            ) : (
              <>
                <div className="text-[12px] font-bold text-white max-w-[140px] truncate" suppressHydrationWarning>{name}</div>
                <div className="text-[9.5px] font-medium text-[var(--teal)] opacity-90">{roleLabel(session?.user?.role)}</div>
              </>
            )}
          </div>
          <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`} />
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

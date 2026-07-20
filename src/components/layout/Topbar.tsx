"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, UserRound, ShieldCheck, KeyRound } from "lucide-react";
import { roleLabel } from "@/lib/permissions";
import { ChangePasswordModal } from "@/components/layout/ChangePasswordModal";
import TopbarNav from "@/components/layout/TopbarNav";
import FacilitySwitcher from "@/components/layout/FacilitySwitcher";

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
    <header className="h-16 shrink-0 bg-white border-b border-[var(--line)] flex items-center gap-2 sm:gap-4 px-3 sm:px-6 min-w-0">
      {/* Menu chức năng (dropdown theo nhóm) + drawer mobile */}
      <div className="order-1 lg:order-3">
        <TopbarNav />
      </div>

      {/* Thương hiệu */}
      <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group order-2 lg:order-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="VISI" className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm" />
        <div className="leading-tight">
          <div className="font-serif font-bold text-[15px] sm:text-[16px] tracking-[-0.02em] text-[var(--ink)] whitespace-nowrap">VISI</div>
          <div className="font-mono font-bold text-[9px] uppercase tracking-[0.18em] text-[var(--teal)] whitespace-nowrap hidden sm:block">Khám cộng đồng</div>
        </div>
      </Link>

      <div className="w-px h-7 bg-[var(--line)] shrink-0 hidden lg:block order-2 mx-1" />

      <div className="flex-1 order-4" />

      <div className="hidden md:block md:w-[280px] max-w-[280px] order-5">
        <FacilitySwitcher />
      </div>

      <div className="relative shrink-0 order-6" ref={ref}>
        <button onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2.5 rounded-[var(--r-md)] pl-2.5 pr-2 py-1.5 transition-colors ${open ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-hover)]"}`}>
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-[var(--teal)] font-mono font-bold flex items-center justify-center text-[13px] shadow-xs border border-white/10">{initial}</div>
          <div className="text-left leading-tight hidden sm:block">
            {isLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3.5 bg-[var(--surface-hover)] rounded w-24"></div>
                <div className="h-2.5 bg-[var(--surface-hover)] rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="text-[13px] font-bold text-[var(--ink)] max-w-[160px] truncate">{name}</div>
                <div className="text-[11px] font-medium text-[var(--mute)]">{roleLabel(session?.user?.role)}</div>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-[var(--mute)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-[252px] bg-white border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in">
            <div className="px-4 py-3.5 bg-[var(--surface-soft)] border-b border-[var(--line)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-[var(--teal)] font-mono font-bold flex items-center justify-center text-[15px] shrink-0 shadow-xs border border-white/10">{initial}</div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-[var(--ink)] truncate">{name}</div>
                <div className="text-[11px] font-mono text-[var(--mute)]">{session?.user?.id}</div>
              </div>
            </div>
            <div className="px-4 py-2.5 space-y-1.5 border-b border-[var(--line-soft)] text-[12.5px]">
              <div className="flex items-center gap-2 text-[var(--ink-soft)]"><ShieldCheck className="w-4 h-4 text-[var(--teal-deep)]" /> Vai trò: <b>{roleLabel(session?.user?.role)}</b></div>
              <div className="flex items-center gap-2 text-[var(--ink-soft)]"><UserRound className="w-4 h-4 text-[var(--navy)]" /> {session?.user?.coSoId ? `Cơ sở: ${session.user.coSoId}` : "Toàn hệ thống"}</div>
            </div>
            <button
              onClick={() => { setOpen(false); setChangePwOpen(true); }}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--line-soft)]"
            >
              <KeyRound className="w-4 h-4 text-[var(--teal-deep)]" /> Đổi mật khẩu
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-3 flex items-center gap-2.5 text-[13px] font-semibold text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors">
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X, Building2 } from "lucide-react";
import { can } from "@/lib/permissions";
import { MENU_GROUPS, isNavActive, type NavGroup } from "@/lib/nav";
import FacilitySwitcher from "@/components/layout/FacilitySwitcher";

/** Nhóm menu dạng dropdown trên thanh ngang Navy. */
function GroupMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groupActive = group.items.some((it) => isNavActive(pathname, it.href));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onEsc); };
  }, [open]);

  // Nhóm chỉ có 1 mục → link thẳng, không cần dropdown
  if (group.items.length === 1) {
    const it = group.items[0];
    const Icon = it.icon;
    const active = isNavActive(pathname, it.href);
    return (
      <Link
        href={it.href}
        className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all select-none ${
          active
            ? "bg-[var(--teal)] text-[var(--navy-ink)] shadow-sm font-extrabold"
            : "text-white/80 hover:text-white hover:bg-white/10 font-semibold"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--navy-ink)]" : "text-white/70"}`} />
        {it.label}
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
          groupActive
            ? "bg-white/15 text-[var(--teal)] border border-white/20 shadow-xs"
            : open
            ? "bg-white/20 text-white"
            : "text-white/80 hover:text-white hover:bg-white/10 font-semibold"
        }`}
      >
        {group.title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 text-white" : "text-white/60"}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[260px] bg-white border border-[var(--line-strong)] rounded-2xl shadow-2xl p-1.5 animate-dropdown text-[var(--ink)]">
          {group.items.map((it) => {
            const Icon = it.icon;
            const active = isNavActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-xs"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
                {it.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TopbarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawer, setDrawer] = useState(false);
  const role = session?.user?.role || "";

  const groups = MENU_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.cap || can(role, it.cap)) }))
    .filter((g) => g.items.length > 0);

  // Đóng drawer khi đổi trang
  useEffect(() => { setDrawer(false); }, [pathname]);

  return (
    <>
      {/* Desktop */}
      <nav data-tour="db-nav" className="hidden lg:flex items-center gap-1 min-w-0">
        {groups.map((g) => <GroupMenu key={g.title} group={g} pathname={pathname} />)}
      </nav>

      {/* Mobile — nút mở drawer */}
      <button
        onClick={() => setDrawer(true)}
        className="lg:hidden p-2 text-white/90 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
        title="Menu chức năng"
      >
        <Menu className="w-5 h-5" />
      </button>

      {drawer && (
        <>
          <div className="fixed inset-0 bg-[var(--navy-ink)]/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setDrawer(false)} />
          <aside className="fixed inset-y-0 left-0 z-[61] w-[280px] bg-white border-r border-[var(--line)] flex flex-col lg:hidden animate-fade-in shadow-2xl">
            <div className="h-16 shrink-0 px-4 bg-gradient-to-r from-[var(--navy-deep)] to-[var(--navy)] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="VISI" className="w-7 h-7 object-contain drop-shadow" />
                <span className="font-serif font-bold text-[16px] tracking-tight">
                  VISI <span className="text-[var(--teal)]">CSR</span>
                </span>
              </div>
              <button onClick={() => setDrawer(false)} className="p-1.5 rounded-full text-white/80 hover:bg-white/15 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Cơ sở làm việc */}
            <div className="px-3 py-3 border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
              <div className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-[var(--mute)] flex items-center gap-1.5 mb-1.5 font-mono">
                <Building2 className="w-3.5 h-3.5 text-[var(--teal)]" /> Cơ sở làm việc
              </div>
              <FacilitySwitcher className="w-full" variant="light" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {groups.map((g) => (
                <div key={g.title} className="space-y-1">
                  <div className="font-sans font-extrabold text-[9px] uppercase tracking-[0.15em] text-[var(--mute)] px-2.5 font-mono">
                    {g.title}
                  </div>
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active = isNavActive(pathname, it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                          active
                            ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-bold shadow-sm"
                            : "text-[var(--ink-soft)] font-medium hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

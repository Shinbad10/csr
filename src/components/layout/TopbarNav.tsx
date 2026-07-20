"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X, Building2 } from "lucide-react";
import { can } from "@/lib/permissions";
import { MENU_GROUPS, isNavActive, type NavGroup } from "@/lib/nav";
import FacilitySwitcher from "@/components/layout/FacilitySwitcher";

/** Nhóm menu dạng dropdown trên thanh ngang. */
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
        className={`inline-flex items-center gap-2 h-9 px-3 rounded-[var(--r-md)] text-[13px] font-semibold whitespace-nowrap transition-colors ${
          active ? "bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]" : "text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
        {it.label}
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--r-md)] text-[13px] font-semibold whitespace-nowrap transition-colors ${
          groupActive || open ? "bg-[var(--navy-50)] text-[var(--navy)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]"
        }`}
      >
        {group.title}
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--mute)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[260px] bg-white border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-lg)] p-1.5 animate-fade-in">
          {group.items.map((it) => {
            const Icon = it.icon;
            const active = isNavActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-md)] text-[13px] font-semibold transition-colors ${
                  active ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
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
        className="lg:hidden p-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] rounded-md"
        title="Menu chức năng"
      >
        <Menu className="w-5 h-5" />
      </button>

      {drawer && (
        <>
          <div className="fixed inset-0 bg-[var(--navy-ink)]/40 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setDrawer(false)} />
          <aside className="fixed inset-y-0 left-0 z-[61] w-[272px] bg-white border-r border-[var(--line)] flex flex-col lg:hidden animate-fade-in">
            <div className="h-16 shrink-0 px-4 flex items-center justify-between border-b border-[var(--line-soft)]">
              <span className="font-serif font-bold text-[16px] text-[var(--ink)]">Chức năng</span>
              <button onClick={() => setDrawer(false)} className="p-1.5 rounded-full text-[var(--mute)] hover:bg-[var(--surface-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Cơ sở làm việc — topbar ẩn ô này dưới md, nên đưa vào drawer */}
            <div className="px-3 py-3 border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
              <div className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-[var(--mute)] flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3 h-3 text-[var(--teal)]" /> Cơ sở làm việc
              </div>
              <FacilitySwitcher className="w-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {groups.map((g) => (
                <div key={g.title} className="space-y-1">
                  <div className="font-sans font-extrabold text-[9px] uppercase tracking-[0.15em] text-[var(--mute)] px-2.5">{g.title}</div>
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active = isNavActive(pathname, it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] text-[13px] transition-colors ${
                          active ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-semibold" : "text-[var(--ink-soft)] font-medium hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
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

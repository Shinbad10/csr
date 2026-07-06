"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, CalendarHeart, Activity, ClipboardList,
  PhoneCall, BarChart3, Settings, Building2, X, UserCog,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { can, isCorporate as isCorporateRole, type Capability } from "@/lib/permissions";
import { Dropdown } from "@/components/csr/fields";

interface CoSo { id: string; ten: string }
type NavItem = { label: string; icon: typeof LayoutDashboard; href: string; cap?: Capability };

// Tổ chức theo luồng nghiệp vụ: Tổng quan → Tầm soát → Sau khám → Dữ liệu → Hệ thống.
// Tư vấn & phân nhóm đặt trong từng ĐỢT KHÁM (nút ở màn /buoi-kham), không để ở sidebar.
const MENU_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Tổng quan", items: [{ label: "Bảng điều khiển", icon: LayoutDashboard, href: "/" }] },
  {
    title: "Tầm soát cộng đồng",
    items: [
      { label: "Đợt khám tầm soát", icon: CalendarHeart, href: "/buoi-kham" }, // gồm Tham gia khám + Tư vấn theo đợt
    ],
  },
  {
    title: "Điều trị & Chăm sóc",
    items: [
      { label: "Phân nhóm A/B", icon: UserCog, href: "/tu-van" },
      { label: "Theo dõi A/B", icon: PhoneCall, href: "/theo-doi", cap: "hoso.followup" },
      { label: "Đối chiếu HIS", icon: Activity, href: "/doi-chieu-his", cap: "hoso.followup" },
    ],
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { label: "Hồ sơ bệnh nhân", icon: ClipboardList, href: "/ho-so" },
      { label: "Báo cáo & thống kê", icon: BarChart3, href: "/bao-cao", cap: "report.export" },
    ],
  },
  { title: "Hệ thống", items: [{ label: "Quản trị", icon: Settings, href: "/quan-tri", cap: "admin.masterdata" }] },
];

function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

export default function Sidebar({ open, setOpen }: { open?: boolean; setOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [coSos, setCoSos] = useState<CoSo[]>([]);
  const [selectedCoSo, setSelectedCoSo] = useState<string>(readCosoCookie);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/kham/")) setCollapsed(true);
  }, [pathname]);

  const role = session?.user?.role || "";
  const isCorporate = isCorporateRole(role);

  const visibleGroups = MENU_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.cap || can(role, it.cap)),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    fetch("/api/csr/coso").then((r) => r.json()).then((data) => {
      if (!Array.isArray(data)) return;
      setCoSos(data);
      setSelectedCoSo((cur) => {
        if (cur) return cur;
        const id = session?.user?.coSoId || data[0]?.id || "";
        if (id && typeof document !== "undefined") document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
        return id;
      });
    }).catch(() => {});
  }, [session]);

  const onChangeCoSo = (id: string) => {
    setSelectedCoSo(id);
    document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const facilityName = coSos.find((c) => c.id === (selectedCoSo || session?.user?.coSoId))?.ten ?? "—";

  return (
    <>
      {/* Mobile overlay */}
      {open && setOpen && (
        <div className="fixed inset-0 bg-[var(--navy-ink)]/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      
      <aside className={`fixed lg:relative top-0 h-screen ${collapsed ? "w-[72px]" : "w-[250px]"} shrink-0 bg-white border-r border-[var(--line)] flex flex-col z-50 transition-all duration-300 ease-in-out overflow-x-hidden ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Brand */}
        <div className={`h-[72px] flex items-center gap-3 border-b border-[var(--line-soft)] shrink-0 transition-all duration-300 ${collapsed ? "px-0 justify-center" : "px-4 justify-between lg:justify-start"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : ""}`}>
            <div className={`relative group shrink-0 transition-all duration-300 ${collapsed ? "w-[42px] h-[42px] cursor-pointer" : "w-11 h-11"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VISI" className="w-full h-full object-contain drop-shadow-sm" />
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-[var(--navy-deep)] text-white text-[13px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 flex items-center gap-1.5 border border-[var(--navy-100)] font-sans">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--navy-deep)] rotate-45 border-l border-b border-[var(--navy-100)]" />
                  <span>VISI - Khám cộng đồng</span>
                </div>
              )}
            </div>
            <div className={`leading-tight overflow-hidden transition-all duration-300 ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[150px] opacity-100 ml-2.5"}`}>
              <div className="font-serif font-semibold text-[16px] tracking-[-0.02em] text-[var(--ink)] whitespace-nowrap">VISI</div>
              <div className="font-sans font-bold text-[9px] uppercase tracking-[0.18em] text-[var(--mute)] whitespace-nowrap">Khám cộng đồng</div>
            </div>
          </div>
          {setOpen && !collapsed && (
            <button className="lg:hidden p-1.5 -mr-1.5 text-[var(--mute)] hover:bg-[var(--surface-hover)] rounded-full shrink-0" onClick={() => setOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Cơ sở làm việc */}
      <div className={`border-b border-[var(--line-soft)] bg-[var(--surface-soft)] transition-all duration-300 ${collapsed ? "p-3 flex justify-center items-center" : "p-3"}`}>
        <div className={`overflow-hidden transition-all duration-300 ${collapsed ? "max-h-0 opacity-0 mb-0" : "max-h-[20px] opacity-100 mb-1.5"}`}>
          <div className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-[var(--mute)] flex items-center gap-1.5 whitespace-nowrap">
            <Building2 className="w-3 h-3 text-[var(--teal)]" /> Cơ sở làm việc
          </div>
        </div>
        {collapsed ? (
          <div className="relative group w-[38px] h-[38px] shrink-0 rounded-[var(--r-md)] bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] flex items-center justify-center transition-all duration-300 cursor-pointer">
            <Building2 className="w-[18px] h-[18px]" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-[var(--navy-deep)] text-white text-[13px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 flex items-center gap-1.5 border border-[var(--navy-100)]">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--navy-deep)] rotate-45 border-l border-b border-[var(--navy-100)]" />
              <span>Cơ sở: {facilityName}</span>
            </div>
          </div>
        ) : isCorporate ? (
          <Dropdown
            value={selectedCoSo}
            onChange={onChangeCoSo}
            options={coSos.map(c => c.id)}
            labels={Object.fromEntries(coSos.map(c => [c.id, c.ten]))}
            placeholder="Chọn cơ sở làm việc..."
            mono={false}
          />
        ) : (
          <div className="bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] rounded-[var(--r-md)] px-2.5 py-1.5 text-xs font-bold truncate transition-all duration-300" title={facilityName}>
            {facilityName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-5 transition-all duration-300 ${collapsed ? "px-2 py-4 flex flex-col items-center" : "px-3 py-4"}`}>
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1 w-full flex flex-col">
            <div className={`font-sans font-extrabold text-[9px] uppercase tracking-[0.15em] text-[var(--mute)] whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "max-w-0 opacity-0 h-0 px-0 m-0" : "max-w-[200px] opacity-100 h-auto px-2.5"}`}>
              {group.title}
            </div>
            <div className={`flex flex-col transition-all duration-300 ${collapsed ? "gap-2 items-center" : "gap-0.5"}`}>
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                const Icon = item.icon;
                return (
                  <div key={item.href} className="relative group flex justify-center w-full">
                    <Link href={item.href} onClick={() => setOpen && setOpen(false)} title={collapsed ? undefined : item.label}
                      className={`flex items-center rounded-[var(--r-md)] transition-all duration-300 overflow-hidden ${collapsed ? "w-[38px] h-[38px] justify-center shrink-0" : "w-full px-3 py-2.5 gap-3"} ${
                        active ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-[var(--navy-shadow)] font-semibold" : "text-[var(--ink-soft)] font-medium hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"}`}>
                      <Icon className={`shrink-0 transition-all duration-300 ${collapsed ? "w-[18px] h-[18px]" : "w-4 h-4"} ${active ? (collapsed ? "text-white" : "text-[var(--teal)]") : "text-[var(--mute)] group-hover:text-[var(--navy)]"}`} />
                      <span className={`text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100"}`}>
                        {item.label}
                      </span>
                    </Link>
                    {collapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-[var(--navy-deep)] text-white text-[13px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 flex items-center gap-1.5 border border-[var(--navy-100)]">
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--navy-deep)] rotate-45 border-l border-b border-[var(--navy-100)]" />
                        <span>{item.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Toggle collapse button */}
      <div className={`p-3 border-t border-[var(--line-soft)] flex ${collapsed ? "justify-center" : "justify-end"}`}>
        <div className="relative group">
          <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 flex items-center justify-center rounded-[var(--r-md)] text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)] transition-colors">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[var(--navy-deep)] text-white text-[12px] font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 border border-[var(--navy-100)]">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--navy-deep)] rotate-45 border-l border-b border-[var(--navy-100)]" />
              Mở rộng menu
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

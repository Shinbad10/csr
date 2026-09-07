import {
  LayoutDashboard, CalendarHeart, Bus, ClipboardList,
  PhoneCall, BarChart3, Settings, UserCog,
} from "lucide-react";
import { type Capability } from "./permissions";

export type NavItem = { label: string; icon: typeof LayoutDashboard; href: string; cap?: Capability };
export type NavGroup = { title: string; items: NavItem[] };

// Tổ chức theo luồng nghiệp vụ: Tổng quan → Tầm soát → Sau khám → Dữ liệu → Hệ thống.
// Tư vấn & phân nhóm đặt trong từng ĐỢT KHÁM (nút ở màn /buoi-kham), không để ở menu.
export const MENU_GROUPS: NavGroup[] = [
  { title: "Tổng quan", items: [{ label: "Bảng điều khiển", icon: LayoutDashboard, href: "/" }] },
  {
    title: "Tầm soát cộng đồng",
    items: [
      { label: "Đợt khám tầm soát", icon: CalendarHeart, href: "/buoi-kham", cap: "buoikham.view" },
    ],
  },
  {
    title: "Điều trị & Chăm sóc",
    items: [
      { label: "Tư vấn điều trị", icon: UserCog, href: "/tu-van", cap: "hoso.clinical" },
      { label: "Theo dõi & Chăm sóc", icon: PhoneCall, href: "/theo-doi", cap: "hoso.followup" },
      { label: "Danh sách đoàn xe", icon: Bus, href: "/doan-xe", cap: "hoso.followup" },
    ],
  },
  {
    title: "Dữ liệu & Báo cáo",
    items: [
      { label: "Hồ sơ bệnh nhân", icon: ClipboardList, href: "/ho-so" },
      { label: "Báo cáo & thống kê", icon: BarChart3, href: "/bao-cao", cap: "report.export" },
    ],
  },
  { title: "Hệ thống", items: [{ label: "Quản trị", icon: Settings, href: "/quan-tri", cap: "admin.users" }] },
];

/** Mục đang active theo pathname (khớp chính xác, hoặc là tiền tố của route con). */
export const isNavActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

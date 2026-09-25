"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Plus,
  Building2,
  Users,
  ScrollText,
  X,
  Check,
  Pencil,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Copy,
  Stethoscope,
  Search,
  ShieldCheck,
  ChevronDown,
  Mail,
  Send,
  RotateCw,
  Server,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Database,
  AtSign,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { fmtTime } from "@/lib/csr";
import { can, roleLabel } from "@/lib/permissions";
import { Field, StatusBadge, SectionHeader } from "@/components/csr/fields";
import { DataView, DataTable } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";

interface CoSo {
  id: string;
  ten: string;
  diaChi: string | null;
  trangThai: string;
  cauHinhTruong?: string | null;
  bhxhUser?: string | null;
  bhxhPass?: string | null;
  bhxhMaCSKCB?: string | null;
  bhxhHoTenCB?: string | null;
  bhxhCccdCB?: string | null;
  hisHost?: string | null;
  hisPort?: string | null;
  hisUser?: string | null;
  hisPass?: string | null;
  hisDbName?: string | null;
}

interface LoiMoi {
  thoiDiem: string;
  email: string;
  ok: boolean;
  loi?: string;
  soLan: number;
}

interface NguoiDung {
  maNV: string;
  hoTen: string;
  vaiTro: string;
  coSoId: string | null;
  tenDangNhap: string;
  trangThai: string;
  coSo?: { ten: string };
  loiMoi?: LoiMoi | null;
}

interface Audit {
  id: number;
  bang: string;
  banGhiId: string;
  hanhDong: string;
  nguoiDung: string;
  thoiDiem: string;
  thayDoi?: string | null;
}

interface SmtpStatus {
  ready: boolean;
  problem?: string;
  from?: string;
  fromName?: string;
  host?: string;
  port?: number;
}

const ALL_ROLES = ["BacSi", "MKT", "TuVanVien", "KeToan", "HCNS", "IT", "QuanLy"];
const IT_ROLES = ["BacSi", "MKT", "TuVanVien", "KeToan", "HCNS", "IT"];

const ROLE_BADGES: Record<string, { label: string; cls: string }> = {
  QuanLy: { label: "Quản lý hệ thống", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  IT: { label: "IT Đơn vị", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  BacSi: { label: "Bác sĩ", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  TuVanVien: { label: "Tư vấn viên", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  MKT: { label: "Marketing (MKT)", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  KeToan: { label: "Kế toán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  HCNS: { label: "HCNS", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  CSKH: { label: "Marketing (MKT)", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

/** Tạo mật khẩu tạm ngẫu nhiên an toàn trên client */
function generateTempPassword(len = 10): string {
  const up = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const low = "abcdefghijkmnpqrstuvwxyz";
  const dig = "23456789";
  const all = up + low + dig;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(up), pick(low), pick(dig), "@"];
  while (chars.length < len) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function QuanTriPage() {
  const { data: session } = useSession();
  const isMaster = can(session?.user?.role, "admin.masterdata");
  const isIT = can(session?.user?.role, "admin.users") && !isMaster;

  const { addToast } = useToast();
  const [tab, setTab] = useState<"coso" | "nguoidung" | "bacsi" | "audit" | "gsheet">("coso");

  // Dữ liệu chung
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [users, setUsers] = useState<NguoiDung[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc tài khoản
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userCosoFilter, setUserCosoFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState<"" | "da_gui" | "chua_gui" | "loi">("");

  // Bác sĩ
  const [bacsiFilterCoso, setBacsiFilterCoso] = useState("");
  const [bacsiSearch, setBacsiSearch] = useState("");
  const [syncingBacSi, setSyncingBacSi] = useState(false);

  // Nhật ký
  const [auditFilterHanhDong, setAuditFilterHanhDong] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // SMTP Info
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [checkingSmtp, setCheckingSmtp] = useState(false);
  const [smtpTestModal, setSmtpTestModal] = useState(false);

  // Modals & Selection
  const [modal, setModal] = useState<{ type: "coso" | "user"; rec?: CoSo | NguoiDung } | null>(null);
  const [inviteModal, setInviteModal] = useState<NguoiDung | null>(null);
  const [bulkInviteModal, setBulkInviteModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const [selectedCosos, setSelectedCosos] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isIT) {
      setTab("nguoidung");
      if (session?.user?.coSoId) setBacsiFilterCoso(session.user.coSoId);
    }
  }, [isIT, session?.user?.coSoId]);

  const changeTab = (k: "coso" | "nguoidung" | "bacsi" | "audit" | "gsheet") => {
    setTab(k);
    setSelectedCosos(new Set());
    setSelectedUsers(new Set());
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [c, u, a, emailRes] = await Promise.all([
        fetch("/api/csr/coso?all=1"),
        fetch("/api/csr/nguoidung"),
        fetch("/api/csr/audit"),
        fetch("/api/csr/email"),
      ]);
      if (c.ok) setCosos(await c.json());
      if (u.ok) setUsers(await u.json());
      if (a.ok) setAudits(await a.json());
      if (emailRes.ok) setSmtpStatus(await emailRes.json());
    } catch {
      addToast({ type: "error", message: "Không thể tải dữ liệu quản trị." });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const checkSmtpConnection = async () => {
    setCheckingSmtp(true);
    try {
      const res = await fetch("/api/csr/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          title: "Máy chủ SMTP sẵn sàng",
          message: data.message || "Kết nối mail.visicare.com.vn:465 thành công!",
        });
        setSmtpStatus((p) => (p ? { ...p, ready: true } : p));
      } else {
        addToast({
          type: "error",
          title: "Lỗi kết nối SMTP",
          message: data.error || "Không thể kết nối đến máy chủ mail VISI.",
        });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối mạng tới máy chủ API." });
    } finally {
      setCheckingSmtp(false);
    }
  };

  const displayedCosos = useMemo(() => {
    if (isIT && session?.user?.coSoId) {
      return cosos.filter((c) => c.id === session.user.coSoId);
    }
    return cosos;
  }, [cosos, isIT, session?.user?.coSoId]);

  const regularUsers = useMemo(() => {
    return users
      .filter((u) => u.vaiTro !== "BacSi" && !u.vaiTro.includes("Bác"))
      .filter((u) => !isIT || u.coSoId === session?.user?.coSoId);
  }, [users, isIT, session?.user?.coSoId]);

  const filteredUsers = useMemo(() => {
    return regularUsers.filter((u) => {
      if (userRoleFilter && u.vaiTro !== userRoleFilter) return false;
      if (userCosoFilter && u.coSoId !== userCosoFilter) return false;
      if (userEmailFilter === "da_gui" && !u.loiMoi?.ok) return false;
      if (userEmailFilter === "chua_gui" && u.loiMoi?.ok) return false;
      if (userEmailFilter === "loi" && (!u.loiMoi || u.loiMoi.ok)) return false;
      if (userSearch) {
        const q = userSearch.toLowerCase();
        const matchName = u.hoTen.toLowerCase().includes(q);
        const matchMa = u.maNV.toLowerCase().includes(q);
        const matchUser = u.tenDangNhap.toLowerCase().includes(q);
        const matchEmail = u.loiMoi?.email?.toLowerCase().includes(q);
        if (!matchName && !matchMa && !matchUser && !matchEmail) return false;
      }
      return true;
    });
  }, [regularUsers, userRoleFilter, userCosoFilter, userEmailFilter, userSearch]);

  const doctorUsers = useMemo(() => {
    return users
      .filter((u) => u.vaiTro === "BacSi" || u.vaiTro.includes("Bác"))
      .filter((u) => {
        if (isIT && session?.user?.coSoId) return u.coSoId === session.user.coSoId;
        return !bacsiFilterCoso || u.coSoId === bacsiFilterCoso;
      })
      .filter(
        (u) =>
          !bacsiSearch ||
          u.hoTen.toLowerCase().includes(bacsiSearch.toLowerCase()) ||
          u.maNV.toLowerCase().includes(bacsiSearch.toLowerCase())
      );
  }, [users, isIT, session?.user?.coSoId, bacsiFilterCoso, bacsiSearch]);

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      if (auditFilterHanhDong && a.hanhDong !== auditFilterHanhDong) return false;
      if (auditSearch) {
        const q = auditSearch.toLowerCase();
        const matchUser = a.nguoiDung.toLowerCase().includes(q);
        const matchBang = a.bang.toLowerCase().includes(q);
        const matchId = a.banGhiId.toLowerCase().includes(q);
        const matchThayDoi = a.thayDoi?.toLowerCase().includes(q);
        if (!matchUser && !matchBang && !matchId && !matchThayDoi) return false;
      }
      return true;
    });
  }, [audits, auditFilterHanhDong, auditSearch]);

  // KPI Metrics for Accounts
  const totalUsers = regularUsers.length;
  const activeUsers = regularUsers.filter((u) => u.trangThai === "active").length;
  const totalEmailSent = regularUsers.filter((u) => u.loiMoi?.ok).length;
  const totalNotSent = regularUsers.filter((u) => !u.loiMoi?.ok).length;

  const availableTabs = useMemo(() => {
    if (isIT) {
      return [
        ["coso", "Cấu hình đơn vị", Building2],
        ["nguoidung", `Tài khoản (${regularUsers.length})`, Users],
        ["bacsi", `Danh sách Bác sĩ (${doctorUsers.length})`, Stethoscope],
      ] as const;
    }
    return [
      ["coso", `Cơ sở (${displayedCosos.length})`, Building2],
      ["nguoidung", `Tài khoản (${regularUsers.length})`, Users],
      ["bacsi", `Danh sách Bác sĩ (${doctorUsers.length})`, Stethoscope],
      ["gsheet", "Google Sheet", FileSpreadsheet],
      ["audit", `Nhật ký (${audits.length})`, ScrollText],
    ] as const;
  }, [isIT, displayedCosos.length, regularUsers.length, doctorUsers.length, audits.length]);

  const lockCoso = (id: string) => {
    setConfirmDialog({
      title: "Xóa cơ sở y tế",
      message: "Bạn có chắc chắn muốn xóa cơ sở này? Hành động này sẽ cascade xóa các cấu hình liên quan.",
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos((prev) => prev.filter((c) => c.id !== id));
        const res = await fetch(`/api/csr/coso/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          addToast({ type: "success", message: "Đã xóa cơ sở." });
          load(true);
        } else {
          addToast({ type: "error", message: data.error || "Lỗi xóa cơ sở" });
          load(true);
        }
      },
    });
  };

  const lockUser = (id: string) => {
    setConfirmDialog({
      title: "Xóa tài khoản người dùng",
      message: "Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?",
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers((prev) => prev.filter((u) => u.maNV !== id));
        const res = await fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          addToast({ type: "success", message: "Đã xóa tài khoản." });
          load(true);
        } else {
          addToast({ type: "error", message: data.error || "Lỗi xóa tài khoản" });
          load(true);
        }
      },
    });
  };

  const bulkDeleteCosos = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt cơ sở",
      message: `Bạn có chắc chắn muốn xóa ${selectedCosos.size} cơ sở đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos((prev) => prev.filter((c) => !selectedCosos.has(c.id)));
        const results = await Promise.all(
          Array.from(selectedCosos).map((id) => fetch(`/api/csr/coso/${id}`, { method: "DELETE" }))
        );
        const success = results.filter((r) => r.ok).length;
        const failed = results.length - success;
        addToast({
          type: success > 0 ? "success" : "error",
          message: `Đã xóa ${success} cơ sở.${failed > 0 ? ` Lỗi ${failed} cơ sở.` : ""}`,
        });
        setSelectedCosos(new Set());
        await load(true);
      },
    });
  };

  const bulkDeleteUsers = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt tài khoản",
      message: `Bạn có chắc chắn muốn xóa ${selectedUsers.size} tài khoản đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.maNV)));
        const results = await Promise.all(
          Array.from(selectedUsers).map((id) => fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" }))
        );
        const success = results.filter((r) => r.ok).length;
        const failed = results.length - success;
        addToast({
          type: success > 0 ? "success" : "error",
          message: `Đã xóa ${success} tài khoản.${failed > 0 ? ` Lỗi ${failed} tài khoản.` : ""}`,
        });
        setSelectedUsers(new Set());
        await load(true);
      },
    });
  };

  const checkboxCls =
    "rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer";

  // Cột bảng Cơ sở
  const cosoColumns = useMemo<ColumnDef<CoSo>[]>(
    () => [
      ...(!isIT
        ? ([
            {
              id: "sel",
              size: 44,
              enableSorting: false,
              enableResizing: false,
              meta: { width: "44px" },
              header: () => (
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={displayedCosos.length > 0 && selectedCosos.size === displayedCosos.length}
                  onChange={(e) =>
                    setSelectedCosos(e.target.checked ? new Set(displayedCosos.map((c) => c.id)) : new Set())
                  }
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  data-no-row-click
                  className={checkboxCls}
                  checked={selectedCosos.has(row.original.id)}
                  onChange={(e) => {
                    const n = new Set(selectedCosos);
                    if (e.target.checked) n.add(row.original.id);
                    else n.delete(row.original.id);
                    setSelectedCosos(n);
                  }}
                />
              ),
            },
          ] as ColumnDef<CoSo>[])
        : []),
      {
        id: "id",
        accessorKey: "id",
        header: "Mã",
        size: 80,
        meta: { align: "center", width: "80px" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span className="font-mono font-bold text-[12px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/80">
              {row.original.id}
            </span>
          </div>
        ),
      },
      {
        id: "ten",
        accessorKey: "ten",
        header: "Tên cơ sở y tế",
        size: 340,
        meta: { width: "38%" },
        cell: ({ row }) => (
          <div className="min-w-0 pr-2">
            <div className="font-bold text-[var(--ink)] text-[14px] flex items-center gap-1.5 truncate">
              <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{row.original.ten}</span>
            </div>
            <div className="text-[12px] text-[var(--mute)] truncate mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{row.original.diaChi || "Chưa có địa chỉ"}</span>
            </div>
          </div>
        ),
      },
      {
        id: "bhxh",
        header: "Cấu hình BHYT",
        size: 260,
        meta: { width: "27%" },
        enableSorting: false,
        cell: ({ row }) => {
          const hasBhxh = Boolean(row.original.bhxhUser && row.original.bhxhPass);
          return hasBhxh ? (
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Mã CSKCB: {row.original.bhxhMaCSKCB || "Đã lưu"}</span>
              </div>
              <div className="text-[11.5px] text-slate-500 font-mono truncate pl-1">
                TK: {row.original.bhxhUser} {row.original.bhxhHoTenCB ? `• ${row.original.bhxhHoTenCB}` : ""}
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
              Chưa cấu hình
            </span>
          );
        },
      },
      {
        id: "his",
        header: "Kết nối HIS",
        size: 260,
        meta: { width: "25%" },
        enableSorting: false,
        cell: ({ row }) => {
          const hasHis = Boolean(row.original.hisHost && row.original.hisDbName);
          return hasHis ? (
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                <Server className="w-3 h-3 text-blue-600" />
                <span className="font-mono">{row.original.hisDbName}</span>
              </div>
              <div className="text-[11.5px] text-slate-500 font-mono truncate pl-1">
                {row.original.hisHost}:{row.original.hisPort || "1433"}
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
              Chưa kết nối
            </span>
          );
        },
      },
      {
        id: "trangThai",
        accessorKey: "trangThai",
        header: "Trạng thái",
        size: 130,
        meta: { align: "center", width: "130px" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.trangThai === "active" ? (
              <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
            ) : (
              <StatusBadge label="Đã khóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 90,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right", width: "90px" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setModal({ type: "coso", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)] transition-colors"
              title="Sửa cấu hình cơ sở"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {!isIT && (
              <button
                type="button"
                onClick={() => lockCoso(row.original.id)}
                className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)] transition-colors"
                title="Xóa cơ sở"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isIT, selectedCosos, displayedCosos]
  );

  // Cột bảng Tài khoản (Tối ưu chuẩn VISIHUB)
  const userColumns = useMemo<ColumnDef<NguoiDung>[]>(
    () => [
      {
        id: "sel",
        size: 44,
        enableSorting: false,
        enableResizing: false,
        meta: { width: "44px" },
        header: () => (
          <input
            type="checkbox"
            className={checkboxCls}
            checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
            onChange={(e) =>
              setSelectedUsers(e.target.checked ? new Set(filteredUsers.map((u) => u.maNV)) : new Set())
            }
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            data-no-row-click
            className={checkboxCls}
            checked={selectedUsers.has(row.original.maNV)}
            onChange={(e) => {
              const n = new Set(selectedUsers);
              if (e.target.checked) n.add(row.original.maNV);
              else n.delete(row.original.maNV);
              setSelectedUsers(n);
            }}
          />
        ),
      },
      {
        id: "maNV",
        accessorKey: "maNV",
        header: "Mã NV",
        size: 95,
        meta: { align: "center", width: "95px" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span className="font-mono font-bold text-[12px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/80 whitespace-nowrap">
              {row.original.maNV}
            </span>
          </div>
        ),
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Họ và tên",
        size: 260,
        meta: { width: "28%" },
        cell: ({ row }) => {
          const email = row.original.loiMoi?.email;
          return (
            <div className="min-w-0 pr-2">
              <div className="font-bold text-[var(--ink)] text-[14px] flex items-center gap-1.5 truncate">
                <span className="truncate">{row.original.hoTen}</span>
              </div>
              <div className="text-[12px] text-[var(--mute)] font-mono flex items-center gap-1.5 mt-0.5 truncate">
                <span className="text-teal-700 font-semibold">@{row.original.tenDangNhap}</span>
                {email && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[var(--ink-soft)] font-sans truncate">{email}</span>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "vaiTro",
        accessorKey: "vaiTro",
        header: "Vai trò",
        size: 150,
        meta: { width: "150px" },
        cell: ({ row }) => {
          const badge = ROLE_BADGES[row.original.vaiTro] || {
            label: roleLabel(row.original.vaiTro),
            cls: "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]",
          };
          return (
            <span
              className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${badge.cls}`}
            >
              {badge.label}
            </span>
          );
        },
      },
      {
        id: "coSo",
        header: "Đơn vị làm việc",
        size: 220,
        meta: { width: "24%" },
        accessorFn: (u) => u.coSo?.ten || "Toàn hệ thống",
        cell: ({ getValue }) => (
          <span className="text-[var(--ink-soft)] font-medium text-[13px] truncate block">{String(getValue())}</span>
        ),
      },
      {
        id: "trang_thai_moi",
        header: "Thư mời (SMTP)",
        size: 240,
        meta: { width: "24%" },
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          const loiMoi = u.loiMoi;

          if (loiMoi?.ok) {
            return (
              <div className="flex items-center gap-1.5" data-no-row-click>
                <span
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/40 whitespace-nowrap"
                  title={`Đã gửi thư mời lúc: ${fmtTime(loiMoi.thoiDiem)}${loiMoi.email ? ` tới ${loiMoi.email}` : ""}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
                  Đã gửi email
                </span>
                <button
                  type="button"
                  onClick={() => setInviteModal(u)}
                  className="p-1 rounded text-[var(--mute)] hover:text-[var(--navy)] hover:bg-[var(--navy-50)] transition-colors"
                  title="Gửi lại thư mời"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          if (loiMoi && !loiMoi.ok) {
            return (
              <div className="flex items-center gap-1.5" data-no-row-click>
                <span
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)]/40 whitespace-nowrap"
                  title={`Lỗi gửi: ${loiMoi.loi || "Không rõ nguyên nhân"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--rose)]" />
                  Lỗi gửi thư
                </span>
                <button
                  type="button"
                  onClick={() => setInviteModal(u)}
                  className="p-1 rounded text-[var(--rose)] hover:bg-[var(--rose-soft)] transition-colors"
                  title="Thử gửi lại"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2" data-no-row-click>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-hover)] text-[var(--mute)] border border-[var(--line)] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Chưa gửi mail
              </span>
              <button
                type="button"
                onClick={() => setInviteModal(u)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition-all shadow-xs"
                title="Gửi email mời tham gia qua SMTP no-reply@visicare.com.vn"
              >
                <Send className="w-3 h-3" />
                <span>Gửi</span>
              </button>
            </div>
          );
        },
      },
      {
        id: "trangThai",
        accessorKey: "trangThai",
        header: "Trạng thái",
        size: 120,
        meta: { align: "center", width: "120px" },
        cell: ({ row }) =>
          row.original.trangThai === "active" ? (
            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Đã khóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 110,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right", width: "110px" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setInviteModal(row.original)}
              className="p-1.5 rounded-md text-[var(--navy)] hover:bg-[var(--navy-50)] transition-colors"
              title="Gửi email mời tham gia"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setModal({ type: "user", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)] transition-colors"
              title="Chỉnh sửa tài khoản"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => lockUser(row.original.maNV)}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)] transition-colors"
              title="Xóa tài khoản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUsers, filteredUsers]
  );

  // Cột bảng Bác sĩ
  const bacsiColumns = useMemo<ColumnDef<NguoiDung>[]>(
    () => [
      {
        id: "maNV",
        accessorKey: "maNV",
        header: "Mã Bác sĩ",
        size: 110,
        meta: { align: "center", width: "110px" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span className="font-mono font-bold text-[12px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/80 whitespace-nowrap">
              {row.original.maNV}
            </span>
          </div>
        ),
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Họ và Tên Bác sĩ",
        size: 280,
        meta: { width: "36%" },
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] font-bold text-xs flex items-center justify-center shrink-0">
              BS
            </div>
            <span className="font-bold text-[var(--ink)] text-[14px] truncate">{row.original.hoTen}</span>
          </div>
        ),
      },
      {
        id: "coSo",
        header: "Cơ sở làm việc",
        size: 260,
        meta: { width: "34%" },
        accessorFn: (u) => u.coSo?.ten || "Toàn hệ thống",
        cell: ({ getValue }) => <span className="text-[var(--ink-soft)] font-medium text-[13px] truncate block">{String(getValue())}</span>,
      },
      {
        id: "nguon",
        header: "Nguồn dữ liệu",
        size: 170,
        meta: { width: "170px" },
        enableSorting: false,
        cell: ({ row }) => {
          const isHis = row.original.maNV.startsWith("HIS-") || row.original.tenDangNhap.startsWith("his_");
          return isHis ? (
            <StatusBadge label="Từ HIS (DMNhanSu)" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Nhập thủ công" cls="bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]" sm />
          );
        },
      },
      {
        id: "trangThai",
        accessorKey: "trangThai",
        header: "Trạng thái",
        size: 130,
        meta: { align: "center", width: "130px" },
        cell: ({ row }) =>
          row.original.trangThai === "active" ? (
            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Đã khóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right", width: "100px" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setModal({ type: "user", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)] transition-colors"
              title="Sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => lockUser(row.original.maNV)}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)] transition-colors"
              title="Xóa bác sĩ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Cột bảng Audit
  const auditColumns = useMemo<ColumnDef<Audit>[]>(
    () => [
      {
        id: "thoiDiem",
        header: "Thời điểm",
        size: 165,
        meta: { width: "165px" },
        accessorFn: (a) => (a.thoiDiem ? new Date(a.thoiDiem).getTime() : 0),
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] text-[var(--mute)] whitespace-nowrap">{fmtTime(row.original.thoiDiem)}</span>
        ),
      },
      {
        id: "nguoiDung",
        accessorKey: "nguoiDung",
        header: "Người thực hiện",
        size: 150,
        meta: { width: "150px" },
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--navy)] whitespace-nowrap">{row.original.nguoiDung}</span>
        ),
      },
      {
        id: "hanhDong",
        accessorKey: "hanhDong",
        header: "Hành động",
        size: 145,
        meta: { align: "center", width: "145px" },
        cell: ({ row }) => {
          const hd = row.original.hanhDong;
          const isEmail = hd === "gui_email_moi";
          return (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                isEmail
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : hd === "them"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : hd === "xoa"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-[var(--surface-hover)] text-[var(--ink-soft)] border-[var(--line)]"
              }`}
            >
              {isEmail ? "Gửi thư mời" : hd}
            </span>
          );
        },
      },
      {
        id: "bang",
        accessorKey: "bang",
        header: "Đối tượng",
        size: 140,
        meta: { width: "140px" },
        cell: ({ row }) => <span className="text-[var(--ink-soft)] font-mono text-[12px]">{row.original.bang}</span>,
      },
      {
        id: "banGhiId",
        accessorKey: "banGhiId",
        header: "Mã bản ghi",
        size: 130,
        meta: { align: "center", width: "130px" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span className="font-mono text-[12px] font-bold text-[var(--teal-deep)]">{row.original.banGhiId}</span>
          </div>
        ),
      },
      {
        id: "thayDoi",
        header: "Chi tiết thay đổi",
        size: 360,
        meta: { width: "42%" },
        enableSorting: false,
        cell: ({ row }) => {
          const raw = row.original.thayDoi;
          if (!raw) return <span className="text-[var(--mute)] text-[12px]">—</span>;
          try {
            const parsed = JSON.parse(raw);
            if (row.original.hanhDong === "gui_email_moi") {
              return (
                <div className="text-[12px] text-[var(--ink-soft)] truncate" title={raw}>
                  Email: <span className="font-bold text-[var(--navy)]">{parsed.email}</span> · {parsed.ok ? "Thành công" : `Lỗi: ${parsed.loi}`}
                </div>
              );
            }
            return (
              <span className="font-mono text-[11px] text-[var(--mute)] truncate block max-w-md" title={raw}>
                {raw}
              </span>
            );
          } catch {
            return <span className="text-[11px] text-[var(--mute)] truncate">{raw}</span>;
          }
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isIT ? "Quản trị tài khoản & Đơn vị" : "Quản trị hệ thống"}
        description={
          isIT
            ? "Quản lý tài khoản nhân sự, gửi thư mời tham gia & danh sách bác sĩ thuộc đơn vị."
            : "Quản trị danh mục cơ sở, phân quyền tài khoản, gửi email thư mời qua máy chủ VISI, và nhật ký kiểm toán."
        }
        guide={
          isIT
            ? [
                { selector: '[data-tour="qt-tabs"]', title: "Chọn mục quản trị", desc: "Dùng các tab: Tài khoản đơn vị, Danh sách Bác sĩ." },
                { title: "Quản lý tài khoản đơn vị", desc: "Tạo tài khoản, gửi thư mời tham gia kèm mật khẩu qua email cho nhân sự." },
                { title: "Danh sách bác sĩ", desc: "Xem và đồng bộ danh sách bác sĩ thuộc cơ sở từ HIS." },
              ]
            : [
                { selector: '[data-tour="qt-tabs"]', title: "Chọn mục quản trị", desc: "Dùng các tab: Cơ sở, Tài khoản, Danh sách Bác sĩ, Google Sheet, Nhật ký." },
                { title: "Gửi thư mời tham gia", desc: "Sử dụng SMTP no-reply@visicare.com.vn để gửi thông tin đăng nhập tự động cho nhân sự." },
                { title: "Đồng bộ Google Sheet", desc: "Quản lý ID bảng tính đồng bộ hồ sơ khám theo từng cơ sở." },
              ]
        }
      />

      {/* Tabs navigation */}
      <div data-tour="qt-tabs" className="flex items-center gap-1.5 bg-white border border-[var(--line)] rounded-2xl p-1.5 w-full sm:w-fit overflow-x-auto hide-scrollbar shadow-xs">
        {availableTabs.map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => changeTab(k as any)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
              tab === k
                ? "bg-[var(--navy)] text-white shadow-sm"
                : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading && users.length === 0 && cosos.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
          <span className="text-[13px] text-[var(--mute)] font-medium">Đang tải dữ liệu quản trị...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ════════════════════════════════════════════════════════════════
              TAB: TÀI KHOẢN (NGƯỜI DÙNG)
             ════════════════════════════════════════════════════════════════ */}
          {tab === "nguoidung" && (
            <div className="space-y-4">
              {/* 4 Thẻ KPI Metrics chuẩn VISIHUB */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Tổng tài khoản</div>
                    <div className="text-[24px] font-extrabold text-[var(--ink)] font-mono leading-tight">{totalUsers}</div>
                    <div className="text-[11px] text-[var(--mute)] mt-0.5">Nhân sự trong phạm vi</div>
                  </div>
                </div>

                <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Đang hoạt động</div>
                    <div className="text-[24px] font-extrabold text-emerald-600 font-mono leading-tight">{activeUsers}</div>
                    <div className="text-[11px] text-[var(--mute)] mt-0.5">Trạng thái active</div>
                  </div>
                </div>

                <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Đã gửi thư mời</div>
                    <div className="text-[24px] font-extrabold text-[var(--teal-deep)] font-mono leading-tight">
                      {totalEmailSent}
                      <span className="text-xs font-normal text-[var(--mute)] ml-1 font-sans">
                        ({totalUsers > 0 ? Math.round((totalEmailSent / totalUsers) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--mute)] mt-0.5">Đã gửi email thông tin</div>
                  </div>
                </div>

                <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Chưa gửi thư mời</div>
                    <div className="text-[24px] font-extrabold text-amber-600 font-mono leading-tight">{totalNotSent}</div>
                    <div className="text-[11px] text-[var(--mute)] mt-0.5">Cần gửi thông tin đăng nhập</div>
                  </div>
                </div>
              </div>

              {/* Banner Máy chủ SMTP (no-reply@visicare.com.vn) */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-teal-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--navy)] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[var(--navy)]/20">
                    <Mail className="w-5 h-5 text-[var(--teal)]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-[var(--ink)]">Cổng gửi Email thư mời (SMTP Gateway)</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sẵn sàng gửi
                      </span>
                    </div>
                    <div className="text-[12.5px] text-[var(--ink-soft)] flex flex-wrap items-center gap-y-1 gap-x-2">
                      <span>Máy chủ: <strong className="font-mono text-[var(--navy)]">{smtpStatus?.host || "mail.visicare.com.vn"}:{smtpStatus?.port || 465} (SSL)</strong></span>
                      <span className="text-[var(--mute)]">•</span>
                      <span>Tài khoản: <strong className="font-mono text-[var(--navy)]">{smtpStatus?.from || "no-reply@visicare.com.vn"}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={checkSmtpConnection}
                    disabled={checkingSmtp}
                    className="btn btn-secondary px-3.5 py-2 text-[12.5px] font-bold rounded-xl"
                    title="Kiểm tra kết nối tới mail.visicare.com.vn"
                  >
                    {checkingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5 text-[var(--teal)]" />}
                    <span>Kiểm tra kết nối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmtpTestModal(true)}
                    className="btn px-3.5 py-2 text-[12.5px] font-bold bg-[var(--navy)] text-white hover:bg-[#021370] rounded-xl shadow-xs"
                    title="Gửi thư thử nghiệm"
                  >
                    <Send className="w-3.5 h-3.5 text-[var(--teal)]" />
                    <span>Gửi thử nghiệm</span>
                  </button>
                </div>
              </div>

              {/* DataToolbar: Tìm kiếm, Bộ lọc và Thao tác hàng loạt */}
              <div className="bg-white border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Tìm tên, mã nhân viên, đăng nhập, email..."
                        className="input-field pl-9 pr-8 h-10 text-[13px] w-full rounded-xl"
                      />
                      {userSearch && (
                        <button
                          type="button"
                          onClick={() => setUserSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Vai trò */}
                    <div className="relative w-full sm:w-44">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="input-field h-10 text-[12.5px] w-full font-medium bg-white cursor-pointer pr-8 rounded-xl appearance-none"
                      >
                        <option value="">Tất cả vai trò</option>
                        {(isIT ? IT_ROLES : ALL_ROLES).map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Filter Cơ sở (cho Master) */}
                    {!isIT && (
                      <div className="relative w-full sm:w-48">
                        <select
                          value={userCosoFilter}
                          onChange={(e) => setUserCosoFilter(e.target.value)}
                          className="input-field h-10 text-[12.5px] w-full font-medium bg-white cursor-pointer pr-8 rounded-xl appearance-none"
                        >
                          <option value="">Tất cả cơ sở</option>
                          {cosos
                            .filter((c) => c.trangThai === "active")
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.ten}
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}

                    {/* Filter Trạng thái Email */}
                    <div className="relative w-full sm:w-44">
                      <select
                        value={userEmailFilter}
                        onChange={(e) => setUserEmailFilter(e.target.value as any)}
                        className="input-field h-10 text-[12.5px] w-full font-medium bg-white cursor-pointer pr-8 rounded-xl appearance-none"
                      >
                        <option value="">Tất cả thư mời</option>
                        <option value="da_gui">Đã gửi email</option>
                        <option value="chua_gui">Chưa gửi mail</option>
                        <option value="loi">Lỗi gửi thư</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Actions: Add / Bulk */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setModal({ type: "user" })}
                      className="btn btn-primary px-4 py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 rounded-xl shadow-sm whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 text-[var(--teal)] stroke-[3]" />
                      <span>Thêm tài khoản</span>
                    </button>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[var(--line-soft)] bg-[var(--surface-soft)] p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--teal)]" />
                      <span className="text-[13px] font-bold text-[var(--ink)]">
                        Đã chọn <strong className="text-[var(--navy)] font-mono">{selectedUsers.size}</strong> tài khoản
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkInviteModal(true)}
                        className="btn px-3.5 py-1.5 text-[12.5px] font-bold bg-[var(--navy)] text-white hover:bg-[#021370] rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-[var(--teal)]" />
                        <span>Gửi thư mời hàng loạt ({selectedUsers.size})</span>
                      </button>
                      <button
                        type="button"
                        onClick={bulkDeleteUsers}
                        className="btn px-3.5 py-1.5 text-[12.5px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ({selectedUsers.size})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUsers(new Set())}
                        className="text-[12px] text-[var(--mute)] hover:underline ml-1"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bảng dữ liệu tài khoản */}
              <div className="card p-0 overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="py-16 text-center text-[var(--mute)] text-[13px]">
                      Không tìm thấy tài khoản nào khớp bộ lọc.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const loiMoi = u.loiMoi;
                      return (
                        <div key={u.maNV} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                className={checkboxCls}
                                checked={selectedUsers.has(u.maNV)}
                                onChange={(e) => {
                                  const n = new Set(selectedUsers);
                                  if (e.target.checked) n.add(u.maNV);
                                  else n.delete(u.maNV);
                                  setSelectedUsers(n);
                                }}
                              />
                              <div>
                                <span className="font-bold text-[14.5px] text-[var(--ink)]">{u.hoTen}</span>
                                <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] ml-2">
                                  {u.maNV}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                ROLE_BADGES[u.vaiTro]?.cls || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {roleLabel(u.vaiTro)}
                            </span>
                          </div>

                          <div className="text-[12px] text-[var(--mute)] flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[var(--navy)]">@{u.tenDangNhap}</span>
                            <span>•</span>
                            <span>{u.coSo?.ten || "Toàn hệ thống"}</span>
                            {loiMoi?.email && (
                              <>
                                <span>•</span>
                                <span className="text-[var(--ink)]">{loiMoi.email}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--line-soft)]">
                            <div>
                              {loiMoi?.ok ? (
                                <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-teal-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                  Đã gửi thư mời
                                </span>
                              ) : (
                                <span className="text-[11.5px] text-[var(--mute)]">Chưa gửi thư mời</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInviteModal(u)}
                                className="btn px-2.5 py-1 text-xs text-[var(--navy)] bg-[var(--navy-50)] rounded-md font-bold flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Mời</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setModal({ type: "user", rec: u })}
                                className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => lockUser(u.maNV)}
                                className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop: DataTable */}
                <div className="hidden md:block">
                  <DataView<NguoiDung, unknown> columns={userColumns} data={filteredUsers} pageSize={50}>
                    <DataTable<NguoiDung> dense emptyIcon={Users} emptyTitle="Không có tài khoản nào" />
                  </DataView>
                </div>

                <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium flex justify-between items-center">
                  <span>
                    Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filteredUsers.length}</span> /{" "}
                    <span className="font-mono font-bold text-[var(--ink)]">{regularUsers.length}</span> tài khoản
                  </span>
                  <span className="text-[11.5px]">Máy chủ SMTP: mail.visicare.com.vn:465</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB: CƠ SỞ Y TẾ
             ════════════════════════════════════════════════════════════════ */}
          {tab === "coso" && (
            <div className="space-y-4">
              <div className="flex flex-col-reverse sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {selectedCosos.size > 0 && !isIT && (
                    <button
                      onClick={bulkDeleteCosos}
                      className="btn w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-xl shadow-xs transition-colors flex justify-center items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa {selectedCosos.size} đã chọn
                    </button>
                  )}
                </div>
                {!isIT && (
                  <button
                    onClick={() => setModal({ type: "coso" })}
                    className="btn btn-primary w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold flex justify-center items-center gap-2 rounded-xl shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-[var(--teal)] stroke-[3]" /> Thêm cơ sở y tế
                  </button>
                )}
              </div>

              <div data-tour="qt-table" className="card p-0 overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
                {/* Mobile */}
                <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                  {displayedCosos.length === 0 ? (
                    <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có cơ sở nào.</div>
                  ) : (
                    displayedCosos.map((c) => (
                      <div key={c.id} className="p-4 flex items-start gap-3">
                        {!isIT && (
                          <input
                            type="checkbox"
                            className={checkboxCls}
                            checked={selectedCosos.has(c.id)}
                            onChange={(e) => {
                              const n = new Set(selectedCosos);
                              if (e.target.checked) n.add(c.id);
                              else n.delete(c.id);
                              setSelectedCosos(n);
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[14px] text-[var(--ink)]">{c.ten}</span>
                            <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)]">{c.id}</span>
                          </div>
                          <div className="text-[12px] text-[var(--mute)] break-words">{c.diaChi || "—"}</div>
                          {c.trangThai === "active" ? (
                            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
                          ) : (
                            <StatusBadge label="Đã khóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setModal({ type: "coso", rec: c })}
                            className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
                            title="Sửa cấu hình"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!isIT && (
                            <button
                              onClick={() => lockCoso(c.id)}
                              className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"
                              title="Xóa cơ sở"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop */}
                <div className="hidden md:block">
                  <DataView<CoSo, unknown> columns={cosoColumns} data={displayedCosos} pageSize={50}>
                    <DataTable<CoSo> dense emptyIcon={Building2} emptyTitle="Chưa có cơ sở nào" />
                  </DataView>
                </div>
                <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                  {isIT
                    ? `Đơn vị của bạn: ${displayedCosos[0]?.ten || session?.user?.coSoId || ""}`
                    : <>Tổng số <span className="font-mono font-bold text-[var(--ink)]">{displayedCosos.length}</span> cơ sở y tế</>}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB: DANH SÁCH BÁC SĨ
             ════════════════════════════════════════════════════════════════ */}
          {tab === "bacsi" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={bacsiSearch}
                      onChange={(e) => setBacsiSearch(e.target.value)}
                      placeholder="Tìm theo tên hoặc mã bác sĩ..."
                      className="input-field pl-9 pr-3 h-10 text-[13px] w-full rounded-xl"
                    />
                  </div>
                  {!isIT && (
                    <div className="relative w-full sm:w-48">
                      <select
                        value={bacsiFilterCoso}
                        onChange={(e) => setBacsiFilterCoso(e.target.value)}
                        className="input-field h-10 text-[12.5px] w-full font-medium bg-white cursor-pointer pr-8 rounded-xl appearance-none"
                      >
                        <option value="">Tất cả cơ sở</option>
                        {cosos
                          .filter((c) => c.trangThai === "active")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.ten}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      setSyncingBacSi(true);
                      try {
                        const res = await fetch("/api/csr/bacsi", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            coSoId: isIT ? session?.user?.coSoId || null : bacsiFilterCoso || null,
                          }),
                        });
                        const data = await res.json();
                        if (data.ok) {
                          addToast({ type: "success", message: `Đã đồng bộ ${data.syncedCount} bác sĩ từ HIS DMNhanSu` });
                          load(true);
                        } else {
                          addToast({ type: "error", message: data.error || "Lỗi đồng bộ HIS" });
                        }
                      } catch {
                        addToast({ type: "error", message: "Lỗi kết nối đồng bộ HIS" });
                      } finally {
                        setSyncingBacSi(false);
                      }
                    }}
                    disabled={syncingBacSi}
                    className="btn px-4 py-2.5 text-[13px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    {syncingBacSi ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Đồng bộ từ HIS DMNhanSu</span>
                  </button>
                  <button
                    onClick={() =>
                      setModal({
                        type: "user",
                        rec: {
                          vaiTro: "BacSi",
                          maNV: "",
                          hoTen: "",
                          tenDangNhap: "",
                          trangThai: "active",
                          coSoId: bacsiFilterCoso || null,
                        } as any,
                      })
                    }
                    className="btn btn-primary px-4 py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 text-[var(--teal)] stroke-[3]" />
                    <span>Thêm Bác sĩ</span>
                  </button>
                </div>
              </div>

              <div className="card p-0 overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
                <div className="hidden md:block">
                  <DataView<NguoiDung, unknown> columns={bacsiColumns} data={doctorUsers} pageSize={50}>
                    <DataTable<NguoiDung>
                      dense
                      emptyIcon={Stethoscope}
                      emptyTitle="Chưa có bác sĩ nào"
                      emptyDesc="Không có bác sĩ khớp bộ lọc hoặc chưa đồng bộ từ HIS DMNhanSu."
                    />
                  </DataView>
                </div>
                <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium flex justify-between items-center">
                  <span>Tổng số <span className="font-mono font-bold text-[var(--ink)]">{doctorUsers.length}</span> bác sĩ</span>
                  <span>Đồng bộ từ <span className="font-bold text-[var(--teal-deep)]">HIS DMNhanSu</span></span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB: NHẬT KÝ KIỂM TOÁN (AUDIT LOG)
             ════════════════════════════════════════════════════════════════ */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[var(--line)] shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Tìm nhật ký theo người dùng, bảng, bản ghi..."
                      className="input-field pl-9 pr-3 h-10 text-[13px] w-full rounded-xl"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <select
                      value={auditFilterHanhDong}
                      onChange={(e) => setAuditFilterHanhDong(e.target.value)}
                      className="input-field h-10 text-[12.5px] w-full font-medium bg-white cursor-pointer pr-8 rounded-xl appearance-none"
                    >
                      <option value="">Tất cả hành động</option>
                      <option value="gui_email_moi">Gửi thư mời</option>
                      <option value="them">Thêm bản ghi</option>
                      <option value="sua">Chỉnh sửa</option>
                      <option value="xoa">Xóa dữ liệu</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="text-[12px] text-[var(--mute)] font-medium px-2">
                  Tổng cộng: <strong className="text-[var(--ink)] font-mono">{filteredAudits.length}</strong> sự kiện
                </div>
              </div>

              <div className="card p-0 overflow-hidden rounded-2xl border border-[var(--line)] shadow-xs">
                <div className="hidden md:block">
                  <DataView<Audit, unknown> columns={auditColumns} data={filteredAudits} pageSize={50}>
                    <DataTable<Audit> dense emptyIcon={ScrollText} emptyTitle="Chưa có nhật ký kiểm toán" />
                  </DataView>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB: GOOGLE SHEET
             ════════════════════════════════════════════════════════════════ */}
          {tab === "gsheet" && <GoogleSheetPanel />}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════ */}
      {modal?.type === "coso" && (
        <CoSoModal
          cosos={cosos}
          edit={modal.rec as CoSo | undefined}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {modal?.type === "user" && (
        <UserModal
          cosos={cosos}
          users={users}
          edit={modal.rec as NguoiDung | undefined}
          isIT={isIT}
          userCoSoId={session?.user?.coSoId}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load(true);
          }}
        />
      )}

      {inviteModal && (
        <InviteUserModal
          user={inviteModal}
          onClose={() => setInviteModal(null)}
          onDone={() => {
            setInviteModal(null);
            load(true);
          }}
        />
      )}

      {bulkInviteModal && (
        <BulkInviteModal
          users={regularUsers.filter((u) => selectedUsers.has(u.maNV))}
          onClose={() => setBulkInviteModal(false)}
          onDone={() => {
            setBulkInviteModal(false);
            setSelectedUsers(new Set());
            load(true);
          }}
        />
      )}

      {smtpTestModal && (
        <SmtpTestModal onClose={() => setSmtpTestModal(false)} />
      )}

      {confirmDialog && (
        <Modal open={true} title={confirmDialog.title} onClose={() => setConfirmDialog(null)} maxWidth="w-[95%] max-w-[460px]">
          <div className="py-2">
            <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--line-soft)]">
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">
                Hủy bỏ
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="btn px-5 py-2.5 font-bold text-white bg-[var(--rose)] hover:bg-[#e11d48] rounded-xl shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal Gửi thư mời tham gia cho 1 tài khoản (InviteUserModal) ───
function InviteUserModal({
  user,
  onClose,
  onDone,
}: {
  user: NguoiDung;
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [email, setEmail] = useState(user.loiMoi?.email || "");
  const [capMatKhauMoi, setCapMatKhauMoi] = useState(true);
  const [matKhau, setMatKhau] = useState(generateTempPassword());
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const refreshPassword = () => {
    setMatKhau(generateTempPassword());
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setErr("Vui lòng nhập địa chỉ email nhận thư hợp lệ.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/csr/nguoidung/${user.maNV}/moi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          capMatKhauMoi,
          matKhau: capMatKhauMoi ? matKhau : undefined,
        }),
      });
      const d = await res.json();
      setSending(false);
      if (!res.ok) {
        setErr(d.error || "Gửi email thất bại");
        return;
      }
      addToast({
        type: "success",
        title: "Đã gửi thư mời thành công!",
        message: `Đã gửi thông tin đăng nhập tới ${targetEmail} qua SMTP no-reply@visicare.com.vn.`,
      });
      onDone();
    } catch {
      setSending(false);
      setErr("Lỗi kết nối máy chủ khi gửi email.");
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Gửi email mời tham gia hệ thống"
      subtitle="Gửi thông tin đăng nhập tự động qua máy chủ mail VISI"
      icon={Mail}
      maxWidth="w-[95%] max-w-[560px]"
      noPadding
    >
      <form onSubmit={handleSend} className="p-5 sm:p-7 space-y-5 bg-white">
        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[13px] font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Card Tóm tắt nhân sự — Chuẩn VISIHUB */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-teal-50/20 border border-slate-200/90 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[#020f5c] text-white flex items-center justify-center font-bold text-[15px] shadow-sm shadow-[var(--navy)]/30 shrink-0">
            {user.hoTen
              .trim()
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(-2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[15px] text-slate-900 truncate">{user.hoTen}</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                {user.maNV}
              </span>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                @{user.tenDangNhap}
              </span>
            </div>
            <div className="text-[12px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>{roleLabel(user.vaiTro)}</span>
              <span>•</span>
              <span>{user.coSo?.ten || "Toàn hệ thống"}</span>
            </div>
          </div>
        </div>

        {/* Ô nhập Email */}
        <div>
          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
            Địa chỉ Email nhận thư mời <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="VD: nguyenvana@visicare.com.vn"
              className="input-field pl-9 pr-3 h-10 font-medium text-[13.5px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <p className="text-[11.5px] text-slate-400 mt-1">
            Email cá nhân hoặc công vụ của nhân sự để nhận thông tin đăng nhập tự động
          </p>
        </div>

        {/* Tùy chọn Mật khẩu tạm */}
        <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={capMatKhauMoi}
              onChange={(e) => setCapMatKhauMoi(e.target.checked)}
              className="mt-0.5 rounded-[4px] border-slate-300 text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer"
            />
            <div>
              <div className="text-[13px] font-bold text-slate-900">Cấp mật khẩu tạm mới & gửi kèm thư mời</div>
              <div className="text-[11.5px] text-slate-500">
                Nếu tắt, thư mời sẽ hướng dẫn người dùng đăng nhập bằng mật khẩu cũ đã được cấp.
              </div>
            </div>
          </label>

          {capMatKhauMoi && (
            <div className="space-y-2 pt-1 pl-6">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                    className="input-field pl-9 pr-3 h-9.5 font-mono text-[13px] font-bold text-slate-900 w-full rounded-xl bg-white border-slate-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={refreshPassword}
                  className="btn btn-secondary px-3 py-2 text-[12px] font-bold rounded-xl shrink-0 flex items-center gap-1.5"
                  title="Sinh mật khẩu khác"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đổi mã</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-800 leading-relaxed">
                <strong>Lưu ý:</strong> Mật khẩu này sẽ được đồng bộ ngay vào tài khoản khi gửi thư thành công.
              </div>
            </div>
          )}
        </div>

        {/* Khối nguồn gửi */}
        <div className="text-[12px] text-slate-500 flex items-center justify-between px-1">
          <span>Gửi từ: <strong className="font-mono text-slate-800">no-reply@visicare.com.vn</strong></span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SSL Port 465
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={sending}
            className="btn btn-primary px-7 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
            <span>{sending ? "Đang gửi thư..." : "Gửi thư mời qua Email"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Gửi thư mời hàng loạt (BulkInviteModal) ───
function BulkInviteModal({
  users,
  onClose,
  onDone,
}: {
  users: NguoiDung[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [emails, setEmails] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.maNV] = u.loiMoi?.email || "";
    });
    return map;
  });
  const [capMatKhauMoi, setCapMatKhauMoi] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const handleBulkSend = async () => {
    setErr("");
    const targets = users.map((u) => ({
      maNV: u.maNV,
      email: (emails[u.maNV] || "").trim().toLowerCase(),
      capMatKhauMoi,
    }));

    const invalid = targets.filter((t) => !t.email || !t.email.includes("@"));
    if (invalid.length > 0) {
      setErr(`Còn ${invalid.length} tài khoản chưa nhập địa chỉ email hợp lệ. Vui lòng kiểm tra lại.`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/csr/nguoidung/bulk-moi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      });
      const data = await res.json();
      setSending(false);
      if (!res.ok) {
        setErr(data.error || "Lỗi gửi hàng loạt");
        return;
      }
      addToast({
        type: data.failCount === 0 ? "success" : "info",
        title: "Hoàn tất gửi thư mời hàng loạt",
        message: `Đã gửi thành công ${data.successCount}/${data.total} tài khoản.${
          data.failCount > 0 ? ` Có ${data.failCount} tài khoản lỗi.` : ""
        }`,
      });
      onDone();
    } catch {
      setSending(false);
      setErr("Lỗi kết nối khi gửi hàng loạt.");
    }
  };

  const readyCount = users.filter((u) => Boolean(emails[u.maNV]?.includes("@"))).length;
  const missingCount = users.length - readyCount;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Gửi thư mời hàng loạt (${users.length} tài khoản)`}
      subtitle="Gửi thông tin đăng nhập tự động qua SMTP no-reply@visicare.com.vn"
      icon={Send}
      maxWidth="w-[95%] max-w-[760px]"
      noPadding
    >
      <div className="p-5 sm:p-7 space-y-5 bg-white">
        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[13px] font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Thẻ đếm trạng thái email & tùy chọn mật khẩu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={capMatKhauMoi}
              onChange={(e) => setCapMatKhauMoi(e.target.checked)}
              className="rounded-[4px] border-slate-300 text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-[13px] font-bold text-slate-900">
                Tự động sinh mật khẩu tạm ngẫu nhiên cho từng nhân sự
              </span>
              <p className="text-[11.5px] text-slate-500">Mỗi nhân sự sẽ nhận được mật khẩu tạm riêng biệt</p>
            </div>
          </label>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>{readyCount} đã có email</span>
            </span>
            {missingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span>{missingCount} chưa có</span>
              </span>
            )}
          </div>
        </div>

        {/* Danh sách tài khoản & ô nhập email */}
        <div className="space-y-2">
          <div className="text-[12px] font-bold text-slate-700 px-1 flex items-center justify-between">
            <span>Danh sách nhân sự được chọn ({users.length})</span>
            <span className="text-[11.5px] font-normal text-slate-400">Vui lòng điền email cho các tài khoản còn thiếu</span>
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-slate-50/40">
            {users.map((u) => {
              const hasEmail = Boolean(emails[u.maNV]?.includes("@"));
              return (
                <div
                  key={u.maNV}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                      {u.hoTen
                        .trim()
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join("")
                        .slice(-2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[13.5px] text-slate-900 truncate">{u.hoTen}</span>
                        <span className="font-mono text-[11px] font-bold text-teal-700 px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                          {u.maNV}
                        </span>
                        <span className="font-mono text-[11px] text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          @{u.tenDangNhap}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 mt-0.5">
                        {roleLabel(u.vaiTro)} · {u.coSo?.ten || "Toàn hệ thống"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-72 shrink-0">
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={emails[u.maNV] || ""}
                        onChange={(e) =>
                          setEmails((p) => ({ ...p, [u.maNV]: e.target.value }))
                        }
                        placeholder="Nhập email nhận..."
                        className={`input-field pl-8.5 pr-3 h-9 text-[12.5px] w-full rounded-xl bg-white ${
                          !hasEmail
                            ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200 bg-amber-50/20"
                            : "border-slate-200 focus:border-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-[12px] text-slate-500">
            Gửi qua: <strong className="font-mono text-slate-800">no-reply@visicare.com.vn</strong> (SSL 465)
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleBulkSend}
              disabled={sending}
              className="btn btn-primary px-7 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
              <span>{sending ? "Đang gửi thư mời..." : `Bắt đầu gửi (${users.length} tài khoản)`}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Kiểm tra cấu hình & gửi email thử nghiệm (SmtpTestModal) ───
function SmtpTestModal({ onClose }: { onClose: () => void }) {
  const { addToast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setSending(true);
    try {
      const res = await fetch("/api/csr/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      setSending(false);
      if (res.ok) {
        setResult({ ok: true, message: data.message || "Gửi thư thử nghiệm thành công!" });
        addToast({ type: "success", message: "Đã gửi email thử nghiệm thành công!" });
      } else {
        setResult({ ok: false, message: data.error || "Gửi thất bại" });
      }
    } catch {
      setSending(false);
      setResult({ ok: false, message: "Lỗi kết nối máy chủ." });
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Thử nghiệm máy chủ SMTP Mail"
      subtitle="Gửi thử nghiệm qua mail.visicare.com.vn (no-reply@visicare.com.vn)"
      icon={Server}
      maxWidth="w-[95%] max-w-[500px]"
    >
      <form onSubmit={handleTest} className="space-y-4">
        {result && (
          <div
            className={`p-3.5 rounded-xl border text-[13px] flex items-center gap-2 ${
              result.ok
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{result.message}</span>
          </div>
        )}

        <div>
          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
            Địa chỉ email nhận thử nghiệm <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              placeholder="VD: your-email@gmail.com"
              className="input-field pl-9 pr-3 h-10 text-[13.5px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 font-medium"
            />
          </div>
          <p className="text-[11.5px] text-slate-400 mt-1">
            Hộp thư nhận email thử nghiệm để kiểm tra kết nối và tính tương thích
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[12px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Máy chủ gửi:</span>
            <strong className="font-mono text-slate-900">mail.visicare.com.vn:465 (SSL)</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tài khoản SMTP:</span>
            <strong className="font-mono text-blue-700">no-reply@visicare.com.vn</strong>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">
            Đóng
          </button>
          <button
            type="submit"
            disabled={sending}
            className="btn btn-primary px-6 py-2.5 font-bold rounded-xl shadow-sm flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
            <span>{sending ? "Đang gửi..." : "Gửi thử nghiệm"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Thêm / Sửa tài khoản (UserModal) ───
function UserModal({
  cosos,
  users,
  edit,
  isIT,
  userCoSoId,
  onClose,
  onDone,
}: {
  cosos: CoSo[];
  users: NguoiDung[];
  edit?: NguoiDung;
  isIT?: boolean;
  userCoSoId?: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const isEditing = !!(edit && edit.maNV && edit.maNV.trim() !== "");

  const getPrefix = (role: string) => {
    if (role === "BacSi") return "BS";
    if (role === "IT") return "IT";
    return "NV";
  };

  const getNextMaNV = useCallback(
    (role: string) => {
      const prefix = getPrefix(role);
      let maxNum = 0;
      users.forEach((u) => {
        if (u.maNV && u.maNV.startsWith(prefix)) {
          const match = u.maNV.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      });
      return `${prefix}${String(maxNum + 1).padStart(2, "0")}`;
    },
    [users]
  );

  const initialRole = edit?.vaiTro || "MKT";
  const [vaiTro, setVaiTro] = useState(initialRole);
  const [maNV, setMaNV] = useState(isEditing ? edit!.maNV : getNextMaNV(initialRole));
  const [hoTen, setHoTen] = useState(edit?.hoTen ?? "");
  const [email, setEmail] = useState(edit?.loiMoi?.email ?? "");
  const [guiEmail, setGuiEmail] = useState(!isEditing);
  const [coSoId, setCoSoId] = useState(edit?.coSoId ?? (isIT ? userCoSoId || "" : ""));
  const [tenDangNhap, setTenDangNhap] = useState(edit?.tenDangNhap ?? "");
  const [matKhau, setMatKhau] = useState(!isEditing ? generateTempPassword() : "");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmailNow, setSendingEmailNow] = useState(false);
  const [err, setErr] = useState("");

  const roleOptions = isIT ? IT_ROLES : ALL_ROLES;

  const roleLabels: Record<string, string> = {
    BacSi: "Bác sĩ",
    MKT: "Marketing (MKT)",
    TuVanVien: "Tư vấn viên",
    KeToan: "Kế toán",
    HCNS: "Hành chính Nhân sự (HCNS)",
    IT: "Quản trị viên IT (Đơn vị)",
    QuanLy: "Quản lý (Toàn hệ thống)",
    CSKH: "Marketing (MKT)",
  };

  const handleRoleChange = (newRole: string) => {
    setVaiTro(newRole);
    if (!isEditing) {
      setMaNV(getNextMaNV(newRole));
    }
    if (newRole === "QuanLy") {
      setCoSoId("");
    } else if (isIT && userCoSoId) {
      setCoSoId(userCoSoId);
    }
  };

  const handleSendEmailNow = async () => {
    if (!edit || !email.trim()) {
      addToast({ type: "error", message: "Vui lòng nhập địa chỉ email hợp lệ trước khi gửi." });
      return;
    }
    setSendingEmailNow(true);
    try {
      const res = await fetch(`/api/csr/nguoidung/${edit.maNV}/moi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          capMatKhauMoi: Boolean(matKhau.trim()),
          matKhau: matKhau.trim() || undefined,
        }),
      });
      const d = await res.json();
      setSendingEmailNow(false);
      if (res.ok) {
        addToast({
          type: "success",
          title: "Đã gửi email thành công!",
          message: `Thông tin đăng nhập đã được gửi tới ${email} qua no-reply@visicare.com.vn.`,
        });
        onDone();
      } else {
        addToast({ type: "error", message: d.error || "Gửi email thất bại." });
      }
    } catch {
      setSendingEmailNow(false);
      addToast({ type: "error", message: "Lỗi kết nối khi gửi email." });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!hoTen.trim()) {
      setErr("Vui lòng nhập họ và tên.");
      return;
    }
    if (vaiTro !== "QuanLy" && !isIT && !coSoId) {
      setErr("Vui lòng chọn cơ sở làm việc.");
      return;
    }
    if (!isEditing && !tenDangNhap.trim()) {
      setErr("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!isEditing && !matKhau.trim()) {
      setErr("Vui lòng nhập mật khẩu.");
      return;
    }

    setSaving(true);
    const finalCoSoId = vaiTro === "QuanLy" ? null : isIT ? userCoSoId || coSoId || null : coSoId || null;
    const body = isEditing
      ? { hoTen: hoTen.trim(), vaiTro, coSoId: finalCoSoId, matKhau: matKhau.trim() || undefined }
      : {
          maNV: maNV.trim(),
          hoTen: hoTen.trim(),
          vaiTro,
          coSoId: finalCoSoId,
          tenDangNhap: tenDangNhap.trim().toLowerCase(),
          matKhau: matKhau.trim(),
          email: email.trim() || undefined,
          guiEmail: guiEmail && Boolean(email.trim()),
        };

    try {
      const res = await fetch(isEditing ? `/api/csr/nguoidung/${edit!.maNV}` : "/api/csr/nguoidung", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      setSaving(false);
      if (!res.ok) {
        setErr(d.error || "Lỗi cập nhật");
        return;
      }
      if (d.emailSent) {
        addToast({
          type: "success",
          title: "Tạo tài khoản & Đã gửi email!",
          message: `Đã gửi thông tin đăng nhập tới ${email} qua no-reply@visicare.com.vn.`,
        });
      } else {
        addToast({
          type: "success",
          message: isEditing ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản thành công.",
        });
      }
      onDone();
    } catch {
      setSaving(false);
      setErr("Lỗi kết nối máy chủ");
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa tài khoản" : "Cấp tài khoản người dùng mới"}
      subtitle={
        isEditing
          ? "Cập nhật phân quyền, cơ sở công tác & bảo mật tài khoản"
          : "Cấp quyền truy cập hệ thống và gửi email mời tham gia tự động qua SMTP"
      }
      icon={Users}
      maxWidth="w-[95%] max-w-[780px]"
      noPadding
    >
      <form onSubmit={submit} className="p-5 sm:p-7 space-y-6 bg-white">
        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[13px] font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Thẻ Hero Card thông tin tài khoản khi Edit (Chuẩn VISIHUB) */}
        {isEditing ? (
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar squircle with gradient & initials */}
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[var(--navy)] via-[#0d2a6a] to-[#020f5c] text-white flex items-center justify-center font-bold text-[16px] shadow-sm shadow-[var(--navy)]/30 border-2 border-white">
                    {(hoTen || edit?.hoTen || "NV")
                      .trim()
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join("")
                      .slice(-2)
                      .toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      edit?.trangThai === "active" ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                    title={edit?.trangThai === "active" ? "Đang hoạt động" : "Đã khóa"}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[16.5px] text-slate-900 tracking-tight truncate">
                      {hoTen || edit?.hoTen}
                    </h3>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                      {maNV}
                    </span>
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      @{tenDangNhap}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cosos.find((c) => c.id === (coSoId || edit?.coSoId))?.ten || "Toàn hệ thống"}</span>
                    </span>
                    {email && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{email}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                <span
                  className={`text-[12px] font-bold px-3 py-1 rounded-full border shadow-2xs ${
                    ROLE_BADGES[vaiTro]?.cls || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {roleLabels[vaiTro] || vaiTro}
                </span>
                <StatusBadge
                  label={edit?.trangThai === "active" ? "Hoạt động" : "Đã khóa"}
                  cls={
                    edit?.trangThai === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }
                  sm
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-[12.5px] text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block mb-0.5">Khởi tạo tài khoản nhân sự mới</strong>
              Mã nhân viên được sinh tự động theo quy chuẩn vai trò. Hệ thống sẽ tự động gửi thông tin đăng nhập và hướng dẫn truy cập qua email nhân sự bằng máy chủ SMTP VISI.
            </div>
          </div>
        )}

        {/* Khối 1: Thông tin nhân sự & Email liên hệ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Thông tin nhân sự & Liên hệ
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Bắt buộc họ tên</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Họ và tên nhân sự <span className="text-rose-500">*</span>
              </label>
              <input
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                required
                className="input-field h-10 font-semibold text-[14px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                placeholder="VD: Nguyễn Văn A"
              />
              <p className="text-[11px] text-slate-400 mt-1">Tên đầy đủ hiển thị trên hệ thống và báo cáo</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Email nhận thư mời & tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value && !guiEmail) setGuiEmail(true);
                  }}
                  className="input-field pl-9.5 pr-3 h-10 text-[13.5px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-medium"
                  placeholder="VD: vana@visicare.com.vn"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dùng để gửi thông tin đăng nhập tự động qua SMTP</p>
            </div>
          </div>
        </div>

        {/* Khối 2: Phân quyền & Cơ sở làm việc */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Phân quyền & Cơ sở làm việc
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Vai trò hệ thống <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={vaiTro}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="input-field h-10 w-full font-semibold text-[13.5px] pr-9 bg-white cursor-pointer appearance-none rounded-xl border-slate-200 focus:border-blue-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r] || r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Xác định các quyền và phạm vi dữ liệu được truy cập</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Cơ sở làm việc {vaiTro !== "QuanLy" && <span className="text-rose-500">*</span>}
              </label>
              {isIT ? (
                <div className="input-field h-10 flex items-center bg-slate-100 text-slate-700 font-semibold text-[13px] cursor-not-allowed rounded-xl border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600 mr-2 shrink-0" />
                  <span className="truncate">
                    {cosos.find((c) => c.id === userCoSoId)?.ten || userCoSoId || "Đơn vị hiện tại"}
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={vaiTro === "QuanLy" ? "" : coSoId}
                    disabled={vaiTro === "QuanLy"}
                    onChange={(e) => setCoSoId(e.target.value)}
                    required={vaiTro !== "QuanLy"}
                    className={`input-field h-10 w-full font-semibold text-[13.5px] pr-9 cursor-pointer appearance-none rounded-xl border-slate-200 focus:border-blue-500 ${
                      vaiTro === "QuanLy" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white"
                    }`}
                  >
                    {vaiTro === "QuanLy" ? (
                      <option value="">Toàn hệ thống (Tất cả cơ sở)</option>
                    ) : (
                      <>
                        <option value="">-- Chọn cơ sở làm việc --</option>
                        {cosos
                          .filter((c) => c.trangThai === "active")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.ten}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                {vaiTro === "QuanLy" ? "Vai trò Quản lý có quyền xem dữ liệu toàn hệ thống" : "Đơn vị trực thuộc của nhân sự"}
              </p>
            </div>
          </div>
        </div>

        {/* Khối 3: Thông tin đăng nhập & Bảo mật */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Tài khoản & Mật khẩu đăng nhập
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                {isEditing && (
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  value={tenDangNhap}
                  onChange={(e) => setTenDangNhap(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  required
                  disabled={isEditing}
                  className={`input-field font-mono h-10 w-full rounded-xl text-[13.5px] ${
                    isEditing
                      ? "pl-9 bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                      : "bg-white border-slate-200 focus:border-blue-500"
                  }`}
                  placeholder="VD: mkt.daklak"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditing ? "Tên đăng nhập cố định, không thể sửa sau khi tạo" : "Dùng để đăng nhập vào hệ thống VISI CSR"}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-bold text-slate-700">
                  {isEditing ? "Đặt lại mật khẩu mới" : "Mật khẩu khởi tạo"}{" "}
                  {!isEditing && <span className="text-rose-500">*</span>}
                </label>
                <button
                  type="button"
                  onClick={() => setMatKhau(generateTempPassword())}
                  className="text-[11.5px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sinh ngẫu nhiên</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  required={!isEditing}
                  className="input-field font-mono pr-10 h-10 w-full rounded-xl text-[13.5px] bg-white border-slate-200 focus:border-blue-500"
                  placeholder={isEditing ? "Để trống nếu giữ nguyên mật khẩu cũ..." : "Nhập hoặc sinh mật khẩu..."}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditing ? "Chỉ nhập nếu bạn muốn đổi mật khẩu mới cho nhân sự" : "Mật khẩu ban đầu để nhân sự đăng nhập"}
              </p>
            </div>
          </div>

          {/* Toggle gửi email */}
          {(!isEditing || (isEditing && Boolean(matKhau.trim()))) && (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={guiEmail && Boolean(email.trim())}
                  disabled={!email.trim()}
                  onChange={(e) => setGuiEmail(e.target.checked)}
                  className="mt-0.5 sm:mt-0 rounded-[4px] border-slate-300 text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer"
                />
                <div>
                  <div className="text-[12.5px] font-bold text-slate-900">
                    Gửi email thông tin đăng nhập tự động cho nhân sự
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Gửi từ: <strong className="font-mono text-blue-700">no-reply@visicare.com.vn</strong> qua cổng SMTP VISI
                  </div>
                </div>
              </label>
              {!email.trim() && (
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-100 px-2.5 py-1 rounded-md shrink-0">
                  Chưa nhập email nhận thư
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100 mt-6">
          <div>
            {isEditing && email.trim() && (
              <button
                type="button"
                onClick={handleSendEmailNow}
                disabled={sendingEmailNow}
                className="btn px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[12.5px] flex items-center justify-center gap-2 transition-all shadow-2xs"
                title="Gửi ngay thông tin đăng nhập tới email nhân sự này"
              >
                {sendingEmailNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-blue-600" />}
                <span>Gửi email tài khoản ngay qua SMTP</span>
              </button>
            )}
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-7 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
              <span>{isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Cấu hình Cơ sở (CoSoModal) ───
function CoSoModal({
  cosos,
  edit,
  onClose,
  onDone,
}: {
  cosos: CoSo[];
  edit?: CoSo;
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const autoId = useMemo(() => {
    if (edit) return edit.id;
    let maxNum = 0;
    cosos.forEach((c) => {
      const match = c.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `CS${String(maxNum + 1).padStart(2, "0")}`;
  }, [edit, cosos]);

  const [id, setId] = useState(edit?.id ?? autoId);
  const [ten, setTen] = useState(edit?.ten ?? "");
  const [diaChi, setDiaChi] = useState(edit?.diaChi ?? "");
  const [bhxhUser, setBhxhUser] = useState(edit?.bhxhUser ?? "");
  const [bhxhPass, setBhxhPass] = useState(edit?.bhxhPass ?? "");
  const [bhxhMaCSKCB, setBhxhMaCSKCB] = useState(edit?.bhxhMaCSKCB ?? "");
  const [bhxhHoTenCB, setBhxhHoTenCB] = useState(edit?.bhxhHoTenCB ?? "");
  const [bhxhCccdCB, setBhxhCccdCB] = useState(edit?.bhxhCccdCB ?? "");
  const [hisHost, setHisHost] = useState(edit?.hisHost ?? "");
  const [hisPort, setHisPort] = useState(edit?.hisPort ?? "1433");
  const [hisUser, setHisUser] = useState(edit?.hisUser ?? "");
  const [hisPass, setHisPass] = useState(edit?.hisPass ?? "");
  const [hisDbName, setHisDbName] = useState(edit?.hisDbName ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const res = await fetch(edit ? `/api/csr/coso/${edit.id}` : "/api/csr/coso", {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        ten,
        diaChi,
        bhxhUser,
        bhxhPass,
        bhxhMaCSKCB,
        bhxhHoTenCB,
        bhxhCccdCB,
        hisHost,
        hisPort,
        hisUser,
        hisPass,
        hisDbName,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(d.error || "Lỗi lưu cơ sở");
      return;
    }
    addToast({ type: "success", message: edit ? "Đã cập nhật cơ sở." : "Đã thêm cơ sở." });
    onDone();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={edit ? "Sửa thông tin cơ sở" : "Thêm cơ sở y tế mới"}
      subtitle={
        edit
          ? "Cập nhật thông tin chi nhánh & cấu hình kết nối BHYT / HIS"
          : "Đăng ký cơ sở khám chữa bệnh mới vào hệ thống VISI CSR"
      }
      icon={Building2}
      maxWidth="w-[95%] max-w-[780px]"
      noPadding
    >
      <form onSubmit={submit} className="p-5 sm:p-7 space-y-6 bg-white">
        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[13px] font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Hero Card thông tin cơ sở khi Edit */}
        {edit && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/20 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[16px] text-slate-900 truncate">{ten || edit.ten}</span>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    Mã CS: {edit.id}
                  </span>
                </div>
                <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{diaChi || edit.diaChi || "Chưa cập nhật địa chỉ cơ sở"}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge
                label={edit.trangThai === "active" ? "Hoạt động" : "Đã khóa"}
                cls={
                  edit.trangThai === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }
                sm
              />
            </div>
          </div>
        )}

        {/* Khối 1: Thông tin cơ sở & Chi nhánh */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Thông tin cơ sở y tế & Chi nhánh
              </span>
            </div>
            {!edit && (
              <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Mã CS: {id}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Tên cơ sở khám chữa bệnh <span className="text-rose-500">*</span>
              </label>
              <input
                value={ten}
                onChange={(e) => setTen(e.target.value)}
                required
                className="input-field h-10 font-semibold text-[14px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                placeholder="VD: Bệnh viện Mắt VISI Đắk Lắk"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Địa chỉ cơ sở
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  className="input-field pl-9 pr-3 h-10 text-[13.5px] w-full rounded-xl bg-white border-slate-200 focus:border-blue-500 font-medium"
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Khối 2: Cấu hình tra cứu BHYT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Cấu hình cổng tra cứu BHYT (Cổng Giám định BHYT)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Tùy chọn tra cứu tự động</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Tài khoản BHXH</label>
              <input
                value={bhxhUser}
                onChange={(e) => setBhxhUser(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="VD: 0101000..."
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Mật khẩu BHXH</label>
              <input
                type="password"
                value={bhxhPass}
                onChange={(e) => setBhxhPass(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder={edit && edit.bhxhPass ? "••••••••" : "Nhập mật khẩu BHXH..."}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Mã CSKCB</label>
              <input
                value={bhxhMaCSKCB}
                onChange={(e) => setBhxhMaCSKCB(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="VD: 01001"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Họ tên cán bộ</label>
              <input
                value={bhxhHoTenCB}
                onChange={(e) => setBhxhHoTenCB(e.target.value)}
                className="input-field text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="Họ tên CB tra cứu"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">CCCD cán bộ</label>
              <input
                value={bhxhCccdCB}
                onChange={(e) => setBhxhCccdCB(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="Số CCCD cán bộ"
              />
            </div>
          </div>
        </div>

        {/* Khối 3: Cấu hình kết nối HIS (SQL Server) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <Server className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight">
                Cấu hình kết nối HIS nội viện (SQL Server)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Đồng bộ bệnh nhân</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">IP / Host máy chủ HIS</label>
              <input
                value={hisHost}
                onChange={(e) => setHisHost(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="VD: 192.168.10.250"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Cổng (Port)</label>
              <input
                value={hisPort}
                onChange={(e) => setHisPort(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="1433"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Tên Database</label>
              <input
                value={hisDbName}
                onChange={(e) => setHisDbName(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="VD: shpt_phongKham"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Tài khoản Database (User)</label>
              <input
                value={hisUser}
                onChange={(e) => setHisUser(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder="VD: sa"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Mật khẩu Database</label>
              <input
                type="password"
                value={hisPass}
                onChange={(e) => setHisPass(e.target.value)}
                className="input-field font-mono text-[13.5px] h-10 w-full rounded-xl bg-white border-slate-200 focus:border-blue-500"
                placeholder={edit && edit.hisPass ? "••••••••" : "Mật khẩu database..."}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
            <span>{edit ? "Lưu thay đổi" : "Tạo cơ sở"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Cấu hình & trạng thái đồng bộ Google Sheet (GoogleSheetPanel) ───
interface GSheetCoSo {
  id: string;
  ten: string;
  sheetId: string | null;
  envSheetId: string | null;
}
interface GSheetStatus {
  enabled: boolean;
  shareEmail: string | null;
  tab: string;
  sharedSheetId: string | null;
  cronConfigured: boolean;
  pending: number;
}

function GoogleSheetPanel() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState<GSheetStatus | null>(null);
  const [rows, setRows] = useState<GSheetCoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/csr/googlesheet");
    if (res.ok) {
      const d = await res.json();
      setStatus(d.status);
      setRows(d.cosos);
    } else {
      addToast({ type: "error", message: "Không tải được cấu hình Google Sheet." });
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSheetId = async (coSoId: string) => {
    setSavingId(coSoId);
    const res = await fetch("/api/csr/googlesheet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coSoId, sheetId: drafts[coSoId] ?? "" }),
    });
    const d = await res.json();
    setSavingId(null);
    if (res.ok) {
      addToast({ type: "success", message: "Đã lưu spreadsheetId." });
      setDrafts((p) => {
        const n = { ...p };
        delete n[coSoId];
        return n;
      });
      load();
    } else {
      addToast({ type: "error", message: d.error || "Lỗi lưu sheet" });
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    const res = await fetch("/api/csr/googlesheet", { method: "POST" });
    const d = await res.json();
    setSyncing(false);
    if (res.ok) {
      addToast({
        type: "success",
        message: `Đồng bộ xong: ${d.processed} hồ sơ${d.failed ? `, lỗi ${d.failed}` : ""}.`,
      });
    } else {
      addToast({ type: "error", message: d.error || "Lỗi đồng bộ" });
    }
    load();
  };

  const rebuildSheet = async () => {
    if (
      !(await confirm({
        title: "Dựng lại báo cáo?",
        message: "Toàn bộ dòng dữ liệu trên Google Sheet sẽ bị xoá và ghi lại từ đầu theo bộ cột mới.",
        note: "Hàng tiêu đề và mọi cột kế toán tự thêm sẽ bị mất. Thao tác không thể hoàn tác.",
        confirmLabel: "Xoá & dựng lại",
        tone: "danger",
      }))
    )
      return;
    setRebuilding(true);
    const res = await fetch("/api/csr/googlesheet?rebuild=1", { method: "POST" });
    const d = await res.json();
    setRebuilding(false);
    if (res.ok) {
      addToast({
        type: "success",
        title: "Đã dựng lại báo cáo",
        message: `${d.processed} hồ sơ${d.failed ? `, lỗi ${d.failed}` : ""}${
          d.remaining ? `, còn ${d.remaining} trong hàng đợi` : ""
        }.`,
      });
    } else {
      addToast({ type: "error", message: d.error || "Lỗi dựng lại" });
    }
    load();
  };

  const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}`;
  const shared = !!status?.sharedSheetId;

  const gsheetColumns = useMemo<ColumnDef<GSheetCoSo>[]>(
    () => [
      {
        id: "coSo",
        accessorKey: "ten",
        header: "Cơ sở y tế",
        size: 240,
        meta: { width: "32%" },
        cell: ({ row }) => (
          <div className="min-w-0 pr-2">
            <div className="font-bold text-[var(--ink)] truncate">{row.original.ten}</div>
            <div className="font-mono text-[11px] text-[var(--mute)]">{row.original.id}</div>
          </div>
        ),
      },
      {
        id: "sheetId",
        header: shared ? "Tab trong bảng tính" : "Spreadsheet ID",
        size: 380,
        meta: { width: "44%" },
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const effective = shared ? status!.sharedSheetId! : c.sheetId || c.envSheetId;
          const draft = drafts[c.id] ?? (c.sheetId ?? "");
          const dirty = drafts[c.id] !== undefined && drafts[c.id] !== (c.sheetId ?? "");
          if (shared)
            return (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)]">
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)]">Tab</span>{" "}
                {c.ten}
              </span>
            );
          return (
            <div data-no-row-click>
              <input
                value={draft}
                onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: e.target.value }))}
                placeholder={c.envSheetId ? `env: ${c.envSheetId}` : "Tự tạo khi đồng bộ…"}
                className="input-field font-mono text-[12px] w-[260px] max-w-full rounded-lg"
              />
              {effective && !dirty && (
                <a
                  href={sheetUrl(effective)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[var(--navy)] hover:underline truncate"
                  title={sheetUrl(effective)}
                >
                  <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{sheetUrl(effective)}</span>
                </a>
              )}
            </div>
          );
        },
      },
      {
        id: "trangThai",
        header: "Trạng thái",
        size: 140,
        meta: { width: "140px" },
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const effective = shared ? status!.sharedSheetId! : c.sheetId || c.envSheetId;
          if (shared)
            return <StatusBadge label="Trong bảng chung" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />;
          return effective ? (
            <StatusBadge label={c.sheetId ? "Đã có sheet" : "Từ .env"} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Chưa có" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 140,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right", width: "140px" },
        cell: ({ row }) => {
          const c = row.original;
          const effective = shared ? status!.sharedSheetId! : c.sheetId || c.envSheetId;
          const dirty = drafts[c.id] !== undefined && drafts[c.id] !== (c.sheetId ?? "");
          return (
            <div className="flex items-center justify-end gap-1.5" data-no-row-click>
              {effective && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(sheetUrl(effective));
                    addToast({ type: "success", message: "Đã copy link." });
                  }}
                  className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {effective && (
                <a
                  href={sheetUrl(effective)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
                  title="Mở Google Sheet"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {!shared && (
                <button
                  type="button"
                  onClick={() => saveSheetId(c.id)}
                  disabled={!dirty || savingId === c.id}
                  className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold disabled:opacity-40 rounded-lg"
                >
                  {savingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[var(--teal)]" />}{" "}
                  Lưu
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shared, status, drafts, savingId]
  );

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--navy)]" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Trạng thái tổng */}
      <div className="bg-white border border-[var(--line)] rounded-2xl shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                status?.enabled ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--rose-soft)] text-[var(--rose)]"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[16px] font-bold text-[var(--ink)]">Đồng bộ dữ liệu Google Sheet</div>
              <div className="text-[12.5px] text-[var(--mute)]">
                {!status?.enabled
                  ? "Chưa bật: thiếu GOOGLE_CREDENTIALS trong .env."
                  : status?.sharedSheetId
                  ? "Đã bật — dùng chung 1 bảng tính, mỗi cơ sở là 1 tab riêng."
                  : "Đã bật — mỗi cơ sở đồng bộ 1 chiều lên spreadsheet riêng."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={rebuildSheet}
              disabled={rebuilding || syncing || !status?.enabled}
              title="Xoá dòng cũ & đẩy lại toàn bộ theo bộ cột hiện tại"
              className="btn btn-secondary px-4 py-2.5 font-bold rounded-xl"
            >
              {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-amber-500" />}
              <span>Dựng lại báo cáo</span>
            </button>
            <button
              onClick={syncNow}
              disabled={syncing || rebuilding || !status?.enabled}
              className="btn btn-primary px-5 py-2.5 font-bold rounded-xl"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[var(--teal)]" />}
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Credentials", val: status?.enabled ? "Đã cấu hình" : "Chưa có", ok: status?.enabled },
            { label: "Email chia sẻ", val: status?.shareEmail || "Chưa đặt", ok: !!status?.shareEmail },
            { label: "Cron dự phòng", val: status?.cronConfigured ? "Đã đặt" : "Chưa đặt", ok: status?.cronConfigured },
            { label: "Hàng đợi chờ", val: `${status?.pending ?? 0} hồ sơ`, ok: (status?.pending ?? 0) === 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3.5 py-2.5">
              <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--mute)]">{s.label}</div>
              <div
                className={`text-[13px] font-bold mt-0.5 truncate ${s.ok ? "text-[var(--teal-deep)]" : "text-[var(--ink-soft)]"}`}
                title={s.val}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sheet dùng chung */}
      {status?.sharedSheetId && (
        <div className="bg-[var(--navy-50)] border border-[var(--navy-100)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-[var(--navy)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[var(--ink)]">Bảng tính dùng chung của mọi cơ sở</div>
              <a
                href={sheetUrl(status.sharedSheetId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] font-semibold text-[var(--navy)] hover:underline truncate block"
                title={sheetUrl(status.sharedSheetId)}
              >
                {sheetUrl(status.sharedSheetId)}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(sheetUrl(status.sharedSheetId!));
                addToast({ type: "success", message: "Đã copy link." });
              }}
              className="btn btn-secondary px-3 py-2 text-[12px] font-bold rounded-lg"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <a
              href={sheetUrl(status.sharedSheetId)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary px-4 py-2 text-[12px] font-bold rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--teal)]" /> Mở bảng tính
            </a>
          </div>
        </div>
      )}

      {/* Danh sách cơ sở */}
      <div className="bg-white border border-[var(--line)] rounded-2xl shadow-xs overflow-hidden">
        <DataView<GSheetCoSo, unknown> columns={gsheetColumns} data={rows} pageSize={100}>
          <DataTable<GSheetCoSo> dense emptyIcon={FileSpreadsheet} emptyTitle="Chưa có cơ sở nào" />
        </DataView>
      </div>
    </div>
  );
}

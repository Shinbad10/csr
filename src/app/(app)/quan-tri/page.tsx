"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Building2, Users, ScrollText, X, Check, Pencil, Trash2, FileSpreadsheet, RefreshCw, ExternalLink, Copy, ClipboardList, Lock, Stethoscope, Search, ShieldCheck, ChevronDown } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { fmtTime } from "@/lib/csr";
import { can, roleLabel } from "@/lib/permissions";
import { Field, Dropdown, StatusBadge, SectionHeader } from "@/components/csr/fields";
import { DataView, DataTable, DataPagination } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";

interface CoSo { id: string; ten: string; diaChi: string | null; trangThai: string; cauHinhTruong?: string | null; bhxhUser?: string | null; bhxhPass?: string | null; bhxhMaCSKCB?: string | null; bhxhHoTenCB?: string | null; bhxhCccdCB?: string | null; hisHost?: string | null; hisPort?: string | null; hisUser?: string | null; hisPass?: string | null; hisDbName?: string | null }
interface NguoiDung { maNV: string; hoTen: string; vaiTro: string; coSoId: string | null; tenDangNhap: string; trangThai: string; coSo?: { ten: string } }
interface Audit { id: number; bang: string; banGhiId: string; hanhDong: string; nguoiDung: string; thoiDiem: string }

const ALL_ROLES = ["BacSi", "MKT", "TuVanVien", "KeToan", "HCNS", "IT", "QuanLy"];
const IT_ROLES = ["BacSi", "MKT", "TuVanVien", "KeToan", "HCNS", "IT"];

export default function QuanTriPage() {
  const { data: session } = useSession();
  const isMaster = can(session?.user?.role, "admin.masterdata");
  const isIT = can(session?.user?.role, "admin.users") && !isMaster;

  const { addToast } = useToast();
  const [tab, setTab] = useState<"coso" | "nguoidung" | "bacsi" | "audit" | "gsheet">("coso");
  const [bacsiFilterCoso, setBacsiFilterCoso] = useState("");
  const [bacsiSearch, setBacsiSearch] = useState("");
  const [syncingBacSi, setSyncingBacSi] = useState(false);
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [users, setUsers] = useState<NguoiDung[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "coso" | "user"; rec?: CoSo | NguoiDung } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [selectedCosos, setSelectedCosos] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isIT) {
      setTab("nguoidung");
      if (session?.user?.coSoId) setBacsiFilterCoso(session.user.coSoId);
    }
  }, [isIT, session?.user?.coSoId]);

  const changeTab = (k: "coso" | "nguoidung" | "bacsi" | "audit" | "gsheet") => { setTab(k); setSelectedCosos(new Set()); setSelectedUsers(new Set()); };

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

  const doctorUsers = useMemo(() => {
    return users
      .filter((u) => u.vaiTro === "BacSi" || u.vaiTro.includes("Bác"))
      .filter((u) => {
        if (isIT && session?.user?.coSoId) return u.coSoId === session.user.coSoId;
        return !bacsiFilterCoso || u.coSoId === bacsiFilterCoso;
      })
      .filter((u) => !bacsiSearch || u.hoTen.toLowerCase().includes(bacsiSearch.toLowerCase()) || u.maNV.toLowerCase().includes(bacsiSearch.toLowerCase()));
  }, [users, isIT, session?.user?.coSoId, bacsiFilterCoso, bacsiSearch]);

  const availableTabs = useMemo(() => {
    if (isIT) {
      return [
        ["coso", "Cấu hình đơn vị", Building2],
        ["nguoidung", "Tài khoản đơn vị", Users],
        ["bacsi", "Danh sách Bác sĩ", Stethoscope],
      ] as const;
    }
    return [
      ["coso", "Cơ sở", Building2],
      ["nguoidung", "Tài khoản", Users],
      ["bacsi", "Danh sách Bác sĩ", Stethoscope],
      ["gsheet", "Google Sheet", FileSpreadsheet],
      ["audit", "Nhật ký", ScrollText],
    ] as const;
  }, [isIT]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [c, u, a] = await Promise.all([fetch("/api/csr/coso?all=1"), fetch("/api/csr/nguoidung"), fetch("/api/csr/audit")]);
    if (c.ok) setCosos(await c.json());
    if (u.ok) setUsers(await u.json());
    if (a.ok) setAudits(await a.json());
    if (!silent) setLoading(false);
  }, []);
  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const lockCoso = (id: string) => {
    setConfirmDialog({
      title: "Xóa cơ sở",
      message: "Bạn có chắc chắn muốn xóa cơ sở này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos(prev => prev.filter(c => c.id !== id)); // Optimistic UI
        const res = await fetch(`/api/csr/coso/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { addToast({ type: "success", message: "Đã xóa cơ sở." }); load(true); } else { addToast({ type: "error", message: data.error || "Lỗi" }); load(true); }
      }
    });
  };
  const lockUser = (id: string) => {
    setConfirmDialog({
      title: "Xóa tài khoản",
      message: "Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers(prev => prev.filter(u => u.maNV !== id)); // Optimistic UI
        const res = await fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { addToast({ type: "success", message: "Đã xóa tài khoản." }); load(true); } else { addToast({ type: "error", message: data.error || "Lỗi" }); load(true); }
      }
    });
  };

  const bulkDeleteCosos = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt cơ sở",
      message: `Bạn có chắc chắn muốn xóa ${selectedCosos.size} cơ sở đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos(prev => prev.filter(c => !selectedCosos.has(c.id))); // Optimistic UI
        const results = await Promise.all(Array.from(selectedCosos).map(id => fetch(`/api/csr/coso/${id}`, { method: "DELETE" })));
        const success = results.filter(r => r.ok).length;
        const failed = results.length - success;
        addToast({ type: success > 0 ? "success" : "error", message: `Đã xóa ${success} cơ sở.${failed > 0 ? ` Lỗi ${failed} cơ sở.` : ""}` });
        setSelectedCosos(new Set());
        await load(true);
      }
    });
  };

  const bulkDeleteUsers = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt tài khoản",
      message: `Bạn có chắc chắn muốn xóa ${selectedUsers.size} tài khoản đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers(prev => prev.filter(u => !selectedUsers.has(u.maNV))); // Optimistic UI
        const results = await Promise.all(Array.from(selectedUsers).map(id => fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" })));
        const success = results.filter(r => r.ok).length;
        const failed = results.length - success;
        addToast({ type: success > 0 ? "success" : "error", message: `Đã xóa ${success} tài khoản.${failed > 0 ? ` Lỗi ${failed} tài khoản.` : ""}` });
        setSelectedUsers(new Set());
        await load(true);
      }
    });
  };

  const checkboxCls =
    "rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer";

  const cosoColumns = useMemo<ColumnDef<CoSo>[]>(
    () => [
      ...(!isIT
        ? ([
            {
              id: "sel",
              size: 44,
              enableSorting: false,
              enableResizing: false,
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
        size: 120,
        cell: ({ row }) => <span className="font-mono font-bold text-[var(--teal-deep)]">{row.original.id}</span>,
      },
      {
        id: "ten",
        accessorKey: "ten",
        header: "Tên cơ sở",
        size: 220,
        meta: { flex: true },
        cell: ({ row }) => <span className="font-bold text-[var(--ink)]">{row.original.ten}</span>,
      },
      {
        id: "diaChi",
        accessorKey: "diaChi",
        header: "Địa chỉ",
        size: 220,
        cell: ({ row }) => <span className="text-[var(--mute)]">{row.original.diaChi || "—"}</span>,
      },
      {
        id: "trangThai",
        accessorKey: "trangThai",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) =>
          row.original.trangThai === "active" ? (
            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setModal({ type: "coso", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
              title="Sửa cấu hình"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {!isIT && (
              <button
                type="button"
                onClick={() => lockCoso(row.original.id)}
                className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"
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

  const userColumns = useMemo<ColumnDef<NguoiDung>[]>(
    () => [
      {
        id: "sel",
        size: 44,
        enableSorting: false,
        enableResizing: false,
        header: () => (
          <input
            type="checkbox"
            className={checkboxCls}
            checked={regularUsers.length > 0 && selectedUsers.size === regularUsers.length}
            onChange={(e) =>
              setSelectedUsers(e.target.checked ? new Set(regularUsers.map((u) => u.maNV)) : new Set())
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
        size: 110,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--teal-deep)] whitespace-nowrap">{row.original.maNV}</span>
        ),
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Họ tên",
        size: 180,
        meta: { flex: true },
        cell: ({ row }) => <span className="font-bold text-[var(--ink)]">{row.original.hoTen}</span>,
      },
      {
        id: "vaiTro",
        accessorKey: "vaiTro",
        header: "Vai trò",
        size: 140,
        cell: ({ row }) => (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
            {roleLabel(row.original.vaiTro)}
          </span>
        ),
      },
      {
        id: "coSo",
        header: "Cơ sở",
        size: 160,
        accessorFn: (u) => u.coSo?.ten || "Toàn hệ thống",
        cell: ({ getValue }) => <span className="text-[var(--mute)] font-medium">{String(getValue())}</span>,
      },
      {
        id: "tenDangNhap",
        accessorKey: "tenDangNhap",
        header: "Đăng nhập",
        size: 130,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.tenDangNhap}</span>,
      },
      {
        id: "trangThai",
        accessorKey: "trangThai",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) =>
          row.original.trangThai === "active" ? (
            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setModal({ type: "user", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
              title="Sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => lockUser(row.original.maNV)}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"
              title="Xóa tài khoản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUsers, regularUsers]
  );

  const bacsiColumns = useMemo<ColumnDef<NguoiDung>[]>(
    () => [
      {
        id: "maNV",
        accessorKey: "maNV",
        header: "Mã Bác sĩ",
        size: 130,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--teal-deep)] whitespace-nowrap">{row.original.maNV}</span>
        ),
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Họ và Tên",
        size: 200,
        meta: { flex: true },
        cell: ({ row }) => <span className="font-bold text-[var(--ink)] text-[14px]">{row.original.hoTen}</span>,
      },
      {
        id: "coSo",
        header: "Cơ sở làm việc",
        size: 190,
        accessorFn: (u) => u.coSo?.ten || "Toàn hệ thống",
        cell: ({ getValue }) => <span className="text-[var(--mute)] font-medium">{String(getValue())}</span>,
      },
      {
        id: "nguon",
        header: "Nguồn dữ liệu",
        size: 170,
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
        cell: ({ row }) =>
          row.original.trangThai === "active" ? (
            <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />
          ) : (
            <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" data-no-row-click>
            <button
              type="button"
              onClick={() => setModal({ type: "user", rec: row.original })}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]"
              title="Sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => lockUser(row.original.maNV)}
              className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]"
              title="Xóa tài khoản"
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

  const auditColumns = useMemo<ColumnDef<Audit>[]>(
    () => [
      {
        id: "thoiDiem",
        header: "Thời điểm",
        size: 170,
        accessorFn: (a) => (a.thoiDiem ? new Date(a.thoiDiem).getTime() : 0),
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] text-[var(--mute)] whitespace-nowrap">{fmtTime(row.original.thoiDiem)}</span>
        ),
      },
      {
        id: "nguoiDung",
        accessorKey: "nguoiDung",
        header: "Người dùng",
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--navy)] whitespace-nowrap">{row.original.nguoiDung}</span>
        ),
      },
      {
        id: "hanhDong",
        accessorKey: "hanhDong",
        header: "Hành động",
        size: 130,
        cell: ({ row }) => (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--ink-soft)] border border-[var(--line)] uppercase tracking-wider">
            {row.original.hanhDong}
          </span>
        ),
      },
      {
        id: "bang",
        accessorKey: "bang",
        header: "Bảng",
        size: 160,
        meta: { flex: true },
        cell: ({ row }) => <span className="text-[var(--mute)] font-mono text-[11.5px]">{row.original.bang}</span>,
      },
      {
        id: "banGhiId",
        accessorKey: "banGhiId",
        header: "Bản ghi",
        size: 160,
        cell: ({ row }) => <span className="font-mono text-[11.5px] text-[var(--mute)]">{row.original.banGhiId}</span>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title={isIT ? "Quản trị tài khoản đơn vị" : "Quản trị hệ thống"}
        description={isIT ? "Quản lý tài khoản nhân sự và danh sách bác sĩ thuộc đơn vị của bạn." : "Cơ sở, tài khoản (gán vai trò + cơ sở) và nhật ký kiểm toán. Xoá có ràng buộc → ngừng hoạt động (BR-13)."}
        guide={isIT ? [
          { selector: '[data-tour="qt-tabs"]', title: "Chọn mục quản trị", desc: "Dùng các tab: Tài khoản đơn vị, Danh sách Bác sĩ." },
          { title: "Quản lý tài khoản đơn vị", desc: "Ở tab \"Tài khoản\": tạo tài khoản, đổi mật khẩu và cấp vai trò nhân viên cho cơ sở của bạn." },
          { title: "Danh sách bác sĩ", desc: "Xem và đồng bộ danh sách bác sĩ thuộc cơ sở từ HIS." },
        ] : [
          { selector: '[data-tour="qt-tabs"]', title: "Chọn mục quản trị", desc: "Dùng các tab: Cơ sở, Tài khoản, Danh sách Bác sĩ, Google Sheet, Nhật ký." },
          { selector: '[data-tour="qt-table"]', title: "Quản lý cơ sở", desc: "Xem/sửa danh sách cơ sở. Bấm \"Thêm cơ sở\" để tạo mới và cấu hình kết nối BHYT / HIS." },
          { title: "Quản lý tài khoản", desc: "Ở tab \"Tài khoản\": tạo tài khoản, gán vai trò và cơ sở làm việc cho từng người dùng." },
          { title: "Cấu hình Google Sheet", desc: "Ở tab \"Google Sheet\": gán ID Google Sheet cho từng cơ sở để đồng bộ báo cáo." },
          { title: "Xem nhật ký kiểm toán", desc: "Tab \"Nhật ký\" ghi lại các thao tác quan trọng trong hệ thống." },
        ]}
        guideTip={'Bản ghi đang có ràng buộc dữ liệu sẽ được chuyển sang "ngừng hoạt động" thay vì xoá cứng (BR-13).'}
      />

      <div data-tour="qt-tabs" className="flex items-center gap-1 mt-5 bg-white border border-[var(--line)] rounded-[var(--r-md)] p-1 w-full sm:w-fit overflow-x-auto hide-scrollbar">
        {availableTabs.map(([k, label, Icon]) => (
          <button key={k} onClick={() => changeTab(k as any)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r-sm)] text-[13px] font-bold whitespace-nowrap ${tab === k ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}><Icon className="w-4 h-4 shrink-0" /> {label}</button>
        ))}
      </div>

      {loading && users.length === 0 && cosos.length === 0 ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" /></div>
      ) : (
        <div className="mt-4">
          {tab === "bacsi" ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bacsiSearch}
                    onChange={(e) => setBacsiSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã bác sĩ..."
                    className="input-field pl-9 pr-3 h-10 text-[13px] w-full"
                  />
                </div>
                {!isIT && (
                  <select
                    value={bacsiFilterCoso}
                    onChange={(e) => setBacsiFilterCoso(e.target.value)}
                    className="input-field h-10 text-[13px] w-full sm:w-48 font-medium bg-white cursor-pointer"
                  >
                    <option value="">Tất cả cơ sở</option>
                    {cosos.filter((c) => c.trangThai === "active").map((c) => (
                      <option key={c.id} value={c.id}>{c.ten}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Boolean(
                  (isIT ? session?.user?.coSoId : bacsiFilterCoso)
                    ? cosos.find((c) => c.id === (isIT ? session?.user?.coSoId : bacsiFilterCoso))?.hisHost?.trim() && cosos.find((c) => c.id === (isIT ? session?.user?.coSoId : bacsiFilterCoso))?.hisDbName?.trim()
                    : cosos.some((c) => c.hisHost?.trim() && c.hisDbName?.trim())
                ) && (
                  <button
                    onClick={async () => {
                      setSyncingBacSi(true);
                      try {
                        const res = await fetch("/api/csr/bacsi", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ coSoId: isIT ? (session?.user?.coSoId || null) : (bacsiFilterCoso || null) }),
                        });
                        const data = await res.json();
                        if (data.ok) {
                          addToast({ type: "success", message: `Đã đồng bộ ${data.syncedCount} bác sĩ từ HIS DMNhanSu` });
                          load(true);
                        } else {
                          addToast({ type: "error", message: data.error || "Lỗi đồng bộ HIS" });
                        }
                      } catch (e) {
                        addToast({ type: "error", message: "Lỗi kết nối đồng bộ HIS" });
                      } finally {
                        setSyncingBacSi(false);
                      }
                    }}
                    disabled={syncingBacSi}
                    className="btn px-4 py-2 text-[13px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white rounded-[var(--r-md)] transition-colors flex items-center justify-center gap-2 shadow-[var(--shadow-sm)]"
                  >
                    {syncingBacSi ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Đồng bộ từ HIS DMNhanSu</span>
                  </button>
                )}
                <button
                  onClick={() => setModal({ type: "user", rec: { vaiTro: "BacSi", maNV: "", hoTen: "", tenDangNhap: "", trangThai: "active", coSoId: bacsiFilterCoso || null } as any })}
                  className="btn btn-primary px-4 py-2 text-[13px] font-bold flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 text-[var(--teal)]" />
                  <span>Thêm Bác sĩ</span>
                </button>
              </div>
            </div>
          ) : (tab === "coso" || tab === "nguoidung") ? (
            <div className="flex flex-col-reverse sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {tab === "coso" && selectedCosos.size > 0 && (
                  <button onClick={bulkDeleteCosos} className="btn w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-[var(--r-md)] shadow-[var(--shadow-sm)] transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> Xóa {selectedCosos.size} đã chọn</button>
                )}
                {tab === "nguoidung" && selectedUsers.size > 0 && (
                  <button onClick={bulkDeleteUsers} className="btn w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-[var(--r-md)] shadow-[var(--shadow-sm)] transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> Xóa {selectedUsers.size} đã chọn</button>
                )}
              </div>
              <button onClick={() => setModal({ type: tab === "coso" ? "coso" : "user" })} className="btn btn-primary w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold flex justify-center items-center gap-2 shadow-[var(--shadow-sm)]"><Plus className="w-4 h-4 text-[var(--teal)]" /> Thêm {tab === "coso" ? "cơ sở" : "tài khoản"}</button>
            </div>
          ) : null}

          {tab === "coso" && (
            <div data-tour="qt-table" className="card p-0 overflow-hidden">
              {/* Mobile: danh sách thẻ */}
              <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                {displayedCosos.length === 0 ? <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có cơ sở nào.</div>
                : displayedCosos.map((c) => (
                  <div key={c.id} className="p-4 flex items-start gap-3">
                    {!isIT && <input type="checkbox" className="mt-1 rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] w-4 h-4 shrink-0" checked={selectedCosos.has(c.id)} onChange={(e) => { const n = new Set(selectedCosos); if (e.target.checked) n.add(c.id); else n.delete(c.id); setSelectedCosos(n); }} />}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[14px] text-[var(--ink)]">{c.ten}</span>
                        <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)]">{c.id}</span>
                      </div>
                      <div className="text-[12px] text-[var(--mute)] break-words">{c.diaChi || "—"}</div>
                      {c.trangThai === "active" ? <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm /> : <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModal({ type: "coso", rec: c })} className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Sửa cấu hình"><Pencil className="w-4 h-4" /></button>
                      {!isIT && <button onClick={() => lockCoso(c.id)} className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]" title="Xóa cơ sở"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <DataView<CoSo, unknown> columns={cosoColumns} data={displayedCosos} pageSize={50}>
                  <DataTable<CoSo> dense emptyIcon={Building2} emptyTitle="Chưa có cơ sở nào" />
                </DataView>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                {isIT ? `Đơn vị của bạn: ${displayedCosos[0]?.ten || session?.user?.coSoId || ""}` : <>Tổng số <span className="font-mono font-bold text-[var(--ink)]">{displayedCosos.length}</span> cơ sở</>}
              </div>
            </div>
          )}

          {tab === "nguoidung" && (
            <div className="card p-0 overflow-hidden">
              {/* Mobile: danh sách thẻ */}
              <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                {regularUsers.length === 0 ? <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có tài khoản nào.</div>
                : regularUsers.map((u) => (
                  <div key={u.maNV} className="p-4 flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] w-4 h-4 shrink-0" checked={selectedUsers.has(u.maNV)} onChange={(e) => { const n = new Set(selectedUsers); if (e.target.checked) n.add(u.maNV); else n.delete(u.maNV); setSelectedUsers(n); }} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[14px] text-[var(--ink)]">{u.hoTen}</span>
                        <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)]">{u.maNV}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">{roleLabel(u.vaiTro)}</span>
                        {u.trangThai === "active" ? <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm /> : <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />}
                      </div>
                      <div className="text-[12px] text-[var(--mute)]">{u.coSo?.ten || "Toàn hệ thống"} · <span className="font-mono">{u.tenDangNhap}</span></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModal({ type: "user", rec: u })} className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Sửa"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => lockUser(u.maNV)} className="p-2 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]" title="Xóa tài khoản"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <DataView<NguoiDung, unknown> columns={userColumns} data={regularUsers} pageSize={50}>
                  <DataTable<NguoiDung> dense emptyIcon={Users} emptyTitle="Chưa có tài khoản nào" />
                </DataView>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                Tổng số <span className="font-mono font-bold text-[var(--ink)]">{regularUsers.length}</span> tài khoản
              </div>
            </div>
          )}

          {tab === "bacsi" && (
            <div className="card p-0 overflow-hidden">
              <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                {doctorUsers.length === 0 ? <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có bác sĩ nào trong hệ thống hoặc không khớp bộ lọc. Bấm &ldquo;Đồng bộ từ HIS DMNhanSu&rdquo; để tải danh sách.</div>
                : doctorUsers.map((u) => {
                  const isHis = u.maNV.startsWith("HIS-") || u.tenDangNhap.startsWith("his_");
                  return (
                    <div key={u.maNV} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-[14.5px] text-[var(--ink)]">{u.hoTen}</span>
                        <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)]">{u.maNV}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isHis ? <StatusBadge label="Từ HIS (DMNhanSu)" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm /> : <StatusBadge label="Nhập thủ công" cls="bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]" sm />}
                        {u.trangThai === "active" ? <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm /> : <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" sm />}
                      </div>
                      <div className="text-[12px] text-[var(--mute)]">{u.coSo?.ten || "Toàn hệ thống"}</div>
                      <div className="flex items-center justify-end gap-1 pt-1">
                        <button onClick={() => setModal({ type: "user", rec: u })} className="btn px-3 py-1.5 text-xs text-[var(--navy)] bg-[var(--navy-50)] hover:bg-[var(--navy)] hover:text-white rounded-md flex items-center gap-1.5 font-bold"><Pencil className="w-3.5 h-3.5" /> Sửa</button>
                        <button onClick={() => lockUser(u.maNV)} className="btn px-3 py-1.5 text-xs text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-md flex items-center gap-1.5 font-bold"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                <span>Đang đồng bộ từ <span className="font-bold text-[var(--teal-deep)]">HIS DMNhanSu (Loai = &apos;Bác_Sĩ&apos;)</span></span>
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div className="card p-0 overflow-hidden">
              {/* Mobile: danh sách thẻ */}
              <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
                {audits.length === 0 ? <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có nhật ký kiểm toán.</div>
                : audits.map((a) => (
                  <div key={a.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--ink-soft)] border border-[var(--line)] uppercase tracking-wider">{a.hanhDong}</span>
                      <span className="font-mono text-[11px] text-[var(--mute)]">{fmtTime(a.thoiDiem)}</span>
                    </div>
                    <div className="font-mono text-[12px] font-bold text-[var(--navy)]">{a.nguoiDung}</div>
                    <div className="font-mono text-[11.5px] text-[var(--mute)] break-all">{a.bang} · {a.banGhiId}</div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <DataView<Audit, unknown> columns={auditColumns} data={audits} pageSize={50}>
                  <DataTable<Audit> dense emptyIcon={ScrollText} emptyTitle="Chưa có nhật ký kiểm toán" />
                  <DataPagination pageSizeOptions={[25, 50, 100, 200]} />
                </DataView>
              </div>
            </div>
          )}

          {tab === "gsheet" && <GoogleSheetPanel />}
        </div>
      )}

      {modal?.type === "coso" && <CoSoModal cosos={cosos} edit={modal.rec as CoSo | undefined} onClose={() => setModal(null)} onDone={() => { setModal(null); load(true); }} />}
      {modal?.type === "user" && <UserModal cosos={cosos} users={users} edit={modal.rec as NguoiDung | undefined} isIT={isIT} userCoSoId={session?.user?.coSoId} onClose={() => setModal(null)} onDone={() => { setModal(null); load(true); }} />}
      
      {confirmDialog && (
        <Modal open={true} title={confirmDialog.title} onClose={() => setConfirmDialog(null)} maxWidth="max-w-[460px]">
          <div className="py-2">
            <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--line-soft)]">
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">Hủy</button>
              <button onClick={confirmDialog.onConfirm} className="btn px-5 py-2.5 font-bold text-white bg-[var(--rose)] hover:bg-[#e11d48] rounded-xl shadow-sm">Xóa dữ liệu</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CoSoModal({ cosos, edit, onClose, onDone }: { cosos: CoSo[]; edit?: CoSo; onClose: () => void; onDone: () => void }) {
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

  const [id, setId] = useState(edit?.id ?? autoId); const [ten, setTen] = useState(edit?.ten ?? ""); const [diaChi, setDiaChi] = useState(edit?.diaChi ?? "");
  const [bhxhUser, setBhxhUser] = useState(edit?.bhxhUser ?? ""); const [bhxhPass, setBhxhPass] = useState(edit?.bhxhPass ?? "");
  const [bhxhMaCSKCB, setBhxhMaCSKCB] = useState(edit?.bhxhMaCSKCB ?? ""); const [bhxhHoTenCB, setBhxhHoTenCB] = useState(edit?.bhxhHoTenCB ?? ""); const [bhxhCccdCB, setBhxhCccdCB] = useState(edit?.bhxhCccdCB ?? "");
  const [hisHost, setHisHost] = useState(edit?.hisHost ?? ""); const [hisPort, setHisPort] = useState(edit?.hisPort ?? "1433");
  const [hisUser, setHisUser] = useState(edit?.hisUser ?? ""); const [hisPass, setHisPass] = useState(edit?.hisPass ?? ""); const [hisDbName, setHisDbName] = useState(edit?.hisDbName ?? "");
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    const res = await fetch(edit ? `/api/csr/coso/${edit.id}` : "/api/csr/coso", { method: edit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ten, diaChi, bhxhUser, bhxhPass, bhxhMaCSKCB, bhxhHoTenCB, bhxhCccdCB, hisHost, hisPort, hisUser, hisPass, hisDbName }) });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setErr(d.error || "Lỗi"); return; }
    addToast({ type: "success", message: edit ? "Đã cập nhật cơ sở." : "Đã thêm cơ sở." }); onDone();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={edit ? "Sửa thông tin cơ sở" : "Thêm cơ sở y tế mới"}
      subtitle={
        edit ? (
          <span className="flex items-center gap-2">
            <span>Quản lý thông tin chi nhánh & cấu hình</span>
            <span className="font-mono text-[11.5px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] px-2 py-0.5 rounded border border-[var(--teal)]">Mã CS: {edit.id}</span>
          </span>
        ) : (
          "Quản lý thông tin chi nhánh & cấu hình kết nối BHYT / HIS"
        )
      }
      icon={Building2}
      maxWidth="max-w-[700px]"
      noPadding
    >
      <form onSubmit={submit} className="p-4 sm:p-7 space-y-6 bg-white">
        {err && <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2"><X className="w-4 h-4 shrink-0" /> {err}</div>}
        
        <div className="space-y-4">
          <SectionHeader n={1} accent="Thông tin chung" />
          <Field label="Tên cơ sở" required>
            <input value={ten} onChange={(e) => setTen(e.target.value)} required className="input-field h-10 font-semibold text-[14.5px]" placeholder="VD: Bệnh viện Mắt VISI Đắk Lắk" />
          </Field>
          <Field label="Địa chỉ cơ sở">
            <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field h-10" placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={2} accent="Cấu hình tra cứu BHYT" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tài khoản BHXH"><input value={bhxhUser} onChange={(e) => setBhxhUser(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 0101000..." /></Field>
            <Field label="Mật khẩu BHXH"><input type="password" value={bhxhPass} onChange={(e) => setBhxhPass(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder={edit && edit.bhxhPass ? "••••••••" : "Nhập mật khẩu..."} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Mã CSKCB"><input value={bhxhMaCSKCB} onChange={(e) => setBhxhMaCSKCB(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 01001" /></Field>
            <Field label="Họ tên cán bộ"><input value={bhxhHoTenCB} onChange={(e) => setBhxhHoTenCB(e.target.value)} className="input-field text-[13.5px] h-10" placeholder="Họ tên CB tra cứu" /></Field>
            <Field label="CCCD cán bộ"><input value={bhxhCccdCB} onChange={(e) => setBhxhCccdCB(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="Số CCCD cán bộ" /></Field>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={3} accent="Cấu hình HIS (SQL Server)" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="IP / Host HIS"><input value={hisHost} onChange={(e) => setHisHost(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 192.168.10.250" /></Field>
            <Field label="Cổng (Port)"><input value={hisPort} onChange={(e) => setHisPort(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="1433" /></Field>
            <Field label="Tên Database"><input value={hisDbName} onChange={(e) => setHisDbName(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: shpt_phongKham" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tài khoản HIS"><input value={hisUser} onChange={(e) => setHisUser(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: sa" /></Field>
            <Field label="Mật khẩu HIS"><input type="password" value={hisPass} onChange={(e) => setHisPass(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder={edit && edit.hisPass ? "••••••••" : "Mật khẩu database..."} /></Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} {edit ? "Lưu thay đổi" : "Tạo cơ sở"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

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

  const getNextMaNV = useCallback((role: string) => {
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
  }, [users]);

  const initialRole = edit?.vaiTro || "MKT";
  const [vaiTro, setVaiTro] = useState(initialRole);
  const [maNV, setMaNV] = useState(isEditing ? edit!.maNV : getNextMaNV(initialRole));
  const [hoTen, setHoTen] = useState(edit?.hoTen ?? "");
  const [coSoId, setCoSoId] = useState(edit?.coSoId ?? (isIT ? userCoSoId || "" : ""));
  const [tenDangNhap, setTenDangNhap] = useState(edit?.tenDangNhap ?? "");
  const [matKhau, setMatKhau] = useState("");
  const [saving, setSaving] = useState(false);
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
    const finalCoSoId = vaiTro === "QuanLy" ? null : (isIT ? (userCoSoId || coSoId || null) : (coSoId || null));
    const body = isEditing
      ? { hoTen: hoTen.trim(), vaiTro, coSoId: finalCoSoId, matKhau: matKhau.trim() || undefined }
      : { maNV: maNV.trim(), hoTen: hoTen.trim(), vaiTro, coSoId: finalCoSoId, tenDangNhap: tenDangNhap.trim().toLowerCase(), matKhau: matKhau.trim() };

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
      addToast({ type: "success", message: isEditing ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản thành công." });
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
      title={isEditing ? "Sửa thông tin tài khoản" : "Thêm tài khoản người dùng"}
      subtitle={
        <span className="flex items-center gap-2">
          <span>{isEditing ? "Cập nhật quyền truy cập & phân bổ vai trò" : "Cấp quyền truy cập & phân bổ vai trò nhân sự"}</span>
          <span className="font-mono text-[11.5px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] px-2 py-0.5 rounded border border-[var(--teal)]">
            Mã NV: {maNV}
          </span>
        </span>
      }
      icon={Users}
      maxWidth="max-w-[620px]"
      noPadding
    >
      <form onSubmit={submit} className="p-4 sm:p-7 space-y-6 bg-white">
        {err && (
          <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="space-y-4">
          <SectionHeader n={1} accent="Thông tin nhân sự" />
          <Field label="Họ và tên" required>
            <input
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              required
              className="input-field h-10 font-semibold text-[14.5px] w-full"
              placeholder="VD: Nguyễn Văn A"
            />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={2} accent="Phân quyền & Vai trò" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vai trò hệ thống" required>
              <div className="relative">
                <select
                  value={vaiTro}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="input-field h-10 w-full font-medium text-[13.5px] pr-9 bg-white cursor-pointer appearance-none"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r] || r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>

            <Field
              label="Cơ sở làm việc"
              hint={isIT ? "Cố định theo cơ sở của bạn" : (vaiTro === "QuanLy" ? "Toàn hệ thống" : undefined)}
              required={vaiTro !== "QuanLy"}
            >
              {isIT ? (
                <div className="input-field h-10 flex items-center bg-[var(--surface-soft)] text-[var(--ink)] font-semibold text-[13px] cursor-not-allowed">
                  <ShieldCheck className="w-4 h-4 text-[var(--teal-deep)] mr-2 shrink-0" />
                  <span className="truncate">{cosos.find((c) => c.id === userCoSoId)?.ten || userCoSoId || "Đơn vị hiện tại"}</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={vaiTro === "QuanLy" ? "" : coSoId}
                    disabled={vaiTro === "QuanLy"}
                    onChange={(e) => setCoSoId(e.target.value)}
                    required={vaiTro !== "QuanLy"}
                    className={`input-field h-10 w-full font-medium text-[13.5px] pr-9 cursor-pointer appearance-none ${
                      vaiTro === "QuanLy" ? "bg-[var(--surface-soft)] text-[var(--mute)] cursor-not-allowed" : "bg-white"
                    }`}
                  >
                    {vaiTro === "QuanLy" ? (
                      <option value="">Toàn hệ thống (Tất cả cơ sở)</option>
                    ) : (
                      <>
                        <option value="">-- Chọn cơ sở làm việc --</option>
                        {cosos.filter((c) => c.trangThai === "active").map((c) => (
                          <option key={c.id} value={c.id}>{c.ten}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--mute)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </Field>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={3} accent="Thông tin đăng nhập" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tên đăng nhập" required>
              <input
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                required
                disabled={isEditing}
                className="input-field font-mono h-10 disabled:bg-[var(--surface-hover)] disabled:text-[var(--mute)] w-full"
                placeholder="VD: mkt.bt"
              />
            </Field>
            <Field label={isEditing ? "Mật khẩu mới" : "Mật khẩu"} required={!isEditing}>
              <input
                type="text"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                required={!isEditing}
                className="input-field font-mono h-10 w-full"
                placeholder={isEditing ? "Để trống nếu không đổi..." : "Nhập mật khẩu..."}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">
            Hủy bỏ
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
            <span>{isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}



// ─── Cấu hình & trạng thái đồng bộ Google Sheet (UC-10 / BR-15) ───
interface GSheetCoSo { id: string; ten: string; sheetId: string | null; envSheetId: string | null }
interface GSheetStatus { enabled: boolean; shareEmail: string | null; tab: string; sharedSheetId: string | null; cronConfigured: boolean; pending: number }

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
    if (res.ok) { const d = await res.json(); setStatus(d.status); setRows(d.cosos); }
    else addToast({ type: "error", message: "Không tải được cấu hình Google Sheet." });
    setLoading(false);
  }, [addToast]);
  useEffect(() => { load(); }, [load]);

  const saveSheetId = async (coSoId: string) => {
    setSavingId(coSoId);
    const res = await fetch("/api/csr/googlesheet", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coSoId, sheetId: drafts[coSoId] ?? "" }) });
    const d = await res.json(); setSavingId(null);
    if (res.ok) { addToast({ type: "success", message: "Đã lưu spreadsheetId." }); setDrafts((p) => { const n = { ...p }; delete n[coSoId]; return n; }); load(); }
    else addToast({ type: "error", message: d.error || "Lỗi" });
  };

  const syncNow = async () => {
    setSyncing(true);
    const res = await fetch("/api/csr/googlesheet", { method: "POST" });
    const d = await res.json(); setSyncing(false);
    if (res.ok) addToast({ type: "success", message: `Đồng bộ xong: ${d.processed} hồ sơ${d.failed ? `, lỗi ${d.failed}` : ""}.` });
    else addToast({ type: "error", message: d.error || "Lỗi đồng bộ" });
    load();
  };

  // Xoá hết dòng dữ liệu cũ rồi đẩy lại toàn bộ hồ sơ theo bộ cột báo cáo hiện tại.
  const rebuildSheet = async () => {
    if (!(await confirm({
      title: "Dựng lại báo cáo?",
      message: "Toàn bộ dòng dữ liệu trên Google Sheet sẽ bị xoá và ghi lại từ đầu theo bộ cột mới.",
      note: "Hàng tiêu đề và mọi cột kế toán tự thêm sẽ bị mất. Thao tác không thể hoàn tác.",
      confirmLabel: "Xoá & dựng lại",
      tone: "danger",
    }))) return;
    setRebuilding(true);
    const res = await fetch("/api/csr/googlesheet?rebuild=1", { method: "POST" });
    const d = await res.json(); setRebuilding(false);
    if (res.ok) addToast({ type: "success", title: "Đã dựng lại báo cáo", message: `${d.processed} hồ sơ${d.failed ? `, lỗi ${d.failed}` : ""}${d.remaining ? `, còn ${d.remaining} trong hàng đợi` : ""}.` });
    else addToast({ type: "error", message: d.error || "Lỗi dựng lại" });
    load();
  };

  const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}`;
  const shared = !!status?.sharedSheetId; // chế độ dùng chung 1 bảng tính

  const gsheetColumns = useMemo<ColumnDef<GSheetCoSo>[]>(
    () => [
      {
        id: "coSo",
        accessorKey: "ten",
        header: "Cơ sở",
        size: 180,
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-[var(--ink)]">{row.original.ten}</div>
            <div className="font-mono text-[11px] text-[var(--mute)]">{row.original.id}</div>
          </div>
        ),
      },
      {
        id: "sheetId",
        header: shared ? "Tab trong bảng tính" : "Spreadsheet ID",
        size: 320,
        meta: { flex: true },
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          const effective = shared ? status!.sharedSheetId! : c.sheetId || c.envSheetId;
          const draft = drafts[c.id] ?? (c.sheetId ?? "");
          const dirty = drafts[c.id] !== undefined && drafts[c.id] !== (c.sheetId ?? "");
          if (shared)
            return (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)]">
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)]">Tab</span> {c.ten}
              </span>
            );
          return (
            <div data-no-row-click>
              <input
                value={draft}
                onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: e.target.value }))}
                placeholder={c.envSheetId ? `env: ${c.envSheetId}` : "Tự tạo khi đồng bộ…"}
                className="input-field font-mono text-[12px] w-[260px] max-w-full"
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
        size: 150,
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
        size: 150,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
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
                  className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
                >
                  {savingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[var(--teal)]" />} Lưu
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
      <div className="bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-sm)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${status?.enabled ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--rose-soft)] text-[var(--rose)]"}`}><FileSpreadsheet className="w-5 h-5" /></div>
            <div>
              <div className="font-serif text-[16px] font-semibold text-[var(--ink)]">Đồng bộ Google Sheet</div>
              <div className="text-[12.5px] text-[var(--mute)]">{!status?.enabled ? "Chưa bật: thiếu GOOGLE_CREDENTIALS trong .env." : status?.sharedSheetId ? "Đã bật — dùng chung 1 bảng tính, mỗi cơ sở là 1 tab riêng." : "Đã bật — mỗi cơ sở đồng bộ 1 chiều lên spreadsheet riêng."}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={rebuildSheet} disabled={rebuilding || syncing || !status?.enabled} title="Xoá dòng cũ & đẩy lại toàn bộ theo bộ cột hiện tại" className="btn btn-secondary px-4 py-2.5 font-bold border-[var(--line-strong)]">
              {rebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[var(--amber)]" />} Dựng lại báo cáo
            </button>
            <button onClick={syncNow} disabled={syncing || rebuilding || !status?.enabled} className="btn btn-primary px-5 py-2.5 font-bold">{syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[var(--teal)]" />} Đồng bộ ngay</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Credentials", val: status?.enabled ? "Đã cấu hình" : "Chưa có", ok: status?.enabled },
            { label: "Email chia sẻ", val: status?.shareEmail || "Chưa đặt", ok: !!status?.shareEmail },
            { label: "Cron dự phòng", val: status?.cronConfigured ? "Đã đặt" : "Chưa đặt", ok: status?.cronConfigured },
            { label: "Hàng đợi chờ", val: `${status?.pending ?? 0} hồ sơ`, ok: (status?.pending ?? 0) === 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2.5">
              <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--mute)]">{s.label}</div>
              <div className={`text-[13px] font-bold mt-0.5 truncate ${s.ok ? "text-[var(--teal-deep)]" : "text-[var(--ink-soft)]"}`} title={s.val}>{s.val}</div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-[var(--mute)] mt-3 leading-relaxed">
          Cấu hình bí mật (JSON service account, email chia sẻ, cron) đặt trong <span className="font-mono">.env</span>.
          {status?.sharedSheetId
            ? " Đang ở chế độ dùng chung: mọi cơ sở ghi vào 1 bảng tính (mỗi cơ sở 1 tab). Đổi/bỏ ở khóa GOOGLE_SHEET_ID trong .env."
            : " Bên dưới bạn có thể gán thủ công spreadsheetId cho từng cơ sở; để trống thì hệ thống tự tạo file lần đồng bộ đầu và lưu lại."}
        </p>
      </div>

      {/* Bảng tính dùng chung */}
      {status?.sharedSheetId && (
        <div className="bg-[var(--navy-50)] border border-[var(--navy-100)] rounded-[var(--r-xl)] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-[var(--navy)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[var(--ink)]">Bảng tính dùng chung của mọi cơ sở</div>
              <a href={sheetUrl(status.sharedSheetId)} target="_blank" rel="noopener noreferrer" className="text-[11.5px] font-semibold text-[var(--navy)] hover:underline truncate block" title={sheetUrl(status.sharedSheetId)}>{sheetUrl(status.sharedSheetId)}</a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(sheetUrl(status.sharedSheetId!)); addToast({ type: "success", message: "Đã copy link." }); }} className="btn btn-secondary px-3 py-2 text-[12px] font-bold"><Copy className="w-3.5 h-3.5" /> Copy</button>
            <a href={sheetUrl(status.sharedSheetId)} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-4 py-2 text-[12px] font-bold"><ExternalLink className="w-3.5 h-3.5 text-[var(--teal)]" /> Mở bảng tính</a>
          </div>
        </div>
      )}

      {/* Sheet theo cơ sở */}
      <div className="bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
        <DataView<GSheetCoSo, unknown> columns={gsheetColumns} data={rows} pageSize={100}>
          <DataTable<GSheetCoSo> dense emptyIcon={FileSpreadsheet} emptyTitle="Chưa có cơ sở" />
        </DataView>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bus,
  Search,
  Check,
  Phone,
  MapPin,
  Clock,
  Users,
  Calendar,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  X,
  Eye,
  ShieldCheck,
  LayoutGrid,
  List,
  Table as TableIcon,
  CheckCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { fmtDate, fmtBuoiKhamName, type HoSo } from "@/lib/csr";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { DataView, DataToolbar, DataTable, DataPagination } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

type StatusFilter = "all" | "chuaDon" | "daDon" | "daMo";
type ViewMode = "grouped" | "grid" | "table";

export default function DoanXePage() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HoSo[]>([]);
  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(false);
  const [bkSearch, setBkSearch] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [diemDonFilter, setDiemDonFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");

  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [stationLoading, setStationLoading] = useState<string | null>(null);
  const [collapsedStations, setCollapsedStations] = useState<Set<string>>(new Set());

  // Nạp danh sách đợt khám để lọc
  useEffect(() => {
    fetch("/api/csr/buoikham")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) setBks(res);
      })
      .catch(() => {});
  }, []);

  // Nạp danh sách bệnh nhân đoàn xe
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (selBk) sp.set("buoiKhamId", selBk);
      if (search.trim()) sp.set("search", search.trim());
      if (dateFilter && dateFilter !== "ALL") sp.set("ngay", dateFilter);
      if (diemDonFilter && diemDonFilter !== "ALL") sp.set("diemDon", diemDonFilter);

      const res = await fetch(`/api/csr/doan-xe?${sp.toString()}`);
      const json = await res.json();
      if (res.ok && json.items) {
        setData(json.items);
      } else {
        addToast({ type: "error", message: json.error || "Không thể tải danh sách đoàn xe" });
      }
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setLoading(false);
    }
  }, [selBk, search, dateFilter, diemDonFilter, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates (SSE)
  useRealtimeEvent(["hoso_change", "buoikham_change"], () => {
    loadData();
  });

  // Toggle Check-in Đã đón / Chưa đón cho 1 cá nhân
  const toggleCheckIn = async (patient: HoSo) => {
    const nextState = !patient.daDon;
    setCheckingInId(patient.id);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/csr/hoso/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daDon: nextState,
          ngayDenBV: nextState ? (patient.ngayDenBV || today) : null,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          message: nextState
            ? `✓ Đã đón bệnh nhân ${patient.hoTen} lên xe`
            : `Đã hủy đón cho ${patient.hoTen}`,
        });
        setData((prev) =>
          prev.map((it) =>
            it.id === patient.id ? { ...it, daDon: nextState, ngayDenBV: nextState ? (it.ngayDenBV || today) : null } : it
          )
        );
      } else {
        addToast({ type: "error", message: d.error || "Không thể cập nhật trạng thái đón" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi mạng khi cập nhật" });
    } finally {
      setCheckingInId(null);
    }
  };

  // Điểm danh đón TẤT CẢ bệnh nhân tại trạm trong 1 click
  const checkInAllStation = async (items: HoSo[], stationKey: string) => {
    const unboarded = items.filter(
      (p) => !p.daDon && !p.ngayDenBV && p.trangThaiDieuTri !== "Đã mổ" && !p.ngayMoThucTe
    );
    if (unboarded.length === 0) {
      addToast({ type: "info", message: "Tất cả bệnh nhân tại trạm này đã được đón lên xe" });
      return;
    }

    setStationLoading(stationKey);
    const today = new Date().toISOString().slice(0, 10);

    try {
      const results = await Promise.all(
        unboarded.map((p) =>
          fetch(`/api/csr/hoso/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ daDon: true, ngayDenBV: p.ngayDenBV || today }),
          })
        )
      );

      const successCount = results.filter((r) => r.ok).length;
      addToast({
        type: "success",
        message: `✓ Đã điểm danh đón ${successCount} bệnh nhân tại trạm lên xe!`,
      });

      const unboardedIds = new Set(unboarded.map((u) => u.id));
      setData((prev) =>
        prev.map((it) =>
          unboardedIds.has(it.id) ? { ...it, daDon: true, ngayDenBV: it.ngayDenBV || today } : it
        )
      );
    } catch {
      addToast({ type: "error", message: "Có lỗi khi cập nhật danh sách trạm" });
    } finally {
      setStationLoading(null);
    }
  };

  // Danh mục unique ngày điều trị / đón
  const uniqueDates = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((i) => (i.ngayDieuTri ? new Date(i.ngayDieuTri).toISOString().slice(0, 10) : null))
          .filter(Boolean) as string[]
      )
    ).sort();
  }, [data]);

  // Danh mục unique điểm đón
  const uniqueDiemDon = useMemo(() => {
    return Array.from(
      new Set(data.map((i) => i.diemDon?.trim()).filter(Boolean) as string[])
    ).sort();
  }, [data]);

  // Bộ lọc dữ liệu phía Client (cho status filter)
  const filteredList = useMemo(() => {
    return data.filter((p) => {
      const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe) || p.trangThai === "DaMoHauPhau";
      const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || p.trangThai === "DaDonVien" || isMo;

      if (statusFilter === "chuaDon" && isDaDen) return false;
      if (statusFilter === "daDon" && !isDaDen) return false;
      if (statusFilter === "daMo" && !isMo) return false;
      return true;
    });
  }, [data, statusFilter]);

  // Thống kê tổng hợp
  const summary = useMemo(() => {
    const total = data.length;
    const daDon = data.filter((i) => i.daDon || i.ngayDenBV || i.trangThaiDieuTri === "Đã mổ" || i.ngayMoThucTe).length;
    const chuaDon = total - daDon;
    const daMo = data.filter((i) => i.trangThaiDieuTri === "Đã mổ" || i.ngayMoThucTe).length;
    return {
      total,
      daDon,
      chuaDon,
      daMo,
      soDiemDon: uniqueDiemDon.length,
    };
  }, [data, uniqueDiemDon]);

  // Nhóm theo Ngày đón (ngayDieuTri) + Điểm đón + Giờ đón
  const groupedByDiemDon = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        ngay: string; // YYYY-MM-DD hoặc CHUA_XEP_NGAY
        diemDon: string;
        gioDon: string;
        items: HoSo[];
        cacXa: string[];
      }
    >();

    for (const p of filteredList) {
      const ngay = p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "CHUA_XEP_NGAY";
      const diem = p.diemDon?.trim() || "Chưa xác định điểm đón";
      const gio = p.gioDon?.trim() || "Chưa xếp giờ";
      const key = `${ngay}___${diem}___${gio}`;

      let grp = map.get(key);
      if (!grp) {
        grp = { key, ngay, diemDon: diem, gioDon: gio, items: [], cacXa: [] };
        map.set(key, grp);
      }
      grp.items.push(p);
      const xa = p.buoiKham?.xa?.trim();
      if (xa && !grp.cacXa.includes(xa)) {
        grp.cacXa.push(xa);
      }
    }

    // Sắp xếp: Nhóm có ngày đón gần nhất lên trước, sau đó đến giờ đón. Nhóm chưa xếp ngày xuống cuối.
    return Array.from(map.values()).sort((a, b) => {
      if (a.ngay === "CHUA_XEP_NGAY" && b.ngay !== "CHUA_XEP_NGAY") return 1;
      if (a.ngay !== "CHUA_XEP_NGAY" && b.ngay === "CHUA_XEP_NGAY") return -1;
      if (a.ngay !== b.ngay) return a.ngay.localeCompare(b.ngay);
      return a.gioDon.localeCompare(b.gioDon);
    });
  }, [filteredList]);

  // Toggle thu gọn/mở rộng trạm
  const toggleCollapse = (key: string) => {
    setCollapsedStations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const collapseAll = () => {
    const allKeys = new Set(groupedByDiemDon.map((g) => g.key));
    setCollapsedStations(allKeys);
  };

  const expandAll = () => {
    setCollapsedStations(new Set());
  };

  // Helper tính tuổi từ năm sinh / ngày sinh
  const getAge = (p: HoSo) => {
    const y = p.namSinh || (p.ngaySinh ? new Date(p.ngaySinh).getFullYear() : null);
    if (!y) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - Number(y);
  };

  // Helper kiểm tra số điện thoại người nhà hợp lệ
  const hasFamilyPhone = (s?: string | null) => {
    if (!s) return false;
    const clean = s.trim().toLowerCase();
    return clean !== "" && clean !== "0" && !clean.includes("chưa") && !clean.includes("khong");
  };

  // Xuất file Excel đoàn xe
  const exportExcel = () => {
    if (filteredList.length === 0) {
      addToast({ type: "info", message: "Không có dữ liệu để xuất Excel" });
      return;
    }

    const rows = filteredList.map((p, idx) => ({
      STT: idx + 1,
      "Họ và tên": p.hoTen,
      "Giới tính": p.gioiTinh || "",
      "Năm sinh": p.namSinh || (p.ngaySinh ? new Date(p.ngaySinh).getFullYear() : ""),
      "Số điện thoại": p.sdt || "",
      "SĐT người nhà": hasFamilyPhone(p.sdtNguoiNha) ? p.sdtNguoiNha : "",
      "Điểm đón": p.diemDon || "Chưa có",
      "Giờ đón": p.gioDon || "",
      "Ngày điều trị / đón": p.ngayDieuTri ? fmtDate(p.ngayDieuTri) : "",
      "Đợt khám": p.buoiKham ? fmtBuoiKhamName(p.buoiKham) : "",
      "Địa chỉ": p.diaChi || "",
      "Chẩn đoán": [p.chanDoanMP, p.chanDoanMT, p.chanDoan].filter(Boolean).join(" · "),
      "Ghi chú tư vấn / Dặn dò": p.ghiChuTuVan || "",
      "Trạng thái đón": p.daDon || p.ngayDenBV ? "ĐÃ ĐÓN" : "CHƯA ĐÓN",
      "Trạng thái mổ": p.trangThaiDieuTri === "Đã mổ" || p.ngayMoThucTe ? "ĐÃ MỔ" : "CHƯA MỔ",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doan_Xe_Don");

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Danh_sach_doan_xe_${todayStr}.xlsx`);
    addToast({ type: "success", message: "Đã xuất file Excel danh sách đoàn xe!" });
  };

  // In danh sách đoàn xe
  const handlePrint = () => {
    window.print();
  };

  const filteredBks = useMemo(() => {
    if (!bkSearch.trim()) return bks;
    const q = bkSearch.toLowerCase();
    return bks.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.xa.toLowerCase().includes(q) ||
        (b.diaDiem && b.diaDiem.toLowerCase().includes(q))
    );
  }, [bks, bkSearch]);

  const selectedBkObj = useMemo(() => bks.find((b) => b.id === selBk), [bks, selBk]);

  // Cột cho chế độ xem BẢNG (TanStack — chuẩn VISIHUB)
  const doanXeColumns = useMemo<ColumnDef<HoSo>[]>(
    () => [
      {
        id: "stt",
        header: "STT",
        size: 60,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--mute)]">
            #{String(row.original.stt ?? row.index + 1).padStart(2, "0")}
          </span>
        ),
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Bệnh nhân",
        size: 200,
        meta: { flex: true },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="min-w-0">
              <div className="font-extrabold text-[13px] text-[var(--ink)] truncate">{p.hoTen}</div>
              <div className="text-[11px] text-[var(--mute)]">
                {p.gioiTinh} · {p.namSinh || (p.ngaySinh ? new Date(p.ngaySinh).getFullYear() : "")}
              </div>
            </div>
          );
        },
      },
      {
        id: "diemDon",
        accessorKey: "diemDon",
        header: "Điểm đón",
        size: 200,
        cell: ({ row }) => (
          <span className="font-bold text-[12px] text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="w-3 h-3 shrink-0" /> {row.original.diemDon || "Chưa có điểm"}
          </span>
        ),
      },
      {
        id: "gioDon",
        accessorKey: "gioDon",
        header: "Giờ đón",
        size: 92,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--navy)]">{row.original.gioDon || "—"}</span>
        ),
      },
      {
        id: "ngayDon",
        header: "Ngày đón",
        size: 108,
        meta: { align: "center" },
        accessorFn: (r) => (r.ngayDieuTri ? new Date(r.ngayDieuTri).getTime() : 0),
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-[var(--ink-soft)]">
            {row.original.ngayDieuTri ? fmtDate(row.original.ngayDieuTri) : "—"}
          </span>
        ),
      },
      {
        id: "sdt",
        accessorKey: "sdt",
        header: "Số điện thoại",
        size: 148,
        cell: ({ row }) =>
          row.original.sdt ? (
            <a
              href={`tel:${row.original.sdt}`}
              data-no-row-click
              className="font-mono font-bold text-[var(--navy)] hover:underline inline-flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-emerald-600" /> {row.original.sdt}
            </a>
          ) : (
            <span className="text-[var(--mute)]">—</span>
          ),
      },
      {
        id: "ghiChuTuVan",
        accessorKey: "ghiChuTuVan",
        header: "Ghi chú đón / Dặn dò",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[12px] text-amber-900" title={row.original.ghiChuTuVan || ""}>
            {row.original.ghiChuTuVan || "—"}
          </span>
        ),
      },
      {
        id: "trangThai",
        header: "Trạng thái",
        size: 128,
        meta: { align: "center" },
        accessorFn: (r) => {
          const isMo = r.trangThaiDieuTri === "Đã mổ" || Boolean(r.ngayMoThucTe);
          if (isMo) return "Đã mổ";
          return Boolean(r.daDon) || Boolean(r.ngayDenBV) ? "Đã lên xe" : "Chờ đón";
        },
        cell: ({ row }) => {
          const p = row.original;
          const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
          const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;
          if (isMo)
            return (
              <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                ✓ ĐÃ MỔ
              </span>
            );
          if (isDaDen)
            return (
              <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                ✓ ĐÃ LÊN XE
              </span>
            );
          return (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              ⏳ CHỜ ĐÓN
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 128,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => {
          const p = row.original;
          const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
          const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;
          return (
            <button
              type="button"
              data-no-row-click
              disabled={checkingInId === p.id}
              onClick={() => toggleCheckIn(p)}
              className={`px-3 py-1 rounded-lg text-[11.5px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                isDaDen
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300"
                  : "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)]"
              }`}
            >
              {checkingInId === p.id ? "..." : isDaDen ? "✓ Đã đón" : "Đón xe"}
            </button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkingInId]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface-bg)] overflow-y-auto">
      {/* Page Header (Ẩn khi in) */}
      <div className="print:hidden border-b border-[var(--line)] bg-white">
        <div className="max-w-7xl mx-auto w-full">
          <PageHeader
            title={
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--navy)] text-white flex items-center justify-center shadow-xs">
                  <Bus className="w-5 h-5 text-[var(--teal)]" />
                </div>
                <div>
                  Danh sách <span className="italic font-normal text-[var(--teal)]">đoàn xe đón</span>
                </div>
              </div>
            }
            description="Điều phối lộ trình xe, điểm đón, giờ đón và danh sách bệnh nhân điều trị phẫu thuật"
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                {/* Nút Chọn đợt khám */}
                <button
                  type="button"
                  onClick={() => setShowBkModal(true)}
                  className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold h-[34px] rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)] cursor-pointer shadow-2xs"
                >
                  <CalendarDays className="w-4 h-4 text-[var(--teal-deep)] shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {selectedBkObj ? fmtBuoiKhamName(selectedBkObj) : "Tất cả đợt khám"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--mute)]" />
                </button>

                {/* Nút Xuất Excel */}
                <button
                  type="button"
                  onClick={exportExcel}
                  className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold h-[34px] rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Xuất bảng Excel đoàn xe"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="hidden sm:inline">Xuất Excel</span>
                </button>

                {/* Nút In danh sách */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold h-[34px] rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-hover)] text-[var(--ink)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="In lệnh điều xe / danh sách đón xe"
                >
                  <Printer className="w-4 h-4 text-[var(--navy)] shrink-0" />
                  <span className="hidden sm:inline">In danh sách</span>
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Dải chỉ số thống kê lộ trình xe (KPI Strip - Bounded max-w-7xl) */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Tổng ca xếp xe */}
            <div className="relative pl-3.5 pr-3 py-2.5 rounded-xl bg-white border border-[var(--line)] shadow-2xs">
              <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-[var(--navy)]" />
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--navy)]" /> Tổng BN đón
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[22px] font-black text-[var(--navy)]">{summary.total}</span>
                <span className="text-[11px] text-[var(--mute)] font-medium">bệnh nhân</span>
              </div>
            </div>

            {/* Đã đón lên xe */}
            <div className="relative pl-3.5 pr-3 py-2.5 rounded-xl bg-white border border-sky-200 shadow-2xs">
              <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-sky-500" />
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Đã đón lên xe
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[22px] font-black text-sky-700">{summary.daDon}</span>
                <span className="text-[11px] text-sky-600 font-bold">
                  ({summary.total > 0 ? Math.round((summary.daDon / summary.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Đang chờ đón */}
            <div className="relative pl-3.5 pr-3 py-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
              <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-amber-500" />
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Đang chờ đón
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[22px] font-black text-amber-700">{summary.chuaDon}</span>
                <span className="text-[11px] text-amber-600 font-medium">chưa lên xe</span>
              </div>
            </div>

            {/* Đã mổ tại viện */}
            <div className="relative pl-3.5 pr-3 py-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-emerald-500" />
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Đã phẫu thuật
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[22px] font-black text-emerald-700">{summary.daMo}</span>
                <span className="text-[11px] text-emerald-600 font-medium">ca đã mổ</span>
              </div>
            </div>

            {/* Số điểm đón */}
            <div className="relative pl-3.5 pr-3 py-2.5 rounded-xl bg-white border border-[var(--line)] shadow-2xs col-span-2 sm:col-span-1">
              <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-[var(--teal)]" />
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> Điểm đón khách
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[22px] font-black text-[var(--ink)]">{summary.soDiemDon}</span>
                <span className="text-[11px] text-[var(--mute)] font-medium">điểm tập trung</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm & bộ lọc lộ trình (Bounded max-w-7xl) */}
      <div className="border-b border-[var(--line)] bg-white shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1 min-w-[240px] max-w-[380px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, SĐT, địa chỉ, trạm đón..."
                className="w-full h-9 rounded-lg border border-[var(--line)] bg-[var(--surface-bg)] pl-9 pr-8 text-[13px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters + View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {/* Chọn ngày đón */}
              <div className="flex items-center gap-1.5">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[var(--line)] bg-white text-[12px] font-bold text-[var(--ink)] outline-none focus:border-[var(--navy)] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">📅 Tất cả ngày đón</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>
                      📅 {fmtDate(d)}
                    </option>
                  ))}
                </select>

                {/* Chọn điểm đón */}
                <select
                  value={diemDonFilter}
                  onChange={(e) => setDiemDonFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[var(--line)] bg-white text-[12px] font-bold text-[var(--ink)] outline-none focus:border-[var(--navy)] cursor-pointer shadow-2xs max-w-[210px] truncate"
                >
                  <option value="ALL">📍 Tất cả điểm đón ({uniqueDiemDon.length})</option>
                  {uniqueDiemDon.map((d) => (
                    <option key={d} value={d}>
                      📍 {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Switcher: Lộ trình trạm / Lưới thẻ / Bảng */}
              <div className="flex items-center bg-[var(--surface-soft)] p-0.5 rounded-lg border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setViewMode("grouped")}
                  title="Chế độ lộ trình trạm"
                  className={`px-2.5 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "grouped"
                      ? "bg-white text-[var(--navy)] shadow-2xs"
                      : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Lộ trình trạm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Chế độ lưới thẻ 2 cột"
                  className={`px-2.5 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white text-[var(--navy)] shadow-2xs"
                      : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Lưới thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title="Chế độ bảng chi tiết"
                  className={`px-2.5 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "table"
                      ? "bg-white text-[var(--navy)] shadow-2xs"
                      : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bảng chi tiết</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dải Tab trạng thái + Toggle thu gọn trạm */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--line-soft)] flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-[11.5px]">
              {[
                { key: "all" as const, label: "Tất cả", n: summary.total },
                { key: "chuaDon" as const, label: "Đang chờ đón", n: summary.chuaDon },
                { key: "daDon" as const, label: "Đã đón lên xe", n: summary.daDon },
                { key: "daMo" as const, label: "Đã mổ xong", n: summary.daMo },
              ].map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? "bg-[var(--navy)] text-white shadow-2xs"
                        : "bg-[var(--surface-soft)] text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[10.5px] px-1.5 rounded-full ${
                        active ? "bg-white/20 text-white" : "bg-white text-[var(--mute)] border border-[var(--line)]"
                      }`}
                    >
                      {tab.n}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nút thu gọn / mở rộng các trạm */}
            {viewMode !== "table" && groupedByDiemDon.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[var(--mute)]">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-[var(--navy)] cursor-pointer font-bold px-1.5 py-0.5"
                >
                  Mở rộng tất cả
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-[var(--navy)] cursor-pointer font-bold px-1.5 py-0.5"
                >
                  Thu gọn tất cả
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vùng nội dung chính (Main Content Area - Bounded with max-w-7xl) */}
      <div className="p-4 sm:p-6 flex-1 min-h-0">
        <div className="max-w-7xl mx-auto w-full">
          {loading && data.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-[var(--mute)] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
              <span className="text-[13px] font-semibold text-[var(--ink-soft)]">
                Đang tải dữ liệu lộ trình đoàn xe...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--mute)] bg-white rounded-2xl border border-[var(--line)] p-8 shadow-xs max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center mb-3">
                <Bus className="w-8 h-8 text-[var(--navy)]" />
              </div>
              <h3 className="font-extrabold text-[16px] text-[var(--ink)]">Không tìm thấy bệnh nhân nào</h3>
              <p className="text-[13px] text-[var(--mute)] mt-1.5 max-w-md leading-relaxed">
                Chưa có ca bệnh nhân nào được xếp xe theo bộ lọc đã chọn. Vui lòng chọn "Tất cả ngày" hoặc chọn đợt khám khác.
              </p>
            </div>
          ) : viewMode === "grouped" ? (
            /* ============================================================
               CHẾ ĐỘ 1: LỘ TRÌNH TRẠM (DẠNG DANH SÁCH RÕ RÀNG, TỐI ƯU CỘT)
               ============================================================ */
            <div className="space-y-5">
              {groupedByDiemDon.map((grp, gIdx) => {
                const stationKey = grp.key;
                const grpDaDon = grp.items.filter((i) => i.daDon || i.ngayDenBV).length;
                const isAllDone = grpDaDon === grp.items.length && grp.items.length > 0;
                const isCollapsed = collapsedStations.has(stationKey);
                const percentDone = Math.round((grpDaDon / grp.items.length) * 100);
                const isStationLoading = stationLoading === stationKey;

                return (
                  <div
                    key={stationKey}
                    className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                      isAllDone
                        ? "border-emerald-200 bg-white"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    {/* Header trạm đón: Thiết kế nổi bật, rõ ràng */}
                    <div className="p-4 sm:px-5 bg-gradient-to-r from-[var(--surface-soft)] via-white to-[var(--surface-soft)] border-b border-[var(--line)] flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Huy hiệu số thứ tự trạm */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-black text-[13px] shadow-2xs ${
                            isAllDone
                              ? "bg-emerald-600 text-white"
                              : "bg-[var(--navy)] text-white"
                          }`}
                        >
                          {String(gIdx + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-[16px] text-[var(--ink)] tracking-tight">
                              {grp.diemDon}
                            </h3>
                            {/* Ngày đón nổi bật */}
                            {grp.ngay !== "CHUA_XEP_NGAY" ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[12px] font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{fmtDate(grp.ngay)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Chưa có ngày</span>
                              </span>
                            )}
                            {/* Giờ đón nổi bật */}
                            <span className="inline-flex items-center gap-1 font-mono text-[12px] font-black px-2.5 py-0.5 rounded-lg bg-[var(--navy-soft)] text-[var(--navy)] border border-blue-200">
                              <Clock className="w-3.5 h-3.5 text-[var(--navy)]" /> {grp.gioDon}
                            </span>
                            {/* Các xã ghép tuyến */}
                            {grp.cacXa.length > 0 && (
                              <span className="text-[11.5px] text-[var(--ink-soft)] bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                Tuyến xã: <b className="text-[var(--navy)]">{grp.cacXa.join(", ")}</b>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[12px] text-[var(--mute)] mt-0.5 flex-wrap">
                            <span>
                              Quy mô: <b className="text-[var(--ink)] font-bold">{grp.items.length}</b> bệnh nhân
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 font-medium">
                              Tiến độ đón:{" "}
                              <b
                                className={`font-mono font-black ${
                                  isAllDone ? "text-emerald-700" : "text-sky-800"
                                }`}
                              >
                                {grpDaDon}/{grp.items.length} ({percentDone}%)
                              </b>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phía phải của Header trạm */}
                      <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                        {/* Thanh đo tiến độ trạm */}
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isAllDone ? "bg-emerald-500" : "bg-sky-500"
                              }`}
                              style={{ width: `${percentDone}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[var(--mute)]">
                            {isAllDone ? "ĐÃ ĐÓN ĐỦ" : `${grp.items.length - grpDaDon} CHƯA LÊN XE`}
                          </span>
                        </div>

                        {/* Nút Đón tất cả bệnh nhân tại trạm nếu chưa đủ */}
                        {!isAllDone && (
                          <button
                            type="button"
                            disabled={isStationLoading}
                            onClick={() => checkInAllStation(grp.items, stationKey)}
                            className="px-3 py-1.5 text-[11.5px] font-extrabold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                            title="Đánh dấu tất cả bệnh nhân tại điểm này đã lên xe"
                          >
                            {isStationLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                            )}
                            <span>Đón cả trạm ({grp.items.length - grpDaDon})</span>
                          </button>
                        )}

                        {/* Badge Hoàn thành nếu đã đủ */}
                        {isAllDone && (
                          <span className="px-2.5 py-1 text-[11.5px] font-extrabold rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            <span>Đã đón đủ</span>
                          </span>
                        )}

                        {/* Nút Thu gọn / Mở rộng trạm */}
                        <button
                          type="button"
                          onClick={() => toggleCollapse(stationKey)}
                          className="w-8 h-8 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          title={isCollapsed ? "Mở rộng danh sách" : "Thu gọn trạm"}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Danh sách hành khách trong trạm (Chia cột khoa học, không khoảng trống vô tận) */}
                    {!isCollapsed && (
                      <div className="divide-y divide-[var(--line-soft)]">
                        {grp.items.map((p, pIdx) => {
                          const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                          const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;
                          const age = getAge(p);

                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 sm:px-5 sm:py-3.5 transition-colors hover:bg-[var(--surface-hover)] ${
                                isDaDen ? "bg-emerald-50/20" : ""
                              }`}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                {/* Cột 1: Thông tin bệnh nhân (md:col-span-4) */}
                                <div className="md:col-span-4 flex items-start gap-2.5 min-w-0">
                                  <span className="font-mono text-[11px] font-black text-[var(--navy)] bg-[var(--navy-50)] px-2 py-0.5 rounded-md border border-[var(--navy-100)] shrink-0 mt-0.5">
                                    #{String(p.stt ?? pIdx + 1).padStart(2, "0")}
                                  </span>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-[14.5px] text-[var(--ink)] truncate">
                                        {p.hoTen}
                                      </span>
                                      {isMo && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs shrink-0">
                                          <Check className="w-3 h-3 stroke-[3]" /> ĐÃ MỔ
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[12px] text-[var(--mute)] font-medium flex items-center gap-2 flex-wrap">
                                      <span>
                                        {p.gioiTinh || "—"}
                                        {age ? ` · ${age} tuổi` : ""}
                                        {p.namSinh ? ` (${p.namSinh})` : ""}
                                      </span>
                                      {p.ngayDieuTri && (
                                        <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                          📅 {fmtDate(p.ngayDieuTri)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Cột 2: Liên lạc, Địa chỉ & Dặn dò (md:col-span-5) */}
                                <div className="md:col-span-5 space-y-1 min-w-0">
                                  {/* Điện thoại chính & người nhà */}
                                  <div className="flex items-center gap-2 flex-wrap text-[12px]">
                                    {p.sdt ? (
                                      <a
                                        href={`tel:${p.sdt}`}
                                        className="inline-flex items-center gap-1 text-[var(--navy)] hover:underline font-mono font-black bg-white px-2 py-0.5 rounded-md border border-[var(--line)] shadow-2xs shrink-0"
                                      >
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        <span>{p.sdt}</span>
                                      </a>
                                    ) : (
                                      <span className="text-[var(--mute)] text-[11.5px]">Không có SĐT</span>
                                    )}

                                    {hasFamilyPhone(p.sdtNguoiNha) && (
                                      <a
                                        href={`tel:${p.sdtNguoiNha}`}
                                        className="inline-flex items-center gap-1 text-slate-700 hover:underline font-mono text-[11.5px] bg-slate-100 px-2 py-0.5 rounded-md shrink-0"
                                      >
                                        <span>Người nhà: {p.sdtNguoiNha}</span>
                                      </a>
                                    )}
                                  </div>

                                  {/* Địa chỉ nơi ở */}
                                  {p.diaChi && (
                                    <div className="text-[12px] text-[var(--mute)] truncate flex items-center gap-1 font-medium">
                                      <MapPin className="w-3 h-3 text-[var(--mute-soft)] shrink-0" />
                                      <span className="truncate">{p.diaChi}</span>
                                    </div>
                                  )}

                                  {/* Dặn dò / Ghi chú tư vấn (Chỉ hiện khi có nội dung) */}
                                  {p.ghiChuTuVan && (
                                    <div className="text-[11.5px] font-medium text-amber-900 bg-amber-50/90 px-2.5 py-0.5 rounded-md border border-amber-200/80 inline-flex items-center gap-1 max-w-full">
                                      <span className="shrink-0">💬</span>
                                      <span className="truncate">
                                        <b>Dặn dò:</b> {p.ghiChuTuVan}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Cột 3: Trạng thái & Thao tác đón (md:col-span-3 - Nằm cạnh thông tin) */}
                                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--line-soft)]">
                                  {/* Nhãn trạng thái */}
                                  <div className="text-left md:text-right">
                                    <span
                                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                                        isDaDen
                                          ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                          : "bg-amber-100 text-amber-900 border border-amber-300"
                                      }`}
                                    >
                                      {isDaDen ? "ĐÃ LÊN XE" : "CHƯA ĐÓN"}
                                    </span>
                                  </div>

                                  {/* Nút bấm Đón lên xe / Hủy đón */}
                                  <button
                                    type="button"
                                    disabled={checkingInId === p.id}
                                    onClick={() => toggleCheckIn(p)}
                                    className={`px-3.5 py-1.5 rounded-xl text-[12px] font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0 ${
                                      isDaDen
                                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300"
                                        : "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)]"
                                    }`}
                                  >
                                    {checkingInId === p.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isDaDen ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>✓ ĐÃ LÊN XE</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bus className="w-3.5 h-3.5 text-[var(--teal)]" />
                                        <span>ĐÓN LÊN XE</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === "grid" ? (
            /* ============================================================
               CHẾ ĐỘ 2: LƯỚI THẺ TRẠM (GRID VIEW - 2 CỘT HIỆN ĐẠI CHO MÀN RỘNG)
               ============================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {groupedByDiemDon.map((grp, gIdx) => {
                const stationKey = grp.key;
                const grpDaDon = grp.items.filter((i) => i.daDon || i.ngayDenBV).length;
                const isAllDone = grpDaDon === grp.items.length && grp.items.length > 0;
                const percentDone = Math.round((grpDaDon / grp.items.length) * 100);
                const isStationLoading = stationLoading === stationKey;

                return (
                  <div
                    key={stationKey}
                    className={`rounded-2xl border bg-white shadow-xs overflow-hidden flex flex-col ${
                      isAllDone ? "border-emerald-200" : "border-[var(--line)]"
                    }`}
                  >
                    {/* Header trạm đón dạng thẻ */}
                    <div className="p-4 bg-gradient-to-r from-[var(--surface-soft)] to-white border-b border-[var(--line)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono font-black text-xs ${
                            isAllDone
                              ? "bg-emerald-600 text-white"
                              : "bg-[var(--navy)] text-white"
                          }`}
                        >
                          {String(gIdx + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-[15px] text-[var(--ink)] truncate">
                            {grp.diemDon}
                          </h3>
                          <div className="flex items-center gap-2 text-[11.5px] text-[var(--mute)] mt-0.5 flex-wrap">
                            {grp.ngay !== "CHUA_XEP_NGAY" ? (
                              <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 text-[11px]">
                                📅 {fmtDate(grp.ngay)}
                              </span>
                            ) : (
                              <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[11px]">
                                Chưa có ngày
                              </span>
                            )}
                            <span className="font-mono font-bold text-[var(--navy)] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              ⏰ {grp.gioDon}
                            </span>
                            <span>•</span>
                            <span>{grp.items.length} BN</span>
                            {grp.cacXa.length > 0 && (
                              <span className="text-[10.5px] text-slate-600">
                                ({grp.cacXa.join(", ")})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nút đón cả trạm hoặc trạng thái */}
                      <div className="shrink-0">
                        {!isAllDone ? (
                          <button
                            type="button"
                            disabled={isStationLoading}
                            onClick={() => checkInAllStation(grp.items, stationKey)}
                            className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            {isStationLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-emerald-700" />
                            )}
                            <span>Đón cả trạm</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300">
                            ✓ Đủ {grp.items.length} BN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar trạm */}
                    <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isAllDone ? "bg-emerald-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${percentDone}%` }}
                      />
                    </div>

                    {/* Danh sách hành khách dạng danh sách thẻ nhỏ */}
                    <div className="divide-y divide-[var(--line-soft)] flex-1 overflow-y-auto max-h-[380px]">
                      {grp.items.map((p, pIdx) => {
                        const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                        const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;

                        return (
                          <div
                            key={p.id}
                            className={`p-3 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-3 ${
                              isDaDen ? "bg-emerald-50/15" : ""
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[10.5px] font-bold text-[var(--mute)]">
                                  #{String(p.stt ?? pIdx + 1).padStart(2, "0")}
                                </span>
                                <span className="font-bold text-[13.5px] text-[var(--ink)] truncate">
                                  {p.hoTen}
                                </span>
                                {isMo && (
                                  <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                                    ĐÃ MỔ
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11.5px] text-[var(--mute)] flex-wrap">
                                <span>{p.gioiTinh} · {p.namSinh}</span>
                                {p.sdt && (
                                  <a
                                    href={`tel:${p.sdt}`}
                                    className="font-mono font-bold text-[var(--navy)] hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                    {p.sdt}
                                  </a>
                                )}
                              </div>

                              {p.ghiChuTuVan && (
                                <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 truncate max-w-[280px]">
                                  💬 {p.ghiChuTuVan}
                                </div>
                              )}
                            </div>

                            {/* Nút đón xe */}
                            <button
                              type="button"
                              disabled={checkingInId === p.id}
                              onClick={() => toggleCheckIn(p)}
                              className={`px-3 py-1.5 rounded-xl text-[11.5px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 ${
                                isDaDen
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300"
                                  : "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)]"
                              }`}
                            >
                              {checkingInId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isDaDen ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                  <span>Đã đón</span>
                                </>
                              ) : (
                                <>
                                  <Bus className="w-3.5 h-3.5 text-[var(--teal)]" />
                                  <span>Đón xe</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================
               CHẾ ĐỘ 3: BẢNG DANH SÁCH CHI TIẾT (EXCEL-LIKE TABLE VIEW)
               ============================================================ */
            <DataView<HoSo, unknown> columns={doanXeColumns} data={filteredList} pageSize={100}>
              <div className="rounded-2xl border border-[var(--line)] bg-white shadow-xs overflow-hidden flex flex-col">
                <DataToolbar searchPlaceholder="Tìm bệnh nhân, điểm đón, số điện thoại…" />
                <DataTable<HoSo>
                  dense
                  emptyIcon={Bus}
                  emptyTitle="Không có bệnh nhân xếp xe"
                  rowClassName={(p) => {
                    const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                    return Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo ? "!bg-emerald-50/40" : undefined;
                  }}
                />
                <DataPagination pageSizeOptions={[50, 100, 200, 500]} />
              </div>
            </DataView>
          )}
        </div>
      </div>

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={
          <>
            Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span>
          </>
        }
        subtitle="Lọc danh sách đoàn xe theo đợt khám tầm soát"
        icon={CalendarDays}
        maxWidth="max-w-[620px]"
        noPadding
      >
        {/* Search */}
        <div className="p-4 border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
            <input
              autoFocus
              placeholder="Tìm theo xã, địa điểm hoặc mã đợt khám..."
              value={bkSearch}
              onChange={(e) => setBkSearch(e.target.value)}
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line)] bg-white pl-10 pr-4 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 bg-[var(--surface-soft)] min-h-[250px] max-h-[50vh] overflow-y-auto">
          {/* Tùy chọn: Xem tất cả đợt khám */}
          <button
            type="button"
            onClick={() => {
              setSelBk("");
              setShowBkModal(false);
            }}
            className={`w-full text-left p-3.5 rounded-[var(--r-lg)] transition-all flex items-center gap-3 border cursor-pointer ${
              !selBk ? "bg-white border-[var(--navy)] ring-1 ring-[var(--navy)]" : "bg-white border-[var(--line)] hover:border-[var(--line-strong)]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center font-bold text-xs">
              ALL
            </div>
            <div>
              <div className="font-bold text-[14px] text-[var(--ink)]">Tất cả các đợt khám</div>
              <div className="text-[12px] text-[var(--mute)]">Xem toàn bộ bệnh nhân xếp xe của các đợt</div>
            </div>
          </button>

          {filteredBks.map((b) => {
            const active = selBk === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setSelBk(b.id);
                  setShowBkModal(false);
                }}
                className={`w-full text-left p-3.5 rounded-[var(--r-lg)] transition-all flex items-center gap-3 border cursor-pointer ${
                  active ? "bg-white border-[var(--navy)] ring-1 ring-[var(--navy)]" : "bg-white border-[var(--line)] hover:border-[var(--line-strong)]"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[14px] text-[var(--ink)] truncate">{fmtBuoiKhamName(b)}</span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--mute)] mt-0.5 flex items-center gap-3">
                    <span>📅 {fmtDate(b.ngayKham)}</span>
                    {b.diaDiem && <span className="truncate">📍 {b.diaDiem}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

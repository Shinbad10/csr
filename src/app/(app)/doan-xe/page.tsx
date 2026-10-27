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
  Edit3,
  UserPlus, Plus, ChevronLeft
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import {
  fmtDate,
  fmtBuoiKhamName,
  type HoSo,
  fmtSinhTuoi,
  cleanDiemDon,
  parseDoanXe,
  stripDoanXeTag,
  formatGhiChuWithDoanXe,
  suggestNextTime,
  getDoanColor,
  type ThongTinNguoiNha,
  parseThongTinNguoiNha,
  XE_MAC_DINH,
} from "@/lib/csr";
import Modal from "@/components/layout/Modal";
import PageHeader from "@/components/layout/PageHeader";
import DoanXeAutocomplete from "@/components/csr/DoanXeAutocomplete";
import { SoDoXe, ChonXeModal, type NguoiTrenXe } from "@/components/csr/SoDoXe";
import { Dropdown } from "@/components/csr/fields";
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
  // Xe của từng đoàn (bảng DoanXe): loại xe + giờ đón
  type XeDoan = { id: string; coSoId: string; ngayDon: string; diemDon: string; soDoan: number; soCho: number; gioDon: string | null };
  const [xeList, setXeList] = useState<XeDoan[]>([]);
  const [chuaCoBangXe, setChuaCoBangXe] = useState(false);
  const [chonXe, setChonXe] = useState<{ coSoId: string; ngayDon: string; diemDon: string; soDoan: number; soCho: number | null; gioDon: string | null; moi: boolean } | null>(null);
  const [cheDoTram, setCheDoTram] = useState<"ds" | "ghe">("ds");
  // Lộ trình trạm dạng sidebar: trạm đang xem + bộ lọc danh sách trạm
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [stationQuery, setStationQuery] = useState("");
  const [stationTinhTrang, setStationTinhTrang] = useState<"all" | "cho" | "du">("all");

  // Lọc Đoàn theo từng trạm: { [stationKey]: "all" | number }
  const [stationDoanFilter, setStationDoanFilter] = useState<Record<string, "all" | number>>({});
  const [switchingPatientId, setSwitchingPatientId] = useState<string | null>(null);

  // Modal Tách / Thêm nhanh Đoàn cho cả Trạm Y Tế
  const [splitModalStation, setSplitModalStation] = useState<{
    key: string;
    diemDon: string;
    ngay: string;
    items: HoSo[];
    existingDoans: number[];
    defaultDoan1Gio?: string;
  } | null>(null);
  const [splitTargetDoanNum, setSplitTargetDoanNum] = useState<number>(2);
  const [splitTargetGio, setSplitTargetGio] = useState("06:30");
  const [splitMode, setSplitMode] = useState<"half" | "manual" | "time_only">("half");
  const [splitSelectedPatientIds, setSplitSelectedPatientIds] = useState<Set<string>>(new Set());
  const [splittingInProgress, setSplittingInProgress] = useState(false);

  // Modal xếp xe / đổi điểm đón / thêm người nhà
  const [editingBusPatient, setEditingBusPatient] = useState<HoSo | null>(null);
  const [busFormDiem, setBusFormDiem] = useState("");
  const [busFormGio, setBusFormGio] = useState("");
  const [busFormDate, setBusFormDate] = useState("");
  const [busFormDoanXe, setBusFormDoanXe] = useState<number>(1);
  const [busFormCoNguoiNha, setBusFormCoNguoiNha] = useState(false);
  const [busFormSoNguoiNha, setBusFormSoNguoiNha] = useState(1);
  const [busFormTenQuanHe, setBusFormTenQuanHe] = useState("");
  const [busFormSdtNguoiNha, setBusFormSdtNguoiNha] = useState("");
  const [busFormGhiChu, setBusFormGhiChu] = useState("");
  const [savingBus, setSavingBus] = useState(false);

  const handleOpenAssignModal = (p: HoSo, defaultAddFamily = false) => {
    const info = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
    const doan = parseDoanXe(p);
    setEditingBusPatient(p);
    setBusFormDiem(cleanDiemDon(p.diemDon));
    setBusFormGio(p.gioDon || "06:00");
    setBusFormDate(p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "");
    setBusFormDoanXe(doan);
    setBusFormCoNguoiNha(defaultAddFamily ? true : info.hasNguoiNha ? info.coDiCung : false);
    setBusFormSoNguoiNha(info.soLuongDiCung || 1);
    setBusFormTenQuanHe(info.tenQuanHe || "");
    setBusFormSdtNguoiNha(info.sdt || (info.hasNguoiNha && !info.tenQuanHe && !info.sdt ? p.sdtNguoiNha || "" : ""));
    setBusFormGhiChu(stripDoanXeTag(p.ghiChuTuVan));
  };

  const handleSaveBusAssignment = async () => {
    if (!editingBusPatient) return;
    setSavingBus(true);
    try {
      let finalSdtNguoiNha: string | null = null;
      if (busFormCoNguoiNha) {
        const phone = busFormSdtNguoiNha.trim();
        const rel = busFormTenQuanHe.trim();
        const label = `${busFormSoNguoiNha} người nhà đi kèm${rel ? ` - ${rel}` : ""}`;
        if (phone) {
          finalSdtNguoiNha = `${phone} (${label})`;
        } else {
          finalSdtNguoiNha = label;
        }
      } else if (busFormSdtNguoiNha.trim() || busFormTenQuanHe.trim()) {
        const phone = busFormSdtNguoiNha.trim();
        const rel = busFormTenQuanHe.trim();
        if (phone && rel) {
          finalSdtNguoiNha = `${phone} (${rel})`;
        } else {
          finalSdtNguoiNha = phone || rel;
        }
      }

      const finalGhiChu = formatGhiChuWithDoanXe(busFormGhiChu, busFormDoanXe);
      const cleanDiem = cleanDiemDon(busFormDiem);

      const res = await fetch(`/api/csr/hoso/${editingBusPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diemDon: cleanDiem || null,
          gioDon: busFormGio.trim() || null,
          ngayDieuTri: busFormDate || null,
          sdtNguoiNha: finalSdtNguoiNha,
          ghiChuTuVan: finalGhiChu || null,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        const familyMsg = busFormCoNguoiNha
          ? ` (+${busFormSoNguoiNha} người nhà đi kèm)`
          : "";
        addToast({
          type: "success",
          message: `✓ Đã cập nhật cho ${editingBusPatient.hoTen}: ${cleanDiem || "Tự túc"} (Đoàn ${busFormDoanXe} - ${busFormGio})${familyMsg}`,
        });
        setData((prev) =>
          prev.map((it) =>
            it.id === editingBusPatient.id
              ? {
                  ...it,
                  diemDon: cleanDiem || null,
                  gioDon: busFormGio.trim() || null,
                  ngayDieuTri: busFormDate || null,
                  sdtNguoiNha: finalSdtNguoiNha,
                  ghiChuTuVan: finalGhiChu || null,
                }
              : it
          )
        );
        setEditingBusPatient(null);
      } else {
        addToast({ type: "error", message: json.error || "Không thể lưu thông tin đón" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối khi lưu thông tin đón" });
    } finally {
      setSavingBus(false);
    }
  };

  // Chuyển nhanh bệnh nhân qua Đoàn bất kỳ (1-click trực tiếp trên thẻ/dòng)
  const handleQuickSwitchDoan = async (p: HoSo, targetDoan: number, targetGio?: string) => {
    setSwitchingPatientId(p.id);
    const updatedGhiChu = formatGhiChuWithDoanXe(p.ghiChuTuVan, targetDoan);
    const baseDiem = cleanDiemDon(p.diemDon);
    const updatePayload: Record<string, any> = {
      diemDon: baseDiem,
      ghiChuTuVan: updatedGhiChu,
    };
    if (targetGio && targetGio.trim() && targetGio !== "Chưa xếp giờ") {
      updatePayload.gioDon = targetGio.trim();
    }

    try {
      const res = await fetch(`/api/csr/hoso/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (res.ok) {
        addToast({
          type: "success",
          message: `✓ Đã chuyển bệnh nhân ${p.hoTen} sang Đoàn ${targetDoan}!`,
        });
        setData((prev) =>
          prev.map((it) =>
            it.id === p.id
              ? {
                  ...it,
                  diemDon: baseDiem,
                  ghiChuTuVan: updatedGhiChu,
                  ...(updatePayload.gioDon ? { gioDon: updatePayload.gioDon } : {}),
                }
              : it
          )
        );
      } else {
        const err = await res.json();
        addToast({ type: "error", message: err.error || "Không thể chuyển đoàn xe" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối khi chuyển đoàn xe" });
    } finally {
      setSwitchingPatientId(null);
    }
  };

  // Mở modal tách / thêm nhanh Đoàn cho cả Trạm Y Tế (linh động Đoàn 2, 3, 4...)
  const handleOpenSplitModal = (
    grp: { key: string; diemDon: string; ngay: string; items: HoSo[] },
    existingDoans: number[] = [1],
    suggestedDoanNum?: number,
    suggestedGio?: string
  ) => {
    const nextDoanNum = suggestedDoanNum || (existingDoans.length > 0 ? Math.max(...existingDoans) + 1 : 2);
    const itemWithTime = grp.items.find((it) => it.gioDon && it.gioDon.includes(":"));
    const defaultGio = suggestedGio || (itemWithTime?.gioDon ? suggestNextTime(itemWithTime.gioDon) : "06:30");
    setSplitModalStation({
      ...grp,
      existingDoans,
      defaultDoan1Gio: itemWithTime?.gioDon || "05:15",
    });
    setSplitTargetDoanNum(nextDoanNum);
    setSplitTargetGio(defaultGio);
    setSplitMode("half");

    // Mặc định chọn 50% số bệnh nhân phía sau cho chế độ chia đều
    const halfCount = Math.floor(grp.items.length / 2);
    const bottomHalfIds = new Set(grp.items.slice(grp.items.length - halfCount).map((p) => p.id));
    setSplitSelectedPatientIds(bottomHalfIds);
  };

  // Thực hiện tách hoặc tạo tuyến Đoàn mới cho Trạm
  const handleExecuteSplitDoan = async () => {
    if (!splitModalStation) return;
    setSplittingInProgress(true);
    const stationName = splitModalStation.diemDon;
    const targetGio = splitTargetGio.trim() || "06:30";
    const targetDoan = splitTargetDoanNum || 2;

    try {
      if (splitMode === "time_only") {
        await fetch("/api/csr/doan-xe/diem-don", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenDoan: `Tuyến ${stationName} - Đoàn ${targetDoan}`,
            ngayDon:
              splitModalStation.ngay !== "CHUA_XEP_NGAY"
                ? splitModalStation.ngay
                : new Date().toISOString().slice(0, 10),
            cacDiem: [{ diemDon: stationName, gioDon: targetGio }],
          }),
        });
        addToast({
          type: "success",
          message: `✓ Đã tạo mốc đón Đoàn ${targetDoan} (${targetGio}) cho ${stationName}!`,
        });
        setSplitModalStation(null);
        return;
      }

      const patientsToMove = splitModalStation.items.filter((p) =>
        splitSelectedPatientIds.has(p.id)
      );
      if (patientsToMove.length === 0) {
        addToast({
          type: "info",
          message: `Vui lòng chọn ít nhất 1 bệnh nhân để chuyển sang Đoàn ${targetDoan}`,
        });
        setSplittingInProgress(false);
        return;
      }

      const updatePromises = patientsToMove.map((p) => {
        const updatedGhiChu = formatGhiChuWithDoanXe(p.ghiChuTuVan, targetDoan);
        return fetch(`/api/csr/hoso/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gioDon: targetGio,
            ghiChuTuVan: updatedGhiChu,
          }),
        });
      });

      await Promise.all(updatePromises);

      const targetIds = new Set(patientsToMove.map((p) => p.id));
      setData((prev) =>
        prev.map((it) => {
          if (targetIds.has(it.id)) {
            return {
              ...it,
              gioDon: targetGio,
              ghiChuTuVan: formatGhiChuWithDoanXe(it.ghiChuTuVan, targetDoan),
            };
          }
          return it;
        })
      );

      setStationDoanFilter((prev) => ({ ...prev, [splitModalStation.key]: "all" }));

      addToast({
        type: "success",
        message: `✓ Đã chuyển thành công ${patientsToMove.length} bệnh nhân sang Đoàn ${targetDoan} (${targetGio}) tại ${stationName}!`,
      });

      setSplitModalStation(null);
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối khi tách đoàn xe" });
    } finally {
      setSplittingInProgress(false);
    }
  };

  // Nạp danh sách đợt khám để lọc
  useEffect(() => {
    fetch("/api/csr/buoikham")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) setBks(res);
      })
      .catch(() => {});
  }, []);

  const loadXe = useCallback(async () => {
    try {
      const res = await fetch("/api/csr/doan-xe/xe");
      const json = await res.json();
      if (res.ok) {
        setXeList(Array.isArray(json.items) ? json.items : []);
        setChuaCoBangXe(Boolean(json.chuaCoBang));
      }
    } catch {}
  }, []);

  // Nạp danh sách bệnh nhân đoàn xe (kèm xe của các đoàn)
  const loadData = useCallback(async () => {
    setLoading(true);
    loadXe();
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
  }, [selBk, search, dateFilter, diemDonFilter, addToast, loadXe]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates (SSE)
  useRealtimeEvent(["hoso_change", "buoikham_change"], () => {
    loadData();
  });

  /** Lưu loại xe (+ giờ đón) cho một đoàn của một điểm đón */
  const luuXe = async (v: { coSoId: string; ngayDon: string; diemDon: string; soDoan: number; soCho: number; gioDon?: string | null }) => {
    try {
      const res = await fetch("/api/csr/doan-xe/xe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        addToast({ type: "error", message: json.error || "Không lưu được đoàn xe" });
        return false;
      }
      await loadXe();
      return true;
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
      return false;
    }
  };

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
      new Set(data.map((i) => cleanDiemDon(i.diemDon)).filter(Boolean) as string[])
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
    const totalNguoiNha = data.reduce((acc, it) => {
      const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
      return acc + (f.coDiCung ? f.soLuongDiCung : 0);
    }, 0);
    const totalDoan1 = data.filter((i) => parseDoanXe(i) === 1).length;
    const totalDoan2 = data.filter((i) => parseDoanXe(i) > 1).length;
    return {
      total,
      daDon,
      chuaDon,
      daMo,
      totalDoan1,
      totalDoan2,
      totalNguoiNha,
      tongChoNgoi: total + totalNguoiNha,
      soDiemDon: uniqueDiemDon.length,
    };
  }, [data, uniqueDiemDon]);

  // Nhóm theo Ngày đón (ngayDieuTri) + Điểm đón (cùng trạm y tế nằm chung 1 thẻ, tách Đoàn 1 / Đoàn 2 bên trong)
  const groupedByDiemDon = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        ngay: string; // YYYY-MM-DD hoặc CHUA_XEP_NGAY
        diemDon: string;
        rawDiemDon: string;
        items: HoSo[];
        cacXa: string[];
      }
    >();

    for (const p of filteredList) {
      const ngay = p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "CHUA_XEP_NGAY";
      const diem = cleanDiemDon(p.diemDon);
      const key = `${ngay}___${diem}`;

      let grp = map.get(key);
      if (!grp) {
        grp = {
          key,
          ngay,
          diemDon: diem,
          rawDiemDon: p.diemDon?.trim() || "Chưa xác định điểm đón",
          items: [],
          cacXa: [],
        };
        map.set(key, grp);
      }
      grp.items.push(p);
      const xa = p.buoiKham?.xa?.trim();
      if (xa && !grp.cacXa.includes(xa)) {
        grp.cacXa.push(xa);
      }
    }

    // Sắp xếp: Nhóm có ngày đón gần nhất lên trước, sau đó đến tên trạm. Nhóm chưa xếp ngày xuống cuối.
    return Array.from(map.values()).sort((a, b) => {
      if (a.ngay === "CHUA_XEP_NGAY" && b.ngay !== "CHUA_XEP_NGAY") return 1;
      if (a.ngay !== "CHUA_XEP_NGAY" && b.ngay === "CHUA_XEP_NGAY") return -1;
      if (a.ngay !== b.ngay) return a.ngay.localeCompare(b.ngay);
      return a.diemDon.localeCompare(b.diemDon);
    });
  }, [filteredList]);

  const activeStationKey = activeStation && groupedByDiemDon.some((g) => g.key === activeStation) ? activeStation : null;
  const shownStationKey = activeStationKey ?? groupedByDiemDon[0]?.key ?? null;

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

    const rows = filteredList.map((p, idx) => {
      const info = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
      const doan = parseDoanXe(p);
      const nguoiNhaText = info.hasNguoiNha
        ? `${info.coDiCung ? `Có (${info.soLuongDiCung} người đi kèm)` : "Không đi xe"}${info.tenQuanHe ? ` - ${info.tenQuanHe}` : ""}`
        : "Không";
      const tongCho = 1 + (info.coDiCung ? info.soLuongDiCung : 0);

      return {
        STT: idx + 1,
        "Họ và tên": p.hoTen,
        "Giới tính": p.gioiTinh || "",
        "Năm sinh": p.namSinh || (p.ngaySinh ? new Date(p.ngaySinh).getFullYear() : ""),
        "Số điện thoại BN": p.sdt || "",
        "Đoàn xe": `Đoàn ${doan}`,
        "Người nhà đi kèm": nguoiNhaText,
        "SĐT người nhà": info.sdt || (info.hasNguoiNha ? p.sdtNguoiNha : ""),
        "Tổng số người lên xe": `${tongCho} (${tongCho > 1 ? `1 BN + ${info.soLuongDiCung} người nhà` : "1 BN"})`,
        "Điểm đón": cleanDiemDon(p.diemDon),
        "Giờ đón": p.gioDon || "",
        "Ngày điều trị / đón": p.ngayDieuTri ? fmtDate(p.ngayDieuTri) : "",
        "Đợt khám": p.buoiKham ? fmtBuoiKhamName(p.buoiKham) : "",
        "Địa chỉ": p.diaChi || "",
        "Chẩn đoán": [p.chanDoanMP, p.chanDoanMT, p.chanDoan].filter(Boolean).join(" · "),
        "Ghi chú tư vấn / Dặn dò": stripDoanXeTag(p.ghiChuTuVan) || "",
        "Trạng thái đón": p.daDon || p.ngayDenBV ? "ĐÃ ĐÓN" : "CHƯA ĐÓN",
        "Trạng thái mổ": p.trangThaiDieuTri === "Đã mổ" || p.ngayMoThucTe ? "ĐÃ MỔ" : "CHƯA MỔ",
      };
    });

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
        size: 190,
        cell: ({ row }) => (
          <span className="font-bold text-[12px] text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-flex items-center gap-1 truncate max-w-[190px]">
            <MapPin className="w-3 h-3 shrink-0" /> {cleanDiemDon(row.original.diemDon)}
          </span>
        ),
      },
      {
        id: "doanXe",
        header: "Đoàn xe",
        size: 165,
        meta: { align: "center" },
        accessorFn: (r) => parseDoanXe(r),
        cell: ({ row }) => {
          const p = row.original;
          const currentDoan = parseDoanXe(p);
          const color = getDoanColor(currentDoan);
          return (
            <div data-no-row-click className="inline-flex items-center gap-1.5 justify-center">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${color.badge} flex items-center gap-1 shadow-2xs`}
              >
                <Bus className="w-3 h-3" />
                <span>
                  Đoàn {currentDoan}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenAssignModal(p)}
                className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                title={`Đổi đoàn xe hoặc giờ đón cho ${p.hoTen}`}
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          );
        },
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
        id: "nguoiNha",
        header: "Người nhà đi kèm & SĐT",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const info = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
          if (info.hasNguoiNha) {
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[11.5px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-600 shrink-0" />
                  {info.coDiCung ? `Kèm ${info.soLuongDiCung} người` : "Người nhà"}: {info.tenQuanHe || "Đi cùng"}
                </span>
                {info.sdt && (
                  <a
                    href={`tel:${info.sdt}`}
                    data-no-row-click
                    className="font-mono text-[11px] font-bold text-purple-700 hover:underline inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-purple-200"
                  >
                    <Phone className="w-2.5 h-2.5 text-purple-600" /> {info.sdt}
                  </a>
                )}
                <button
                  type="button"
                  data-no-row-click
                  onClick={() => handleOpenAssignModal(p)}
                  className="text-purple-400 hover:text-purple-700 p-0.5 rounded cursor-pointer transition-colors"
                  title="Sửa thông tin người nhà"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            );
          }
          return (
            <button
              type="button"
              data-no-row-click
              onClick={() => handleOpenAssignModal(p, true)}
              className="text-[11px] text-purple-700 hover:text-purple-900 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold bg-purple-50/70 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200/60"
            >
              <UserPlus className="w-3 h-3 text-purple-600" />
              <span>+ Thêm người nhà</span>
            </button>
          );
        },
      },
      {
        id: "ghiChuTuVan",
        accessorKey: "ghiChuTuVan",
        header: "Ghi chú đón / Dặn dò",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => {
          const stripped = stripDoanXeTag(row.original.ghiChuTuVan);
          return (
            <span className="text-[12px] text-amber-900" title={stripped || ""}>
              {stripped || "—"}
            </span>
          );
        },
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
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg)] overflow-hidden print:overflow-visible print:block">
      {/* ── Header chung: tiêu đề · đợt khám + thao tác; hàng dưới là dải chỉ số ── */}
      <PageHeader
        className="print:hidden shrink-0"
        icon={Bus}
        title="Đoàn xe"
        accent="đón bệnh nhân"
        description="Điều phối điểm đón, giờ đón, xe và ghế ngồi cho bệnh nhân điều trị tại viện"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowBkModal(true)}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] text-[12.5px] font-semibold text-[var(--ink)] hover:border-[var(--navy)]/40 transition-colors cursor-pointer min-w-0"
              title="Chọn đợt khám"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[var(--teal-deep)] shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[260px]">{selectedBkObj ? fmtBuoiKhamName(selectedBkObj) : "Tất cả đợt khám"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--mute)] shrink-0" />
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[12.5px] font-semibold text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              title="Xuất bảng Excel đoàn xe"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 transition-colors cursor-pointer whitespace-nowrap"
              title="In lệnh điều xe / danh sách đón xe"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In danh sách</span>
            </button>
          </>
        }
      >
          {/* Dải chỉ số (ERP): một khối chia cột, số mono — điện thoại vuốt ngang */}
          <div className="min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex items-stretch w-max xl:w-full rounded-[12px] border border-[var(--line)] bg-[var(--surface-soft)]/40 divide-x divide-[var(--line-soft)]">
              {(() => {
                const pct = (n: number) => `${summary.total > 0 ? Math.round((n / summary.total) * 100) : 0}%`;
                return [
                  {
                    k: "Tổng BN đón",
                    v: summary.total,
                    sub: summary.totalNguoiNha > 0 ? `+${summary.totalNguoiNha} NN · ${summary.tongChoNgoi} chỗ` : "bệnh nhân",
                    tone: "text-[var(--ink)]",
                  },
                  { k: "Đoàn 1", v: summary.totalDoan1, sub: pct(summary.totalDoan1), tone: "text-[var(--navy)]" },
                  { k: "Đoàn 2+", v: summary.totalDoan2, sub: pct(summary.totalDoan2), tone: summary.totalDoan2 ? "text-[var(--navy)]" : "text-[var(--mute-soft)]" },
                  { k: "Đã lên xe", v: summary.daDon, sub: pct(summary.daDon), tone: "text-[var(--teal-deep)]" },
                  { k: "Chờ đón", v: summary.chuaDon, sub: "chưa lên xe", tone: summary.chuaDon ? "text-[var(--amber-deep)]" : "text-[var(--mute-soft)]" },
                  { k: "Đã phẫu thuật", v: summary.daMo, sub: "ca", tone: "text-[var(--teal-deep)]" },
                ].map((m) => (
                  <div key={m.k} className="px-3.5 py-1.5 min-w-[118px] xl:min-w-0 xl:flex-1">
                    <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--mute)] whitespace-nowrap">{m.k}</div>
                    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                      <span className={`font-mono text-[17px] font-bold leading-tight tabular-nums ${m.tone}`}>{m.v}</span>
                      <span className="font-mono text-[10.5px] text-[var(--mute)]">{m.sub}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
      </PageHeader>

      {/* ── Thanh công cụ: tìm · trạng thái · ngày · điểm đón · chế độ xem ── */}
      <div className="print:hidden shrink-0 bg-[var(--surface)] border-b border-[var(--line)] px-3 sm:px-5 py-2 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--mute)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT, địa chỉ, trạm đón…"
            className="w-full h-8 pl-8 pr-7 rounded-[9px] border border-[var(--line)] bg-[var(--surface-soft)] text-[12.5px] text-[var(--ink)] outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_var(--navy-100)] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5 max-w-full overflow-x-auto no-scrollbar">
          {[
            { key: "all" as const, label: "Tất cả", n: summary.total },
            { key: "chuaDon" as const, label: "Chờ đón", n: summary.chuaDon },
            { key: "daDon" as const, label: "Đã lên xe", n: summary.daDon },
            { key: "daMo" as const, label: "Đã mổ", n: summary.daMo },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`shrink-0 h-7 px-2.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  active ? "bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {tab.label}
                <span className={`font-mono text-[10.5px] tabular-nums ${active ? "text-white/75" : "text-[var(--mute)]"}`}>{tab.n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <div className="flex-1 sm:flex-none sm:w-[170px] min-w-0">
            <Dropdown
              size="sm"
              value={dateFilter}
              onChange={setDateFilter}
              options={["ALL", ...uniqueDates]}
              labels={Object.fromEntries([["ALL", "Tất cả ngày đón"], ...uniqueDates.map((d) => [d, fmtDate(d)])])}
              mono={false}
            />
          </div>
          <div className="flex-1 sm:flex-none sm:w-[230px] min-w-0">
            <Dropdown
              size="sm"
              value={diemDonFilter}
              onChange={setDiemDonFilter}
              options={["ALL", ...uniqueDiemDon]}
              labels={{ ALL: `Tất cả điểm đón (${uniqueDiemDon.length})` }}
              mono={false}
            />
          </div>
          <div className="inline-flex shrink-0 p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5">
            {([
              ["grouped", List, "Lộ trình trạm"],
              ["grid", LayoutGrid, "Lưới thẻ"],
              ["table", TableIcon, "Bảng chi tiết"],
            ] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                title={label}
                className={`h-7 px-2 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === mode ? "bg-[var(--surface)] text-[var(--navy)] shadow-[var(--shadow-xs)]" : "text-[var(--mute)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden 2xl:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nội dung: Lộ trình trạm = sidebar + chi tiết cao hết màn hình; chế độ khác cuộn cả vùng ── */}
      {(() => {
        const sidebarMode = viewMode === "grouped" && !(loading && data.length === 0) && filteredList.length > 0;
        return (
      <div className={sidebarMode ? "flex-1 min-h-0 flex flex-col print:block" : "flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 print:overflow-visible"}>
        <div className={sidebarMode ? "flex-1 min-h-0 flex flex-col" : "w-full"}>
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
            <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
              {/* Sidebar điểm đón: nhóm theo ngày, tiến độ từng trạm, tìm & lọc nhanh */}
              {(() => {
                const daDonCua = (g: (typeof groupedByDiemDon)[number]) => g.items.filter((it) => it.daDon || it.ngayDenBV).length;
                const q = stationQuery.trim().toLowerCase();
                const nDu = groupedByDiemDon.filter((g) => daDonCua(g) >= g.items.length).length;
                const rows = groupedByDiemDon
                  .map((g, i) => ({ g, i, done: daDonCua(g) }))
                  .filter(({ g, done }) => {
                    if (q && !`${g.diemDon} ${g.cacXa.join(" ")}`.toLowerCase().includes(q)) return false;
                    if (stationTinhTrang === "cho" && done >= g.items.length) return false;
                    if (stationTinhTrang === "du" && done < g.items.length) return false;
                    return true;
                  });
                const soTramTheoNgay = rows.reduce<Record<string, number>>((acc, r) => {
                  acc[r.g.ngay] = (acc[r.g.ngay] || 0) + 1;
                  return acc;
                }, {});
                return (
                  <aside
                    className={`${activeStationKey ? "hidden lg:flex" : "flex"} flex-1 lg:flex-none min-h-0 flex-col bg-[var(--surface)] lg:border-r border-[var(--line)] overflow-hidden print:hidden`}
                  >
                    <div className="p-3 border-b border-[var(--line-soft)] space-y-2 shrink-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-serif text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">Điểm đón</h3>
                        <span className="font-mono text-[11px] text-[var(--mute)] tabular-nums">
                          {rows.length}/{groupedByDiemDon.length} trạm
                        </span>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--mute)]" />
                        <input
                          value={stationQuery}
                          onChange={(e) => setStationQuery(e.target.value)}
                          placeholder="Tìm trạm, xã…"
                          className="w-full h-8 pl-8 pr-7 rounded-[9px] border border-[var(--line)] bg-[var(--surface-soft)] text-[12.5px] text-[var(--ink)] outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)]"
                        />
                        {stationQuery && (
                          <button
                            type="button"
                            onClick={() => setStationQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 p-0.5 rounded-[9px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5">
                        {([
                          ["all", "Tất cả", groupedByDiemDon.length],
                          ["cho", "Còn chờ", groupedByDiemDon.length - nDu],
                          ["du", "Đã đủ", nDu],
                        ] as const).map(([k, label, n]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setStationTinhTrang(k)}
                            className={`h-7 rounded-[7px] text-[11.5px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              stationTinhTrang === k ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                            }`}
                          >
                            {label}
                            <span className={`font-mono text-[10px] ${stationTinhTrang === k ? "text-white/75" : "text-[var(--mute)]"}`}>{n}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {rows.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[12.5px] text-[var(--mute)]">Không có điểm đón phù hợp.</div>
                      ) : (
                        rows.map(({ g, i, done }, idx) => {
                          const isActive = g.key === shownStationKey;
                          const isDone = done >= g.items.length;
                          const pct = g.items.length ? Math.round((done / g.items.length) * 100) : 0;
                          const gio = g.items.map((it) => it.gioDon?.trim()).find(Boolean);
                          const ngayMoi = idx === 0 || rows[idx - 1].g.ngay !== g.ngay;
                          return (
                            <div key={g.key}>
                              {ngayMoi && (
                                <div className="sticky top-0 z-[1] px-3 py-1.5 bg-[var(--surface-soft)] border-b border-[var(--line-soft)] flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mute)]">
                                  <span>{g.ngay === "CHUA_XEP_NGAY" ? "Chưa có ngày" : fmtDate(g.ngay)}</span>
                                  <span>{soTramTheoNgay[g.ngay]} trạm</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveStation(g.key)}
                                className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 border-b border-b-[var(--line-soft)] transition-colors cursor-pointer ${
                                  // Đang chọn: nền navy nhạt + viền navy bao quanh, cùng kiểu danh sách bệnh nhân ở Tư vấn
                                  isActive ? "bg-[var(--navy-50)] shadow-[inset_0_0_0_1.5px_var(--navy)]" : "hover:bg-[var(--surface-soft)]"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 w-6 h-6 rounded-[7px] font-mono text-[10.5px] font-bold flex items-center justify-center shrink-0 ${
                                    isDone ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--navy-50)] text-[var(--navy)]"
                                  }`}
                                >
                                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String(i + 1).padStart(2, "0")}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[13px] font-semibold truncate ${isActive ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{g.diemDon}</span>
                                    <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--ink-soft)] shrink-0">
                                      {done}/{g.items.length}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-[var(--line-soft)] overflow-hidden">
                                      <div className={`h-full rounded-full ${isDone ? "bg-[var(--teal)]" : "bg-[var(--navy)]"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    {gio && <span className="font-mono text-[10.5px] text-[var(--mute)] shrink-0">{gio}</span>}
                                  </div>
                                  {(() => {
                                    const xeG = xeList.filter((x) => x.ngayDon === g.ngay && x.diemDon === g.diemDon);
                                    const doanG = Array.from(new Set([...g.items.map((it) => parseDoanXe(it)), ...xeG.map((x) => x.soDoan)])).sort((a, b) => a - b);
                                    const soChoG = doanG.map((d) => xeG.find((x) => x.soDoan === d)?.soCho ?? XE_MAC_DINH);
                                    return (
                                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--mute)] min-w-0">
                                        <span className="inline-flex items-center gap-1 shrink-0 text-[var(--ink-soft)]">
                                          <Bus className="w-3 h-3 text-[var(--mute)]" />
                                          <span className="font-mono">{soChoG.join(" + ")}</span> chỗ
                                        </span>
                                        {g.cacXa.length > 0 && <span className="truncate">· {g.cacXa.join(", ")}</span>}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </aside>
                );
              })()}

              {/* Chi tiết trạm đang chọn */}
              <div className={`${activeStationKey ? "block" : "hidden lg:block"} flex-1 lg:flex-none min-h-0 min-w-0 overflow-y-auto p-3 sm:p-5 print:overflow-visible`}>
                <button
                  type="button"
                  onClick={() => setActiveStation(null)}
                  className="lg:hidden mb-2.5 inline-flex items-center gap-1 h-8 px-2.5 rounded-[9px] border border-[var(--line)] bg-[var(--surface)] text-[12px] font-semibold text-[var(--ink-soft)] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Điểm đón
                </button>
                {chuaCoBangXe && (
                  <div className="mb-3 rounded-[10px] border border-[var(--amber)]/40 bg-[var(--amber-soft)] px-3 py-2 text-[12px] text-[var(--amber-deep)]">
                    CSDL chưa có bảng <b className="font-mono">DoanXe</b> nên chưa lưu được loại xe — cần chạy{" "}
                    <span className="font-mono">prisma/manual/004_doan_xe.sql</span>.
                  </div>
                )}
              {groupedByDiemDon.map((grp, gIdx) => {
                const stationKey = grp.key;
                if (stationKey !== shownStationKey) return null;
                const currentDoanFilter = stationDoanFilter[stationKey] || "all";
                const isCollapsed = false; // xem một trạm mỗi lần → luôn mở
                const isStationLoading = stationLoading === stationKey;

                // Danh sách các đoàn xe hiện có tại trạm này
                const presentDoans = Array.from(new Set(grp.items.map((it) => parseDoanXe(it)))).sort((a, b) => a - b);
                const stationDoanList = presentDoans.length > 0 ? presentDoans : [1];
                const xeTram = xeList.filter((x) => x.ngayDon === grp.ngay && x.diemDon === grp.diemDon);
                const displayDoanTabs = Array.from(new Set([...stationDoanList, ...xeTram.map((x) => x.soDoan)])).sort((a, b) => a - b);
                const xeCuaDoan = (d: number) => xeTram.find((x) => x.soDoan === d) || null;
                const soChoCua = (d: number) => xeCuaDoan(d)?.soCho ?? XE_MAC_DINH;
                const coSoTram = grp.items[0]?.coSoId || "";
                // Ghế ngồi của một đoàn: bệnh nhân theo STT, người nhà đi kèm ngồi ngay sau
                const nguoiTrenXe = (d: number): NguoiTrenXe[] => {
                  const out: NguoiTrenXe[] = [];
                  const ds = grp.items.filter((it) => parseDoanXe(it) === d).sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0));
                  for (const it of ds) {
                    const daLen = Boolean(it.daDon) || Boolean(it.ngayDenBV);
                    out.push({ key: it.id, loai: "bn", ten: it.hoTen, daLenXe: daLen, onClick: () => handleOpenAssignModal(it) });
                    const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
                    if (f.coDiCung) {
                      for (let k = 0; k < f.soLuongDiCung; k++)
                        out.push({ key: `${it.id}-nn${k}`, loai: "nn", ten: it.hoTen, daLenXe: daLen, onClick: () => handleOpenAssignModal(it) });
                    }
                  }
                  return out;
                };

                // Map số liệu cho từng đoàn
                const doanStatsMap = new Map<number, { items: HoSo[]; gio: string; familyCount: number }>();
                for (const dNum of displayDoanTabs) {
                  const itms = grp.items.filter((it) => parseDoanXe(it) === dNum);
                  const times = Array.from(new Set(itms.map((it) => it.gioDon?.trim()).filter(Boolean)));
                  const fam = itms.reduce((acc, it) => {
                    const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
                    return acc + (f.coDiCung ? f.soLuongDiCung : 0);
                  }, 0);
                  doanStatsMap.set(dNum, { items: itms, gio: times[0] || "", familyCount: fam });
                }

                const displayedItems =
                  currentDoanFilter === "all"
                    ? grp.items
                    : grp.items.filter((it) => parseDoanXe(it) === currentDoanFilter);

                const grpDaDon = grp.items.filter((i) => i.daDon || i.ngayDenBV).length;
                const isAllDone = grpDaDon === grp.items.length && grp.items.length > 0;
                const percentDone = Math.round((grpDaDon / grp.items.length) * 100);

                const filterDaDon = displayedItems.filter((i) => i.daDon || i.ngayDenBV).length;
                const filterUnboarded = displayedItems.length - filterDaDon;
                const stationFamilyCount = grp.items.reduce((acc, it) => {
                  const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
                  return acc + (f.coDiCung ? f.soLuongDiCung : 0);
                }, 0);

                return (
                  <div
                    key={stationKey}
                    className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-clip"
                  >
                    {/* Header trạm + tiêu đề cột dính trên cùng khi cuộn (overflow-clip thay overflow-hidden để sticky chạy) */}
                    <div className="sticky top-0 z-20 bg-[var(--surface)]">
                    {/* Header trạm: tầng 1 = danh tính trạm | tiến độ · thao tác; tầng 2 = chọn đoàn */}
                    <div className="px-3.5 sm:px-5 py-3 border-b border-[var(--line)] bg-[var(--surface-soft)]/50">
                      <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-5 gap-y-2.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 font-mono text-[12px] font-bold ${
                              isAllDone ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--navy-50)] text-[var(--navy)]"
                            }`}
                          >
                            {String(gIdx + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-serif text-[16px] sm:text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)] leading-snug">
                              {grp.diemDon}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-x-3 gap-y-1 flex-wrap text-[11.5px] text-[var(--mute)]">
                              {grp.ngay !== "CHUA_XEP_NGAY" ? (
                                <span className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--ink-soft)]">
                                  <Calendar className="w-3 h-3 text-[var(--teal-deep)]" />
                                  {fmtDate(grp.ngay)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-[var(--amber-deep)]">
                                  <AlertCircle className="w-3 h-3" />
                                  Chưa có ngày
                                </span>
                              )}
                              {displayDoanTabs.map((dNum) => {
                                const st = doanStatsMap.get(dNum);
                                if (!st?.gio) return null;
                                return (
                                  <span key={dNum} className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--ink-soft)]" title={`Giờ đón Đoàn ${dNum}`}>
                                    <Clock className="w-3 h-3 text-[var(--navy)]" />
                                    {displayDoanTabs.length > 1 ? `Đ${dNum} ` : ""}
                                    {st.gio}
                                  </span>
                                );
                              })}
                              {Array.from(doanStatsMap.values()).every((st) => !st.gio) && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {grp.rawDiemDon || "Chưa xếp giờ"}
                                </span>
                              )}
                              {grp.cacXa.length > 0 && (
                                <span className="inline-flex items-center gap-1 min-w-0">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="font-semibold text-[var(--ink-soft)]">{grp.cacXa.join(", ")}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tiến độ đón (điện thoại: xuống hàng riêng, full width) */}
                        <div className="order-last lg:order-none w-full lg:w-[240px] shrink-0">
                          <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                            <span className="text-[var(--mute)]">Tiến độ đón</span>
                            <span className="font-mono font-semibold tabular-nums text-[var(--ink)]">
                              {grpDaDon}/{grp.items.length}
                              <span className="text-[var(--mute)] font-normal"> · {percentDone}%</span>
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-[var(--line-soft)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isAllDone ? "bg-[var(--teal)]" : "bg-[var(--navy)]"}`}
                              style={{ width: `${percentDone}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
                          {isAllDone ? (
                            <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[9px] bg-[var(--teal-soft)] text-[var(--teal-deep)] text-[12px] font-semibold whitespace-nowrap">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã đón đủ
                            </span>
                          ) : (
                            filterUnboarded > 0 && (
                              <button
                                type="button"
                                disabled={isStationLoading}
                                onClick={() => checkInAllStation(displayedItems, stationKey)}
                                className="h-8 px-3 rounded-[9px] text-[12px] font-semibold border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                title="Đánh dấu tất cả bệnh nhân trong danh sách đang xem đã lên xe"
                              >
                                {isStationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                {currentDoanFilter === "all" ? "Đón cả trạm" : `Đón Đoàn ${currentDoanFilter}`}
                                <span className="font-mono">{filterUnboarded}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Tầng 2: các đoàn xe của trạm (bấm để lọc) · thêm đoàn xe · danh sách / sơ đồ ghế */}
                      <div className="mt-3 sm:pl-12 flex items-stretch gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: "all" }))}
                          className={`px-3 py-1.5 rounded-[10px] border text-left transition-all cursor-pointer ${
                            currentDoanFilter === "all" ? "border-[var(--navy)] bg-[var(--navy-50)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                          }`}
                        >
                          <div className={`text-[12px] font-semibold ${currentDoanFilter === "all" ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>Tất cả</div>
                          <div className="text-[11px] text-[var(--mute)]">
                            <span className="font-mono">{grp.items.length}</span> BN
                            {stationFamilyCount > 0 && <> + <span className="font-mono">{stationFamilyCount}</span> NN</>}
                          </div>
                        </button>
                        {displayDoanTabs.map((dNum) => {
                          const xe = xeCuaDoan(dNum);
                          const soCho = soChoCua(dNum);
                          const nguoi = nguoiTrenXe(dNum).length;
                          const ghe = soCho - 1;
                          const gio = xe?.gioDon || doanStatsMap.get(dNum)?.gio;
                          const active = currentDoanFilter === dNum;
                          return (
                            <div
                              key={dNum}
                              role="button"
                              tabIndex={0}
                              onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: dNum }))}
                              onKeyDown={(e) => e.key === "Enter" && setStationDoanFilter((prev) => ({ ...prev, [stationKey]: dNum }))}
                              className={`group flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-[10px] border transition-all cursor-pointer ${
                                active ? "border-[var(--navy)] bg-[var(--navy-50)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[12px] font-semibold ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>Đoàn {dNum}</span>
                                  <span
                                    className={`font-mono text-[10.5px] font-semibold tabular-nums ${nguoi > ghe ? "text-[var(--rose)]" : "text-[var(--mute)]"}`}
                                    title="Ghế đã dùng / ghế chở khách"
                                  >
                                    {nguoi}/{ghe}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[var(--mute)] whitespace-nowrap">
                                  Xe <span className="font-mono">{soCho}</span> chỗ{gio ? <> · <span className="font-mono">{gio}</span></> : null}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChonXe({
                                    coSoId: coSoTram,
                                    ngayDon: grp.ngay,
                                    diemDon: grp.diemDon,
                                    soDoan: dNum,
                                    soCho,
                                    gioDon: gio ?? null,
                                    moi: false,
                                  });
                                }}
                                className="w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors text-[var(--mute-soft)] hover:text-[var(--navy)] hover:bg-[var(--surface)]"
                                title="Đổi loại xe / giờ đón"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            setChonXe({
                              coSoId: coSoTram,
                              ngayDon: grp.ngay,
                              diemDon: grp.diemDon,
                              soDoan: Math.max(0, ...displayDoanTabs) + 1,
                              soCho: XE_MAC_DINH,
                              gioDon: null,
                              moi: true,
                            })
                          }
                          className="px-3 rounded-[10px] text-[12px] font-semibold text-[var(--mute)] hover:text-[var(--navy)] border border-dashed border-[var(--line-strong)] hover:border-[var(--navy)]/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap min-h-[44px]"
                          title="Thêm một đoàn xe nữa cho điểm đón này"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm đoàn xe
                        </button>

                        <div className="ml-auto flex items-center gap-2 self-center">
                          {displayDoanTabs.length > 1 && grp.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleOpenSplitModal(grp, stationDoanList)}
                              className="h-8 px-2.5 rounded-[9px] text-[12px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] transition-colors cursor-pointer whitespace-nowrap"
                              title="Chuyển nhanh nhiều bệnh nhân sang đoàn khác"
                            >
                              Chia bệnh nhân
                            </button>
                          )}
                          <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5">
                            {([
                              ["ds", List, "Danh sách"],
                              ["ghe", LayoutGrid, "Sơ đồ ghế"],
                            ] as const).map(([k, Icon, label]) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => setCheDoTram(k)}
                                className={`h-7 px-2.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                  cheDoTram === k ? "bg-[var(--surface)] text-[var(--navy)] shadow-[var(--shadow-xs)]" : "text-[var(--mute)] hover:text-[var(--ink)]"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {cheDoTram === "ds" && displayedItems.length > 0 && (
                      <div className="hidden lg:grid lg:grid-cols-[28px_minmax(0,1.15fr)_176px_minmax(0,1fr)_minmax(0,1.5fr)_196px] gap-x-5 items-center px-5 py-2 border-b border-[var(--line)] bg-[var(--surface-soft)] font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mute)]">
                        <span>#</span>
                        <span>Bệnh nhân</span>
                        <span>Đoàn</span>
                        <span>Liên hệ</span>
                        <span>Địa chỉ · Dặn dò</span>
                        <span className="text-right">Thao tác</span>
                      </div>
                    )}
                    </div>

                    {/* Sơ đồ ghế từng đoàn */}
                    {cheDoTram === "ghe" && (
                      <div className="p-3 sm:p-4 grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4 items-start">
                        {displayDoanTabs
                          .filter((d) => currentDoanFilter === "all" || currentDoanFilter === d)
                          .map((dNum) => {
                            const xe = xeCuaDoan(dNum);
                            return (
                              <SoDoXe
                                key={dNum}
                                soDoan={dNum}
                                soCho={soChoCua(dNum)}
                                gioDon={xe?.gioDon ?? doanStatsMap.get(dNum)?.gio ?? null}
                                nguoi={nguoiTrenXe(dNum)}
                                onSuaXe={() =>
                                  setChonXe({
                                    coSoId: coSoTram,
                                    ngayDon: grp.ngay,
                                    diemDon: grp.diemDon,
                                    soDoan: dNum,
                                    soCho: soChoCua(dNum),
                                    gioDon: xe?.gioDon ?? doanStatsMap.get(dNum)?.gio ?? null,
                                    moi: false,
                                  })
                                }
                              />
                            );
                          })}
                      </div>
                    )}

                    {/* Danh sách hành khách trong trạm */}
                    {!isCollapsed && cheDoTram === "ds" && (
                      <div className="divide-y divide-[var(--line-soft)]">
                        {displayedItems.length === 0 ? (
                          <div className="px-4 py-6 text-center text-[12.5px] text-[var(--mute)] flex flex-col items-center justify-center gap-1.5">
                            <Bus className="w-5 h-5 text-[var(--mute-soft)]" />
                            <span>Chưa có bệnh nhân nào được xếp vào Đoàn {currentDoanFilter} tại trạm này.</span>
                            <button
                              type="button"
                              onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: "all" }))}
                              className="text-[12px] font-semibold text-[var(--navy)] hover:underline cursor-pointer"
                            >
                              Xem tất cả bệnh nhân tại trạm
                            </button>
                          </div>
                        ) : (
                          displayedItems.map((p, pIdx) => {
                            const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                            const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;
                            const currentDoan = parseDoanXe(p);
                            const isSwitching = switchingPatientId === p.id;
                            const nn = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
                            const danDo = stripDoanXeTag(p.ghiChuTuVan);
                            const chuaXepXe = !p.diemDon || p.diemDon === "Chưa xác định điểm đón";

                            return (
                              <div key={p.id} className="grid grid-cols-[24px_minmax(0,1fr)] lg:grid-cols-[28px_minmax(0,1.15fr)_176px_minmax(0,1fr)_minmax(0,1.5fr)_196px] gap-x-3 lg:gap-x-5 gap-y-1.5 items-start lg:items-center px-3.5 sm:px-5 py-2.5 transition-colors hover:bg-[var(--surface-soft)]">
                                {/* # */}
                                <span className="font-mono text-[11px] font-semibold text-[var(--mute)] tabular-nums pt-[3px] lg:pt-0">
                                  {String(p.stt ?? pIdx + 1).padStart(2, "0")}
                                </span>

                                {/* Bệnh nhân */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[13.5px] font-semibold text-[var(--ink)] truncate">{p.hoTen}</span>
                                    {isMo && (
                                      <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] text-[10.5px] font-semibold shrink-0">
                                        <Check className="w-3 h-3 stroke-[3]" /> Đã mổ
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 text-[11.5px] text-[var(--mute)] flex items-center gap-x-1.5 flex-wrap">
                                    <span>{[p.gioiTinh || "—", fmtSinhTuoi(p)].filter(Boolean).join(" · ")}</span>
                                    {p.ngayDieuTri && (
                                      <span className="text-[var(--ink-soft)]">
                                        · Hẹn <span className="font-mono font-semibold">{fmtDate(p.ngayDieuTri)}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Đoàn */}
                                <div className="col-start-2 lg:col-start-auto">
                                  <div className="inline-flex p-0.5 rounded-[8px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5 flex-wrap">
                                    {displayDoanTabs.map((dNum) => {
                                      const isCurrent = currentDoan === dNum;
                                      const st = doanStatsMap.get(dNum);
                                      return (
                                        <button
                                          key={dNum}
                                          type="button"
                                          disabled={isSwitching}
                                          onClick={() => !isCurrent && handleQuickSwitchDoan(p, dNum, st?.gio)}
                                          className={`h-6 px-2 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                            isCurrent ? "bg-[var(--navy)] text-white" : "text-[var(--mute)] hover:text-[var(--ink)]"
                                          }`}
                                          title={isCurrent ? `Bệnh nhân đang ở Đoàn ${dNum}` : `Bấm để chuyển bệnh nhân sang Đoàn ${dNum}`}
                                        >
                                          {isSwitching && isCurrent ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Bus className="w-2.5 h-2.5" />}
                                          Đoàn {dNum}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Liên hệ */}
                                <div className="col-start-2 lg:col-start-auto min-w-0 text-[12px] flex lg:flex-col items-center lg:items-start gap-x-3 gap-y-0.5 flex-wrap">
                                  {p.sdt ? (
                                    <a href={`tel:${p.sdt}`} className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--navy)] hover:underline">
                                      <Phone className="w-3 h-3" />
                                      {p.sdt}
                                    </a>
                                  ) : (
                                    <span className="text-[var(--mute-soft)]">Không có SĐT</span>
                                  )}
                                  {nn.hasNguoiNha ? (
                                    <span className="inline-flex items-center gap-1 text-[11.5px] text-[var(--ink-soft)] min-w-0 flex-wrap">
                                      <Users className="w-3 h-3 text-[var(--mute)] shrink-0" />
                                      <span className="font-semibold">{nn.coDiCung ? `Kèm ${nn.soLuongDiCung} NN` : "Người nhà"}</span>
                                      {nn.tenQuanHe && <span className="truncate">· {nn.tenQuanHe}</span>}
                                      {nn.sdt && (
                                        <a href={`tel:${nn.sdt}`} className="font-mono text-[var(--navy)] hover:underline" title="Gọi cho người nhà">
                                          · {nn.sdt}
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssignModal(p)}
                                        className="p-0.5 text-[var(--mute-soft)] hover:text-[var(--navy)] cursor-pointer transition-colors"
                                        title="Sửa thông tin người nhà"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModal(p, true)}
                                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--mute)] hover:text-[var(--navy)] transition-colors cursor-pointer"
                                      title="Điền thêm thông tin người nhà đi kèm"
                                    >
                                      <UserPlus className="w-3 h-3" /> Người nhà
                                    </button>
                                  )}
                                </div>

                                {/* Địa chỉ · dặn dò */}
                                <div className="col-start-2 lg:col-start-auto min-w-0 space-y-1 text-[12px]">
                                  {p.diaChi ? (
                                    <div className="text-[var(--ink-soft)] flex items-center gap-1 min-w-0" title={p.diaChi}>
                                      <MapPin className="w-3 h-3 text-[var(--mute-soft)] shrink-0" />
                                      <span className="truncate">{p.diaChi}</span>
                                    </div>
                                  ) : (
                                    <span className="hidden lg:inline text-[var(--mute-soft)]">—</span>
                                  )}
                                  {danDo && (
                                    <div className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md bg-[var(--amber-soft)] text-[11.5px] text-[var(--amber-deep)]" title={danDo}>
                                      <span className="font-semibold shrink-0">Dặn dò:</span>
                                      <span className="truncate">{danDo}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Thao tác */}
                                <div className="col-start-2 lg:col-start-auto flex items-center justify-end gap-1.5 pt-1 lg:pt-0">
                                  {chuaXepXe ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModal(p)}
                                      className="h-8 px-2.5 rounded-[9px] text-[12px] font-semibold border border-[var(--amber)]/40 bg-[var(--amber-soft)] text-[var(--amber-deep)] hover:bg-[var(--amber)] hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                      title="Xếp điểm đón và giờ xe đón cho bệnh nhân này"
                                    >
                                      <Bus className="w-3.5 h-3.5" /> Xếp xe
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModal(p)}
                                      className="w-8 h-8 rounded-[9px] border border-[var(--line)] text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                                      title="Đổi điểm đón / giờ xe đón"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={checkingInId === p.id}
                                    onClick={() => toggleCheckIn(p)}
                                    title={isDaDen ? "Đã lên xe — bấm để huỷ đánh dấu" : "Đánh dấu bệnh nhân đã lên xe"}
                                    className={`h-8 w-[112px] justify-center rounded-[9px] text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                      isDaDen
                                        ? "border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal-softer)]"
                                        : "bg-gradient-to-b from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-[var(--navy-shadow)] hover:brightness-110"
                                    }`}
                                  >
                                    {checkingInId === p.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isDaDen ? (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                      <Bus className="w-3.5 h-3.5 text-[var(--teal)]" />
                                    )}
                                    {isDaDen ? "Đã lên xe" : "Đón lên xe"}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* ============================================================
               CHẾ ĐỘ 2: LƯỚI THẺ TRẠM (GRID VIEW - 2 CỘT HIỆN ĐẠI CHO MÀN RỘNG)
               ============================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {groupedByDiemDon.map((grp, gIdx) => {
                const stationKey = grp.key;
                const currentDoanFilter = stationDoanFilter[stationKey] || "all";
                const isStationLoading = stationLoading === stationKey;

                const presentDoans = Array.from(new Set(grp.items.map((it) => parseDoanXe(it)))).sort((a, b) => a - b);
                const stationDoanList = presentDoans.length > 0 ? presentDoans : [1];
                const displayDoanTabs = stationDoanList.includes(2) ? stationDoanList : [...stationDoanList, 2];

                // Map số liệu cho từng đoàn
                const doanStatsMap = new Map<number, { items: HoSo[]; gio: string; familyCount: number }>();
                for (const dNum of displayDoanTabs) {
                  const itms = grp.items.filter((it) => parseDoanXe(it) === dNum);
                  const times = Array.from(new Set(itms.map((it) => it.gioDon?.trim()).filter(Boolean)));
                  const fam = itms.reduce((acc, it) => {
                    const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
                    return acc + (f.coDiCung ? f.soLuongDiCung : 0);
                  }, 0);
                  doanStatsMap.set(dNum, { items: itms, gio: times[0] || "", familyCount: fam });
                }

                const displayedItems =
                  currentDoanFilter === "all"
                    ? grp.items
                    : grp.items.filter((it) => parseDoanXe(it) === currentDoanFilter);

                const grpDaDon = grp.items.filter((i) => i.daDon || i.ngayDenBV).length;
                const isAllDone = grpDaDon === grp.items.length && grp.items.length > 0;
                const percentDone = Math.round((grpDaDon / grp.items.length) * 100);

                const filterDaDon = displayedItems.filter((i) => i.daDon || i.ngayDenBV).length;
                const filterUnboarded = displayedItems.length - filterDaDon;

                return (
                  <div
                    key={stationKey}
                    className={`rounded-2xl border bg-white shadow-xs overflow-hidden flex flex-col ${
                      isAllDone ? "border-emerald-200" : "border-[var(--line)]"
                    }`}
                  >
                    {/* Header trạm đón dạng thẻ */}
                    <div className="p-4 bg-gradient-to-r from-[var(--surface-soft)] to-white border-b border-[var(--line)]">
                      <div className="flex items-center justify-between gap-2">
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
                              {displayDoanTabs.map((dNum) => {
                                const st = doanStatsMap.get(dNum);
                                if (!st?.gio) return null;
                                const c = getDoanColor(dNum);
                                return (
                                  <span
                                    key={dNum}
                                    className={`font-mono font-bold ${c.text} ${c.bg} px-1.5 py-0.2 rounded border ${c.border} text-[11px]`}
                                  >
                                    ⏰ Đ{dNum}: {st.gio}
                                  </span>
                                );
                              })}
                              <span>•</span>
                              <span>{grp.items.length} BN</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút đón hoặc trạng thái */}
                        <div className="shrink-0">
                          {!isAllDone && filterUnboarded > 0 ? (
                            <button
                              type="button"
                              disabled={isStationLoading}
                              onClick={() => checkInAllStation(displayedItems, stationKey)}
                              className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              {isStationLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                              ) : (
                                <CheckCheck className="w-3 h-3 text-emerald-700" />
                              )}
                              <span>
                                {currentDoanFilter === "all"
                                  ? "Đón cả trạm"
                                  : `Đón Đ${currentDoanFilter} (${filterUnboarded})`}
                              </span>
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300">
                              ✓ Đủ {grp.items.length} BN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tab lọc Đoàn xe trong Grid */}
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--line-soft)] flex-wrap">
                        <button
                          type="button"
                          onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: "all" }))}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            currentDoanFilter === "all"
                              ? "bg-[var(--navy)] text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          Tất cả ({grp.items.length})
                        </button>
                        {displayDoanTabs.map((dNum) => {
                          const st = doanStatsMap.get(dNum) || { items: [] };
                          const c = getDoanColor(dNum);
                          const isSel = currentDoanFilter === dNum;
                          return (
                            <button
                              key={dNum}
                              type="button"
                              onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: dNum }))}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all ${
                                isSel
                                  ? `${c.activeBg} shadow-2xs`
                                  : `${c.bg} ${c.border} border hover:opacity-90`
                              }`}
                            >
                              <Bus className="w-3 h-3" />
                              <span>Đoàn {dNum} ({st.items.length})</span>
                            </button>
                          );
                        })}
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
                      {displayedItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          Chưa có bệnh nhân nào trong Đoàn {currentDoanFilter} tại trạm này
                        </div>
                      ) : (
                        displayedItems.map((p, pIdx) => {
                          const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                          const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;

                          return (
                            <div
                              key={p.id}
                              className={`p-3 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-3 ${
                                isDaDen ? "bg-emerald-50/15" : ""
                              }`}
                            >
                              <div className="min-w-0 space-y-1 flex-1">
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

                                {/* Chuyển Đoàn 1 / Đoàn 2 nhanh trong Grid */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(() => {
                                    const currentDoan = parseDoanXe(p);
                                    const isSwitching = switchingPatientId === p.id;
                                    return (
                                      <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-wrap gap-0.5">
                                        {displayDoanTabs.map((dNum) => {
                                          const isCurrent = currentDoan === dNum;
                                          const dColor = getDoanColor(dNum);
                                          const st = doanStatsMap.get(dNum);
                                          return (
                                            <button
                                              key={dNum}
                                              type="button"
                                              disabled={isSwitching}
                                              onClick={() => !isCurrent && handleQuickSwitchDoan(p, dNum, st?.gio)}
                                              className={`px-1.5 py-0.5 rounded text-[10.5px] font-black cursor-pointer transition-all ${
                                                isCurrent
                                                  ? `${dColor.activeBg} shadow-2xs`
                                                  : `text-slate-600 hover:${dColor.text}`
                                              }`}
                                              title={isCurrent ? `Đang ở Đoàn ${dNum}` : `Chuyển sang Đoàn ${dNum}`}
                                            >
                                              {isSwitching && isCurrent ? "..." : `Đ${dNum}`}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Hiển thị Người nhà đi kèm dạng thẻ nhỏ */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(() => {
                                    const info = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
                                    if (info.hasNguoiNha) {
                                      return (
                                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                          <Users className="w-3 h-3 text-purple-600" />
                                          <span>{info.coDiCung ? `Kèm ${info.soLuongDiCung} người nhà` : "Người nhà"}{info.tenQuanHe ? `: ${info.tenQuanHe}` : ""}</span>
                                          {info.sdt && (
                                            <a href={`tel:${info.sdt}`} className="text-purple-700 font-mono font-bold hover:underline ml-0.5">
                                              ({info.sdt})
                                            </a>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAssignModal(p)}
                                            className="text-purple-400 hover:text-purple-700 ml-1 cursor-pointer"
                                            title="Sửa thông tin người nhà"
                                          >
                                            <Edit3 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      );
                                    }
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssignModal(p, true)}
                                        className="inline-flex items-center gap-1 text-[10.5px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 cursor-pointer"
                                        title="Điền thêm người nhà đi kèm"
                                      >
                                        <UserPlus className="w-2.5 h-2.5 text-purple-600" />
                                        <span>+ Người nhà</span>
                                      </button>
                                    );
                                  })()}
                                </div>

                                {stripDoanXeTag(p.ghiChuTuVan) && (
                                  <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 truncate max-w-[280px]">
                                    💬 {stripDoanXeTag(p.ghiChuTuVan)}
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
                        })
                      )}
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
        );
      })()}

      {chonXe && (
      <ChonXeModal
        key={`${chonXe.ngayDon}___${chonXe.diemDon}___${chonXe.soDoan}`}
        open
        onClose={() => setChonXe(null)}
        tieuDe={chonXe ? (chonXe.moi ? `Thêm Đoàn ${chonXe.soDoan}` : `Xe của Đoàn ${chonXe.soDoan}`) : ""}
        moTa={
          chonXe
            ? `${chonXe.diemDon}${chonXe.ngayDon !== "CHUA_XEP_NGAY" ? ` · ${fmtDate(chonXe.ngayDon)}` : ""}${
                chonXe.moi ? " — sau khi thêm, chuyển bệnh nhân sang đoàn bằng nút Đoàn ở từng dòng" : ""
              }`
            : ""
        }
        soChoBanDau={chonXe?.soCho}
        gioDonBanDau={chonXe?.gioDon}
        onLuu={async (soCho, gioDon) => {
          if (!chonXe) return;
          const ok = await luuXe({ ...chonXe, soCho, gioDon: gioDon || null });
          if (ok) {
            addToast({ type: "success", message: chonXe.moi ? `Đã thêm Đoàn ${chonXe.soDoan} (xe ${soCho} chỗ)` : `Đã lưu xe ${soCho} chỗ cho Đoàn ${chonXe.soDoan}` });
            setChonXe(null);
          }
        }}
      />
      )}

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

      {/* Modal Xếp xe / Đổi điểm đón & Thêm người nhà — company-ui: mục đánh số, đường kẻ mảnh, navy = thao tác */}
      <Modal
        open={Boolean(editingBusPatient)}
        onClose={() => setEditingBusPatient(null)}
        icon={Bus}
        title="Xếp xe đón"
        subtitle={editingBusPatient ? "Ngày hẹn điều trị, điểm & giờ đón, đoàn xe và người nhà đi kèm" : ""}
        maxWidth="max-w-[720px]"
        footer={
          editingBusPatient ? (
            <div className="flex items-center justify-between w-full gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0 text-[12px] flex-wrap">
                {busFormDiem ? (
                  <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-semibold min-w-0">
                    <Bus className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">{busFormDiem}</span>
                    {busFormGio && <span className="font-mono text-[var(--mute)] font-normal">· {busFormGio}</span>}
                    <span className="text-[var(--mute)] font-normal">· Đoàn {busFormDoanXe}</span>
                  </span>
                ) : (
                  <span className="text-[var(--amber-deep)] font-semibold">Chưa chọn điểm đón</span>
                )}
                {busFormCoNguoiNha && (
                  <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[9px] bg-[var(--amber-soft)] text-[var(--amber-deep)] font-semibold">
                    <Users className="w-3.5 h-3.5" />+{busFormSoNguoiNha} người nhà
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBusPatient(null)}
                  className="h-9 px-4 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] rounded-[10px] transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingBus || !busFormDiem}
                  onClick={handleSaveBusAssignment}
                  className="h-9 px-4 text-[13px] font-semibold text-white rounded-[10px] bg-gradient-to-b from-[var(--navy)] to-[var(--navy-deep)] shadow-[var(--navy-shadow)] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:shadow-none"
                >
                  {savingBus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                  Lưu thông tin đón
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {editingBusPatient && (() => {
          const MucDau = ({ so, ten, ghiChu, phai }: { so: string; ten: string; ghiChu?: string; phai?: React.ReactNode }) => (
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10.5px] font-bold text-[var(--navy)] bg-[var(--navy-50)] w-6 h-5 rounded-[6px] flex items-center justify-center shrink-0">{so}</span>
                <span className="text-[13px] font-semibold text-[var(--ink)]">{ten}</span>
                {ghiChu && <span className="hidden sm:inline text-[11.5px] text-[var(--mute)] truncate">— {ghiChu}</span>}
              </div>
              {phai}
            </div>
          );
          const INPUT = "w-full h-9 px-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] text-[13px] text-[var(--ink)] placeholder:text-[var(--mute-soft)] outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_var(--navy-100)] transition-all";
          const CHIP = "h-7 px-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[11.5px] font-medium text-[var(--ink-soft)] hover:border-[var(--navy)]/40 hover:text-[var(--navy)] transition-colors cursor-pointer";
          const doanToiDa = Math.max(3, busFormDoanXe);
          return (
            <div className="-mt-1 divide-y divide-[var(--line-soft)]">
              {/* Bệnh nhân */}
              <div className="pb-4 flex items-center gap-3 flex-wrap">
                <span className="w-10 h-10 rounded-[10px] bg-[var(--navy-50)] text-[var(--navy)] font-mono text-[12px] font-bold flex items-center justify-center shrink-0">
                  {String(editingBusPatient.stt ?? "—").padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)] leading-tight">{editingBusPatient.hoTen}</div>
                  <div className="mt-0.5 flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[12px] text-[var(--mute)]">
                    {editingBusPatient.sdt && (
                      <a href={`tel:${editingBusPatient.sdt}`} className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--navy)] hover:underline">
                        <Phone className="w-3 h-3" />
                        {editingBusPatient.sdt}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {editingBusPatient.buoiKham?.xa || "Chưa xác định xã"}
                    </span>
                    {editingBusPatient.buoiKham?.ngayKham && (
                      <span>
                        Khám <span className="font-mono text-[var(--ink-soft)]">{fmtDate(editingBusPatient.buoiKham.ngayKham)}</span>
                      </span>
                    )}
                  </div>
                </div>
                {editingBusPatient.diemDon ? (
                  <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] text-[11.5px] font-semibold max-w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Đã xếp · {cleanDiemDon(editingBusPatient.diemDon)}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[var(--amber-soft)] text-[var(--amber-deep)] text-[11.5px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> Chưa xếp xe
                  </span>
                )}
              </div>

              {/* 01 Ngày hẹn */}
              <div className="py-4">
                <MucDau so="01" ten="Ngày hẹn điều trị tại bệnh viện" ghiChu="tự theo ngày đón khi chọn tuyến" />
                <input type="date" value={busFormDate} onChange={(e) => setBusFormDate(e.target.value)} className={`${INPUT} font-mono sm:w-[220px]`} />
              </div>

              {/* 02 Tuyến & giờ đón */}
              <div className="py-4">
                <MucDau so="02" ten="Điểm đón & giờ đón" />
                <DoanXeAutocomplete
                  variant="inline"
                  diemDon={busFormDiem}
                  gioDon={busFormGio}
                  ngayHen={busFormDate}
                  buoiKhamXa={editingBusPatient.buoiKham?.xa || ""}
                  onSelect={(val) => {
                    setBusFormDiem(cleanDiemDon(val.diemDon));
                    setBusFormGio(val.gioDon);
                    if (val.ngayHen) setBusFormDate(val.ngayHen);
                  }}
                />
              </div>

              {/* 03 Đoàn xe */}
              <div className="py-4">
                <MucDau so="03" ten="Đoàn xe tại điểm đón" ghiChu="bệnh nhân lên xe của đoàn nào" />
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5">
                    {Array.from({ length: doanToiDa }, (_, i) => i + 1).map((dNum) => (
                      <button
                        key={dNum}
                        type="button"
                        onClick={() => setBusFormDoanXe(dNum)}
                        className={`h-8 px-3 rounded-[8px] text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          busFormDoanXe === dNum ? "bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                        }`}
                      >
                        <Bus className="w-3.5 h-3.5" />
                        Đoàn {dNum}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBusFormDoanXe(doanToiDa + 1)}
                    className="h-9 px-2.5 rounded-[10px] border border-dashed border-[var(--line-strong)] text-[12px] font-semibold text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Đoàn {doanToiDa + 1}
                  </button>
                </div>
              </div>

              {/* 04 Người nhà */}
              <div className="py-4">
                <MucDau
                  so="04"
                  ten="Người nhà đi kèm xe"
                  ghiChu="tính vào số ghế"
                  phai={
                    <button
                      type="button"
                      role="switch"
                      aria-checked={busFormCoNguoiNha}
                      onClick={() => {
                        const next = !busFormCoNguoiNha;
                        setBusFormCoNguoiNha(next);
                        if (next && busFormSoNguoiNha === 0) setBusFormSoNguoiNha(1);
                      }}
                      className="inline-flex items-center gap-2 shrink-0 cursor-pointer select-none"
                    >
                      <span className="text-[12px] font-semibold text-[var(--ink-soft)]">{busFormCoNguoiNha ? "Có người nhà" : "Đi một mình"}</span>
                      <span className={`relative w-9 h-5 rounded-full transition-colors ${busFormCoNguoiNha ? "bg-[var(--navy)]" : "bg-[var(--line-strong)]"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${busFormCoNguoiNha ? "left-[18px]" : "left-0.5"}`} />
                      </span>
                    </button>
                  }
                />
                {busFormCoNguoiNha && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold text-[var(--ink-soft)] w-[92px] shrink-0">Số người</span>
                      <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBusFormSoNguoiNha(num)}
                            className={`h-7 px-3 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer ${
                              busFormSoNguoiNha === num ? "bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                            }`}
                          >
                            {num} người
                          </button>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--mute)]">
                        Khác
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={busFormSoNguoiNha}
                          onChange={(e) => setBusFormSoNguoiNha(Math.max(1, parseInt(e.target.value) || 1))}
                          className={`${INPUT} !w-16 !h-8 !px-2 text-center font-mono font-semibold`}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-semibold text-[var(--ink-soft)] mb-1 block">Mối quan hệ / Tên</label>
                        <input
                          type="text"
                          value={busFormTenQuanHe}
                          onChange={(e) => setBusFormTenQuanHe(e.target.value)}
                          placeholder="VD: Con gái, Vợ, Chồng…"
                          className={INPUT}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {["Con gái", "Con trai", "Vợ", "Chồng", "Cháu", "Anh / Chị"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setBusFormTenQuanHe(tag)}
                              className={`${CHIP} !h-6 !px-2 !text-[11px] ${busFormTenQuanHe === tag ? "!bg-[var(--navy-50)] !text-[var(--navy)] !border-[var(--navy)]/30" : ""}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-[var(--ink-soft)] mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--navy)]" /> SĐT người nhà
                        </label>
                        <input
                          type="tel"
                          value={busFormSdtNguoiNha}
                          onChange={(e) => setBusFormSdtNguoiNha(e.target.value)}
                          placeholder="09xx xxx xxx"
                          className={`${INPUT} font-mono font-semibold`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 05 Dặn dò */}
              <div className="pt-4">
                <MucDau so="05" ten="Dặn dò cho tài xế & điều phối" />
                <input
                  type="text"
                  value={busFormGhiChu}
                  onChange={(e) => setBusFormGhiChu(e.target.value)}
                  placeholder="VD: Cần người dìu lên xe, say xe, mang CCCD & BHYT gốc…"
                  className={INPUT}
                />
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {["Cần người dìu lên xe", "Say xe ngồi ghế đầu", "Đón đúng giờ", "Mang CCCD + BHYT gốc"].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setBusFormGhiChu((prev) => (prev ? `${prev}, ${note}` : note))}
                      className={CHIP}
                    >
                      + {note}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 3. MODAL THIẾT LẬP & TÁCH NHANH ĐOÀN 2 CHO CẢ TRẠM Y TẾ (CHUẨN ERP) */}
      <Modal
        open={Boolean(splitModalStation)}
        onClose={() => !splittingInProgress && setSplitModalStation(null)}
        icon={Bus}
        title={`Thiết lập & Tách nhanh Đoàn ${splitTargetDoanNum} — ${splitModalStation?.diemDon || ""}`}
        subtitle={`Trạm có ${splitModalStation?.items.length || 0} bệnh nhân • Ngày đón: ${
          splitModalStation?.ngay && splitModalStation.ngay !== "CHUA_XEP_NGAY"
            ? fmtDate(splitModalStation.ngay)
            : "Chưa có ngày"
        }`}
        maxWidth="max-w-[660px]"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <span className="text-[12px] text-slate-500 font-medium">
              {splitMode === "time_only"
                ? `Chỉ tạo tuyến Đoàn ${splitTargetDoanNum} cho trạm`
                : `Sẽ chuyển ${splitSelectedPatientIds.size} / ${splitModalStation?.items.length || 0} BN sang Đoàn ${splitTargetDoanNum}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={splittingInProgress}
                onClick={() => setSplitModalStation(null)}
                className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  splittingInProgress ||
                  (splitMode !== "time_only" && splitSelectedPatientIds.size === 0)
                }
                onClick={handleExecuteSplitDoan}
                className="px-4 py-2 rounded-xl text-[12.5px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {splittingInProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>Xác nhận tách sang Đoàn {splitTargetDoanNum}</span>
              </button>
            </div>
          </div>
        }
      >
        {splitModalStation && (
          <div className="space-y-4">
            {/* Lựa chọn số Đoàn xe muốn chuyển sang */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[12px] font-extrabold text-slate-800">Tách / chuyển sang:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[2, 3, 4, 5, 6].map((dNum) => {
                  const isSel = splitTargetDoanNum === dNum;
                  const c = getDoanColor(dNum);
                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => setSplitTargetDoanNum(dNum)}
                      className={`px-3 py-1 rounded-lg text-[12px] font-black transition-all cursor-pointer ${
                        isSel
                          ? `${c.activeBg} shadow-2xs ring-2 ${c.ring}`
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Đoàn {dNum}
                    </button>
                  );
                })}
                <div className="inline-flex items-center gap-1 ml-1">
                  <span className="text-[11px] text-slate-500 font-bold">Khác:</span>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={splitTargetDoanNum}
                    onChange={(e) => setSplitTargetDoanNum(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-12 h-7 text-center font-mono font-black text-[12px] rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Box thiết lập giờ đón của 2 đoàn */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Đoàn 1 */}
                <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-2xs">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-1">
                    <Bus className="w-3.5 h-3.5 text-blue-600" /> Đoàn 1
                  </div>
                  <div className="text-[12.5px] font-mono font-black text-blue-700">
                    Giờ xe đón: {splitModalStation.defaultDoan1Gio || "05:15"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {splitModalStation.items.length - (splitMode === "time_only" ? 0 : splitSelectedPatientIds.size)} bệnh nhân giữ lại
                  </div>
                </div>

                {/* Đoàn tách */}
                <div className="p-2.5 rounded-lg bg-white border border-purple-300 shadow-2xs">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5 mb-1">
                    <Bus className="w-3.5 h-3.5 text-purple-600" /> Đoàn {splitTargetDoanNum}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-600">Giờ xe đón:</span>
                    <input
                      type="text"
                      value={splitTargetGio}
                      onChange={(e) => setSplitTargetGio(e.target.value)}
                      placeholder="06:30"
                      maxLength={5}
                      className="w-18 h-7 px-1 text-[12.5px] font-mono font-black text-center border border-purple-300 rounded-lg bg-white text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div className="text-[11px] text-purple-700 font-bold mt-0.5">
                    {splitMode === "time_only" ? 0 : splitSelectedPatientIds.size} bệnh nhân được chuyển
                  </div>
                </div>
              </div>

              {/* Các chip giờ gợi ý cho Đoàn tách */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-purple-100">
                <span className="text-[11px] text-slate-500 font-medium">Chọn nhanh giờ Đoàn {splitTargetDoanNum}:</span>
                {["05:45", "06:00", "06:30", "07:00", "07:30", "08:00"].map((timeTag) => (
                  <button
                    key={timeTag}
                    type="button"
                    onClick={() => setSplitTargetGio(timeTag)}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      splitTargetGio === timeTag
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    {timeTag}
                  </button>
                ))}
              </div>
            </div>

            {/* Chế độ chia đoàn (Tách xe) */}
            <div>
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 block">
                Phương án tách đoàn xe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Chia đều 50% */}
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode("half");
                    const halfCount = Math.floor(splitModalStation.items.length / 2);
                    const bottomHalf = new Set(
                      splitModalStation.items.slice(splitModalStation.items.length - halfCount).map((p) => p.id)
                    );
                    setSplitSelectedPatientIds(bottomHalf);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    splitMode === "half"
                      ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[12px] font-black text-slate-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Chia đều 50%
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Tự động tách nửa sau danh sách ({Math.floor(splitModalStation.items.length / 2)} BN)
                  </div>
                </button>

                {/* 2. Tự chọn bệnh nhân */}
                <button
                  type="button"
                  onClick={() => setSplitMode("manual")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    splitMode === "manual"
                      ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[12px] font-black text-slate-900 flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" /> Tự chọn BN
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Tích chọn ai đi Đoàn 1, ai đi Đoàn 2
                  </div>
                </button>

                {/* 3. Chỉ tạo mốc giờ Đoàn 2 */}
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode("time_only");
                    setSplitSelectedPatientIds(new Set());
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    splitMode === "time_only"
                      ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[12px] font-black text-slate-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Chỉ tạo mốc giờ
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Khai báo giờ Đoàn 2, sau này xếp BN
                  </div>
                </button>
              </div>
            </div>

            {/* Bảng danh sách bệnh nhân để tích chọn chuyển sang Đoàn 2 */}
            {splitMode !== "time_only" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11.5px] px-1">
                  <span className="font-bold text-slate-700">
                    Danh sách bệnh nhân trạm ({splitSelectedPatientIds.size}/{splitModalStation.items.length} chuyển sang Đoàn {splitTargetDoanNum})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSplitSelectedPatientIds(new Set(splitModalStation.items.map((p) => p.id)))
                      }
                      className="text-purple-700 hover:underline font-bold cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setSplitSelectedPatientIds(new Set())}
                      className="text-slate-500 hover:underline font-medium cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white custom-scrollbar">
                  {splitModalStation.items.map((p, idx) => {
                    const isSelected = splitSelectedPatientIds.has(p.id);
                    const familyInfo = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSplitSelectedPatientIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            return next;
                          });
                        }}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-purple-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-purple-600 rounded cursor-pointer shrink-0"
                          />
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-[13px] text-slate-900 truncate">
                                {p.hoTen}
                              </span>
                              <span className="text-[11.5px] text-slate-500 font-medium">
                                ({p.gioiTinh || "—"} · {fmtSinhTuoi(p)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                              {p.sdt && <span className="font-mono">{p.sdt}</span>}
                              {familyInfo.hasNguoiNha && (
                                <span className="text-purple-700 font-bold">
                                  + {familyInfo.displayLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                              <Bus className="w-3 h-3 text-purple-600" />
                              <span>Đoàn {splitTargetDoanNum} ({splitTargetGio})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                              <Bus className="w-3 h-3 text-blue-600" />
                              <span>Đoàn 1 ({splitModalStation.defaultDoan1Gio || "05:15"})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

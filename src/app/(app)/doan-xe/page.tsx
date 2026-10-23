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
  Edit3,
  UserPlus,
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
} from "@/lib/csr";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import DoanXeAutocomplete from "@/components/csr/DoanXeAutocomplete";
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

      {/* Dải chỉ số thống kê lộ trình xe chuẩn ERP (ERP Metric Ribbon) */}
      <div className="border-b border-slate-200 bg-slate-50/70 shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {/* 1. Tổng ca xếp xe */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <Users className="w-3.5 h-3.5 text-[var(--navy)]" /> Tổng BN đón
                </span>
                {summary.totalNguoiNha > 0 && (
                  <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                    +{summary.totalNguoiNha} NN
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-[var(--navy)]">{summary.total}</span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  {summary.totalNguoiNha > 0 ? `(${summary.tongChoNgoi} chỗ)` : "bệnh nhân"}
                </span>
              </div>
            </div>

            {/* 2. Đoàn 1 */}
            <div className="p-2.5 rounded-xl bg-white border border-blue-200/90 shadow-2xs hover:border-blue-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 truncate">
                <Bus className="w-3.5 h-3.5 text-blue-600" /> Đoàn 1
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-blue-700">{summary.totalDoan1}</span>
                <span className="text-[11px] text-blue-600/80 font-bold truncate">
                  ({summary.total > 0 ? Math.round((summary.totalDoan1 / summary.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* 3. Đoàn 2 trở lên */}
            <div className="p-2.5 rounded-xl bg-white border border-purple-200/90 shadow-2xs hover:border-purple-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5 truncate">
                <Bus className="w-3.5 h-3.5 text-purple-600" /> Đoàn 2+
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-purple-700">{summary.totalDoan2}</span>
                <span className="text-[11px] text-purple-600/80 font-bold truncate">
                  ({summary.total > 0 ? Math.round((summary.totalDoan2 / summary.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* 4. Đã đón lên xe */}
            <div className="p-2.5 rounded-xl bg-white border border-sky-200/90 shadow-2xs hover:border-sky-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-900 flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Đã đón lên xe
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-sky-700">{summary.daDon}</span>
                <span className="text-[11px] text-sky-600 font-bold truncate">
                  ({summary.total > 0 ? Math.round((summary.daDon / summary.total) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* 5. Đang chờ đón */}
            <div className="p-2.5 rounded-xl bg-white border border-amber-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Đang chờ đón
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-amber-700">{summary.chuaDon}</span>
                <span className="text-[11px] text-amber-600/80 font-medium truncate">chưa lên xe</span>
              </div>
            </div>

            {/* 6. Đã mổ tại viện */}
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Đã phẫu thuật
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-mono text-[20px] font-black text-emerald-700">{summary.daMo}</span>
                <span className="text-[11px] text-emerald-600/80 font-medium truncate">ca đã mổ</span>
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
                const currentDoanFilter = stationDoanFilter[stationKey] || "all";
                const isCollapsed = collapsedStations.has(stationKey);
                const isStationLoading = stationLoading === stationKey;

                // Danh sách các đoàn xe hiện có tại trạm này
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
                    className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                      isAllDone
                        ? "border-emerald-200 bg-white"
                        : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"
                    }`}
                  >
                    {/* Header trạm đón: Thiết kế nổi bật, rõ ràng */}
                    <div className="p-4 sm:px-5 bg-gradient-to-r from-[var(--surface-soft)] via-white to-[var(--surface-soft)] border-b border-[var(--line)]">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3">
                          {/* Huy hiệu số thứ tự trạm */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-black text-[13px] shadow-2xs mt-0.5 ${
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

                              {/* Giờ đón nổi bật của từng đoàn */}
                              {displayDoanTabs.map((dNum) => {
                                const st = doanStatsMap.get(dNum);
                                if (!st?.gio) return null;
                                const c = getDoanColor(dNum);
                                return (
                                  <span
                                    key={dNum}
                                    className={`inline-flex items-center gap-1 font-mono text-[12px] font-black px-2.5 py-0.5 rounded-lg ${c.bg} border ${c.border}`}
                                    title={`Giờ đón Đoàn ${dNum}`}
                                  >
                                    <Clock className={`w-3.5 h-3.5 ${c.text}`} /> Đoàn {dNum}: {st.gio}
                                  </span>
                                );
                              })}
                              {Array.from(doanStatsMap.values()).every((st) => !st.gio) && (
                                <span className="inline-flex items-center gap-1 font-mono text-[12px] font-black px-2.5 py-0.5 rounded-lg bg-[var(--navy-soft)] text-[var(--navy)] border border-blue-200">
                                  <Clock className="w-3.5 h-3.5 text-[var(--navy)]" /> {grp.rawDiemDon || "Chưa xếp giờ"}
                                </span>
                              )}

                              {/* Các xã ghép tuyến */}
                              {grp.cacXa.length > 0 && (
                                <span className="text-[11.5px] text-[var(--ink-soft)] bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                  Tuyến xã: <b className="text-[var(--navy)]">{grp.cacXa.join(", ")}</b>
                                </span>
                              )}
                            </div>

                            {(() => {
                              const stationFamilyCount = grp.items.reduce((acc, it) => {
                                const f = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
                                return acc + (f.coDiCung ? f.soLuongDiCung : 0);
                              }, 0);
                              return (
                                <div className="flex items-center gap-3 text-[12px] text-[var(--mute)] mt-0.5 flex-wrap">
                                  <span>
                                    Quy mô: <b className="text-[var(--ink)] font-bold">{grp.items.length}</b> bệnh nhân
                                    {stationFamilyCount > 0 && (
                                      <span className="text-purple-700 font-bold ml-1">
                                        (+ {stationFamilyCount} người nhà = {grp.items.length + stationFamilyCount} chỗ)
                                      </span>
                                    )}
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
                              );
                            })()}

                            {/* Hàng chọn các Đoàn xe tại trạm (Linh hoạt: Đoàn 1, Đoàn 2, Đoàn 3...) */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              {/* Tab Tất cả */}
                              <button
                                type="button"
                                onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: "all" }))}
                                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-black transition-all cursor-pointer shadow-2xs ${
                                  currentDoanFilter === "all"
                                    ? "bg-[var(--navy)] text-white ring-2 ring-[var(--navy-100)]"
                                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                Tất cả ({grp.items.length})
                              </button>

                              {/* Các Tab Đoàn xe linh hoạt */}
                              {displayDoanTabs.map((dNum) => {
                                const st = doanStatsMap.get(dNum) || { items: [], gio: "", familyCount: 0 };
                                const color = getDoanColor(dNum);
                                const isSelected = currentDoanFilter === dNum;
                                return (
                                  <button
                                    key={dNum}
                                    type="button"
                                    onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: dNum }))}
                                    className={`px-3 py-1 rounded-lg text-[12px] font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                      isSelected
                                        ? `${color.activeBg} ring-2 ${color.ring}`
                                        : `${color.bg} ${color.border} border hover:opacity-90`
                                    }`}
                                  >
                                    <Bus className="w-3.5 h-3.5" />
                                    <span>
                                      Đoàn {dNum} ({st.items.length} BN{st.familyCount > 0 ? ` + ${st.familyCount} NN` : ""})
                                    </span>
                                    {st.gio && (
                                      <span className="font-mono text-[11px] font-black opacity-90 ml-0.5">({st.gio})</span>
                                    )}
                                  </button>
                                );
                              })}

                              {/* Nút Thêm / Tách nhanh Đoàn mới */}
                              <button
                                type="button"
                                onClick={() => handleOpenSplitModal(grp, stationDoanList)}
                                className="px-2.5 py-1 rounded-lg text-[11.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border border-purple-300 shadow-2xs hover:border-purple-400 active:scale-95"
                                title="Tách hoặc thêm nhanh đoàn xe mới cho trạm này"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>➕ Tách thêm đoàn</span>
                              </button>
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

                          {/* Nút Đón bệnh nhân */}
                          {!isAllDone && filterUnboarded > 0 && (
                            <button
                              type="button"
                              disabled={isStationLoading}
                              onClick={() => checkInAllStation(displayedItems, stationKey)}
                              className="px-3 py-1.5 text-[11.5px] font-extrabold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                              title="Đánh dấu tất cả bệnh nhân trong danh sách đang xem đã lên xe"
                            >
                              {isStationLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                              <span>
                                {currentDoanFilter === 1
                                  ? `Đón Đoàn 1 (${filterUnboarded})`
                                  : currentDoanFilter === 2
                                  ? `Đón Đoàn 2 (${filterUnboarded})`
                                  : `Đón cả trạm (${filterUnboarded})`}
                              </span>
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
                    </div>

                    {/* Danh sách hành khách trong trạm */}
                    {!isCollapsed && (
                      <div className="divide-y divide-[var(--line-soft)]">
                        {displayedItems.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-[13px] bg-slate-50/60 flex flex-col items-center justify-center gap-2">
                            <Bus className="w-6 h-6 text-slate-400" />
                            <span>
                              Chưa có bệnh nhân nào được xếp vào Đoàn {currentDoanFilter} tại trạm này.
                            </span>
                            <button
                              type="button"
                              onClick={() => setStationDoanFilter((prev) => ({ ...prev, [stationKey]: "all" }))}
                              className="text-[12px] font-bold text-[var(--navy)] hover:underline cursor-pointer"
                            >
                              Xem tất cả bệnh nhân tại trạm
                            </button>
                          </div>
                        ) : (
                          displayedItems.map((p, pIdx) => {
                            const isMo = p.trangThaiDieuTri === "Đã mổ" || Boolean(p.ngayMoThucTe);
                            const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || isMo;

                            return (
                              <div
                                key={p.id}
                                className={`p-3.5 sm:px-5 sm:py-3.5 transition-colors hover:bg-[var(--surface-hover)] ${
                                  isDaDen ? "bg-emerald-50/20" : ""
                                }`}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                  {/* Cột 1: Thông tin bệnh nhân & Bộ chọn Đoàn 1 / Đoàn 2 (md:col-span-4) */}
                                  <div className="md:col-span-4 flex items-start gap-2.5 min-w-0">
                                    <span className="font-mono text-[11px] font-black text-[var(--navy)] bg-[var(--navy-50)] px-2 py-0.5 rounded-md border border-[var(--navy-100)] shrink-0 mt-0.5">
                                      #{String(p.stt ?? pIdx + 1).padStart(2, "0")}
                                    </span>

                                    <div className="min-w-0 space-y-0.5 flex-1">
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
                                          {[p.gioiTinh || "—", fmtSinhTuoi(p)].filter(Boolean).join(" · ")}
                                        </span>
                                        {p.ngayDieuTri && (
                                          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                            📅 {fmtDate(p.ngayDieuTri)}
                                          </span>
                                        )}
                                      </div>

                                      {/* Bộ chuyển Đoàn nhanh 1-click */}
                                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                        {(() => {
                                          const currentDoan = parseDoanXe(p);
                                          const isSwitching = switchingPatientId === p.id;
                                          return (
                                            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs shrink-0 flex-wrap gap-0.5">
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
                                                    className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                                      isCurrent
                                                        ? `${dColor.activeBg} shadow-2xs`
                                                        : `text-slate-600 hover:${dColor.text} hover:bg-white`
                                                    }`}
                                                    title={
                                                      isCurrent
                                                        ? `Bệnh nhân đang ở Đoàn ${dNum}`
                                                        : `Bấm để chuyển bệnh nhân sang Đoàn ${dNum}`
                                                    }
                                                  >
                                                    {isSwitching && isCurrent ? (
                                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                    ) : (
                                                      <Bus className="w-2.5 h-2.5 opacity-80" />
                                                    )}
                                                    <span>
                                                      Đoàn {dNum}
                                                    </span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          );
                                        })()}
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

                                      {/* Hiển thị Người nhà đi kèm hoặc Nút thêm người nhà */}
                                      {(() => {
                                        const info = parseThongTinNguoiNha(p.sdtNguoiNha, p.ghiChuTuVan);
                                        if (info.hasNguoiNha) {
                                          return (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-950 border border-purple-200 shadow-2xs font-medium text-[11.5px] flex-wrap">
                                              <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                              <span className="font-bold text-purple-900">
                                                {info.coDiCung ? `Kèm ${info.soLuongDiCung} người nhà` : "Người nhà"}:
                                              </span>
                                              {info.tenQuanHe && (
                                                <span className="text-purple-800 font-semibold">{info.tenQuanHe}</span>
                                              )}
                                              {info.sdt && (
                                                <a
                                                  href={`tel:${info.sdt}`}
                                                  className="inline-flex items-center gap-0.5 text-purple-700 hover:text-purple-900 hover:underline font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-purple-200"
                                                  title="Gọi cho người nhà"
                                                >
                                                  <Phone className="w-2.5 h-2.5 text-purple-600" />
                                                  <span>{info.sdt}</span>
                                                </a>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => handleOpenAssignModal(p)}
                                                className="p-0.5 text-purple-400 hover:text-purple-700 cursor-pointer transition-colors"
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
                                            onClick={() => handleOpenAssignModal(p, true)}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                                            title="Điền thêm thông tin người nhà đi kèm"
                                          >
                                            <UserPlus className="w-3 h-3 text-purple-600" />
                                            <span>+ Thêm người nhà</span>
                                          </button>
                                        );
                                      })()}
                                    </div>

                                    {/* Địa chỉ nơi ở */}
                                    {p.diaChi && (
                                      <div className="text-[12px] text-[var(--mute)] truncate flex items-center gap-1 font-medium">
                                        <MapPin className="w-3 h-3 text-[var(--mute-soft)] shrink-0" />
                                        <span className="truncate">{p.diaChi}</span>
                                      </div>
                                    )}

                                    {/* Dặn dò / Ghi chú tư vấn (Chỉ hiện khi có nội dung và đã loại bỏ tag đoàn) */}
                                    {stripDoanXeTag(p.ghiChuTuVan) && (
                                      <div className="text-[11.5px] font-medium text-amber-900 bg-amber-50/90 px-2.5 py-0.5 rounded-md border border-amber-200/80 inline-flex items-center gap-1 max-w-full">
                                        <span className="shrink-0">💬</span>
                                        <span className="truncate">
                                          <b>Dặn dò:</b> {stripDoanXeTag(p.ghiChuTuVan)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Cột 3: Trạng thái & Thao tác đón (md:col-span-3 - Nằm cạnh thông tin) */}
                                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--line-soft)] flex-wrap">
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

                                    {/* Nút Xếp xe nếu chưa có điểm đón hoặc nút sửa nếu đã có */}
                                    {!p.diemDon || p.diemDon === "Chưa xác định điểm đón" ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssignModal(p)}
                                        className="px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 active:scale-95"
                                        title="Xếp điểm đón và giờ xe đón cho bệnh nhân này"
                                      >
                                        <Bus className="w-3.5 h-3.5" />
                                        <span>Xếp xe</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssignModal(p)}
                                        className="p-1.5 rounded-lg border border-[var(--line)] text-slate-400 hover:text-[var(--navy)] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                        title="Đổi điểm đón / giờ xe đón"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

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
                          })
                        )}
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

      {/* Modal Xếp xe / Đổi điểm đón & Thêm người nhà */}
      <Modal
        open={Boolean(editingBusPatient)}
        onClose={() => setEditingBusPatient(null)}
        icon={Bus}
        title="Xếp xe đón & Người nhà đi kèm"
        subtitle={
          editingBusPatient
            ? `#${editingBusPatient.stt || ""} ${editingBusPatient.hoTen} • Lên lịch điều trị, điểm xe đón & người nhà đi kèm`
            : ""
        }
        maxWidth="max-w-[720px]"
        footer={
          editingBusPatient ? (
            <div className="flex items-center justify-between w-full gap-3 flex-wrap">
              {/* Thông tin mốc đã chọn tóm tắt */}
              <div className="flex items-center gap-2 min-w-0 text-[12.5px] flex-wrap">
                {busFormDiem ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#031da6] font-bold text-[12px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-[240px]">
                      {busFormDiem}
                    </span>
                    <span className="font-mono px-1.5 py-0.5 rounded bg-white border border-blue-200 text-[11px]">
                      ⏰ {busFormGio}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-medium italic text-[12px]">
                    Chưa chọn điểm đón xe
                  </span>
                )}

                {busFormCoNguoiNha && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-[11.5px]">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>+{busFormSoNguoiNha} người nhà</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBusPatient(null)}
                  className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingBus || !busFormDiem}
                  onClick={handleSaveBusAssignment}
                  className="px-5 py-2 text-[13px] font-bold bg-[#031da6] hover:bg-[#020f5c] text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
                >
                  {savingBus ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Check className="w-4 h-4 text-teal-300 stroke-[3]" />
                  )}
                  <span>Lưu thông tin đón</span>
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {editingBusPatient && (
          <div className="space-y-4">
            {/* Thẻ tóm tắt thông tin bệnh nhân */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-100/90 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#031da6] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-xs">
                  #{editingBusPatient.stt || "—"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-[16px] font-bold text-slate-900 leading-tight">
                      {editingBusPatient.hoTen}
                    </span>
                    {editingBusPatient.sdt && (
                      <a
                        href={`tel:${editingBusPatient.sdt}`}
                        className="inline-flex items-center gap-1 text-[11.5px] font-mono font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg hover:bg-indigo-50"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{editingBusPatient.sdt}</span>
                      </a>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xã: <b>{editingBusPatient.buoiKham?.xa || "Chưa xác định"}</b></span>
                    </span>
                    {editingBusPatient.buoiKham?.ngayKham && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Khám: {fmtDate(editingBusPatient.buoiKham.ngayKham)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Trạng thái hiện tại
                </div>
                <div className="text-[12.5px] font-bold mt-0.5">
                  {editingBusPatient.diemDon ? (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã xếp: {editingBusPatient.diemDon}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Chưa xếp xe đón</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bước 1: Ngày hẹn điều trị */}
            <div>
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#031da6]" />
                  <span>1. Ngày hẹn điều trị tại Bệnh viện</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal lowercase">
                  (tự đồng bộ theo ngày đón của tuyến xe khi chọn bên dưới)
                </span>
              </label>
              <input
                type="date"
                value={busFormDate}
                onChange={(e) => setBusFormDate(e.target.value)}
                className="w-full h-10 px-3.5 text-[13px] font-mono font-bold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>

            {/* Bước 2: Chọn đoàn xe & điểm đón dạng Inline */}
            <div>
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-[#031da6]" />
                <span>2. Chọn tuyến xe đón & Khung giờ đón</span>
              </label>
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

            {/* Chọn đoàn xe đón: Đoàn 1 (đi sớm) hoặc Đoàn 2 */}
            <div className="p-3.5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/30">
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-blue-600" />
                  <span>Chọn đoàn xe đón tại trạm</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (chọn số thứ tự đoàn xe đón BN)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((dNum) => {
                  const isSel = busFormDoanXe === dNum;
                  const c = getDoanColor(dNum);
                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => setBusFormDoanXe(dNum)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? `${c.border} bg-white ring-2 ${c.ring} shadow-2xs`
                          : "border-slate-200 bg-white/60 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isSel ? c.activeBg : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Bus className="w-3.5 h-3.5" />
                        </div>
                        {isSel && <Check className={`w-3.5 h-3.5 ${c.text} stroke-[3]`} />}
                      </div>
                      <span className={`font-extrabold text-[12.5px] ${isSel ? c.text : "text-slate-800"}`}>
                        Đoàn {dNum}
                      </span>
                      <span className="text-[10.5px] text-slate-400 mt-0.5">
                        Xe đoàn {dNum}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                <span className="text-[11.5px] text-slate-500 font-bold">Hoặc nhập số đoàn khác:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={busFormDoanXe}
                  onChange={(e) => setBusFormDoanXe(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-7 text-center font-mono font-black text-[12px] rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Bước 3: Người nhà đi kèm xe đón */}
            <div className="p-4 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/60 via-indigo-50/20 to-white shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-[12px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs shadow-2xs">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <span>3. Người nhà đi kèm xe</span>
                </label>

                {/* Switch / Toggle Có người nhà đi kèm */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={busFormCoNguoiNha}
                    onChange={(e) => {
                      setBusFormCoNguoiNha(e.target.checked);
                      if (e.target.checked && busFormSoNguoiNha === 0) {
                        setBusFormSoNguoiNha(1);
                      }
                    }}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  />
                  <span className="text-[12.5px] font-bold text-purple-900">
                    Có người nhà đi cùng xe
                  </span>
                </label>
              </div>

              {busFormCoNguoiNha ? (
                <div className="space-y-3 pt-1 border-t border-purple-100">
                  {/* Số lượng người đi cùng */}
                  <div>
                    <div className="text-[11.5px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Số lượng người nhà đi cùng:</span>
                      <span className="font-mono text-purple-700 font-extrabold text-[12px]">
                        {busFormSoNguoiNha} người
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setBusFormSoNguoiNha(num)}
                          className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                            busFormSoNguoiNha === num
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                          }`}
                        >
                          {num} người nhà
                        </button>
                      ))}
                      <div className="inline-flex items-center gap-1 ml-auto">
                        <span className="text-[11px] text-slate-500">Khác:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={busFormSoNguoiNha}
                          onChange={(e) => setBusFormSoNguoiNha(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center font-mono font-bold text-[12px] rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Họ tên / Mối quan hệ */}
                  <div>
                    <label className="text-[11.5px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Mối quan hệ / Tên người nhà:</span>
                      <span className="text-[10.5px] text-slate-400 font-normal">
                        (VD: Con gái, Vợ, Chồng, Cháu...)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={busFormTenQuanHe}
                      onChange={(e) => setBusFormTenQuanHe(e.target.value)}
                      placeholder="Nhập tên hoặc mối quan hệ (VD: Con gái, Vợ...)"
                      className="w-full h-9 px-3 text-[12.5px] font-medium text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white"
                    />
                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10.5px] text-slate-400">Gợi ý nhanh:</span>
                      {["Con gái", "Con trai", "Vợ", "Chồng", "Cháu", "Anh / Chị", "Người thân"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setBusFormTenQuanHe(tag)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 cursor-pointer transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SĐT người nhà */}
                  <div>
                    <label className="text-[11.5px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-purple-600" />
                      <span>Số điện thoại người nhà:</span>
                    </label>
                    <input
                      type="tel"
                      value={busFormSdtNguoiNha}
                      onChange={(e) => setBusFormSdtNguoiNha(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full h-9 px-3 text-[12.5px] font-mono font-bold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-slate-500 italic bg-white/70 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <span>Bệnh nhân đi một mình, không có người nhà đi cùng xe đón.</span>
                  <button
                    type="button"
                    onClick={() => setBusFormCoNguoiNha(true)}
                    className="text-purple-700 font-bold hover:underline not-italic cursor-pointer text-[11.5px]"
                  >
                    + Thêm người nhà
                  </button>
                </div>
              )}
            </div>

            {/* Bước 4: Ghi chú dặn dò xe */}
            <div>
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-[#031da6]" />
                  <span>4. Dặn dò / Ghi chú xe đón</span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-normal">
                  (hiển thị cho tài xế & điều phối xe)
                </span>
              </label>
              <input
                type="text"
                value={busFormGhiChu}
                onChange={(e) => setBusFormGhiChu(e.target.value)}
                placeholder="VD: Cần người dìu lên xe, say xe, mang CCCD & BHYT gốc..."
                className="w-full h-9 px-3 text-[12.5px] font-medium text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 bg-white"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10.5px] text-slate-400">Gợi ý:</span>
                {["Cần người dìu lên xe", "Say xe ngồi ghế đầu", "Đón đúng giờ", "Mang CCCD + BHYT gốc"].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() =>
                      setBusFormGhiChu((prev) => (prev ? `${prev}, ${note}` : note))
                    }
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                  >
                    + {note}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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

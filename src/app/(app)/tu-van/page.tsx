"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Search,
  Check,
  Save,
  X,
  Stethoscope,
  Phone,
  MapPin,
  Users,
  Pencil,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PhoneCall,
  Send,
  Clock,
  Bus,
} from "lucide-react";
import DoanXeAutocomplete from "@/components/csr/DoanXeAutocomplete";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import {
  ageOf,
  fmtDate,
  fmtTime,
  fmtBuoiKhamName,
  tomorrowISO,
  bhytLevel,
  statusOf,
  checkSurgeryTiming,
  type HoSo,
} from "@/lib/csr";
import { StatusBadge, labelCls, Combobox, SectionHeader, Select, DateField } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { Badge, Fact, FIELD_LABEL, INPUT_CLS, type Tone } from "@/components/csr/ui";
import { useHisReconcile, DoiChieuHistoryModal, fmtRelative, type DoiChieuLog } from "@/components/csr/HisReconcile";
import { RefreshCw, History } from "lucide-react";

type FilterKey = "" | "chuagoi" | "dagoi" | "nhomA" | "nhomB" | "daden" | "damo" | "damotruoc";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "nhomA", label: "Đồng ý (A)" },
  { key: "chuagoi", label: "Chưa gọi" },
  { key: "dagoi", label: "Đã gọi" },
  { key: "daden", label: "Đã đến" },
  { key: "damo", label: "Đã mổ" },
  { key: "damotruoc", label: "Mổ trước" },
];

/** Kiểm tra bệnh nhân đã được tư vấn sau khám hay chưa */
function isTuVanDone(p: HoSo): boolean {
  return !!p.nhom || !!p.ghiChuTuVan || (!!p.nhatKy && p.nhatKy.length > 0) || p.xacNhanDieuTri != null;
}

/** Tự động tách 2 ký tự giờ và phút cho ô nhập giờ đón 24h (HH:mm) */
function format24hTimeInput(val: string, prevVal: string): string {
  if (val.length < prevVal.length) {
    if (prevVal.endsWith(":") && !val.includes(":")) {
      return val.slice(0, 1);
    }
    return val;
  }

  const digits = val.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 1) return digits;
  if (digits.length === 2) {
    let hh = Number(digits);
    if (hh > 23) hh = 23;
    return `${String(hh).padStart(2, "0")}:`;
  }
  if (digits.length === 3) {
    let hh = Number(digits.slice(0, 2));
    if (hh > 23) hh = 23;
    let m1 = digits.slice(2, 3);
    if (Number(m1) > 5) m1 = "5";
    return `${String(hh).padStart(2, "0")}:${m1}`;
  }
  let hh = Number(digits.slice(0, 2));
  if (hh > 23) hh = 23;
  let mm = Number(digits.slice(2, 4));
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Chuẩn hóa giờ 24h khi rời khỏi ô nhập (onBlur), tự động hoàn thành HH:mm */
function normalize24hOnBlur(val: string): string {
  if (!val || !val.trim()) return "";
  const cleaned = val.trim();
  const parts = cleaned.split(":");
  if (parts.length === 1) {
    const d = cleaned.replace(/\D/g, "");
    if (!d) return "";
    if (d.length === 1) return `0${d}:00`;
    if (d.length === 2) return `${d}:00`;
    if (d.length === 3) return `${d.slice(0, 2)}:0${d.slice(2)}`;
    if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  }
  let hh = parts[0].replace(/\D/g, "");
  let mm = parts[1].replace(/\D/g, "");
  if (!hh) return "";
  hh = String(Math.min(23, Number(hh))).padStart(2, "0");
  if (!mm) mm = "00";
  else if (mm.length === 1) mm = `0${mm}`; // 11:1 -> 11:01 (11 giờ 1 phút)
  else mm = String(Math.min(59, Number(mm.slice(0, 2)))).padStart(2, "0");
  return `${hh}:${mm}`;
}

const PHUONG_AN_TU_VAN = [
  {
    key: "A",
    label: "Đồng ý điều trị tại BV",
    sub: "Lên lịch mổ & xếp xe đón bệnh nhân",
    activeClass: "bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30",
    badgeClass: "bg-emerald-600 text-white",
  },
  {
    key: "B",
    label: "Cần suy nghĩ thêm",
    sub: "Cần tư vấn thêm & hẹn liên hệ lại",
    activeClass: "bg-amber-50/90 border-amber-500 text-amber-950 ring-2 ring-amber-500/30",
    badgeClass: "bg-amber-600 text-white",
  },
  {
    key: "TheoDoi",
    label: "Theo dõi tại nhà",
    sub: "Chưa có chỉ định can thiệp tại viện",
    activeClass: "bg-sky-50/90 border-sky-500 text-sky-950 ring-2 ring-sky-500/30",
    badgeClass: "bg-sky-600 text-white",
  },
];

const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "", ghiChuTuVan: "" };

function parseDiags(arrOrStr?: string | string[] | null, extra?: string | null): string[] {
  const result: string[] = [];
  if (arrOrStr) {
    try {
      const parsed = typeof arrOrStr === "string" ? JSON.parse(arrOrStr) : arrOrStr;
      if (Array.isArray(parsed)) {
        parsed.forEach((x) => x && result.push(String(x)));
      } else if (typeof parsed === "string" && parsed.trim() && parsed !== "[]" && parsed !== "null") {
        result.push(parsed.trim());
      }
    } catch {
      if (typeof arrOrStr === "string" && arrOrStr.trim() && arrOrStr !== "[]" && arrOrStr !== "null") {
        result.push(arrOrStr.trim());
      }
    }
  }
  if (extra && extra.trim() && !result.includes(extra.trim())) {
    result.push(extra.trim());
  }
  return result;
}

type Eye = "MP" | "MT";

/** Tách "Đục thủy tinh thể (MP)" → { name, eye }. Hỗ trợ cả hậu tố "2 mắt / hai mắt". */
function splitEyeSuffix(raw: string): { name: string; eyes: Eye[] } {
  const m = raw.trim().match(/^(.*?)\s*\((MP|MT|2M|2 mắt|hai mắt|cả 2 mắt)\)\s*$/i);
  if (!m) return { name: raw.trim(), eyes: [] };
  const tag = m[2].toUpperCase();
  return { name: m[1].trim(), eyes: tag === "MP" ? ["MP"] : tag === "MT" ? ["MT"] : ["MP", "MT"] };
}

const toList = (raw?: string | string[] | null): string[] => {
  if (!raw) return [];
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  } catch {
    return typeof raw === "string" && raw.trim() && raw !== "[]" && raw !== "null" ? [raw.trim()] : [];
  }
};

/**
 * Gộp toàn bộ chẩn đoán (theo từng mắt, danh sách tổng hợp, "khác", mã ICD) thành danh sách
 * KHÔNG TRÙNG, mỗi bệnh kèm các mắt bị. Dữ liệu cũ lưu cùng một bệnh ở hai dạng
 * ("MP: X" ở chanDoanMP và "X (MP)" ở chanDoan) nên phải chuẩn hoá tên trước khi so.
 */
function getDiagGroups(p: HoSo): { name: string; eyes: Eye[] }[] {
  const map = new Map<string, { name: string; eyes: Set<Eye> }>();
  const add = (name: string, eyes: Eye[]) => {
    const clean = name.trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    const cur = map.get(key) ?? { name: clean, eyes: new Set<Eye>() };
    eyes.forEach((e) => cur.eyes.add(e));
    map.set(key, cur);
  };

  toList(p.chanDoanMP).forEach((d) => add(d, ["MP"]));
  if (p.chanDoanKhacMP) add(p.chanDoanKhacMP, ["MP"]);
  toList(p.chanDoanMT).forEach((d) => add(d, ["MT"]));
  if (p.chanDoanKhacMT) add(p.chanDoanKhacMT, ["MT"]);
  [...toList(p.chanDoan), ...(p.chanDoanKhac ? [p.chanDoanKhac] : [])].forEach((d) => {
    const s = splitEyeSuffix(d);
    add(s.name, s.eyes);
  });
  [...toList(p.loaiBenhLy), ...(p.loaiBenhLyKhac ? [p.loaiBenhLyKhac] : [])].forEach((d) => {
    const s = splitEyeSuffix(d);
    add(s.name, s.eyes);
  });

  return Array.from(map.values()).map((v) => ({ name: v.name, eyes: (["MP", "MT"] as Eye[]).filter((e) => v.eyes.has(e)) }));
}

const eyeLabel = (eyes: Eye[]) => (eyes.length === 2 ? "2 mắt" : eyes[0] ?? "");

/** Chuỗi chẩn đoán gọn cho danh sách: "Đục thủy tinh thể (2 mắt)". */
function getPatientDiags(p: HoSo): string[] {
  return getDiagGroups(p).map((g) => (g.eyes.length ? `${g.name} (${eyeLabel(g.eyes)})` : g.name));
}

/** Kiểm tra xem bệnh nhân có chẩn đoán bệnh lý hay không */
function isBenhLyPatient(p: HoSo): boolean {
  // 1. Có chẩn đoán mắt phải / mắt trái / chung / ICD
  const diags = getPatientDiags(p);
  if (diags.length > 0) return true;

  // 2. Có phân loại bệnh lý khác Chưa phát hiện bất thường
  if (p.benhLy && p.benhLy !== "Chưa phát hiện bất thường" && p.benhLy !== "Bình thường") return true;

  // 3. Khuyến nghị hoặc Hướng xử trí là Phẫu thuật / Điều trị khác
  if (p.khuyenNghi === "Phẫu thuật" || p.huongXuTri === "Phẫu thuật" || p.huongXuTri === "Điều trị khác") return true;

  // 4. Có dữ liệu tư vấn / xác nhận điều trị từ trước
  if (p.nhom || p.xacNhanDieuTri != null) return true;

  return false;
}

/**
 * Thứ tự ưu tiên (chế độ "Ưu tiên") — chưa gọi > đồng ý > chưa đồng ý, trong mỗi nhóm ca chưa gọi lên trước:
 *   1. Chưa có quyết định, chưa gọi
 *   2. Đồng ý (A), chưa gọi
 *   3. Đồng ý (A), đã gọi
 *   4. Chưa có quyết định, đã gọi
 *   5. Chưa đồng ý (Suy nghĩ / Theo dõi), chưa gọi
 *   6. Chưa đồng ý (Suy nghĩ / Theo dõi), đã gọi
 */
function getPatientCategoryPriority(p: HoSo): number {
  const hasCall = !!(p.nhatKy && p.nhatKy.length > 0);
  const isA = p.nhom === "A" || p.xacNhanDieuTri === true;
  const isChuaDongY = !isA && (p.nhom === "B" || p.nhom === "TheoDoi" || p.xacNhanDieuTri === false);
  if (isA) return hasCall ? 3 : 2;
  if (isChuaDongY) return hasCall ? 6 : 5;
  return hasCall ? 4 : 1; // chưa có quyết định
}

/** Trạng thái quyết định tư vấn của một hồ sơ → nhãn + tông màu. */
function decisionOf(p: HoSo): { label: string; tone: Tone } | null {
  if (p.nhom === "A" || p.xacNhanDieuTri === true) return { label: "Đồng ý điều trị", tone: "teal" };
  if (p.nhom === "B" || p.xacNhanDieuTri === false) return { label: "Cần suy nghĩ", tone: "amber" };
  if (p.nhom === "TheoDoi") return { label: "Theo dõi tại nhà", tone: "navy" };
  return null;
}

const isDaDenBV = (p: HoSo, isDaMo: boolean) =>
  Boolean(p.daDon) || Boolean(p.ngayDenBV) || p.trangThai === "DaDonVien" || p.trangThaiDieuTri === "Đã đến trước đây" || isDaMo;

export default function TuVanSessionPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"loai" | "stt">("loai");

  const [f, setF] = useState(EMPTY);
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY));
  const dirty = JSON.stringify(f) !== baseline;
  const [showList, setShowList] = useState(false);

  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(false);
  const [bkSearch, setBkSearch] = useState("");
  const bkLabels = useMemo(() => Object.fromEntries(bks.map((b) => [b.id, `${fmtDate(b.ngayKham)} · ${fmtBuoiKhamName(b)}`])), [bks]);

  const filteredBks = useMemo(() => {
    if (!bkSearch.trim()) return bks;
    const q = bkSearch.toLowerCase();
    return bks.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.xa.toLowerCase().includes(q) ||
        (b.diaDiem && b.diaDiem.toLowerCase().includes(q)) ||
        (b.ghiChu && b.ghiChu.toLowerCase().includes(q))
    );
  }, [bks, bkSearch]);

  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  
  // Nạp danh sách điểm đón và chuyến xe chưa qua ngày trên toàn hệ thống (không phân biệt đợt khám)
  const [activeDiemDonList, setActiveDiemDonList] = useState<string[]>([]);
  const [activeChuyenXeList, setActiveChuyenXeList] = useState<
    Array<{
      key: string;
      diemDon: string;
      gioDon: string;
      ngayDieuTri: string;
      soBN: number;
      cacXa: string[];
    }>
  >([]);

  const loadActiveDoanXe = useCallback(async () => {
    try {
      const res = await fetch("/api/csr/doan-xe/diem-don");
      const json = await res.json();
      if (res.ok) {
        if (Array.isArray(json.diemDonList)) setActiveDiemDonList(json.diemDonList);
        if (Array.isArray(json.chuyenXeList)) setActiveChuyenXeList(json.chuyenXeList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadActiveDoanXe();
  }, [loadActiveDoanXe]);

  useRealtimeEvent(["hoso_change", "buoikham_change"], () => {
    loadActiveDoanXe();
  });

  const uniqueDiemDon = useMemo(() => {
    const set = new Set<string>();
    activeDiemDonList.forEach((d) => d && set.add(d.trim()));
    patients.forEach((p) => p.diemDon?.trim() && set.add(p.diemDon.trim()));
    return Array.from(set).sort();
  }, [activeDiemDonList, patients]);

  const [callNote, setCallNote] = useState("");
  const [savingCallNote, setSavingCallNote] = useState(false);
  const currentBkDate = useMemo(() => bks.find((b) => b.id === selBk)?.ngayKham, [bks, selBk]);

  const visible = useMemo(() => {
    const filtered = patients.filter((p) => {
      const called = !!(p.nhatKy && p.nhatKy.length > 0);
      const isA = p.nhom === "A" || p.xacNhanDieuTri === true;
      const timing = checkSurgeryTiming(p, currentBkDate);
      const isDaDen = Boolean(p.daDon) || Boolean(p.ngayDenBV) || p.trangThai === "DaDonVien" || p.trangThaiDieuTri === "Đã đến trước đây" || timing.isDaMo;

      if (filter === "chuagoi" && called) return false;
      if (filter === "dagoi" && !called) return false;
      if (filter === "nhomA" && !isA) return false;
      if (filter === "nhomB" && isA) return false;
      if (filter === "daden" && !isDaDen) return false;
      if (filter === "damo" && !timing.isDaMo) return false;
      if (filter === "damotruoc" && !timing.isDaMoTruoc) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "loai") {
        const prioA = getPatientCategoryPriority(a);
        const prioB = getPatientCategoryPriority(b);
        if (prioA !== prioB) return prioA - prioB;
      }
      return (a.stt ?? 0) - (b.stt ?? 0);
    });
  }, [patients, filter, sortBy, currentBkDate]);

  // Bộ đếm nhanh trạng thái tư vấn & tiến độ viện
  const counts = useMemo(() => {
    const total = patients.length;
    const called = patients.filter((p) => !!(p.nhatKy && p.nhatKy.length > 0)).length;
    const uncalled = total - called;
    const nhomA = patients.filter((p) => p.nhom === "A" || p.xacNhanDieuTri === true).length;
    const nhomB = total - nhomA;
    const daMo = patients.filter((p) => checkSurgeryTiming(p, currentBkDate).isDaMo).length;
    const daMoTruoc = patients.filter((p) => checkSurgeryTiming(p, currentBkDate).isDaMoTruoc).length;
    const daDen = patients.filter((p) => {
      const timing = checkSurgeryTiming(p, currentBkDate);
      return Boolean(p.daDon) || Boolean(p.ngayDenBV) || p.trangThai === "DaDonVien" || p.trangThaiDieuTri === "Đã đến trước đây" || timing.isDaMo;
    }).length;
    return { total, called, uncalled, nhomA, nhomB, daDen, daMo, daMoTruoc };
  }, [patients, currentBkDate]);

  const saveCallLog = async (presetText?: string) => {
    const textToSave = (presetText || callNote).trim();
    if (!selected || !textToSave) return;
    setSavingCallNote(true);
    try {
      const res = await fetch("/api/csr/nhatky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: selected.id,
          noiDung: textToSave,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Lỗi lưu nhật ký gọi" });
        return;
      }
      setCallNote("");
      addToast({ type: "success", message: `Đã lưu nhật ký gọi cho ${selected.hoTen}` });
      await fetchPatients(selected.id, true);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingCallNote(false);
    }
  };

  const curPatientIndex = visible.findIndex((p) => p.id === selId);
  const prevPatient = curPatientIndex > 0 ? visible[curPatientIndex - 1] : null;
  const nextPatient = curPatientIndex >= 0 && curPatientIndex < visible.length - 1 ? visible[curPatientIndex + 1] : null;

  const loadForm = useCallback((p: HoSo) => {
    const next = {
      bhyt: p.bhyt || "",
      soTienBao: p.soTienBao != null ? String(p.soTienBao) : "",
      nhom: p.nhom || (p.xacNhanDieuTri === true ? "A" : p.xacNhanDieuTri === false ? "B" : ""),
      ngayHen: p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "",
      diemDon: p.diemDon || "",
      gioDon: p.gioDon || "",
      ghiChuTuVan: p.ghiChuTuVan || "",
    };
    setF(next);
    setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(
    async (keepSel?: string, forceForm = false) => {
      if (!selBk) {
        setPatients([]);
        return;
      }
      const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
      const all: HoSo[] = res.ok ? await res.json() : [];
      // Tải tất cả các bệnh nhân có chẩn đoán bệnh lý
      const data = all.filter(isBenhLyPatient);
      setPatients(data);
      // Ưu tiên: ID giữ nguyên -> Bệnh nhân chưa tư vấn đầu tiên -> Bệnh nhân đầu tiên
      const next =
        data.find((p) => p.id === (keepSel ?? selId)) ||
        data.find((p) => !isTuVanDone(p)) ||
        data[0] ||
        null;
      if (next) {
        if (forceForm || next.id !== selId) loadForm(next);
        setSelId(next.id);
      } else {
        setSelId(null);
      }
    },
    [search, selId, loadForm, selBk]
  );

  useEffect(() => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const queryBk = urlParams?.get("buoiKhamId");

    fetch("/api/csr/buoikham")
      .then((r) => r.json())
      .then((data) => {
        setBks(data);
        if (queryBk && data.some((b: any) => b.id === queryBk)) {
          setSelBk(queryBk);
        } else {
          // Bắt buộc yêu cầu chọn đợt khám ngay khi vào trang
          setSelBk("");
          setShowBkModal(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selBk) {
      setLoading(true);
      fetchPatients().finally(() => setLoading(false));
    }
  }, [selBk]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && selBk) {
        setSearching(true);
        fetchPatients(undefined, true).finally(() => setSearching(false));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Cập nhật danh sách tư vấn thời gian thực (SSE)
  useRealtimeEvent(["hoso_change", "buoikham_change", "nhatky_change"], (evt) => {
    if (evt.type === "buoikham_change") {
      fetch("/api/csr/buoikham")
        .then((r) => r.json())
        .then((data) => {
          setBks(data);
        });
    }
    if (selBk && (evt.type === "hoso_change" || evt.type === "nhatky_change")) {
      fetchPatients(selId ?? undefined, false);
    }
  }, [selBk, selId, fetchPatients]);

  // ── Đối chiếu HIS cho đợt đang chọn (ghi lịch sử, dùng chung API với trang Đợt khám) ──
  const curBk = useMemo(() => bks.find((b) => b.id === selBk) || null, [bks, selBk]);
  const [lastDoiChieu, setLastDoiChieu] = useState<{ bkId: string; log: DoiChieuLog } | null>(null);
  const curLog: DoiChieuLog | null =
    lastDoiChieu && lastDoiChieu.bkId === selBk ? lastDoiChieu.log : (curBk?.lastDoiChieu as DoiChieuLog | null) ?? null;
  const [showHisHistory, setShowHisHistory] = useState(false);
  const his = useHisReconcile({
    onLog: (bkId, log) => setLastDoiChieu({ bkId, log }),
    onFinish: () => {
      if (selBk) fetchPatients(selId ?? undefined, false);
    },
  });
  const reconciling = !!selBk && his.runningIds.has(selBk);
  const soCaAB = (curBk?.stats?.nhomA ?? 0) + (curBk?.stats?.nhomB ?? 0);
  const reconcileCurrent = () => {
    if (!curBk) return;
    his.runOne({ id: curBk.id, name: fmtBuoiKhamName(curBk), soCa: soCaAB || counts.total });
  };

  const pick = async (p: HoSo) => {
    if (p.id === selId) return;
    if (
      dirty &&
      !(await confirm({
        title: "Bỏ thay đổi chưa lưu?",
        message: `Phiếu tư vấn đang có thay đổi chưa lưu.\nChuyển sang ${p.hoTen} sẽ mất các thay đổi này.`,
        confirmLabel: "Chuyển & bỏ thay đổi",
        cancelLabel: "Ở lại",
      }))
    )
      return;
    setSelId(p.id);
    loadForm(p);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bhyt: f.bhyt,
          soTienBao: f.soTienBao ? Number(f.soTienBao) : null,
          nhom: f.nhom || null,
          xacNhanDieuTri: f.nhom === "A" ? true : f.nhom === "B" ? false : null,
          ngayDieuTri: f.nhom === "A" ? (f.ngayHen || null) : null,
          diemDon: f.nhom === "A" ? (f.diemDon || null) : null,
          gioDon: f.nhom === "A" ? (f.gioDon || null) : null,
          ghiChuTuVan: f.ghiChuTuVan || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi lưu dữ liệu" });
        return;
      }
      setBaseline(JSON.stringify(f));
      addToast({ type: "success", message: `Đã lưu tư vấn: ${selected.hoTen}` });
      await fetchPatients(selected.id, true);

      // Tự động chuyển ca tiếp theo chưa tư vấn
      const nextPending = visible.find((p) => p.id !== selected.id && !p.nhom && p.xacNhanDieuTri == null);
      if (nextPending) {
        pick(nextPending);
      }
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !bks.length) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg)] overflow-hidden h-full">
      <PageHeader
        title="Tư vấn điều trị"
        description="Tư vấn phương án điều trị, chi phí và lịch đón bệnh viện cho các ca bệnh lý từ đợt khám."
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
          {selBk && (
            <div className="inline-flex">
              <button
                type="button"
                onClick={reconcileCurrent}
                disabled={reconciling}
                title={
                  curLog
                    ? `Đối chiếu HIS gần nhất: ${fmtRelative(curLog.thoiDiem)} — ${curLog.found ?? 0}/${curLog.total ?? 0} khớp`
                    : "Đối chiếu toàn bộ BN Nhóm A/B của đợt này với HIS"
                }
                className="inline-flex items-center gap-1.5 h-[34px] pl-3 pr-2.5 rounded-l-[10px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[12.5px] font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {reconciling ? "Đang đối chiếu…" : "Đối chiếu HIS"}
                {!reconciling && curLog && (
                  <span className="hidden sm:inline font-normal text-[11px] opacity-75">· {fmtRelative(curLog.thoiDiem)}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowHisHistory(true)}
                title="Lịch sử đối chiếu HIS của đợt"
                className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-r-[10px] border border-l-0 border-[var(--navy)]/20 bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            data-tour="tv-bk"
            onClick={() => setShowBkModal(true)}
            className="btn btn-secondary px-3 py-1.5 text-[12px] sm:text-[12.5px] font-semibold min-h-[34px] rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)] text-left shadow-2xs cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 shrink-0 text-[var(--teal-deep)]" />
            <span className="truncate max-w-[200px] sm:max-w-none">
              {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
            </span>
          </button>
          </div>
        }
      />

      <DoiChieuHistoryModal
        target={showHisHistory && curBk ? { id: curBk.id, name: fmtBuoiKhamName(curBk) } : null}
        onClose={() => setShowHisHistory(false)}
        running={reconciling}
        onRerun={reconcileCurrent}
      />

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={<>Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span></>}
        subtitle="Lấy danh sách bệnh nhân bệnh lý để tư vấn điều trị"
        icon={CalendarDays}
        maxWidth="max-w-[660px]"
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
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line)] bg-white pl-10 pr-4 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 bg-[var(--surface-soft)] min-h-[300px] max-h-[60vh] overflow-y-auto">
          {filteredBks.map((b) => {
            const active = selBk === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelBk(b.id);
                  setShowBkModal(false);
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-start gap-3.5 sm:gap-4 border cursor-pointer ${active
                    ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]"
                    : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors mt-0.5 ${active
                      ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] border-transparent text-white shadow-xs"
                      : "bg-[var(--navy-50)] border-[var(--navy-100)] text-[var(--navy)]"
                    }`}
                >
                  {active ? <Check className="w-5 h-5 text-[var(--teal)]" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[14.5px] sm:text-[15px] truncate text-[var(--ink)]" title={fmtBuoiKhamName(b)}>
                      {fmtBuoiKhamName(b)}
                    </span>
                    <span className="font-mono text-[11px] sm:text-[11.5px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] shrink-0 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[12.5px] sm:text-[13px] text-[var(--mute)] mt-1 flex items-center gap-3.5 font-medium flex-wrap">
                    <span className="flex items-center gap-1.5 shrink-0 font-mono">
                      <CalendarDays className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> {fmtDate(b.ngayKham)}
                    </span>
                    {b.diaDiem && (
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />{" "}
                        <span className="truncate">{b.diaDiem}</span>
                      </span>
                    )}
                  </div>

                  {/* Thống kê Phân nhóm A/B & Đã mổ */}
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[var(--line-soft)] flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-bg)] text-[var(--ink-soft)] border border-[var(--line)]" title="Tổng số bệnh nhân tiếp nhận">
                      {b._count?.hoSo ?? 0} BN
                    </span>

                    <div className="inline-flex rounded-md overflow-hidden border border-[var(--line)] font-mono text-[11px] font-bold shadow-2xs">
                      <span className="px-2 py-0.5 bg-[#fef1f4] text-[#e11d48] border-r border-[#e11d48]/20" title="Nhóm A: Đồng ý điều trị / Chỉ định mổ">
                        Nhóm A: {b.stats?.nhomA ?? 0}
                      </span>
                      <span className="px-2 py-0.5 bg-[#fef6eb] text-[#d97706]" title="Nhóm B: Cần suy nghĩ thêm / Theo dõi">
                        Nhóm B: {b.stats?.nhomB ?? 0}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border shadow-2xs ${
                        (b.stats?.daMo ?? 0) > 0
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                      title={`Đã mổ thực tế CSR: ${b.stats?.daMo ?? 0} ca${(b.stats?.nhomA ?? 0) > 0 ? ` trên tổng ${b.stats?.nhomA} ca nhóm A` : ""}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${(b.stats?.daMo ?? 0) > 0 ? "bg-emerald-600" : "bg-slate-400"}`} />
                      <span>
                        Đã mổ: {b.stats?.daMo ?? 0}
                        {(b.stats?.nhomA ?? 0) > 0 ? `/${b.stats?.nhomA ?? 0}` : ""}
                      </span>
                    </span>

                    {(b.stats?.daMoTruoc ?? 0) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
                        title={`Có ${b.stats.daMoTruoc} ca đã mổ trước ngày khám tầm soát`}
                      >
                        <span>🟣 {b.stats.daMoTruoc} mổ trước</span>
                      </span>
                    )}

                    {b.bacSiKham && (
                      <span className="text-[11px] font-medium text-[var(--mute)] ml-auto truncate" title={`Bác sĩ chỉ định / khám: ${b.bacSiKham}`}>
                        BS: {b.bacSiKham.replace(/^(BS|Bác sĩ|BSCKI|BSCKII)\s*/i, "")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredBks.length === 0 && (
            <div className="text-center py-14 flex flex-col items-center justify-center text-[var(--mute)]">
              <CalendarDays className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-[13px] font-medium">Không tìm thấy đợt khám phù hợp</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Main 2-Column Split View */}
      {!selBk ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-bg)] animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] flex items-center justify-center shadow-xs mb-4">
            <CalendarDays className="w-8 h-8 text-[var(--teal-deep)]" />
          </div>
          <h3 className="font-serif font-bold text-[18px] text-[var(--ink)]">Chưa chọn đợt khám</h3>
          <p className="text-[13px] text-[var(--mute)] max-w-md mt-1.5 leading-relaxed">
            Vui lòng chọn một đợt khám tầm soát để tải danh sách bệnh nhân có chẩn đoán bệnh lý và tiến hành tư vấn điều trị.
          </p>
          <button
            type="button"
            onClick={() => setShowBkModal(true)}
            className="btn btn-primary px-6 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-5 cursor-pointer active:scale-95 text-[13.5px]"
          >
            <CalendarDays className="w-4 h-4 text-[var(--teal)]" />
            <span>Chọn đợt khám ngay</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden relative">
          {/* Mobile Backdrop Overlay */}
          {showList && (
            <div
              onClick={() => setShowList(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 xl:hidden animate-fade-in"
            />
          )}

          {/* COL 1 — Hàng đợi bệnh nhân */}
          <aside
            className={`w-full xl:w-[392px] 2xl:w-[420px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] flex flex-col min-h-0 h-full fixed xl:static inset-y-0 left-0 z-40 transition-transform duration-200 ${
              showList ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
            }`}
          >
            {/* Tiêu đề + sắp xếp */}
            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] truncate">
                  Bệnh nhân <span className="italic font-medium text-[var(--teal)]">bệnh lý</span>
                </h3>
                <span className="font-mono text-[11px] font-bold px-1.5 py-px rounded-md bg-[var(--navy-50)] text-[var(--navy)] tabular-nums">{counts.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex p-[2px] rounded-lg bg-[var(--surface-soft)] border border-[var(--line)]">
                  {(["loai", "stt"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSortBy(k)}
                      className={`px-2 h-6 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        sortBy === k ? "bg-[var(--surface)] text-[var(--navy)] shadow-[var(--shadow-sm)]" : "text-[var(--mute)] hover:text-[var(--ink)]"
                      }`}
                      title={k === "loai" ? "Ưu tiên ca chưa gọi, rồi theo quyết định" : "Theo số thứ tự tiếp nhận"}
                    >
                      {k === "loai" ? "Ưu tiên" : "STT"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowList(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--mute)] xl:hidden cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tìm kiếm */}
            <div className="px-4 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--mute)] pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tên, mã BN, SĐT…"
                  className={`${INPUT_CLS} h-9 pl-8 pr-8`}
                />
                {searching ? (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[var(--navy)]" />
                ) : search ? (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Bộ lọc nhanh — chip cuộn ngang, có số đếm */}
            <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--line)] shrink-0">
              {FILTERS.map((ft) => {
                const active = filter === ft.key;
                const count =
                  ft.key === "chuagoi" ? counts.uncalled
                  : ft.key === "dagoi" ? counts.called
                  : ft.key === "nhomA" ? counts.nhomA
                  : ft.key === "nhomB" ? counts.nhomB
                  : ft.key === "daden" ? counts.daDen
                  : ft.key === "damo" ? counts.daMo
                  : ft.key === "damotruoc" ? counts.daMoTruoc
                  : counts.total;
                if (ft.key && count === 0 && !active) return null;
                return (
                  <button
                    key={ft.key}
                    type="button"
                    onClick={() => setFilter(ft.key)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? "bg-[var(--navy)] border-[var(--navy)] text-white"
                        : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--navy)]/40 hover:text-[var(--navy)]"
                    }`}
                  >
                    {ft.label}
                    <span className={`font-mono text-[10px] font-bold tabular-nums ${active ? "text-white/80" : "text-[var(--mute)]"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách */}
            <div data-tour="tv-list" className="flex-1 overflow-y-auto divide-y divide-[var(--line-soft)]">
              {patients.length === 0 ? (
                <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2">
                  <Stethoscope className="w-8 h-8 text-[var(--mute-soft)]" />
                  <span>Không có bệnh nhân nào phát hiện bệnh lý trong đợt khám này.</span>
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không có bệnh nhân khớp bộ lọc.</div>
              ) : (
                visible.map((p, idx) => {
                  const active = selId === p.id;
                  const diags = getPatientDiags(p);
                  const age = ageOf(p);
                  const hasCallLog = !!(p.nhatKy && p.nhatKy.length > 0);
                  const latestCallLog = hasCallLog ? p.nhatKy![0] : null;
                  const timing = checkSurgeryTiming(p, currentBkDate);
                  const daDen = isDaDenBV(p, timing.isDaMo);
                  const decision = decisionOf(p);
                  // Vạch màu trái: tình trạng tiến xa nhất của ca
                  const stripe = timing.isDaMo
                    ? "before:bg-[var(--teal)]"
                    : timing.isDaMoTruoc
                    ? "before:bg-[#7c3aed]"
                    : daDen
                    ? "before:bg-[var(--navy)]"
                    : !hasCallLog
                    ? "before:bg-[var(--amber)]"
                    : "before:bg-transparent";
                  const note = p.ghiChuTuVan || latestCallLog?.noiDung;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        pick(p);
                        if (window.innerWidth < 1280) setShowList(false);
                      }}
                      className={`relative w-full text-left px-4 py-3 transition-colors cursor-pointer before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] ${stripe} ${
                        active ? "bg-[var(--navy-50)]" : "hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-baseline gap-2">
                          <span className="font-mono text-[11px] text-[var(--mute)] tabular-nums shrink-0">{String(p.stt ?? idx + 1).padStart(2, "0")}</span>
                          <span className={`text-[13.5px] font-semibold truncate ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{p.hoTen}</span>
                        </div>
                        {decision && <Badge tone={decision.tone}>{decision.label.replace(" điều trị", "").replace(" tại nhà", "")}</Badge>}
                      </div>

                      <div className="mt-0.5 pl-[26px] text-[11.5px] text-[var(--mute)] truncate">
                        {[p.gioiTinh, age > 0 ? `${age} tuổi` : null, p.bhyt ? `BH ${bhytLevel(p.bhyt)}` : null].filter(Boolean).join(" · ")}
                        {diags.length > 0 && <span className="text-[var(--ink-soft)]"> · {diags.join(", ")}</span>}
                      </div>

                      <div className="mt-1.5 pl-[26px] flex items-center gap-1.5 flex-wrap">
                        {hasCallLog ? (
                          <Badge tone="gray" dot={false}>
                            <PhoneCall className="w-3 h-3" /> {p.nhatKy!.length} cuộc gọi
                          </Badge>
                        ) : (
                          <Badge tone="amber">Chưa gọi</Badge>
                        )}
                        {timing.isDaMo ? (
                          <Badge tone="teal">Đã mổ{p.ngayMoThucTe ? <span className="font-mono font-medium">{fmtDate(p.ngayMoThucTe)}</span> : null}</Badge>
                        ) : timing.isDaMoTruoc ? (
                          <Badge tone="violet">Mổ trước{p.ngayMoThucTe ? <span className="font-mono font-medium">{fmtDate(p.ngayMoThucTe)}</span> : null}</Badge>
                        ) : daDen ? (
                          <Badge tone="navy">Đã đến BV</Badge>
                        ) : p.diemDon ? (
                          <Badge tone="navy" dot={false}><Bus className="w-3 h-3" />{p.gioDon || ""} {p.ngayDieuTri ? fmtDate(p.ngayDieuTri) : ""}</Badge>
                        ) : null}
                      </div>

                      {note && (
                        <div className="mt-1.5 pl-[26px] text-[11.5px] text-[var(--ink-soft)] truncate" title={note}>
                          <span className="text-[var(--mute)]">{p.ghiChuTuVan ? "Ghi chú: " : "Gọi gần nhất: "}</span>
                          {note}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* COL 2 — Vùng làm việc tư vấn */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-[var(--bg)] overflow-hidden">
            {selected ? (
              <>
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* 1. Thẻ hồ sơ: danh tính + trạng thái + tóm tắt lâm sàng */}
                  {(() => {
                    const timing = checkSurgeryTiming(selected, currentBkDate);
                    const daDen = isDaDenBV(selected, timing.isDaMo);
                    const decision = decisionOf(selected);
                    const diagGroups = getDiagGroups(selected);
                    const tienSu = selected.benhSu ? parseDiags(selected.loaiBenhSu, selected.loaiBenhSuKhac).join(", ") || "Có tiền sử" : "";
                    const theTrang = [selected.chieuCao ? `${selected.chieuCao} cm` : null, selected.canNang ? `${selected.canNang} kg` : null].filter(Boolean).join(" · ");
                    return (
                      <div className="bg-[var(--surface)] border-b border-[var(--line)] px-4 sm:px-6 py-3.5 shrink-0">
                        {/* Danh tính + trạng thái | bác sĩ & chỉ định */}
                        <div className="flex items-start justify-between gap-x-6 gap-y-2 flex-wrap">
                          <div className="min-w-0 flex items-center gap-x-2.5 gap-y-1.5 flex-wrap">
                            <h2 className="font-serif text-[21px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-tight">{selected.hoTen}</h2>
                            <span className="font-mono text-[11.5px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--navy-50)] text-[var(--navy)]">{selected.maBN}</span>
                            <span className="text-[12.5px] text-[var(--mute)]">{selected.gioiTinh} · {ageOf(selected)} tuổi</span>
                            <span className="hidden sm:block w-px h-4 bg-[var(--line)]" />
                            {isTuVanDone(selected) ? (
                              <Badge tone="gray" dot={false}>
                                <Check className="w-3 h-3" /> Đã tư vấn{selected.nhatKy?.length ? ` · ${selected.nhatKy.length} cuộc gọi` : ""}
                              </Badge>
                            ) : (
                              <Badge tone="amber">Chưa tư vấn sau khám</Badge>
                            )}
                            {decision ? <Badge tone={decision.tone}>{decision.label}</Badge> : <Badge tone="rose">Chưa chốt quyết định</Badge>}
                            {daDen && !timing.isDaMo && (
                              <Badge tone="navy">Đã đến BV{selected.ngayDenBV ? <span className="font-mono font-medium">{fmtDate(selected.ngayDenBV)}</span> : null}</Badge>
                            )}
                            {timing.isDaMo && (
                              <Badge tone="teal">Đã mổ{selected.ngayMoThucTe ? <span className="font-mono font-medium">{fmtDate(selected.ngayMoThucTe)}</span> : null}</Badge>
                            )}
                            {timing.isDaMoTruoc && (
                              <Badge tone="violet" title="Đã mổ trước ngày khám tầm soát">
                                Mổ trước{selected.ngayMoThucTe ? <span className="font-mono font-medium">{fmtDate(selected.ngayMoThucTe)}</span> : null}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[12.5px]">
                            {selected.bacSiChiDinh && <Fact label="BS khám">BS. {selected.bacSiChiDinh}</Fact>}
                            <Fact label="Chỉ định">
                              <span className="font-semibold text-[var(--rose)]">{selected.khuyenNghi || selected.huongXuTri || "Phẫu thuật"}</span>
                            </Fact>
                          </div>
                        </div>

                        {/* Chẩn đoán + lâm sàng (chỉ hiện trường có dữ liệu) */}
                        <div className="mt-3 pt-3 border-t border-[var(--line-soft)] flex items-center gap-x-5 gap-y-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-[11.5px] text-[var(--mute)] mr-0.5">Chẩn đoán</span>
                            {diagGroups.length ? (
                              diagGroups.map((g) => (
                                <span key={g.name} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[12px] font-semibold bg-[var(--rose-soft)] text-[var(--rose)]">
                                  {g.name}
                                  {g.eyes.length > 0 && (
                                    <span className="font-mono text-[10px] font-bold px-1 rounded-[4px] bg-white/70 text-[var(--rose)]">{eyeLabel(g.eyes)}</span>
                                  )}
                                </span>
                              ))
                            ) : (
                              <span className="text-[12.5px] text-[var(--mute)]">Chưa phát hiện bệnh lý</span>
                            )}
                          </div>
                          {(selected.thiLucMP || selected.thiLucMT) && (
                            <Fact label="Thị lực">
                              <span className="font-mono tabular-nums">
                                MP {selected.thiLucMP || "—"} <span className="text-[var(--mute-soft)]">·</span> MT {selected.thiLucMT || "—"}
                              </span>
                            </Fact>
                          )}
                          {selected.matKham && <Fact label="Mắt khám">{selected.matKham}</Fact>}
                          {tienSu && <Fact label="Tiền sử"><span className="text-[var(--amber-deep)]">{tienSu}</span></Fact>}
                          {theTrang && <Fact label="Thể trạng">{theTrang}</Fact>}
                        </div>

                        {/* Liên hệ */}
                        <div className="mt-2 flex items-center gap-x-5 gap-y-1.5 flex-wrap">
                          <Fact label="SĐT">
                            {selected.sdt ? (
                              <a href={`tel:${selected.sdt}`} className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--navy)] hover:underline">
                                <Phone className="w-3 h-3" /> {selected.sdt}
                              </a>
                            ) : (
                              <span className="text-[var(--mute-soft)]">—</span>
                            )}
                          </Fact>
                          {selected.bhyt && (
                            <Fact label="BHYT">
                              <span className="font-mono">{selected.bhyt}</span> <span className="text-[var(--mute)]">({bhytLevel(selected.bhyt)})</span>
                            </Fact>
                          )}
                          {selected.cccd && <Fact label="CCCD"><span className="font-mono">{selected.cccd}</span></Fact>}
                          {selected.diaChi && <Fact label="Địa chỉ"><span title={selected.diaChi}>{selected.diaChi}</span></Fact>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Hai cột: phương án điều trị | nhật ký cuộc gọi */}
                  <div className="p-4 sm:p-5 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_440px] 2xl:grid-cols-[1fr_500px] gap-4 items-stretch overflow-y-auto lg:overflow-hidden">
                    {/* Phương án điều trị */}
                    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] shadow-[var(--shadow-sm)] flex flex-col lg:h-full min-h-0 overflow-hidden">
                      <header className="px-5 py-3.5 border-b border-[var(--line-soft)] shrink-0">
                        <h3 className="text-[14px] font-bold text-[var(--ink)]">
                          Phương án điều trị <span className="text-[var(--rose)]">*</span>
                        </h3>
                        <p className="text-[11.5px] text-[var(--mute)] mt-0.5">Quyết định của bệnh nhân sau khi được tư vấn</p>
                      </header>

                      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-5">
                        <div data-tour="tv-nhom" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {PHUONG_AN_TU_VAN.map((opt) => {
                            const active = f.nhom === opt.key;
                            const dot = opt.key === "A" ? "bg-[var(--teal)]" : opt.key === "B" ? "bg-[var(--amber)]" : "bg-[var(--navy)]";
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() =>
                                  setF((s) => ({ ...s, nhom: opt.key, ngayHen: opt.key === "A" && !s.ngayHen ? tomorrowISO() : s.ngayHen }))
                                }
                                className={`relative p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                                  active
                                    ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-[0_0_0_3px_var(--navy-100)]"
                                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                  <span className={`text-[13px] font-semibold ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{opt.label}</span>
                                  {active && (
                                    <span className="ml-auto w-[18px] h-[18px] rounded-full bg-[var(--navy)] flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 pl-4 text-[11.5px] leading-snug text-[var(--mute)]">{opt.sub}</p>
                              </button>
                            );
                          })}
                        </div>

                        {f.nhom === "A" ? (
                          <div className="space-y-4 animate-fade-in" data-tour="tv-lich">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={FIELD_LABEL}>Số tiền dự kiến</label>
                                <div className="relative">
                                  <input
                                    inputMode="numeric"
                                    value={f.soTienBao ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienBao)) : ""}
                                    onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))}
                                    className={`${INPUT_CLS} h-10 px-3 pr-10 font-mono font-semibold tabular-nums`}
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] text-[13px] font-semibold">₫</span>
                                </div>
                              </div>
                              <div>
                                <DateField label="Ngày điều trị tại BV" value={f.ngayHen} onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))} min={tomorrowISO()} />
                              </div>
                            </div>

                            <div>
                              <label className={FIELD_LABEL}>
                                <Bus className="w-3.5 h-3.5 text-[var(--navy)]" />
                                Đoàn xe đón (điểm đón & giờ đón)
                              </label>
                              {(() => {
                                // Ca đã đến viện / đã mổ mà chưa từng được xếp xe → nói rõ, tránh tưởng dữ liệu không nạp được
                                const t = checkSurgeryTiming(selected, currentBkDate);
                                const daDen = isDaDenBV(selected, t.isDaMo);
                                if (f.diemDon || !daDen) return null;
                                return (
                                  <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-[10px] bg-[var(--navy-50)] text-[12px] text-[var(--ink-soft)]">
                                    <Bus className="w-3.5 h-3.5 mt-px text-[var(--navy)] shrink-0" />
                                    <span>
                                      Bệnh nhân {t.isDaMo ? <>đã mổ{selected.ngayMoThucTe ? <> ngày <b className="font-mono">{fmtDate(selected.ngayMoThucTe)}</b></> : null}</> : "đã đến viện"} nhưng
                                      <b> chưa được xếp đoàn xe</b> — nhiều khả năng tự đến. Có thể bỏ trống hoặc chọn đoàn nếu có đưa đón.
                                    </span>
                                  </div>
                                );
                              })()}
                              <DoanXeAutocomplete
                                diemDon={f.diemDon}
                                gioDon={f.gioDon}
                                ngayHen={f.ngayHen}
                                buoiKhamXa={bks.find((b) => b.id === selBk)?.xa || ""}
                                onSelect={(val) => {
                                  setF((s) => ({ ...s, diemDon: val.diemDon, gioDon: val.gioDon, ngayHen: val.ngayHen || s.ngayHen }));
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[10px] bg-[var(--surface-soft)] border border-dashed border-[var(--line-strong)] text-[12.5px] text-[var(--ink-soft)] animate-fade-in">
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${f.nhom === "B" ? "bg-[var(--amber)]" : f.nhom === "TheoDoi" ? "bg-[var(--navy)]" : "bg-[var(--mute-soft)]"}`} />
                            <span>
                              {f.nhom === "B"
                                ? "Bệnh nhân cần suy nghĩ thêm — lịch đón và viện phí tạm khóa. Ghi lý do / hẹn gọi lại vào ô ghi chú bên dưới."
                                : f.nhom === "TheoDoi"
                                ? "Theo dõi tại nhà — không cần xếp lịch đưa đón. Ghi dặn dò tái khám vào ô ghi chú bên dưới."
                                : "Chọn quyết định điều trị của bệnh nhân để tiếp tục."}
                            </span>
                          </div>
                        )}

                        <div>
                          <label className={FIELD_LABEL}>Ghi chú tư vấn / dặn dò</label>
                          <textarea
                            value={f.ghiChuTuVan}
                            onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                            placeholder="Nguyện vọng của bệnh nhân, dặn dò trước khi lên viện, số người nhà liên hệ…"
                            rows={3}
                            className={`${INPUT_CLS} p-3 resize-none leading-relaxed`}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Nhật ký cuộc gọi */}
                    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[14px] shadow-[var(--shadow-sm)] flex flex-col lg:h-full min-h-0 overflow-hidden">
                      <header className="px-5 py-3.5 border-b border-[var(--line-soft)] shrink-0 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-bold text-[var(--ink)]">Nhật ký cuộc gọi</h3>
                          <p className="text-[11.5px] text-[var(--mute)] mt-0.5">Ghi nhận các lần gọi chăm sóc bệnh nhân</p>
                        </div>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--line-soft)] text-[var(--ink-soft)] tabular-nums shrink-0">
                          {selected.nhatKy?.length || 0} cuộc gọi
                        </span>
                      </header>

                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Ghi cuộc gọi mới */}
                        <div className="p-4 border-b border-[var(--line-soft)] space-y-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {["Đã gọi - Hẹn gọi lại", "Đã gọi - Đồng ý mổ", "Đã gọi - Cần suy nghĩ thêm", "Thuê bao / Không nghe máy", "Đã tư vấn qua người nhà"].map((tag) => {
                              const on = callNote === tag;
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setCallNote(on ? "" : tag)}
                                  className={`h-7 px-2.5 rounded-lg border text-[11.5px] font-semibold transition-colors cursor-pointer ${
                                    on
                                      ? "bg-[var(--teal-soft)] border-[var(--teal)]/40 text-[var(--teal-deep)]"
                                      : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                                  }`}
                                >
                                  {on && <Check className="inline w-3 h-3 mr-1 -mt-px" />}
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={callNote}
                            onChange={(e) => setCallNote(e.target.value)}
                            placeholder="Nội dung cuộc gọi với bệnh nhân hoặc người nhà…"
                            rows={2}
                            className={`${INPUT_CLS} p-3 resize-none min-h-[64px]`}
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => saveCallLog()}
                              disabled={savingCallNote || !callNote.trim()}
                              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[12px] font-semibold text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:border-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {savingCallNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              Lưu cuộc gọi
                            </button>
                          </div>
                        </div>

                        {/* Dòng thời gian cuộc gọi */}
                        <div className="p-4">
                          {selected.nhatKy && selected.nhatKy.length > 0 ? (
                            <ol className="relative space-y-3.5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--line)]">
                              {selected.nhatKy.map((log, i) => (
                                <li key={log.id} className="relative pl-6">
                                  <span className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-[var(--surface)] ${i === 0 ? "bg-[var(--teal)]" : "bg-[var(--mute-soft)]"}`} />
                                  <div className="flex items-center justify-between gap-2 text-[11.5px]">
                                    <span className="font-semibold text-[var(--ink)] truncate">{log.nguoiGoi?.hoTen || "Tư vấn viên"}</span>
                                    <span className="font-mono text-[var(--mute)] tabular-nums shrink-0">
                                      {fmtTime(log.ngay)} · {fmtDate(log.ngay)}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)] leading-relaxed whitespace-pre-wrap">{log.noiDung}</p>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-8 text-[12.5px] text-[var(--mute)] gap-1.5">
                              <Phone className="w-5 h-5 text-[var(--mute-soft)]" />
                              Chưa có cuộc gọi nào được ghi nhận.
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Thanh thao tác dưới */}
                <div
                  data-tour="tv-save"
                  className="px-3 sm:px-5 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.625rem)] border-t border-[var(--line)] bg-[var(--surface)] sticky bottom-0 z-30 flex items-center justify-between gap-2 shrink-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowList(true)}
                      className="xl:hidden inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[10px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[12px] font-semibold text-[var(--navy)] shrink-0 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      DS
                      <span className="font-mono text-[10.5px] font-bold px-1.5 rounded-[5px] bg-[var(--navy)] text-white tabular-nums">{counts.total}</span>
                    </button>

                    <div className="flex items-center gap-0.5 p-[2px] rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] shrink-0">
                      <button
                        type="button"
                        onClick={() => prevPatient && pick(prevPatient)}
                        disabled={!prevPatient}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Ca trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-semibold px-1 text-[var(--mute)] tabular-nums">
                        {curPatientIndex >= 0 ? `${curPatientIndex + 1}/${visible.length}` : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => nextPatient && pick(nextPatient)}
                        disabled={!nextPatient}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Ca tiếp"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] font-medium min-w-0 truncate">
                      {dirty ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse shrink-0" />
                          <span className="text-[var(--amber-deep)]">Có thay đổi chưa lưu</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                          <span className="text-[var(--mute)]">Đã lưu vào hệ thống</span>
                        </>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty || !f.nhom}
                    className="btn-primary inline-flex items-center gap-1.5 h-9 px-5 rounded-[10px] text-[13px] font-semibold shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                    Lưu tư vấn
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-6 py-12 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center border border-[var(--navy-100)] shadow-2xs">
                    <Stethoscope className="w-7 h-7 text-[var(--teal-deep)]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <div className="font-bold text-[15px] text-[var(--ink)]">
                      {counts.total > 0 ? "Chưa chọn bệnh nhân" : "Chưa có bệnh nhân bệnh lý"}
                    </div>
                    <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                      {counts.total > 0
                        ? `Đợt khám có ${counts.total} bệnh nhân có chẩn đoán bệnh lý. Bấm nút bên dưới để mở danh sách chọn ca.`
                        : "Đợt khám này chưa có bệnh nhân nào được chẩn đoán bệnh lý."}
                    </div>
                  </div>
                  {counts.total > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowList(true)}
                      className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-2 cursor-pointer active:scale-95"
                    >
                      <Users className="w-4 h-4 text-[var(--teal)]" />
                      <span>Mở danh sách bệnh nhân ({counts.total})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBkModal(true)}
                      className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl border border-[var(--line-strong)] flex items-center gap-2 mt-2 cursor-pointer"
                    >
                      <CalendarDays className="w-4 h-4 text-[var(--navy)]" />
                      <span>Chọn đợt khám khác</span>
                    </button>
                  )}
                </div>

                {/* Thanh đáy dự phòng trên Mobile khi chưa chọn bệnh nhân */}
                <div className="xl:hidden px-3 py-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-30 flex items-center justify-between shadow-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="h-8 px-2.5 rounded-lg bg-[#002b7f] hover:bg-[var(--navy-deep)] text-white font-bold text-[12px] flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span className="font-extrabold text-[12px] text-white">DS</span>
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#e11d48] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {counts.total}
                    </span>
                  </button>
                  <span className="text-[11.5px] text-[var(--mute)] font-medium">Chưa chọn ca</span>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

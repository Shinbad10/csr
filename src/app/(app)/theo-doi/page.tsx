"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Search,
  Check,
  Save,
  PhoneCall,
  CalendarClock,
  Send,
  X,
  Users,
  ClipboardList,
  Phone,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import {
  parseDiag,
  ageOf,
  fmtDate,
  fmtTime,
  fmtBuoiKhamName,
  statusOf,
  bhytLevel,
  TT_DIEU_TRI,
  type HoSo,
} from "@/lib/csr";
import { Dropdown, StatusBadge, DateField, ChoiceRow, labelCls } from "@/components/csr/fields";
import { SkeletonList } from "@/components/layout/Skeleton";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";

const FOLLOW = ["", "Đang follow-up", "Quá 28 ngày–chuyển CSKH", "Đã chốt", "Ngừng"];
/** Các trạng thái thuộc luồng mổ (nhóm A). Gồm cả CoChiDinhMo — ca chưa chốt ngày, cần nhắc lịch. */
const A_STATES = ["CoChiDinhMo", "NhomA", "DaNhacLich", "DaDonVien", "DaMoHauPhau", "HuyKhongDen"];
const EMPTY_DIEUTRI = {
  daDon: false,
  ngayMoThucTe: "",
  soTienThucThu: "",
  trangThaiDieuTri: "",
  ngayTaiKham: "",
  ghiChuMat2: "",
};

interface NhatKy {
  id: string;
  ngay: string;
  noiDung: string;
  nguoiGoi?: { hoTen: string };
}
interface HoSoDetail extends HoSo {
  nhatKy?: NhatKy[];
}

export default function TheoDoiPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"A" | "B">("A");
  const [rows, setRows] = useState<HoSo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<HoSoDetail | null>(null);
  const [stats, setStats] = useState({ tong: 0, chiDinh: 0, daDen: 0, chuaDen: 0, quaHan: 0, soA: 0, soB: 0 });

  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(false);
  const [bkSearch, setBkSearch] = useState("");
  const bkLabels = useMemo(
    () => Object.fromEntries(bks.map((b) => [b.id, `${fmtDate(b.ngayKham)} · ${fmtBuoiKhamName(b)}`])),
    [bks]
  );

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
          setSelBk("");
          setShowBkModal(true);
        }
        setLoading(false);
      });
  }, []);

  const [note, setNote] = useState("");
  const [fstatus, setFstatus] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [f, setF] = useState(EMPTY_DIEUTRI);
  const [savingDieuTri, setSavingDieuTri] = useState(false);
  const [isEditingDieuTri, setIsEditingDieuTri] = useState(false);

  const [showList, setShowList] = useState(false);
  const [checkingHis, setCheckingHis] = useState(false);

  // Tìm HIS thủ công (khi đối chiếu tự động không khớp)
  const [hisSearchOpen, setHisSearchOpen] = useState(false);
  const [hisQuery, setHisQuery] = useState("");
  const [hisResults, setHisResults] = useState<any[]>([]);
  const [hisSearched, setHisSearched] = useState(false);
  const [hisSearching, setHisSearching] = useState(false);
  const [hisLinking, setHisLinking] = useState<string | null>(null);

  const curPatientIndex = rows.findIndex((p) => p.id === sel?.id);
  const prevPatient = curPatientIndex > 0 ? rows[curPatientIndex - 1] : null;
  const nextPatient = curPatientIndex >= 0 && curPatientIndex < rows.length - 1 ? rows[curPatientIndex + 1] : null;

  const checkHisPatient = async (p: HoSoDetail) => {
    setCheckingHis(true);
    try {
      const res = await fetch("/api/his/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: p.id }),
      });
      const r = await res.json();
      if (r.success && r.data) {
        addToast({ type: "success", message: r.data.chiTiet || `Đã liên kết mã HIS: ${r.data.maHIS}` });
        load(p.id);
      } else {
        addToast({ type: "error", message: r.message || r.error || "Không tìm thấy trên HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ HIS" });
    } finally {
      setCheckingHis(false);
    }
  };

  const openHisSearch = (p: HoSoDetail) => {
    setHisQuery(p.cccd || p.bhyt || p.hoTen || "");
    setHisResults([]);
    setHisSearched(false);
    setHisSearchOpen(true);
  };

  const runHisSearch = async () => {
    if (!sel || !hisQuery.trim()) return;
    setHisSearching(true);
    try {
      const res = await fetch("/api/his/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: sel.id, q: hisQuery.trim() }),
      });
      const r = await res.json();
      if (r.success) {
        setHisResults(r.results || []);
        setHisSearched(true);
      } else {
        addToast({ type: "error", message: r.error || "Không tìm được trên HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ HIS" });
    } finally {
      setHisSearching(false);
    }
  };

  const confirmHisSurgery = async (item: any) => {
    if (!sel) return;
    setHisLinking(item.maHIS);
    try {
      const dStr = item.ngayMo ? new Date(item.ngayMo).toLocaleDateString("vi-VN") : "";
      const chiTiet =
        `Bệnh nhân: ${item.hoTen} (Mã HIS: ${item.maHIS}, NS: ${item.namSinh})` +
        (item.ngayMo
          ? ` - Đã phẫu thuật ngày ${dStr} tại Khoa ${item.khoaMo || "KMTH"}${item.chanDoan ? ` (CĐ: ${item.chanDoan})` : ""}`
          : "") +
        " [Xác nhận thủ công]";
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: sel.id,
          maHIS: item.maHIS,
          ngayMo: item.ngayMo,
          khoaMo: item.khoaMo,
          chanDoan: item.chanDoan,
          chiTiet,
        }),
      });
      const r = await res.json();
      if (r.success) {
        addToast({ type: "success", message: `Đã xác nhận mổ: ${sel.hoTen} (HIS ${item.maHIS})` });
        setHisSearchOpen(false);
        load(sel.id);
      } else {
        addToast({ type: "error", message: r.error || "Không thể xác nhận" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setHisLinking(null);
    }
  };

  const openDetail = async (p: HoSo) => {
    const res = await fetch(`/api/csr/hoso/${p.id}`);
    const detail: HoSoDetail = res.ok ? await res.json() : p;
    setSel(detail);
    setNote("");
    setFstatus(detail.followUpStatus || "");
    setF({
      daDon: !!detail.daDon,
      ngayMoThucTe: detail.ngayMoThucTe
        ? new Date(detail.ngayMoThucTe).toISOString().slice(0, 10)
        : detail.ngayDieuTri
        ? new Date(detail.ngayDieuTri).toISOString().slice(0, 10)
        : "",
      soTienThucThu:
        detail.soTienThucThu != null
          ? String(detail.soTienThucThu)
          : detail.soTienBao != null
          ? String(detail.soTienBao)
          : "",
      trangThaiDieuTri: detail.trangThaiDieuTri || "",
      ngayTaiKham: detail.ngayTaiKham ? new Date(detail.ngayTaiKham).toISOString().slice(0, 10) : "",
      ghiChuMat2: detail.ghiChuMat2 || "",
    });
    setIsEditingDieuTri(false);
  };

  const load = useCallback(
    async (keepId?: string) => {
      if (!selBk) {
        setRows([]);
        setSel(null);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
      const all: HoSo[] = res.ok ? await res.json() : [];

      const isB = (r: HoSo) => r.nhom === "B" || r.trangThai === "NhomB";
      const isA = (r: HoSo) => !isB(r) && (r.nhom === "A" || A_STATES.includes(r.trangThai));

      let data: HoSo[] = [];
      if (tab === "B") {
        data = all.filter(isB);
      } else {
        data = all.filter(isA).sort((a, b) => (a.ngayDieuTri || "").localeCompare(b.ngayDieuTri || ""));
      }

      setRows(data);
      const next = data.find((p) => p.id === (keepId ?? sel?.id)) || data[0] || null;
      if (next) {
        openDetail(next);
      } else {
        setSel(null);
      }

      const today = new Date().toISOString().slice(0, 10);
      const nhomA = all.filter(isA);
      const tong = all.length;
      const chiDinh = all.filter((p) => isA(p) || isB(p)).length;
      const daDen = nhomA.filter((p) => p.daDon).length;
      const chuaDen = nhomA.length - daDen;
      const quaHan = nhomA.filter((p) => !p.daDon && p.ngayDieuTri && p.ngayDieuTri.slice(0, 10) < today).length;
      setStats({ tong, chiDinh, daDen, chuaDen, quaHan, soA: nhomA.length, soB: all.filter(isB).length });

      setLoading(false);
    },
    [tab, search, sel?.id, selBk]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [search, tab, selBk]);

  // Đồng bộ thời gian thực cho theo dõi A/B, nhật ký liên hệ và danh sách đợt khám (SSE)
  useRealtimeEvent(["hoso_change", "nhatky_change", "buoikham_change"], (evt) => {
    if (evt.type === "buoikham_change") {
      fetch("/api/csr/buoikham")
        .then((r) => r.json())
        .then((data) => {
          setBks(data);
        });
    }
    if (selBk && (evt.type === "hoso_change" || evt.type === "nhatky_change")) {
      load(sel?.id);
    }
  }, [selBk, sel?.id, load]);

  const addNote = async () => {
    if (!sel || !note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/csr/nhatky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: sel.id, noiDung: note, followUpStatus: fstatus || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi" });
        return;
      }
      addToast({ type: "success", message: "Đã thêm nhật ký liên hệ." });
      setNote("");
      await openDetail(sel);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingNote(false);
    }
  };

  const saveDieuTri = async () => {
    if (!sel) return;
    setSavingDieuTri(true);
    try {
      const res = await fetch(`/api/csr/hoso/${sel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daDon: f.daDon,
          ngayMoThucTe: f.ngayMoThucTe || null,
          soTienThucThu: f.soTienThucThu ? Number(f.soTienThucThu) : null,
          trangThaiDieuTri: f.trangThaiDieuTri || null,
          ngayTaiKham: f.ngayTaiKham || null,
          ghiChuMat2: f.ghiChuMat2,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi" });
        return;
      }
      addToast({ type: "success", message: `Đã lưu điều trị: ${sel.hoTen}` });
      await load(sel.id);
      setIsEditingDieuTri(false);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingDieuTri(false);
    }
  };

  const dirtyDieuTri = useMemo(() => {
    if (!sel) return false;
    const isDaDon = !!sel.daDon;
    const isNgayMo = sel.ngayMoThucTe
      ? new Date(sel.ngayMoThucTe).toISOString().slice(0, 10)
      : sel.ngayDieuTri
      ? new Date(sel.ngayDieuTri).toISOString().slice(0, 10)
      : "";
    const isTien = sel.soTienThucThu != null ? String(sel.soTienThucThu) : sel.soTienBao != null ? String(sel.soTienBao) : "";
    const isTrangThai = sel.trangThaiDieuTri || "";
    const isNgayTaiKham = sel.ngayTaiKham ? new Date(sel.ngayTaiKham).toISOString().slice(0, 10) : "";
    const isGhiChu = sel.ghiChuMat2 || "";

    return (
      f.daDon !== isDaDon ||
      f.ngayMoThucTe !== isNgayMo ||
      f.soTienThucThu !== isTien ||
      f.trangThaiDieuTri !== isTrangThai ||
      f.ngayTaiKham !== isNgayTaiKham ||
      f.ghiChuMat2 !== isGhiChu
    );
  }, [f, sel]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface-bg)] overflow-hidden h-full">
      <PageHeader
        title="Theo dõi & Chăm sóc A/B"
        description="Theo dõi nhóm B (chăm sóc) và nhóm A (nhắc lịch & cập nhật điều trị tại BV)."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/doi-chieu-his"
              className="btn btn-secondary px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold h-[34px] rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors flex items-center gap-1.5 text-teal-800 bg-teal-50/50 shadow-2xs"
            >
              ⚡ HIS
            </Link>
            <button
              data-tour="td-bk"
              onClick={() => setShowBkModal(true)}
              className="btn btn-secondary px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold h-[34px] rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)] cursor-pointer shadow-2xs"
            >
              <CalendarDays className="w-4 h-4 text-[var(--teal-deep)]" />
              <span className="truncate max-w-[160px] sm:max-w-none">
                {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
              </span>
            </button>
          </div>
        }
      />

      {/* Dải chỉ số thống kê */}
      <div className="px-3 sm:px-5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-soft)] shrink-0 overflow-x-auto">
        <div className="flex items-stretch gap-2.5 min-w-[600px] sm:min-w-0 flex-nowrap sm:flex-wrap">
          {[
            { k: "Tổng BN", v: stats.tong, accent: "var(--navy)", tone: "text-[var(--navy)]" },
            { k: "Chỉ định A/B", v: stats.chiDinh, sub: `/ ${stats.tong}`, accent: "var(--teal)", tone: "text-[var(--teal-deep)]" },
            { k: "Nhóm A · đã đến BV", v: stats.daDen, accent: "var(--green)", tone: "text-[var(--green)]" },
            { k: "Nhóm A · chưa đến", v: stats.chuaDen, accent: "var(--amber)", tone: "text-[var(--amber-deep)]" },
            { k: "Nhóm A · quá hạn", v: stats.quaHan, accent: "var(--rose)", tone: "text-[var(--rose)]", alert: stats.quaHan > 0 },
          ].map((s) => (
            <div
              key={s.k}
              className={`relative flex-1 min-w-[120px] pl-3 pr-2.5 py-1.5 rounded-lg bg-white border transition-colors shadow-2xs ${
                s.alert ? "border-[var(--rose)]/40" : "border-[var(--line)]"
              }`}
            >
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: s.accent }} />
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--mute)] whitespace-nowrap">
                {s.k}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`font-mono text-[17px] font-bold leading-tight ${s.tone}`}>{s.v}</span>
                {s.sub && <span className="font-mono text-[10.5px] text-[var(--mute-soft)]">{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!selBk ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-bg)] animate-fade-in border-t border-[var(--line)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] flex items-center justify-center shadow-xs mb-4">
            <CalendarDays className="w-8 h-8 text-[var(--teal-deep)]" />
          </div>
          <h3 className="font-serif font-bold text-[18px] text-[var(--ink)]">Chưa chọn đợt khám</h3>
          <p className="text-[13px] text-[var(--mute)] max-w-md mt-1.5 leading-relaxed">
            Vui lòng chọn một đợt khám tầm soát để tải danh sách bệnh nhân và thực hiện theo dõi & chăm sóc.
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
        <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-hidden relative">
          {/* Backdrop */}
          {showList && (
            <div
              className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px] transition-opacity xl:hidden"
              onClick={() => setShowList(false)}
            />
          )}

          {/* COL 1 — List Sidebar */}
          <aside
            className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
              showList ? "translate-x-0" : "translate-x-full"
            } xl:static xl:translate-x-0 xl:w-[350px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}
          >
          {/* Segmented Control Tabs */}
          <div data-tour="td-tabs" className="p-2.5 border-b border-[var(--line)] bg-[var(--surface-bg)]">
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--line)]">
              {[
                { k: "A" as const, icon: CalendarClock, label: "Nhóm A (Mổ)", n: stats.soA },
                { k: "B" as const, icon: PhoneCall, label: "Nhóm B (K/N)", n: stats.soB },
              ].map(({ k, icon: Icon, label, n }) => {
                const on = tab === k;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      setTab(k);
                      setSel(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                      on
                        ? "bg-[var(--navy)] text-white shadow-xs"
                        : "text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${on ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
                    <span className="truncate">{label}</span>
                    <span
                      className={`font-mono text-[10.5px] font-bold px-1.5 rounded-full ${
                        on ? "bg-white/20 text-white" : "bg-[var(--surface-bg)] text-[var(--mute)] border border-[var(--line)]"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--line-soft)] xl:hidden">
            <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--navy)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--teal-deep)]" />
              <span>Danh sách bệnh nhân</span>
            </h2>
            <button
              onClick={() => setShowList(false)}
              className="p-1.5 rounded-full hover:bg-[var(--line-soft)] text-[var(--mute)] active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, mã, SĐT…"
                className="w-full h-9 rounded-lg border border-[var(--line)] bg-white pl-9 pr-8 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Patient Cards List */}
          <div data-tour="td-list" className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {loading ? (
              <SkeletonList items={6} />
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
                <Users className="w-8 h-8 text-[var(--mute-soft)]" />
                <p className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                  {search ? (
                    <>
                      Không có bệnh nhân nào khớp <b className="text-[var(--ink-soft)]">“{search}”</b>.
                    </>
                  ) : tab === "A" ? (
                    "Chưa có bệnh nhân nhóm A trong đợt khám này."
                  ) : (
                    "Chưa có bệnh nhân nhóm B trong đợt khám này."
                  )}
                </p>
                {!search && (tab === "A" ? stats.soB : stats.soA) > 0 && (
                  <button
                    onClick={() => {
                      setTab(tab === "A" ? "B" : "A");
                      setSel(null);
                    }}
                    className="text-[12px] font-bold text-[var(--navy)] hover:underline cursor-pointer mt-2"
                  >
                    Nhóm {tab === "A" ? "B" : "A"} đang có {tab === "A" ? stats.soB : stats.soA} bệnh nhân →
                  </button>
                )}
              </div>
            ) : (
              rows.map((p, idx) => {
                const active = sel?.id === p.id;
                const diags = parseDiag(p.chanDoan);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      openDetail(p);
                      if (window.innerWidth < 1280) setShowList(false);
                    }}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer ${
                      active
                        ? "border-[var(--navy)] bg-[var(--navy-50)]/70 shadow-xs border-l-[3.5px] border-l-[var(--navy)]"
                        : "border-[var(--line-soft)] even:bg-white odd:bg-[#f8fafc] hover:bg-[#eef2ff] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13.5px] font-bold truncate ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>
                        <span className="font-mono text-[11px] opacity-60 mr-1">#{p.stt || idx + 1}</span>
                        {p.hoTen}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] shrink-0 bg-white/80 px-1.5 py-0.5 rounded border border-[var(--line-soft)]">
                        {p.maBN?.split("-").pop() || p.maBN}
                      </span>
                    </div>

                    <div className="text-[11.5px] text-[var(--mute)] mt-1 flex items-center justify-between">
                      <span className="truncate">{diags.join(", ") || "—"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 justify-between">
                      <StatusBadge label={statusOf(p.trangThai).label} cls={statusOf(p.trangThai).cls} sm />
                      {tab === "A" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--mute)]">
                          <CalendarClock className="w-3 h-3 text-[var(--teal)]" />
                          {fmtDate(p.ngayDieuTri) || "Chưa hẹn"}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[var(--mute)]">{p.followUpStatus || "Chưa LH"}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* COL 2 — Details Workspace */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-white overflow-hidden">
          {sel ? (
            <>
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* COMPACT PATIENT HEADER STRIP (FULL INFO - NO TRUNCATION) */}
                <div className="bg-[var(--surface-soft)] border-b border-[var(--line)] px-4 sm:px-5 py-3 shrink-0 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-serif font-bold text-[18px] sm:text-[19px] text-[var(--ink)] uppercase tracking-tight">
                        {sel.hoTen}
                      </h2>
                      <span className="font-mono font-bold text-[var(--navy)] bg-white px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--line)] text-xs shadow-2xs">
                        {sel.maBN}
                      </span>
                      {sel.maBNHIS && (
                        <span className="font-mono font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--teal)] text-xs shadow-2xs">
                          HIS: {sel.maBNHIS}
                        </span>
                      )}
                      {sel.nhom && (
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border shadow-2xs ${
                            sel.nhom === "A"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          Nhóm {sel.nhom}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[var(--ink-soft)] bg-white px-2 py-0.5 rounded-[var(--r-sm)] border border-[var(--line-soft)]">
                        {sel.gioiTinh} · {ageOf(sel)} tuổi
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => checkHisPatient(sel)}
                        disabled={checkingHis}
                        title="Đối chiếu HIS tự động"
                        className="px-2.5 sm:px-3 py-1 h-7 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingHis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>⚡ Đối chiếu HIS</>}
                      </button>
                      <button
                        onClick={() => openHisSearch(sel)}
                        title="Tìm & chọn ca mổ trong HIS thủ công"
                        className="px-2.5 sm:px-3 py-1 h-7 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-500" /> Tìm HIS
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-xs text-[var(--ink-soft)] pt-1.5 border-t border-[var(--line-soft)]/80">
                    {sel.cccd && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-semibold">CCCD:</span>
                        <span className="font-mono font-bold text-[var(--ink)]">{sel.cccd}</span>
                      </div>
                    )}
                    {sel.bhyt && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-semibold">BHYT:</span>
                        <span className="font-mono font-bold text-[var(--teal-deep)] bg-white px-1.5 py-0.5 rounded border border-[var(--line)]">
                          {sel.bhyt} <span className="text-[10px] text-[var(--teal)]">({bhytLevel(sel.bhyt)})</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--mute)] font-semibold">Điện thoại:</span>
                      {sel.sdt ? (
                        <a
                          href={`tel:${sel.sdt}`}
                          className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[var(--line)]"
                        >
                          <Phone className="w-3 h-3 text-[var(--teal)]" /> {sel.sdt}
                        </a>
                      ) : (
                        <span className="font-mono text-[var(--mute)]">—</span>
                      )}
                    </div>
                    <div className="flex items-start sm:items-center gap-1.5 flex-1 min-w-[280px]">
                      <span className="text-[var(--mute)] font-semibold shrink-0">Địa chỉ:</span>
                      <span className="font-medium text-[var(--ink)] leading-relaxed break-words">
                        {[sel.diaChi, sel.buoiKham?.xa].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-b border-[var(--line)] overflow-y-auto">
                  {/* NHẬT KÝ LIÊN HỆ */}
                  <div
                    data-tour="td-note"
                    className={`p-4 sm:p-6 xl:border-r border-[var(--line)] flex flex-col min-h-0 ${
                      tab === "A" ? "xl:w-[400px] shrink-0 bg-[var(--surface-bg)]" : "w-full"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <PhoneCall className="w-4 h-4 text-[var(--navy)]" />
                      <h3 className="font-bold text-[13px] uppercase tracking-wide">Nhật ký liên hệ</h3>
                    </div>
                    <div className="space-y-3.5">
                      {tab === "B" && (
                        <div>
                          <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">
                            Cập nhật trạng thái follow-up
                          </label>
                          <Dropdown
                            value={fstatus}
                            placeholder="Giữ nguyên trạng thái hiện tại"
                            mono={false}
                            options={FOLLOW}
                            onChange={setFstatus}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">
                          Thêm nhật ký mới
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          className="input-field resize-none"
                          placeholder="Nhập kết quả gọi điện, ý kiến bệnh nhân…"
                        />
                      </div>
                      <button
                        onClick={addNote}
                        disabled={savingNote || !note.trim()}
                        className="btn btn-secondary w-full py-2.5 font-bold border border-[var(--line-strong)] shadow-xs bg-white hover:bg-[var(--surface-hover)] cursor-pointer disabled:opacity-50"
                      >
                        {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--navy)]" />}
                        <span>Ghi nhận liên hệ</span>
                      </button>
                      <div className="pt-4 mt-4 border-t border-[var(--line)] flex-1 flex flex-col min-h-0">
                        <h4 className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--mute)] mb-2.5 shrink-0">
                          Lịch sử liên hệ
                        </h4>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {(sel.nhatKy || []).length === 0 ? (
                            <div className="text-[12.5px] text-[var(--mute)] py-4 text-center">Chưa có lịch sử liên hệ.</div>
                          ) : (
                            sel.nhatKy!.map((n) => (
                              <div
                                key={n.id}
                                className="text-[13px] bg-white border border-[var(--line-soft)] rounded-lg p-3 shadow-2xs"
                              >
                                <div className="text-[var(--ink)] leading-snug">{n.noiDung}</div>
                                <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                                  <span className="font-semibold text-[var(--navy)]">{n.nguoiGoi?.hoTen}</span>
                                  <span className="font-mono">{fmtTime(n.ngay)}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIẾP NHẬN & ĐIỀU TRỊ (CHỈ NHÓM A) */}
                  {tab === "A" && (
                    <div data-tour="td-treat" className="flex-1 p-4 sm:p-6 relative flex flex-col min-h-0">
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                        <ClipboardList className="w-4 h-4 text-[var(--teal-deep)]" />
                        <h3 className="font-bold text-[13px] uppercase tracking-wide">Tiếp nhận & Điều trị tại BV</h3>
                      </div>

                      <div className="space-y-5">
                        <div
                          className="flex items-center gap-3 p-3.5 bg-[var(--surface-bg)] border border-[var(--line-strong)] rounded-xl cursor-pointer hover:bg-white transition-colors"
                          onClick={() => setF((s) => ({ ...s, daDon: !s.daDon }))}
                        >
                          <input
                            type="checkbox"
                            checked={f.daDon}
                            onChange={(e) => setF((s) => ({ ...s, daDon: e.target.checked }))}
                            className="w-5 h-5 rounded text-[var(--teal)] focus:ring-[var(--teal-soft)] cursor-pointer"
                          />
                          <label className="font-bold text-[14px] cursor-pointer select-none text-[var(--ink)]">
                            Bệnh nhân ĐÃ ĐẾN BỆNH VIỆN
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <DateField
                            label="Ngày mổ thực tế"
                            value={f.ngayMoThucTe}
                            onChange={(v) => setF((s) => ({ ...s, ngayMoThucTe: v }))}
                          />
                          <div>
                            <label className={labelCls}>Số tiền thực thu (VNĐ)</label>
                            <input
                              type="number"
                              placeholder="Nhập số tiền..."
                              value={f.soTienThucThu}
                              onChange={(e) => setF((s) => ({ ...s, soTienThucThu: e.target.value }))}
                              className="input-field"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelCls}>Trạng thái điều trị</label>
                            <ChoiceRow
                              options={TT_DIEU_TRI}
                              value={f.trangThaiDieuTri}
                              onChange={(v) => setF((s) => ({ ...s, trangThaiDieuTri: v }))}
                              render={(o) => o}
                            />
                          </div>
                          <DateField
                            label="Hẹn tái khám"
                            value={f.ngayTaiKham}
                            onChange={(v) => setF((s) => ({ ...s, ngayTaiKham: v }))}
                          />
                          <div className="md:col-span-2">
                            <label className={labelCls}>Ghi chú (nhóm tài liệu mặt 2)</label>
                            <textarea
                              rows={2}
                              placeholder="Sức khỏe, thuốc, dặn dò..."
                              value={f.ghiChuMat2}
                              onChange={(e) => setF((s) => ({ ...s, ghiChuMat2: e.target.value }))}
                              className="input-field resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Unified Action Bar */}
              <div className="px-2 sm:px-4 py-1.5 sm:py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-30 flex items-center justify-between gap-1.5 sm:gap-2 shadow-lg shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  {/* Nút mở danh sách bệnh nhân trên mobile chuẩn theo style DS */}
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="xl:hidden h-8 px-2.5 rounded-lg bg-[#002b7f] hover:bg-[var(--navy-deep)] text-white font-bold text-[12px] flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span className="font-extrabold text-[12px] text-white">DS</span>
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#e11d48] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {rows.length}
                    </span>
                  </button>

                  {/* Bộ phím chuyển ca Trước / Sau nhanh cho Mobile */}
                  <div className="xl:hidden flex items-center gap-0.5 border border-[var(--line)] rounded-lg p-0.5 bg-[var(--surface-soft)] shrink-0">
                    <button
                      type="button"
                      onClick={() => prevPatient && openDetail(prevPatient)}
                      disabled={!prevPatient}
                      className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      title="Ca trước"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[9.5px] sm:text-[10px] font-mono font-bold px-0.5 text-[var(--mute)]">
                      {curPatientIndex >= 0 ? `${curPatientIndex + 1}/${rows.length}` : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => nextPatient && openDetail(nextPatient)}
                      disabled={!nextPatient}
                      className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      title="Ca tiếp"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="hidden md:inline-flex text-[11px] sm:text-[12px] items-center gap-1 min-w-0 truncate">
                    {tab === "A" && dirtyDieuTri ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--amber)] truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse shrink-0" /> Chưa lưu điều trị
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--mute)] truncate">
                        <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" /> Đã lưu
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tab === "A" && (
                    <button
                      type="button"
                      onClick={saveDieuTri}
                      disabled={savingDieuTri || !dirtyDieuTri}
                      className="btn btn-primary px-3 sm:px-6 py-1.5 font-bold h-8 sm:h-9 text-[11px] sm:text-[13px] shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {savingDieuTri ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                      <span>Lưu điều trị</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-6 py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center border border-[var(--navy-100)] shadow-2xs">
                  <PhoneCall className="w-7 h-7 text-[var(--teal-deep)]" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <div className="font-bold text-[15px] text-[var(--ink)]">
                    {rows.length > 0 ? "Chưa chọn bệnh nhân" : `Chưa có ca nhóm ${tab}`}
                  </div>
                  <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                    {rows.length > 0
                      ? `Đợt khám có ${rows.length} bệnh nhân nhóm ${tab}. Bấm nút bên dưới để mở danh sách chọn ca.`
                      : `Đợt khám này chưa có bệnh nhân nào thuộc nhóm ${tab}.`}
                  </div>
                </div>
                {rows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-2 cursor-pointer active:scale-95"
                  >
                    <Users className="w-4 h-4 text-[var(--teal)]" />
                    <span>Mở danh sách bệnh nhân ({rows.length})</span>
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
                    {rows.length}
                  </span>
                </button>
                <span className="text-[11.5px] text-[var(--mute)] font-medium">Chưa chọn ca</span>
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={<>Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span></>}
        subtitle="Lấy danh sách bệnh nhân để theo dõi & chăm sóc"
        icon={CalendarDays}
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
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white pl-10 pr-9 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
            />
            {bkSearch && (
              <button
                type="button"
                onClick={() => setBkSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
                className={`w-full text-left p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-center gap-4 border cursor-pointer ${
                  active
                    ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]"
                    : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors ${
                    active
                      ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] border-transparent text-white shadow-xs"
                      : "bg-[var(--navy-50)] border-[var(--navy-100)] text-[var(--navy)]"
                  }`}
                >
                  {active ? <Check className="w-5 h-5 text-[var(--teal)]" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px] truncate text-[var(--ink)]" title={fmtBuoiKhamName(b)}>
                      {fmtBuoiKhamName(b)}
                    </span>
                    <span className="font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] shrink-0 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[13px] text-[var(--mute)] mt-1.5 flex items-center gap-4 font-medium">
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
                </div>
              </button>
            );
          })}
          {filteredBks.length === 0 && (
            <div className="text-center py-14 flex flex-col items-center justify-center text-[var(--mute)]">
              <div className="w-12 h-12 rounded-[var(--r-lg)] bg-white shadow-xs border border-[var(--line)] flex items-center justify-center mb-4 text-[var(--mute)]">
                <Search className="w-6 h-6" />
              </div>
              <div className="font-bold text-[15px] text-[var(--ink)] font-serif">Không tìm thấy đợt khám</div>
              <div className="text-[13px] mt-1 text-[var(--mute)]">Thử thay đổi từ khóa tìm kiếm của bạn.</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal tìm HIS thủ công */}
      <Modal
        open={hisSearchOpen}
        onClose={() => setHisSearchOpen(false)}
        title={<>Tìm <span className="italic font-normal text-[var(--teal)]">HIS thủ công</span></>}
        subtitle="Khi đối chiếu tự động không khớp — tự tìm & chọn đúng ca mổ để xác nhận"
        icon={Search}
        maxWidth="max-w-[720px]"
        noPadding
      >
        <div className="p-5 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input
                autoFocus
                value={hisQuery}
                onChange={(e) => setHisQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runHisSearch();
                  }
                }}
                placeholder="Nhập CCCD / Mã thẻ BHYT / Họ tên / Mã HIS…"
                className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white pl-10 pr-9 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
              />
              {hisQuery && (
                <button
                  type="button"
                  onClick={() => setHisQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={runHisSearch}
              disabled={hisSearching || !hisQuery.trim()}
              className="btn btn-primary px-5 py-2.5 font-bold h-11 rounded-[var(--r-md)] flex items-center gap-2 cursor-pointer"
            >
              {hisSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tìm kiếm</span>
            </button>
          </div>

          <div className="mt-4 max-h-[380px] overflow-y-auto space-y-2">
            {hisSearching ? (
              <div className="py-12 flex flex-col items-center justify-center text-[var(--mute)] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" />
                <span className="text-[13px]">Đang tra cứu trên máy chủ HIS...</span>
              </div>
            ) : hisSearched && hisResults.length === 0 ? (
              <div className="py-10 text-center text-[var(--mute)] text-[13px]">
                Không tìm thấy kết quả nào phù hợp trên HIS.
              </div>
            ) : (
              hisResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 border border-[var(--line-soft)] rounded-lg hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2 flex-wrap">
                      <span>{item.hoTen}</span>
                      <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] bg-white px-2 py-0.5 rounded border border-[var(--line-soft)]">
                        {item.maHIS}
                      </span>
                      {item.namSinh && <span className="text-[12px] text-[var(--mute)]">({item.namSinh})</span>}
                    </div>
                    <div className="text-[12px] text-[var(--mute)] mt-1 flex items-center gap-3 flex-wrap">
                      {item.cccd && <span>CCCD: <b className="text-[var(--ink)] font-mono">{item.cccd}</b></span>}
                      {item.bhyt && <span>BHYT: <b className="text-blue-700 font-mono">{item.bhyt}</b></span>}
                      {item.ngayMo && <span>Ngày mổ: {new Date(item.ngayMo).toLocaleDateString("vi-VN")}</span>}
                      {item.khoaMo && <span>Khoa: {item.khoaMo}</span>}
                    </div>
                    {item.chanDoan && (
                      <div className="text-[12px] text-[var(--rose)] mt-0.5 truncate">CĐ: {item.chanDoan}</div>
                    )}
                  </div>
                  <button
                    onClick={() => confirmHisSurgery(item)}
                    disabled={hisLinking === item.maHIS}
                    className="btn btn-primary px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {hisLinking === item.maHIS ? <Loader2 className="w-3 h-3 animate-spin" /> : "Xác nhận"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/layout/Modal";
import {
  Users, Search, Calendar, MapPin, UserCheck, Loader2,
  Stethoscope, Eye, CheckCircle2, Clock, Phone, CreditCard,
  FileSpreadsheet, Sparkles, Filter, X, ChevronDown
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, ageOf, parseDiag, type HoSo } from "@/lib/csr";
import { parseDoctorList } from "./DoctorAutocomplete";
import { useToast } from "@/components/providers/ToastProvider";

interface BuoiKhamSummary {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  bacSiKham?: string | null;
  ghiChu?: string | null;
  coSo?: { ten: string };
  _count?: { hoSo: number };
}

interface BuoiKhamPatientsModalProps {
  open: boolean;
  onClose: () => void;
  buoiKham: BuoiKhamSummary | null;
}

export default function BuoiKhamPatientsModal({
  open,
  onClose,
  buoiKham,
}: BuoiKhamPatientsModalProps) {
  const { addToast } = useToast();
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | "A" | "B" | "DA_MO" | "CHUA_MO">("ALL");
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [exportMenuOpen]);

  const handleExport = async (format: "khamSucKhoe" | "default" = "khamSucKhoe") => {
    if (!buoiKham?.id || exportingFormat) return;
    setExportingFormat(format);
    try {
      const res = await fetch(`/api/csr/export?buoiKhamId=${encodeURIComponent(buoiKham.id)}&format=${format}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể xuất file Excel");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disp = res.headers.get("Content-Disposition");
      let filename = "";
      if (disp) {
        const matchStar = disp.match(/filename\*=UTF-8''([^;]+)/i);
        if (matchStar) filename = decodeURIComponent(matchStar[1]);
        else {
          const matchPlain = disp.match(/filename="?([^";]+)"?/i);
          if (matchPlain) filename = matchPlain[1];
        }
      }
      if (!filename) {
        const dateStr = buoiKham.ngayKham ? new Date(buoiKham.ngayKham).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const cleanXa = (buoiKham.xa || "KhamMat").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_");
        filename = format === "khamSucKhoe"
          ? `Kham_Suc_Khoe_${cleanXa}_${dateStr}.xlsx`
          : `Danh_Sach_Kham_Mat_${cleanXa}_${dateStr}.xlsx`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({
        type: "success",
        title: "Xuất Excel thành công",
        message: format === "khamSucKhoe"
          ? `Đã tải file khám sức khỏe ${buoiKham.xa || fmtBuoiKhamName(buoiKham)} (mẫu 101 cột)`
          : `Đã tải file danh sách bệnh nhân ${buoiKham.xa || fmtBuoiKhamName(buoiKham)} (mẫu Google Sheet)`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Lỗi xuất file",
        message: err instanceof Error ? err.message : "Có lỗi xảy ra khi xuất file Excel",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  useEffect(() => {
    if (!open || !buoiKham?.id) {
      setPatients([]);
      setSearch("");
      setGroupFilter("ALL");
      return;
    }

    let isCancelled = false;
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/csr/hoso?buoiKhamId=${encodeURIComponent(buoiKham.id)}`);
        if (res.ok) {
          const data: HoSo[] = await res.json();
          if (!isCancelled) setPatients(data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách bệnh nhân đợt khám:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchPatients();
    return () => {
      isCancelled = true;
    };
  }, [open, buoiKham?.id]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let nhomA = 0;
    let nhomB = 0;
    let daMo = 0;
    let chuaMo = 0;

    patients.forEach((p) => {
      if (p.nhom === "A") {
        nhomA++;
        if (p.trangThai === "DaMo" || p.ngayMoThucTe) daMo++;
        else chuaMo++;
      } else if (p.nhom === "B") {
        nhomB++;
      }
    });

    return { total: patients.length, nhomA, nhomB, daMo, chuaMo };
  }, [patients]);

  // Danh sách lọc
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match = [
          p.hoTen,
          p.maBN,
          p.maBNHIS,
          p.cccd,
          p.sdt,
          p.diaChi,
          p.bacSiChiDinh,
          String(p.stt),
        ].some((s) => (s || "").toLowerCase().includes(q));
        if (!match) return false;
      }

      if (groupFilter === "A") return p.nhom === "A";
      if (groupFilter === "B") return p.nhom === "B";
      if (groupFilter === "DA_MO") return p.trangThai === "DaMo" || Boolean(p.ngayMoThucTe);
      if (groupFilter === "CHUA_MO") return p.nhom === "A" && p.trangThai !== "DaMo" && !p.ngayMoThucTe;

      return true;
    });
  }, [patients, search, groupFilter]);

  if (!buoiKham) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span>Hồ sơ bệnh nhân</span>
          <span className="font-mono text-xs font-bold text-[#031da6] bg-[#eef2ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
            {fmtBuoiKhamCode(buoiKham.id)}
          </span>
          <span className="text-sm font-normal text-[#64748b]">({fmtBuoiKhamName(buoiKham)})</span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-3 text-xs text-[#64748b] flex-wrap mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#031da6]" />
            <b className="text-[#334155]">{fmtDate(buoiKham.ngayKham)}</b>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#64748b]" />
            <span>{buoiKham.diaDiem}</span>
          </span>
          {buoiKham.bacSiKham && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#047857] font-semibold bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">
                <UserCheck className="w-3.5 h-3.5 text-[#047857]" />
                <span>{buoiKham.bacSiKham}</span>
              </span>
            </>
          )}
        </div>
      }
      icon={Users}
      maxWidth="w-[95vw] max-w-[95vw] h-[92vh] max-h-[92vh]"
      noPadding
      bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
        {/* Toolbar & Filter Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px] max-w-[380px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, SĐT, CCCD, mã BN..."
              className="w-full h-9 pl-9 pr-8 text-[13px] bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-900 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setGroupFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                groupFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter("A")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupFilter === "A"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
              }`}
            >
              <span>Nhóm A (Chỉ định mổ)</span>
              <span className="font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[11px] font-bold">{stats.nhomA}</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter("B")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupFilter === "B"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
              }`}
            >
              <span>Nhóm B (Theo dõi)</span>
              <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[11px] font-bold">{stats.nhomB}</span>
            </button>
            {stats.daMo > 0 && (
              <button
                type="button"
                onClick={() => setGroupFilter("DA_MO")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === "DA_MO"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <span>Đã mổ</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px] font-bold">{stats.daMo}</span>
              </button>
            )}

            {/* Nút Xuất Excel với Menu chọn 2 mẫu */}
            <div className="relative ml-auto" ref={exportMenuRef}>
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleExport("khamSucKhoe")}
                  disabled={!!exportingFormat || patients.length === 0}
                  className="px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-[#018a7f] hover:bg-[#016e65] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Xuất file Excel theo mẫu Khám Sức Khỏe (101 cột chuẩn HIS)"
                >
                  {exportingFormat === "khamSucKhoe" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#e6faf7]" />
                  )}
                  <span>Xuất Excel (Khám SK 101 cột)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  disabled={!!exportingFormat || patients.length === 0}
                  className="px-1.5 py-1.5 text-xs font-bold transition-all flex items-center justify-center cursor-pointer bg-[#017a70] hover:bg-[#01635b] text-white border-l border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tùy chọn mẫu xuất Excel"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#cbd5e1] rounded-xl shadow-xl p-1 z-50 animate-dropdown text-[#0f172a]">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExport("khamSucKhoe");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#018a7f] hover:bg-[#e6faf7] transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#02b8a9] shrink-0" />
                    <div>
                      <div className="font-bold">Mẫu Khám Sức Khỏe (101 cột)</div>
                      <div className="text-[10.5px] text-[#64748b] font-normal">Mẫu chuẩn nộp HIS & trạm y tế</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExport("default");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#64748b] shrink-0" />
                    <div>
                      <div className="font-bold">Mẫu Google Sheet (25 cột)</div>
                      <div className="text-[10.5px] text-[#94a3b8] font-normal">Mẫu danh sách khám sàng lọc</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content — Single Scroll Container */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-sm font-bold text-slate-800">Đang tải danh sách hồ sơ bệnh nhân...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2.5">
              <Users className="w-10 h-10 text-slate-300" />
              <div className="font-bold text-[14px] text-slate-800">
                {patients.length === 0 ? "Chưa có bệnh nhân nào trong đợt khám này" : "Không tìm thấy bệnh nhân phù hợp"}
              </div>
              <div className="text-xs text-slate-400">
                {patients.length === 0 ? "Bệnh nhân sẽ xuất hiện tại đây khi được tiếp nhận vào đợt khám." : "Thử đổi từ khóa tìm kiếm hoặc bấm tab Tất cả."}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1180px]">
              <thead className="bg-slate-100/90 backdrop-blur-xs text-slate-700 text-[11px] font-bold uppercase tracking-wider font-mono sticky top-0 z-10 border-b border-slate-200 select-none shadow-2xs">
                <tr className="[&>th]:py-2.5 [&>th]:px-3 [&>th]:whitespace-nowrap">
                  <th className="w-12 text-center text-slate-500">STT</th>
                  <th className="w-28">Mã BN</th>
                  <th className="min-w-[160px]">Họ và tên</th>
                  <th className="w-20 text-center">Tuổi</th>
                  <th className="w-24 text-center">Giới tính</th>
                  <th className="min-w-[200px]">Thông tin liên hệ</th>
                  <th className="w-32 text-center">Thị lực</th>
                  <th className="min-w-[240px]">Chẩn đoán mắt</th>
                  <th className="min-w-[180px] text-center">Phân nhóm & Hướng xử trí</th>
                  <th className="min-w-[150px]">Bác sĩ khám</th>
                  <th className="w-32 text-center pr-4">Trạng thái mổ</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700 divide-y divide-slate-200/70 bg-white">
                {filtered.map((p, idx) => {
                  const isNhomA = p.nhom === "A";
                  const isNhomB = p.nhom === "B";
                  const isOperated = p.trangThai === "DaMo" || Boolean(p.ngayMoThucTe);

                  // Chẩn đoán tổng hợp
                  const cdMP = Array.isArray(p.chanDoanMP) ? p.chanDoanMP.join(", ") : (p.chanDoanMP || "");
                  const cdMT = Array.isArray(p.chanDoanMT) ? p.chanDoanMT.join(", ") : (p.chanDoanMT || "");
                  const cdAll = parseDiag(p.chanDoan).join(", ") || p.chanDoanKhac || "";

                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/40 even:bg-slate-50/50 transition-colors">
                      {/* STT */}
                      <td className="py-2.5 px-3 text-center align-middle font-mono font-bold text-indigo-700 text-xs">
                        {p.stt ? `#${p.stt}` : String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Mã BN */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <div className="font-mono font-bold text-[12px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-block shadow-2xs">
                          {p.maBN || p.id.slice(-6)}
                        </div>
                        {p.maBNHIS && (
                          <div className="font-mono text-[10px] text-emerald-700 font-bold mt-0.5">
                            HIS: {p.maBNHIS}
                          </div>
                        )}
                      </td>

                      {/* Họ tên */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <div className={`font-bold text-[13.5px] ${
                          (p.bhyt && p.bhyt.trim().length > 0) || (p.mucHuongBHYT != null && p.mucHuongBHYT > 0)
                            ? "text-emerald-800 font-extrabold"
                            : "text-slate-900"
                        }`}>
                          {p.hoTen}
                        </div>
                        {p.bhyt && (
                          <span className="inline-block mt-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            BHYT
                          </span>
                        )}
                      </td>

                      {/* Tuổi */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap font-mono font-bold text-slate-900 text-[13px]">
                        {ageOf(p) ? ageOf(p) : p.namSinh ? (new Date().getFullYear() - p.namSinh) : "—"}
                      </td>

                      {/* Giới tính */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap text-[12px] font-semibold text-slate-700">
                        {p.gioiTinh || "—"}
                      </td>

                      {/* Liên hệ & Địa chỉ */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="text-[12px] flex items-center gap-1 text-slate-700">
                          {p.sdt ? (
                            <span className="font-mono font-bold text-indigo-700 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              <Phone className="w-3 h-3 text-indigo-600" /> {p.sdt}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có SĐT</span>
                          )}
                        </div>
                        <div className="text-[11.5px] text-slate-500 mt-0.5 truncate max-w-[240px]" title={p.diaChi || ""}>
                          {p.diaChi || "—"}
                        </div>
                      </td>

                      {/* Thị lực */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11.5px] font-mono shadow-2xs">
                          <span title="Thị lực mắt phải">MP: <b className="text-slate-900 font-bold">{p.thiLucMP || "—"}</b></span>
                          <span className="text-slate-300">|</span>
                          <span title="Thị lực mắt trái">MT: <b className="text-slate-900 font-bold">{p.thiLucMT || "—"}</b></span>
                        </div>
                      </td>

                      {/* Chẩn đoán */}
                      <td className="py-2.5 px-3 align-middle">
                        {cdMP || cdMT ? (
                          <div className="space-y-1 text-[11.5px]">
                            {cdMP && (
                              <div className="flex items-start gap-1">
                                <span className="font-bold text-indigo-700 shrink-0 text-[10.5px] bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">MP</span>
                                <span className="text-slate-900 font-medium leading-snug">{cdMP}</span>
                              </div>
                            )}
                            {cdMT && (
                              <div className="flex items-start gap-1">
                                <span className="font-bold text-slate-600 shrink-0 text-[10.5px] bg-slate-100 px-1 py-0.2 rounded border border-slate-300">MT</span>
                                <span className="text-slate-900 font-medium leading-snug">{cdMT}</span>
                              </div>
                            )}
                          </div>
                        ) : cdAll ? (
                          <div className="text-[11.5px] text-slate-900 font-medium leading-snug">
                            {cdAll}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11.5px]">Chưa chẩn đoán</span>
                        )}
                      </td>

                      {/* Phân nhóm & Hướng xử trí */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        {isNhomA ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              Nhóm A · Chỉ định mổ
                            </span>
                            <span className="text-[10.5px] text-slate-500 font-medium mt-0.5">{p.huongXuTri || "Phẫu thuật"}</span>
                          </div>
                        ) : isNhomB ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                              Nhóm B · Theo dõi
                            </span>
                            <span className="text-[10.5px] text-slate-500 font-medium mt-0.5">{p.huongXuTri || "Khám định kỳ"}</span>
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-slate-600 font-medium">
                            {p.huongXuTri || p.khuyenNghi || "—"}
                          </span>
                        )}
                      </td>

                      {/* Bác sĩ khám */}
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        {p.bacSiChiDinh ? (
                          <span className="text-[11.5px] text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{p.bacSiChiDinh}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11.5px]">—</span>
                        )}
                      </td>

                      {/* Trạng thái mổ */}
                      <td className="py-2.5 px-3 pr-4 align-middle text-center whitespace-nowrap">
                        {isOperated ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã mổ
                            </span>
                            {p.ngayMoThucTe && (
                              <span className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">
                                {fmtDate(p.ngayMoThucTe)}
                              </span>
                            )}
                          </div>
                        ) : isNhomA ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" /> Chờ mổ
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium shrink-0">
          <div>
            Hiển thị <b className="text-slate-900">{filtered.length}</b> / <b className="text-indigo-700">{patients.length}</b> bệnh nhân
            {stats.nhomA > 0 && <span className="ml-2 text-rose-700 font-bold">• Nhóm A: {stats.nhomA}</span>}
            {stats.nhomB > 0 && <span className="ml-2 text-amber-700 font-bold">• Nhóm B: {stats.nhomB}</span>}
            {stats.daMo > 0 && <span className="ml-2 text-emerald-700 font-bold">• Đã mổ: {stats.daMo}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary py-1.5 px-4 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

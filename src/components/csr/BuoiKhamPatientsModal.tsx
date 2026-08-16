"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/layout/Modal";
import {
  Users, Search, Calendar, MapPin, UserCheck, Loader2,
  Stethoscope, Eye, CheckCircle2, Clock, Phone, CreditCard,
  FileSpreadsheet, Sparkles, Filter, X
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, ageOf, parseDiag, type HoSo } from "@/lib/csr";
import { parseDoctorList } from "./DoctorAutocomplete";

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
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | "A" | "B" | "DA_MO" | "CHUA_MO">("ALL");

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
      maxWidth="max-w-[96vw] 2xl:max-w-[1680px]"
      noPadding
    >
      <div className="flex flex-col h-[88vh] max-h-[960px] bg-white">
        {/* Toolbar & Filter Tabs */}
        <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between gap-4 flex-wrap shrink-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px] max-w-[380px]">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, SĐT, CCCD, mã BN..."
              className="w-full h-10 pl-10 pr-9 text-[13.5px] bg-white border border-[#cbd5e1] rounded-xl outline-hidden focus:border-[#031da6] focus:ring-2 focus:ring-[#031da6]/15 transition-all text-[#0f172a] shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setGroupFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                groupFilter === "ALL"
                  ? "bg-[#031da6] text-white shadow-xs"
                  : "bg-white text-[#475569] border border-[#cbd5e1] hover:bg-[#f1f5f9]"
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter("A")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupFilter === "A"
                  ? "bg-[#e11d48] text-white shadow-xs"
                  : "bg-white text-[#e11d48] border border-[#fecdd3] hover:bg-[#fff1f2]"
              }`}
            >
              <span>Nhóm A (Chỉ định mổ)</span>
              <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-[11px] font-black">{stats.nhomA}</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter("B")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupFilter === "B"
                  ? "bg-[#d97706] text-white shadow-xs"
                  : "bg-white text-[#d97706] border border-[#fed7aa] hover:bg-[#fffbeb]"
              }`}
            >
              <span>Nhóm B (Theo dõi)</span>
              <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-[11px] font-black">{stats.nhomB}</span>
            </button>
            {stats.daMo > 0 && (
              <button
                type="button"
                onClick={() => setGroupFilter("DA_MO")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === "DA_MO"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "bg-white text-[#059669] border border-[#a7f3d0] hover:bg-[#ecfdf5]"
                }`}
              >
                <span>Đã mổ</span>
                <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-[11px] font-black">{stats.daMo}</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#64748b] gap-3">
              <Loader2 className="w-9 h-9 text-[#031da6] animate-spin" />
              <div className="text-sm font-bold text-[#0f172a]">Đang tải danh sách hồ sơ bệnh nhân...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#64748b] gap-2.5">
              <Users className="w-12 h-12 text-[#cbd5e1]" />
              <div className="font-bold text-[15px] text-[#0f172a]">
                {patients.length === 0 ? "Chưa có bệnh nhân nào trong đợt khám này" : "Không tìm thấy bệnh nhân phù hợp"}
              </div>
              <div className="text-xs text-[#94a3b8]">
                {patients.length === 0 ? "Bệnh nhân sẽ xuất hiện tại đây khi được tiếp nhận vào đợt khám." : "Thử đổi từ khóa tìm kiếm hoặc bấm tab Tất cả."}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1120px]">
              <thead className="bg-[#f1f5f9] text-[#1e293b] text-[11.5px] font-extrabold uppercase tracking-[0.06em] font-mono sticky top-0 z-10 border-b border-[#cbd5e1] select-none shadow-2xs">
                <tr className="[&>th]:py-3.5 [&>th]:px-4 [&>th]:whitespace-nowrap">
                  <th className="w-14 text-center text-[#64748b]">STT</th>
                  <th className="w-36">Mã BN</th>
                  <th className="min-w-[200px]">Họ và tên</th>
                  <th className="min-w-[240px]">Thông tin liên hệ</th>
                  <th className="w-40 text-center">Thị lực</th>
                  <th className="min-w-[260px]">Chẩn đoán mắt</th>
                  <th className="min-w-[200px] text-center">Phân nhóm & Hướng xử trí</th>
                  <th className="min-w-[180px]">Bác sĩ khám</th>
                  <th className="w-36 text-center pr-5">Trạng thái mổ</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-[#334155] divide-y divide-[#e2e8f0] bg-white">
                {filtered.map((p, idx) => {
                  const isNhomA = p.nhom === "A";
                  const isNhomB = p.nhom === "B";
                  const isOperated = p.trangThai === "DaMo" || Boolean(p.ngayMoThucTe);

                  // Chẩn đoán tổng hợp
                  const cdMP = Array.isArray(p.chanDoanMP) ? p.chanDoanMP.join(", ") : (p.chanDoanMP || "");
                  const cdMT = Array.isArray(p.chanDoanMT) ? p.chanDoanMT.join(", ") : (p.chanDoanMT || "");
                  const cdAll = parseDiag(p.chanDoan).join(", ") || p.chanDoanKhac || "";

                  return (
                    <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center align-middle font-mono font-bold text-[#031da6] text-xs">
                        {p.stt ? `#${p.stt}` : String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Mã BN */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="font-mono font-bold text-[12.5px] text-[#0f172a] bg-[#f1f5f9] px-2.5 py-1 rounded-md border border-[#cbd5e1] inline-block shadow-2xs">
                          {p.maBN || p.id.slice(-6)}
                        </div>
                        {p.maBNHIS && (
                          <div className="font-mono text-[10.5px] text-emerald-700 font-bold mt-1">
                            HIS: {p.maBNHIS}
                          </div>
                        )}
                      </td>

                      {/* Họ tên + Tuổi + Giới tính */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-[#0f172a] text-[14px]">
                          {p.hoTen}
                        </div>
                        <div className="text-[11.5px] text-[#64748b] flex items-center gap-2 mt-1">
                          <span className="font-semibold">{p.gioiTinh || "—"}</span>
                          <span>•</span>
                          <span>{ageOf(p) ? `${ageOf(p)} tuổi` : p.namSinh ? String(p.namSinh) : "—"}</span>
                        </div>
                      </td>

                      {/* Liên hệ & Địa chỉ */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-[12.5px] flex items-center gap-1 text-[#334155]">
                          {p.sdt ? (
                            <span className="font-mono font-bold text-[#031da6] flex items-center gap-1 bg-[#eef2ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
                              <Phone className="w-3 h-3 text-[#031da6]" /> {p.sdt}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] italic text-xs">Chưa có SĐT</span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#64748b] mt-1 line-clamp-2 max-w-[280px]" title={[p.diaChi, p.khuPho, p.xaPhuong].filter(Boolean).join(", ")}>
                          {[p.diaChi, p.xaPhuong].filter(Boolean).join(", ") || "—"}
                        </div>
                      </td>

                      {/* Thị lực */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5 bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-mono font-medium shadow-2xs">
                          <span title="Thị lực mắt phải">MP: <b className="text-[#0f172a] font-bold">{p.thiLucMP || "—"}</b></span>
                          <span className="text-[#cbd5e1]">|</span>
                          <span title="Thị lực mắt trái">MT: <b className="text-[#0f172a] font-bold">{p.thiLucMT || "—"}</b></span>
                        </div>
                      </td>

                      {/* Chẩn đoán */}
                      <td className="py-3.5 px-4 align-middle">
                        {cdMP || cdMT ? (
                          <div className="space-y-1.5 text-xs">
                            {cdMP && (
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold text-[#031da6] shrink-0 text-[11px] bg-[#eef2ff] px-1.5 py-0.5 rounded border border-[#c7d2fe]">MP</span>
                                <span className="text-[#0f172a] font-medium leading-tight">{cdMP}</span>
                              </div>
                            )}
                            {cdMT && (
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold text-[#475569] shrink-0 text-[11px] bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#cbd5e1]">MT</span>
                                <span className="text-[#0f172a] font-medium leading-tight">{cdMT}</span>
                              </div>
                            )}
                          </div>
                        ) : cdAll ? (
                          <div className="text-xs text-[#0f172a] font-medium leading-tight">
                            {cdAll}
                          </div>
                        ) : (
                          <span className="text-[#94a3b8] italic text-xs">Chưa chẩn đoán</span>
                        )}
                      </td>

                      {/* Phân nhóm & Hướng xử trí */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        {isNhomA ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] shadow-2xs">
                              Nhóm A · Chỉ định mổ
                            </span>
                            <span className="text-[11px] text-[#64748b] font-medium mt-1">{p.huongXuTri || "Phẫu thuật"}</span>
                          </div>
                        ) : isNhomB ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#fffbeb] text-[#d97706] border border-[#fed7aa] shadow-2xs">
                              Nhóm B · Theo dõi
                            </span>
                            <span className="text-[11px] text-[#64748b] font-medium mt-1">{p.huongXuTri || "Khám định kỳ"}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748b] font-medium">
                            {p.huongXuTri || p.khuyenNghi || "—"}
                          </span>
                        )}
                      </td>

                      {/* Bác sĩ khám */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {p.bacSiChiDinh ? (
                          <span className="text-xs text-[#047857] font-bold flex items-center gap-1.5 bg-[#ecfdf5] px-2.5 py-1 rounded-md border border-[#a7f3d0]">
                            <UserCheck className="w-3.5 h-3.5 text-[#047857]" />
                            <span>{p.bacSiChiDinh}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#94a3b8] italic">—</span>
                        )}
                      </td>

                      {/* Trạng thái mổ */}
                      <td className="py-3.5 px-4 pr-5 align-middle text-center whitespace-nowrap">
                        {isOperated ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã mổ
                            </span>
                            {p.ngayMoThucTe && (
                              <span className="text-[10.5px] font-mono font-semibold text-[#64748b] mt-1">
                                {fmtDate(p.ngayMoThucTe)}
                              </span>
                            )}
                          </div>
                        ) : isNhomA ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" /> Chờ mổ
                          </span>
                        ) : (
                          <span className="text-[#cbd5e1] font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-medium shrink-0">
          <div>
            Hiển thị <b className="text-[#0f172a]">{filtered.length}</b> / <b className="text-[#031da6]">{patients.length}</b> bệnh nhân
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

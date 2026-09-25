"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  PlusCircle,
  Stethoscope,
  Tag,
  Zap,
  HeartPulse,
  MessageSquare,
  Edit3,
  RefreshCw,
  Building2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { fmtDate, parseDiag, statusOf, bhytLevel, ageOf } from "@/lib/csr";
import { StatusBadge } from "@/components/csr/fields";
import { motion, AnimatePresence } from "framer-motion";

/* ── Khối trình bày dùng chung cho modal hồ sơ (chuẩn Visihub: thẻ trắng, nhãn trái – giá trị phải) ── */
function InfoSection({ icon: Icon, title, aside, children }: { icon: any; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="h-full flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-xs)] overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[var(--navy-soft)] text-[var(--navy)] flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-[13px] font-bold text-[var(--ink)] truncate">{title}</h3>
        </div>
        {aside}
      </header>
      <dl className="flex-1 px-3.5 py-0.5 divide-y divide-[var(--line-soft)]">{children}</dl>
    </section>
  );
}

function InfoRow({ label, children, mono }: { label: string; children?: React.ReactNode; mono?: boolean }) {
  const empty = children === null || children === undefined || children === "" || children === "—";
  return (
    <div className="grid grid-cols-[108px_1fr] gap-2.5 py-1.5 items-baseline">
      <dt className="text-[11.5px] text-[var(--mute)]">{label}</dt>
      <dd className={`text-[12.5px] min-w-0 break-words ${mono ? "font-mono tabular-nums" : ""} ${empty ? "text-[var(--mute-soft)]" : "text-[var(--ink)] font-semibold"}`}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}

function DiagChips({ items, other }: { items: string[]; other?: string | null }) {
  const all = [...items, ...(other ? [other] : [])];
  if (all.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {all.map((d, i) => (
        <span key={i} className="px-1.5 py-px rounded-md text-[11.5px] font-semibold bg-[var(--surface-soft)] text-[var(--ink)] border border-[var(--line)]">
          {d}
        </span>
      ))}
    </div>
  );
}

const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString("vi-VN")} ₫` : null);

// Modal xem thông tin chi tiết hồ sơ — chuẩn Visihub
export function PatientInfoModal({ hoSoId, onClose }: { hoSoId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/csr/hoso/${hoSoId}`);
        if (!res.ok) throw new Error("Không thể tải thông tin hồ sơ");
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Lỗi tải dữ liệu");
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [hoSoId]);

  /* Esc chỉ đóng modal này — chặn ở pha capture để modal danh sách phía dưới không đóng theo. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const root = typeof document !== "undefined" ? document.getElementById("modal-root") : null;
  const target = root || document.body;

  const st = data ? statusOf(data.trangThai) : null;
  const age = data ? ageOf(data) : null;
  const diagMP = data ? parseDiag(data.chanDoanMP) : [];
  const diagMT = data ? parseDiag(data.chanDoanMT) : [];
  const diagAll = data ? parseDiag(data.chanDoan) : [];
  const hasEyeDiag = diagMP.length > 0 || diagMT.length > 0 || !!data?.chanDoanKhacMP || !!data?.chanDoanKhacMT;
  const benhLy = data ? parseDiag(data.loaiBenhLy) : [];
  const tvv = data?.tuVanVien?.hoTen || data?.nhanVienTuVan;
  const huyMo = data?.trangThaiDieuTri === "Hủy" || data?.trangThaiDieuTri === "Không đến";

  /* Hành trình CSR: khám → phân nhóm → đến viện → phẫu thuật */
  const steps: { label: string; done: boolean; fail?: boolean; sub: string }[] = data
    ? [
        { label: "Khám sàng lọc", done: !!data.buoiKham, sub: data.buoiKham ? fmtDate(data.buoiKham.ngayKham) : "—" },
        { label: "Phân nhóm", done: !!data.nhom, sub: data.nhom ? `Nhóm ${data.nhom}` : "Chưa phân" },
        {
          label: "Đến viện",
          done: !!data.daDon,
          sub: data.daDon
            ? data.ngayDenBV ? fmtDate(data.ngayDenBV) : "Đã đón"
            : data.ngayDieuTri ? `Hẹn ${fmtDate(data.ngayDieuTri)}` : "Chưa đến",
        },
        {
          label: "Phẫu thuật",
          done: !!data.ngayMoThucTe || data.trangThaiDieuTri === "Đã mổ",
          fail: huyMo,
          sub: data.ngayMoThucTe ? fmtDate(data.ngayMoThucTe) : data.trangThaiDieuTri || "Chưa mổ",
        },
      ]
    : [];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(1,8,51,0.45)] backdrop-blur-sm p-2 sm:p-5 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[var(--surface)] rounded-[var(--r-xl)] shadow-2xl w-full max-w-[1320px] max-h-[94vh] flex flex-col overflow-hidden border border-[var(--line-strong)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-[var(--line)] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white flex items-center justify-center font-serif text-[20px] font-bold shadow-[var(--navy-shadow)] shrink-0">
                {data?.hoTen ? String(data.hoTen).trim().split(/\s+/).pop()!.charAt(0).toUpperCase() : <User className="w-5 h-5 text-[var(--teal)]" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-[20px] font-bold tracking-[-0.01em] text-[var(--ink)] leading-tight">
                    {data?.hoTen || (loading ? "Đang tải hồ sơ…" : "Hồ sơ bệnh nhân")}
                  </h2>
                  {data?.nhom && (
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${data.nhom === "A" ? "bg-[var(--rose-soft)] text-[var(--rose)] border-rose-200/70" : "bg-[var(--amber-soft)] text-[var(--amber-deep)] border-amber-200/70"}`}>
                      Nhóm {data.nhom}
                    </span>
                  )}
                  {st && <StatusBadge label={st.label} cls={st.cls} sm />}
                </div>
                {data && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[11.5px]">
                    <span className="font-mono font-bold text-[var(--navy)] px-1.5 py-px rounded bg-[var(--surface-soft)] border border-[var(--line)]">{data.maBN || "—"}</span>
                    {data.maBNHIS && (
                      <span className="font-mono text-[var(--ink-soft)] px-1.5 py-px rounded bg-[var(--surface-soft)] border border-[var(--line)]">HIS {data.maBNHIS}</span>
                    )}
                    <span className="text-[var(--mute)]">
                      {[
                        data.gioiTinh,
                        age ? `${age} tuổi` : null,
                        data.ngaySinh ? `Sinh ${fmtDate(data.ngaySinh)}` : data.namSinh ? `NS ${data.namSinh}` : null,
                      ].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              title="Đóng (Esc)"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Hành trình — thanh bước mảnh, nối bằng đường kẻ */}
          {data && (
            <ol className="mt-3 flex items-start">
              {steps.map((s, i) => {
                const dot = s.fail
                  ? "bg-[var(--rose)] text-white border-[var(--rose)]"
                  : s.done
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "bg-[var(--surface)] text-[var(--mute)] border-[var(--line-strong)]";
                const next = steps[i + 1];
                return (
                  <li key={s.label} className={`${next ? "flex-1" : "shrink-0"} min-w-0 flex items-start`}>
                    <div className="flex items-center gap-2 min-w-0 shrink-0 max-w-full">
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${dot}`}>
                        {s.fail ? <X className="w-3 h-3" /> : s.done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <div className="text-[9.5px] font-mono font-bold uppercase tracking-[0.08em] text-[var(--mute)] whitespace-nowrap">{s.label}</div>
                        <div className={`text-[12px] font-semibold truncate ${s.fail ? "text-[var(--rose)]" : s.done ? "text-[var(--ink)]" : "text-[var(--mute)]"}`}>
                          {s.sub}
                        </div>
                      </div>
                    </div>
                    {next && (
                      <span className={`flex-1 h-px mt-2.5 mx-3 min-w-4 ${next.done || next.fail ? "bg-[var(--teal)]" : "[background:repeating-linear-gradient(90deg,var(--line-strong)_0_4px,transparent_4px_8px)]"}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[var(--bg)]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--mute)]">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--navy)] mb-2" />
              <p className="text-[13px] font-medium">Đang tải chi tiết hồ sơ…</p>
            </div>
          ) : error ? (
            <div className="p-3.5 bg-[var(--rose-soft)] text-[var(--rose)] rounded-[var(--r-lg)] text-center font-medium border border-[var(--rose)]/20 text-[13px]">
              {error}
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <InfoSection icon={User} title="Hành chính & liên hệ">
                <InfoRow label="SĐT cá nhân" mono>{data.sdt}</InfoRow>
                <InfoRow label="SĐT người nhà" mono>{data.sdtNguoiNha}</InfoRow>
                <InfoRow label="CCCD / Định danh" mono>{data.cccd}</InfoRow>
                <InfoRow label="Địa chỉ">{data.diaChi || [data.khuPho, data.xaPhuong].filter(Boolean).join(", ")}</InfoRow>
              </InfoSection>

              <InfoSection
                icon={Stethoscope}
                title="Khám sàng lọc & chẩn đoán"
                aside={
                  data.buoiKham ? (
                    <span className="text-[11.5px] text-[var(--mute)] truncate">
                      <span className="font-semibold text-[var(--navy)]">{data.buoiKham.xa}</span>
                      <span className="font-mono"> · {fmtDate(data.buoiKham.ngayKham)}</span>
                    </span>
                  ) : null
                }
              >
                <InfoRow label="Thị lực">
                  {data.thiLucMP || data.thiLucMT ? (
                    <span className="inline-flex gap-1.5 font-mono">
                      <span className="px-1.5 py-px rounded-md bg-[var(--surface-soft)] border border-[var(--line)] text-[12px]">
                        <span className="text-[var(--mute)] font-medium">MP</span> {data.thiLucMP || "—"}
                      </span>
                      <span className="px-1.5 py-px rounded-md bg-[var(--surface-soft)] border border-[var(--line)] text-[12px]">
                        <span className="text-[var(--mute)] font-medium">MT</span> {data.thiLucMT || "—"}
                      </span>
                    </span>
                  ) : null}
                </InfoRow>
                <InfoRow label="Mắt chỉ định">{data.matKham}</InfoRow>
                {hasEyeDiag ? (
                  <>
                    <InfoRow label="Chẩn đoán MP">
                      {diagMP.length || data.chanDoanKhacMP ? <DiagChips items={diagMP} other={data.chanDoanKhacMP} /> : null}
                    </InfoRow>
                    <InfoRow label="Chẩn đoán MT">
                      {diagMT.length || data.chanDoanKhacMT ? <DiagChips items={diagMT} other={data.chanDoanKhacMT} /> : null}
                    </InfoRow>
                  </>
                ) : (
                  <InfoRow label="Chẩn đoán">
                    {diagAll.length || data.chanDoanKhac ? <DiagChips items={diagAll} other={data.chanDoanKhac} /> : null}
                  </InfoRow>
                )}
                {benhLy.length > 0 && (
                  <InfoRow label="Bệnh lý (ICD)">
                    <DiagChips items={benhLy} other={data.loaiBenhLyKhac} />
                  </InfoRow>
                )}
                <InfoRow label="Khuyến nghị">
                  {data.khuyenNghi ? (
                    <span className={data.khuyenNghi === "Phẫu thuật" ? "text-[var(--rose)]" : "text-[var(--amber-deep)]"}>{data.khuyenNghi}</span>
                  ) : null}
                </InfoRow>
                <InfoRow label="Bác sĩ chỉ định">{data.bacSiChiDinh || data.buoiKham?.bacSiKham}</InfoRow>
              </InfoSection>

              <InfoSection icon={ShieldCheck} title="Tư vấn & BHYT">
                <InfoRow label="Thẻ BHYT">
                  {data.bhyt ? (
                    <span className="inline-flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-indigo-700">{data.bhyt}</span>
                      <span className="px-1.5 py-px rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                        {data.mucHuongBHYT ? `${data.mucHuongBHYT}%` : bhytLevel(data.bhyt)}
                      </span>
                    </span>
                  ) : null}
                </InfoRow>
                <InfoRow label="Tư vấn viên">{tvv}</InfoRow>
                <InfoRow label="Chi phí báo BN" mono>{fmtMoney(data.soTienBao)}</InfoRow>
                <InfoRow label="Ngày hẹn mổ" mono>{data.ngayDieuTri ? fmtDate(data.ngayDieuTri) : null}</InfoRow>
                <InfoRow label="Điểm / giờ đón">{data.diemDon ? `${data.diemDon}${data.gioDon ? ` · ${data.gioDon}` : ""}` : null}</InfoRow>
                {data.ghiChuTuVan && <InfoRow label="Ghi chú tư vấn">{data.ghiChuTuVan}</InfoRow>}
              </InfoSection>

              <InfoSection icon={Building2} title="Điều trị tại bệnh viện (HIS)">
                <InfoRow label="Mã BN HIS" mono>{data.maBNHIS}</InfoRow>
                <InfoRow label="Đến viện">
                  {data.daDon ? (
                    <span className="inline-flex items-center gap-1 text-[var(--teal-deep)]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đến
                      {data.ngayDenBV ? <span className="font-mono"> · {fmtDate(data.ngayDenBV)}</span> : null}
                    </span>
                  ) : (
                    <span className="text-[var(--mute)] font-medium">Chưa đến viện</span>
                  )}
                </InfoRow>
                <InfoRow label="Kết quả">
                  {data.trangThaiDieuTri ? (
                    <span className={huyMo ? "text-[var(--rose)]" : "text-[var(--teal-deep)]"}>{data.trangThaiDieuTri}</span>
                  ) : null}
                </InfoRow>
                <InfoRow label="Ngày mổ" mono>{data.ngayMoThucTe ? fmtDate(data.ngayMoThucTe) : null}</InfoRow>
                <InfoRow label="Chi phí thực thu" mono>{fmtMoney(data.soTienThucThu)}</InfoRow>
                {data.ngayTaiKham && <InfoRow label="Ngày tái khám" mono>{fmtDate(data.ngayTaiKham)}</InfoRow>}
              </InfoSection>

              {data.ghiChuMat2 && (
                <section className="md:col-span-2 xl:col-span-2 bg-[var(--surface)] border border-[var(--line)] border-l-[3px] border-l-[var(--amber)] rounded-[var(--r-lg)] shadow-[var(--shadow-xs)] px-4 py-3 overflow-y-auto">
                  <h3 className="text-[13px] font-bold text-[var(--ink)] flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-[var(--amber)]" /> Ghi chú nội bộ & kết quả HIS
                  </h3>
                  <p className="text-[12px] text-[var(--ink-soft)] whitespace-pre-wrap leading-[1.6]">{data.ghiChuMat2}</p>
                </section>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[var(--mute)] font-mono">
            {data?.updatedAt ? `Cập nhật ${new Date(data.updatedAt).toLocaleString("vi-VN")}` : ""}
          </span>
          <button onClick={onClose} className="btn-secondary h-9 px-5 text-[13px] rounded-[var(--r-md)] cursor-pointer">
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>,
    target
  );
}

// Modal Xem Lịch Sử Thao Tác - Chuẩn Company UI (Editorial, Dense & Breathable)
export function PatientHistoryModal({ hoSoId, onClose }: { hoSoId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/csr/hoso/${hoSoId}/history`);
      if (!res.ok) throw new Error("Không thể tải lịch sử thao tác");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [hoSoId]);

  const getEventIcon = (type: string, isSystem?: boolean) => {
    if (isSystem) return <Zap className="w-[12px] h-[12px] text-[#7c3aed]" />;
    switch (type) {
      case "create": return <PlusCircle className="w-[12px] h-[12px] text-[var(--navy)]" />;
      case "clinical": return <Stethoscope className="w-[12px] h-[12px] text-[var(--teal)]" />;
      case "group": return <Tag className="w-[12px] h-[12px] text-[var(--amber)]" />;
      case "his": return <Zap className="w-[12px] h-[12px] text-[#7c3aed]" />;
      case "surgery": return <HeartPulse className="w-[12px] h-[12px] text-[var(--teal-deep)]" />;
      case "log": return <MessageSquare className="w-[12px] h-[12px] text-[var(--amber)]" />;
      case "edit": return <Edit3 className="w-[12px] h-[12px] text-[var(--navy)]" />;
      default: return <Activity className="w-[12px] h-[12px] text-[var(--navy)]" />;
    }
  };

  const getAvatarStyle = (role: string, isSystem?: boolean) => {
    if (isSystem) return "bg-[#f3eaf8] text-[#7c3aed] border-[#e9d5ff]";
    if (role.toLowerCase().includes("quản lý") || role.toLowerCase().includes("admin"))
      return "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]/20";
    if (role.toLowerCase().includes("bác sĩ") || role.toLowerCase().includes("lâm sàng"))
      return "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]/20";
    if (role.toLowerCase().includes("tư vấn") || role.toLowerCase().includes("bhyt"))
      return "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]/20";
    if (role.toLowerCase().includes("mkt") || role.toLowerCase().includes("marketing") || role.toLowerCase().includes("cskh") || role.toLowerCase().includes("tiếp nhận"))
      return "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy)]/20";
    return "bg-[var(--surface-soft)] text-[var(--ink-soft)] border-[var(--line)]";
  };

  const getBadgeStyle = (cls?: string, type?: string) => {
    if (cls === "badge-red" || cls === "badge-rose") return "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]/20";
    if (cls === "badge-amber" || cls === "badge-orange" || type === "group" || type === "log") return "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]/20";
    if (cls === "badge-teal" || cls === "badge-green" || type === "clinical" || type === "surgery") return "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]/20";
    if (cls === "badge-purple" || type === "his") return "bg-[#f3eaf8] text-[#7c3aed] border-[#e9d5ff]";
    if (cls === "badge-blue" || type === "create") return "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy)]/20";
    return "bg-[var(--line-soft)] text-[var(--ink-soft)] border-[var(--line)]";
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const root = typeof document !== "undefined" ? document.getElementById("modal-root") : null;
  const target = root || document.body;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-6 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[95%] max-w-[95%] min-w-[95%] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Editorial Navy Gradient & Teal Glow */}
        <div 
          className="py-3 px-5 text-white flex items-center justify-between border-b border-[var(--line)] relative overflow-hidden shrink-0"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(2, 184, 169, 0.35) 0%, transparent 60%), linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Clock className="w-4.5 h-4.5 text-[var(--teal)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-[20px] font-bold tracking-[-0.02em] text-white">
                  Lịch sử <span className="italic font-normal text-[var(--teal)]">thao tác</span> &amp; thay đổi dữ liệu
                </h2>
              </div>
              <p className="text-[12.5px] text-white/80 font-mono mt-[3px] flex items-center gap-2 font-sans">
                {data?.hoSo ? (
                  <>
                    <span>Bệnh nhân: <strong className="text-white font-semibold">{data.hoSo.hoTen}</strong></span>
                    <span className="font-mono text-[11px] bg-white/15 text-[var(--teal-soft)] px-[7px] py-[2px] rounded-[4px] font-semibold">{data.hoSo.maBN}</span>
                    <span>· Xã {data.hoSo.buoiKham?.xa || "—"}</span>
                  </>
                ) : (
                  "Ghi nhận chi tiết từng thao tác, đối chiếu HIS và nhật ký liên hệ"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              disabled={loading}
              title="Làm mới lịch sử"
              className="p-2 rounded-[10px] hover:bg-white/10 text-white/80 hover:text-white transition disabled:opacity-50 border border-transparent hover:border-white/15"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-[10px] hover:bg-white/10 text-white/80 hover:text-white transition border border-transparent hover:border-white/15">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[var(--surface-bg)]">
          {loading && !data ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--mute)]">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--navy)] mb-2.5" />
              <p className="text-[13px] font-medium font-sans">Đang truy xuất toàn bộ lịch sử thao tác &amp; kiểm toán...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 bg-[var(--rose-soft)] text-[var(--rose)] rounded-[var(--r-lg)] text-center font-medium border border-[var(--rose)]/20 text-[13px]">
              {error}
            </div>
          ) : data?.events && data.events.length > 0 ? (
            <div className="relative pl-6 space-y-3.5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--line-strong)]">
              {data.events.map((ev: any) => (
                <div key={ev.id} className="relative group animate-fade-in">
                  {/* Timeline node icon */}
                  <div className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-[var(--surface)] border-2 border-[var(--line-strong)] shadow-[var(--shadow-xs)] flex items-center justify-center z-10 group-hover:border-[var(--teal)] group-hover:scale-110 transition-all">
                    {getEventIcon(ev.type, ev.userInfo?.isSystem)}
                  </div>

                  {/* Event card - Standard Card Pattern */}
                  <div className="bg-[var(--surface)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] transition-all duration-200 overflow-hidden">
                    {/* Card Header: Người thao tác */}
                    <div className="bg-[var(--surface-soft)] px-3.5 py-2 border-b border-[var(--line-soft)] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-[6px] flex items-center justify-center font-mono font-bold text-[11px] shadow-2xs border ${getAvatarStyle(
                            ev.userInfo?.role || "",
                            ev.userInfo?.isSystem
                          )}`}
                        >
                          {ev.userInfo?.isSystem ? <Zap className="w-3.5 h-3.5" /> : (ev.userInfo?.name || "?").charAt(0).toUpperCase()}
                        </div>

                        {/* Thông tin nhân viên */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-[12.5px] text-[var(--ink)]">
                              {ev.userInfo?.name || "Nhân viên hệ thống"}
                            </span>
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--line-soft)] text-[var(--ink-soft)] border border-[var(--line)]">
                              Mã: {ev.userInfo?.maNV || "N/A"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--mute)] font-medium mt-0.5 flex items-center gap-1.5 font-sans">
                            <span className="text-[var(--navy)] font-semibold">{ev.userInfo?.role || "Nhân viên"}</span>
                            {ev.userInfo?.khoa ? <span>· {ev.userInfo.khoa}</span> : null}
                          </div>
                        </div>
                      </div>

                      {/* Thời gian */}
                      <div className="font-mono text-[10.5px] font-medium text-[var(--ink-soft)] bg-[var(--surface)] px-2 py-1 rounded-[6px] border border-[var(--line)] shadow-[var(--shadow-xs)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--mute)]" />
                        {new Date(ev.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        {" · "}
                        {new Date(ev.time).toLocaleDateString("vi-VN")}
                      </div>
                    </div>

                    {/* Card Body: Thao tác & Chi tiết */}
                    <div className="p-3.5 space-y-2.5">
                      {/* Tiêu đề hành động */}
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-sans font-bold text-[13px] text-[var(--ink)] flex items-center gap-2">
                          {ev.action}
                        </h4>
                        {ev.badge && (
                          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-[6px] border ${getBadgeStyle(ev.badge.cls, ev.type)}`}>
                            {ev.badge.label}
                          </span>
                        )}
                      </div>

                      {/* Nội dung nhật ký liên hệ (nếu có) */}
                      {ev.message && (
                        <div className="bg-[var(--surface-soft)] p-2.5 rounded-[8px] border border-[var(--line)] text-[12px] text-[var(--ink)] font-sans leading-[1.5] shadow-2xs">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-[var(--teal)] mt-0.5 shrink-0" />
                            <div className="whitespace-pre-wrap flex-1">{ev.message}</div>
                          </div>
                        </div>
                      )}

                      {/* Bảng chi tiết thay đổi / kiểm toán (nếu có changes) */}
                      {ev.changes && ev.changes.length > 0 && (
                        <div className="border border-[var(--line)] rounded-[8px] overflow-hidden bg-[var(--surface)]">
                          <div className="bg-[var(--surface-soft)] px-3 py-1.5 border-b border-[var(--line)] flex items-center justify-between">
                            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
                              Chi tiết cập nhật ({ev.changes.length} trường)
                            </span>
                            <span className="font-sans text-[10px] text-[var(--mute)] font-medium">* Giá trị mới ghi nhận</span>
                          </div>
                          <div className="divide-y divide-[var(--line-soft)] max-h-[180px] overflow-y-auto">
                            {ev.changes.map((ch: any, idx: number) => (
                              <div key={idx} className="px-3 py-1.5 text-[12px] flex items-center justify-between hover:bg-[var(--surface-soft)] transition-colors">
                                <span className="font-sans font-medium text-[var(--ink-soft)] w-2/5 shrink-0 truncate flex items-center gap-1.5" title={ch.fieldLabel}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] inline-block shrink-0"></span>
                                  {ch.fieldLabel}
                                </span>
                                <span className="font-mono font-semibold text-[var(--navy)] w-3/5 text-right break-words pl-2">
                                  {ch.displayValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-[var(--mute)]">
              <Clock className="w-10 h-10 mx-auto mb-2.5 text-[var(--mute-soft)]" />
              <p className="text-[14px] font-bold text-[var(--ink)] font-sans">Chưa ghi nhận thao tác nào</p>
              <p className="text-[12px] text-[var(--mute)] mt-1 font-sans">Mọi thao tác cập nhật, đối chiếu HIS hoặc gọi điện sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[var(--surface)] p-[16px] px-[24px] border-t border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--mute)] font-sans">
            <ShieldAlert className="w-[14px] h-[14px] text-[var(--teal)] shrink-0" />
            <span>
              Lịch sử lưu trữ toàn bộ thao tác, hiển thị <strong className="text-[var(--ink)] font-semibold">mã nhân viên</strong> và <strong className="text-[var(--ink)] font-semibold">chức vụ thực tế</strong> của người chỉnh sửa.
            </span>
          </div>
          <button onClick={onClose} className="btn-secondary px-[20px] py-[8px] text-[12.5px] font-semibold rounded-[var(--r-md)] shadow-xs cursor-pointer">
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>,
    target
  );
}

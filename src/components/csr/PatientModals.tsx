"use client";

import { useEffect, useState } from "react";
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

// Modal Xem Thông Tin Chi Tiết Hồ Sơ - Chuẩn Company UI
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const root = typeof document !== "undefined" ? document.getElementById("modal-root") : null;
  const target = root || document.body;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 pointer-events-auto animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--surface)] rounded-[var(--r-xl)] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--line)]" onClick={(e) => e.stopPropagation()}>
        {/* Header - Editorial Navy Gradient & Teal Glow */}
        <div 
          className="py-3 px-5 text-white flex items-center justify-between border-b border-[var(--line)] relative overflow-hidden shrink-0"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(2, 184, 169, 0.35) 0%, transparent 60%), linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-base font-bold border border-white/20 shadow-inner shrink-0 font-serif">
              {data?.hoTen ? data.hoTen.charAt(0).toUpperCase() : <User className="w-4.5 h-4.5 text-[var(--teal)]" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-[20px] font-bold tracking-[-0.02em] text-white">
                  {data?.hoTen || "Đang tải thông tin..."}
                </h2>
                {data && <StatusBadge label={statusOf(data.trangThai).label} cls={statusOf(data.trangThai).cls} sm />}
              </div>
              <p className="text-[12px] text-white/80 font-mono mt-[3px] flex items-center gap-2">
                <span>Mã BN: <strong className="text-white font-semibold">{data?.maBN || "—"}</strong></span>
                {data?.maBNHIS ? <span className="bg-white/15 px-1.5 py-0.5 rounded text-[10.5px] text-[var(--teal-soft)]">HIS: {data.maBNHIS}</span> : null}
                <span>· {data?.gioiTinh || ""} {data ? `${ageOf(data)} tuổi` : ""}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-[10px] hover:bg-white/10 text-white/80 hover:text-white transition border border-transparent hover:border-white/15">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-[var(--surface-bg)]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--mute)]">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--navy)] mb-2" />
              <p className="text-[13px] font-medium font-sans">Đang truy xuất chi tiết hồ sơ bệnh nhân...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 bg-[var(--rose-soft)] text-[var(--rose)] rounded-[var(--r-lg)] text-center font-medium border border-[var(--rose)]/20 text-[13px]">
              {error}
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Section 1: Hành chính & Liên hệ */}
              <div className="bg-[var(--surface)] p-3.5 rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] transition-all duration-200 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--navy)] flex items-center gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <User className="w-[14px] h-[14px] text-[var(--teal)]" /> Hành chính &amp; liên hệ
                </h3>
                <div className="space-y-1.5 text-[12.5px] font-sans">
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">SĐT cá nhân:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">{data.sdt || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">SĐT người nhà:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">{data.sdtNguoiNha || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Số CCCD / Định danh:</span>
                    <span className="font-mono font-semibold text-[var(--ink)]">{data.cccd || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Địa chỉ cư trú:</span>
                    <span className="font-medium text-[var(--ink)] text-right max-w-[200px] truncate" title={data.diaChi || ""}>{data.diaChi || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[var(--mute)]">Buổi khám tầm soát:</span>
                    <span className="font-medium text-[var(--navy)]">Xã {data.buoiKham?.xa || "—"} (<span className="font-mono">{fmtDate(data.buoiKham?.ngayKham)}</span>)</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Khám lâm sàng & Khuyến nghị */}
              <div className="bg-[var(--surface)] p-3.5 rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] transition-all duration-200 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--navy)] flex items-center gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <Stethoscope className="w-[14px] h-[14px] text-[var(--teal)]" /> Khám lâm sàng &amp; chẩn đoán
                </h3>
                <div className="space-y-1.5 text-[12.5px] font-sans">
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Thị lực mắt phải (MP):</span>
                    <span className="font-mono font-bold text-[var(--teal-deep)]">{data.thiLucMP || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Thị lực mắt trái (MT):</span>
                    <span className="font-mono font-bold text-[var(--teal-deep)]">{data.thiLucMT || "—"}</span>
                  </div>
                  <div className="py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)] block mb-1">Chẩn đoán bác sĩ:</span>
                    <div className="flex flex-wrap gap-1">
                      {parseDiag(data.chanDoan).map((d, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[var(--teal-soft)] text-[var(--teal-deep)] rounded-[6px] text-[11px] font-semibold border border-[var(--teal)]/20">
                          {d}
                        </span>
                      ))}
                      {data.chanDoanKhac && (
                        <span className="px-1.5 py-0.5 bg-[var(--navy-50)] text-[var(--navy)] rounded-[6px] text-[11px] font-semibold border border-[var(--navy)]/20">
                          {data.chanDoanKhac}
                        </span>
                      )}
                      {parseDiag(data.chanDoan).length === 0 && !data.chanDoanKhac && <span className="text-[var(--mute)]">—</span>}
                    </div>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[var(--mute)]">Khuyến nghị điều trị:</span>
                    <span className="font-bold text-[var(--navy)]">{data.khuyenNghi || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Tư vấn BHYT & Chi phí */}
              <div className="bg-[var(--surface)] p-3.5 rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] transition-all duration-200 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--navy)] flex items-center gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <ShieldCheck className="w-[14px] h-[14px] text-[var(--teal)]" /> Tư vấn BHYT &amp; phân nhóm
                </h3>
                <div className="space-y-1.5 text-[12.5px] font-sans">
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Mức hưởng BHYT:</span>
                    <span className="font-mono font-bold text-[var(--teal-deep)]">
                      {data.bhyt || "—"} {bhytLevel(data.bhyt) ? `(${bhytLevel(data.bhyt)})` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Phân nhóm điều trị:</span>
                    <span className="font-bold">
                      {data.nhom ? (
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold uppercase tracking-wide border ${data.nhom === "A" ? "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]/20" : "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]/20"}`}>
                          Nhóm {data.nhom}
                        </span>
                      ) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Chi phí báo bệnh nhân:</span>
                    <span className="font-mono font-bold text-[var(--navy)]">
                      {data.soTienBao != null ? data.soTienBao.toLocaleString("vi-VN") + " ₫" : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Ngày hẹn phẫu thuật:</span>
                    <span className="font-mono font-medium text-[var(--ink)]">{fmtDate(data.ngayDieuTri)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[var(--mute)]">Điểm đón / Giờ đón:</span>
                    <span className="font-medium text-[var(--ink)]">{data.diemDon ? `${data.diemDon} (${data.gioDon || ""})` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Điều trị HIS */}
              <div className="bg-[var(--surface)] p-3.5 rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] transition-all duration-200 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--navy)] flex items-center gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <Building2 className="w-[14px] h-[14px] text-[var(--teal)]" /> Điều trị tại Bệnh viện (HIS)
                </h3>
                <div className="space-y-1.5 text-[12.5px] font-sans">
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Mã bệnh nhân HIS:</span>
                    <span className="font-mono font-bold text-[#7c3aed] bg-[#f3eaf8] px-2 py-0.5 rounded-[6px] border border-[#e9d5ff] text-[11.5px]">
                      {data.maBNHIS || "Chưa liên kết HIS"}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Trạng thái đón viện:</span>
                    <span className="font-medium text-[var(--ink)]">
                      {data.daDon ? <span className="text-[var(--teal-deep)] font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 inline text-[var(--teal)]" /> Đã đón viện</span> : "Chưa đến viện"}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Kết quả điều trị:</span>
                    <span className="font-bold text-[var(--navy)]">{data.trangThaiDieuTri || "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-[var(--line-soft)]">
                    <span className="text-[var(--mute)]">Ngày mổ thực tế:</span>
                    <span className="font-mono font-bold text-[var(--teal-deep)]">{fmtDate(data.ngayMoThucTe)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-[var(--mute)]">Chi phí thực thu:</span>
                    <span className="font-mono font-bold text-[var(--teal-deep)]">
                      {data.soTienThucThu != null ? data.soTienThucThu.toLocaleString("vi-VN") + " ₫" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghi chú nội bộ / HIS */}
              {data.ghiChuMat2 && (
                <div className="col-span-1 md:col-span-2 bg-[var(--amber-soft)] p-3.5 border border-[var(--amber)]/20 rounded-[var(--r-lg)] shadow-[var(--shadow-xs)]">
                  <h4 className="text-[11px] font-bold text-[var(--amber)] uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-[14px] h-[14px] text-[var(--amber)]" /> Ghi chú nội bộ &amp; kết quả HIS
                  </h4>
                  <pre className="text-[12px] text-[var(--ink)] whitespace-pre-wrap font-sans bg-[var(--surface)] p-3 rounded-[10px] border border-[var(--line)] shadow-2xs leading-[1.5]">
                    {data.ghiChuMat2}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-[var(--surface)] p-[16px] px-[24px] border-t border-[var(--line)] flex justify-end">
          <button onClick={onClose} className="btn-secondary px-[24px] py-[8px] text-[13px] font-semibold rounded-[var(--r-md)]">
            Đóng
          </button>
        </div>
      </div>
    </div>,
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
    if (role.toLowerCase().includes("cskh") || role.toLowerCase().includes("tiếp nhận"))
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--surface)] rounded-[var(--r-xl)] shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-[var(--line)]" onClick={(e) => e.stopPropagation()}>
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
          <button onClick={onClose} className="btn-secondary px-[20px] py-[8px] text-[12.5px] font-semibold rounded-[var(--r-md)] shadow-[var(--shadow-xs)]">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    target
  );
}

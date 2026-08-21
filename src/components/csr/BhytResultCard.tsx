"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  Building2,
  FileText,
  Activity,
  History,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Modal from "@/components/layout/Modal";
import { type ThongTinTheBHYT } from "@/lib/bhxh-types";
import { motion, AnimatePresence } from "framer-motion";

interface BhytResultCardProps {
  the: ThongTinTheBHYT;
  notification?: string;
  onApplyData?: () => void;
  className?: string;
}

export function BhytResultCard({ the, notification, onApplyData, className = "" }: BhytResultCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"kcb" | "kt">("kcb");

  const hasHistoryKcb = Boolean(the.dsLichSuKCB && the.dsLichSuKCB.length > 0);
  const hasHistoryKt = Boolean(the.dsLichSuKT && the.dsLichSuKT.length > 0);
  const hasAnyHistory = hasHistoryKcb || hasHistoryKt;

  const note = notification || the.ghiChu || "";
  const isPositive =
    the.maKetQua === "000" ||
    the.maKetQua === "001" ||
    note.toLowerCase().includes("còn giá trị") ||
    note.toLowerCase().includes("con gia tri");

  const formatDateTime = (dt?: string) => {
    if (!dt) return "—";
    const clean = dt.trim();
    if (clean.length === 12) {
      // YYYYMMDDHHmm
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      const d = clean.substring(6, 8);
      const h = clean.substring(8, 10);
      const min = clean.substring(10, 12);
      return `${d}/${m}/${y} ${h}:${min}`;
    }
    if (clean.length === 14) {
      // YYYYMMDDHHmmss
      const y = clean.substring(0, 4);
      const m = clean.substring(4, 6);
      const d = clean.substring(6, 8);
      const h = clean.substring(8, 10);
      const min = clean.substring(10, 12);
      return `${d}/${m}/${y} ${h}:${min}`;
    }
    return clean;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`rounded-2xl border transition-all overflow-hidden shadow-xs max-w-full min-w-0 ${
          isPositive
            ? "bg-gradient-to-br from-[var(--teal-soft)]/50 via-white to-[var(--surface-bg)] dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 border-[var(--teal)]/40"
            : "bg-gradient-to-br from-amber-50/60 via-white to-[var(--surface-bg)] dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/50"
        } ${className}`}
      >
        {/* Header Strip */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b gap-3 min-w-0 ${
            isPositive
              ? "bg-[var(--teal)]/10 border-[var(--teal)]/20 text-[var(--teal-deep)] dark:text-[var(--teal)]"
              : "bg-amber-100/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-[13px] min-w-0 flex-1">
            {isPositive ? (
              <ShieldCheck className="w-4.5 h-4.5 text-[var(--teal-deep)] dark:text-[var(--teal)] shrink-0" />
            ) : (
              <ShieldAlert className="w-4.5 h-4.5 text-amber-700 dark:text-amber-400 shrink-0" />
            )}
            <span className="truncate min-w-0">{isPositive ? "Thẻ còn giá trị sử dụng" : (note || "Thông báo BHXH")}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {the.mucHuong && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[var(--navy)] text-white shadow-2xs">
                Mức hưởng: {the.mucHuong}
              </span>
            )}
            {hasAnyHistory && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-white dark:bg-slate-800 text-[var(--navy)] dark:text-[var(--teal)] hover:bg-[var(--navy-50)] dark:hover:bg-slate-700 border border-[var(--navy)]/20 dark:border-white/10 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Xem chi tiết lịch sử khám chữa bệnh và các lần kiểm tra thẻ"
              >
                <History className="w-3.5 h-3.5 text-[var(--teal-deep)] dark:text-[var(--teal)]" />
                <span>Lịch sử KCB</span>
                {hasHistoryKcb && (
                  <span className="bg-[var(--teal)] text-white px-1.5 py-0.2 rounded-full text-[9.5px]">
                    {the.dsLichSuKCB?.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 text-[12.5px] text-[var(--ink)] dark:text-slate-200 space-y-2 font-sans min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[var(--mute)] text-[11.5px] block">Mã thẻ BHYT:</span>
              <strong className="font-mono text-[13.5px] text-[var(--navy-deep)] dark:text-[var(--teal)] tracking-wider truncate block">
                {the.maThe}
              </strong>
            </div>

            <div className="min-w-0">
              <span className="text-[var(--mute)] text-[11.5px] block">Họ tên & Ngày sinh:</span>
              <strong className="text-[13px] uppercase text-[var(--ink)] dark:text-white truncate block">
                {the.hoTen || "—"} {the.ngaySinh && <span className="font-mono text-[var(--mute)] font-normal text-[12px]">({the.ngaySinh})</span>}
              </strong>
            </div>

            <div className="min-w-0">
              <span className="text-[var(--mute)] text-[11.5px] block">Hạn sử dụng thẻ:</span>
              <strong className="font-mono text-[12.5px] text-[var(--teal-deep)] dark:text-[var(--teal)] block">
                {the.tuNgay || "?"} → {the.denNgay || "?"}
              </strong>
            </div>

            <div className="sm:col-span-2 min-w-0">
              <span className="text-[var(--mute)] text-[11.5px] block">Nơi ĐKBĐ ban đầu:</span>
              <strong className="text-[12.5px] text-[var(--ink)] dark:text-slate-100 flex items-center gap-1.5 min-w-0" title={the.tenDKBD || ""}>
                <Building2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                <span className="truncate">{the.tenDKBD || "Chưa xác định"}</span>
                {the.maDKBD && <span className="font-mono text-[var(--mute)] font-normal text-[11.5px] shrink-0">({the.maDKBD})</span>}
              </strong>
            </div>

            {the.namNamLienTuc && (
              <div className="min-w-0">
                <span className="text-[var(--mute)] text-[11.5px] block">Đủ 5 năm liên tục:</span>
                <span className="font-mono font-bold text-[var(--teal-deep)] dark:text-[var(--teal)] text-[12px]">
                  ✨ {the.namNamLienTuc}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal Lịch Sử Khám Chữa Bệnh & Kiểm Tra Thẻ */}
      {historyOpen && (
        <Modal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          title="Lịch sử Khám Chữa Bệnh & Kiểm tra Thẻ BHYT"
          subtitle={`Thẻ: ${the.maThe} · Bệnh nhân: ${the.hoTen || "—"}`}
          icon={History}
          maxWidth="w-[95vw] max-w-[95vw] h-[92vh] max-h-[92vh]"
          noPadding
        >
          <div className="p-4 sm:p-6 space-y-4 bg-[var(--surface-bg)]">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2 relative">
              <button
                type="button"
                onClick={() => setActiveTab("kcb")}
                className={`relative px-4 py-2 rounded-xl text-[13px] font-bold transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                  activeTab === "kcb"
                    ? "text-white"
                    : "bg-white dark:bg-slate-800 text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)] dark:border-white/10"
                }`}
              >
                {activeTab === "kcb" && (
                  <motion.div
                    layoutId="bhyt-modal-tab"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 bg-[var(--navy)] rounded-xl shadow-xs -z-10"
                  />
                )}
                <Activity className="w-4 h-4" />
                <span>Lịch sử Khám Chữa Bệnh</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                  {the.dsLichSuKCB?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("kt")}
                className={`relative px-4 py-2 rounded-xl text-[13px] font-bold transition-colors flex items-center gap-2 cursor-pointer z-10 ${
                  activeTab === "kt"
                    ? "text-white"
                    : "bg-white dark:bg-slate-800 text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)] dark:border-white/10"
                }`}
              >
                {activeTab === "kt" && (
                  <motion.div
                    layoutId="bhyt-modal-tab"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="absolute inset-0 bg-[var(--navy)] rounded-xl shadow-xs -z-10"
                  />
                )}
                <Clock className="w-4 h-4" />
                <span>Lịch sử Kiểm tra Thẻ</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                  {the.dsLichSuKT?.length || 0}
                </span>
              </button>
            </div>

            {/* Tab 1: Lịch sử KCB */}
            {activeTab === "kcb" && (
              <div className="space-y-3">
                {!the.dsLichSuKCB || the.dsLichSuKCB.length === 0 ? (
                  <div className="py-12 text-center text-[var(--mute)] text-[13px] italic bg-white rounded-2xl border border-[var(--line)]">
                    Không có lịch sử khám chữa bệnh nào được ghi nhận trên cổng BHXH.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-[12px] border-collapse">
                        <thead className="sticky top-0 bg-[var(--navy)] text-white text-[11px] uppercase tracking-wider font-bold z-10">
                          <tr>
                            <th className="p-3 text-center w-12">STT</th>
                            <th className="p-3">Ngày vào / ra</th>
                            <th className="p-3">Cơ sở khám chữa bệnh</th>
                            <th className="p-3">Khoa / Phòng</th>
                            <th className="p-3">Kết quả điều trị</th>
                            <th className="p-3">Loại KCB</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line-soft)] font-sans">
                          {the.dsLichSuKCB.map((kcb, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-soft)] transition-colors">
                              <td className="p-3 text-center font-mono text-[var(--mute)]">{idx + 1}</td>
                              <td className="p-3 font-mono whitespace-nowrap">
                                <div className="text-[var(--teal-deep)] font-semibold">{formatDateTime(kcb.ngayVao)}</div>
                                <div className="text-[var(--mute)] text-[11px]">{formatDateTime(kcb.ngayRa)}</div>
                              </td>
                              <td className="p-3 font-semibold text-[var(--ink)]">
                                {kcb.tenCSKCB || kcb.maCSKCB || "—"}
                              </td>
                              <td className="p-3 text-[var(--mute)]">{kcb.tenKhoa || "—"}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md bg-[var(--navy-50)] text-[var(--navy)] font-semibold text-[11px]">
                                  {kcb.kqDieuTri || kcb.tinhTrangRV || "—"}
                                </span>
                              </td>
                              <td className="p-3 text-[var(--mute)]">{kcb.loaiKCB || "Ngoại trú"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Lịch sử Kiểm tra thẻ */}
            {activeTab === "kt" && (
              <div className="space-y-3">
                {!the.dsLichSuKT || the.dsLichSuKT.length === 0 ? (
                  <div className="py-12 text-center text-[var(--mute)] text-[13px] italic bg-white rounded-2xl border border-[var(--line)]">
                    Không có nhật ký kiểm tra thẻ nào trên Cổng tiếp nhận.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-[12px] border-collapse">
                        <thead className="sticky top-0 bg-[var(--navy)] text-white text-[11px] uppercase tracking-wider font-bold z-10">
                          <tr>
                            <th className="p-3 text-center w-12">STT</th>
                            <th className="p-3">Thời gian</th>
                            <th className="p-3">Cơ sở thực hiện</th>
                            <th className="p-3">Mã User</th>
                            <th className="p-3 min-w-[240px]">Thông báo từ cổng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line-soft)] font-sans">
                          {the.dsLichSuKT.map((kt, idx) => (
                            <tr key={idx} className="hover:bg-[var(--surface-soft)] transition-colors">
                              <td className="p-3 text-center font-mono text-[var(--mute)]">{idx + 1}</td>
                              <td className="p-3 font-mono font-semibold text-[var(--teal-deep)] whitespace-nowrap">
                                {formatDateTime(kt.thoiGianKT)}
                              </td>
                              <td className="p-3 font-semibold text-[var(--ink)]">
                                {kt.tenCSKCB_Display || kt.tenCSKCB || kt.maCSKCB || "—"}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-[var(--mute)]">{kt.userKT || "—"}</td>
                              <td className="p-3 text-[11.5px] leading-snug text-[var(--ink)]">
                                {kt.thongBao || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="btn btn-secondary px-6 py-2 rounded-xl font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

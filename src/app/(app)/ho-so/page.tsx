"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Loader2,
  Search,
  ClipboardList,
  Eye,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  RotateCw,
  X,
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName, parseDiag, statusOf, bhytLevel, type HoSo, fmtSinhTuoi } from "@/lib/csr";
import { isCorporate } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { Dropdown, StatusBadge } from "@/components/csr/fields";
import { DataView, DataTable, DataPagination } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";
import { PatientInfoModal, PatientHistoryModal } from "@/components/csr/PatientModals";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { motion, AnimatePresence } from "framer-motion";

const TT_OPTS = ["", "TiepNhan", "DaKham", "TheoDoi", "CoChiDinhMo", "NhomA", "NhomB", "DaMoHauPhau", "HuyKhongDen"];
const TT_LABELS: Record<string, string> = Object.fromEntries(TT_OPTS.filter(Boolean).map((k) => [k, statusOf(k).label]));
const NHOM_LABELS = { A: "Nhóm A · đã chốt mổ", B: "Nhóm B · theo dõi" };
const PAGE_SIZE_OPTS = [20, 50, 100, 200];

// Chẩn đoán tổng hợp; hồ sơ nhập theo phiếu sàng lọc mới chỉ có loaiBenhLy.
const diagText = (r: HoSo) => {
  const d = parseDiag(r.chanDoan);
  return (d.length ? d : parseDiag(r.loaiBenhLy ?? null)).join(", ");
};

export default function HoSoPage() {
  const { data: session } = useSession();
  const isAdmin = isCorporate(session?.user?.role);
  const { addToast } = useToast();
  const [rows, setRows] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tt, setTt] = useState("");
  const [nhom, setNhom] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const [syncing, setSyncing] = useState(false);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [infoId, setInfoId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  // Đóng menu đồng bộ khi click ngoài
  useEffect(() => {
    if (!syncMenuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSyncMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [syncMenuOpen]);

  // Reset về trang 1 khi lọc hoặc tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [search, tt, nhom, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (tt) sp.set("trangThai", tt);
    if (nhom) sp.set("nhom", nhom);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));

    try {
      const res = await fetch(`/api/csr/hoso?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setRows(data.items);
          setTotal(data.total);
        } else {
          setRows(data);
          setTotal(data.length);
        }
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, tt, nhom, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Cập nhật danh sách hồ sơ thời gian thực (SSE)
  useRealtimeEvent(["hoso_change", "buoikham_change"], () => {
    load();
  }, [load]);

  // Hàm xử lý đồng bộ Google Sheet
  const handleSyncGoogleSheet = async (rebuild = false) => {
    setSyncMenuOpen(false);
    setSyncing(true);
    try {
      const url = rebuild ? "/api/csr/googlesheet?rebuild=1" : "/api/csr/googlesheet";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        addToast({
          type: "success",
          title: rebuild ? "Đã dựng lại toàn bộ Google Sheet" : "Đồng bộ Google Sheet thành công",
          message: `Đã xử lý ${data.processed || 0} hồ sơ. ${
            data.remaining ? `Còn ${data.remaining} hồ sơ trong hàng đợi.` : "Đã đồng bộ 100%."
          }`,
        });
      } else {
        addToast({
          type: "error",
          message: data.error || "Không đồng bộ được Google Sheet",
        });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setSyncing(false);
    }
  };

  const columns = useMemo<ColumnDef<HoSo>[]>(
    () => [
      {
        id: "benhNhan",
        accessorKey: "hoTen",
        header: "Bệnh nhân",
        size: 260,
        meta: { flex: true, noTruncate: true },
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const sub = [r.gioiTinh, fmtSinhTuoi(r)].filter(Boolean).join(" · ");
          return (
            <div className="min-w-0">
              <div className="font-bold text-[13px] text-[var(--ink)] truncate" title={r.hoTen}>
                {r.hoTen}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--mute)] min-w-0">
                <span className="font-mono font-bold text-[var(--navy)] shrink-0">{r.maBN.replace(/^BN-?/i, "")}</span>
                {sub && <span className="truncate" title={sub}>· {sub}</span>}
              </div>
            </div>
          );
        },
      },
      {
        id: "chanDoan",
        header: "Chẩn đoán / Khuyến nghị",
        size: 240,
        meta: { flex: true, noTruncate: true },
        enableSorting: false,
        cell: ({ row }) => {
          const t = diagText(row.original);
          const kn = row.original.khuyenNghi;
          return (
            <div className="min-w-0">
              <div className={`truncate text-[12.5px] ${t ? "text-[var(--ink)]" : "text-[var(--mute-soft)]"}`} title={t}>
                {t || "Chưa có chẩn đoán"}
              </div>
              {kn && (
                <div
                  className={`mt-0.5 text-[11.5px] truncate ${
                    kn === "Phẫu thuật" ? "font-semibold text-[var(--rose)]" : "text-[var(--mute)]"
                  }`}
                >
                  → {kn}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "bhyt",
        header: "BHYT",
        size: 72,
        enableSorting: false,
        meta: { align: "center" },
        cell: ({ row }) => {
          const lv = bhytLevel(row.original.bhyt);
          return lv ? (
            <span className="font-mono text-[12px] text-[var(--ink)]">{lv}</span>
          ) : (
            <span className="text-[var(--mute-soft)]">—</span>
          );
        },
      },
      {
        id: "nhom",
        header: "Nhóm",
        size: 64,
        enableSorting: false,
        meta: { align: "center" },
        cell: ({ row }) => {
          const n = row.original.nhom;
          if (!n) return <span className="text-[var(--mute-soft)]">—</span>;
          return (
            <span
              className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-[12px] font-bold ${
                n === "A" ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--gold-soft)] text-[var(--gold-deep)]"
              }`}
            >
              {n}
            </span>
          );
        },
      },
      {
        id: "trangThai",
        header: "Trạng thái",
        size: 132,
        enableSorting: false,
        cell: ({ row }) => {
          const st = statusOf(row.original.trangThai);
          return <StatusBadge label={st.label} cls={st.cls} sm />;
        },
      },
      {
        id: "buoiKham",
        header: "Buổi khám",
        size: 220,
        enableSorting: false,
        meta: { noTruncate: true },
        cell: ({ row }) => {
          const name = fmtBuoiKhamName(row.original.buoiKham);
          return (
            <div className="min-w-0">
              <div className="truncate text-[12.5px] text-[var(--ink-soft)]" title={name}>
                {name}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[var(--mute)]">{fmtDate(row.original.buoiKham?.ngayKham)}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 84,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              data-tour="hs-info"
              onClick={() => setInfoId(row.original.id)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--navy)] hover:bg-[var(--navy-50)] border border-transparent hover:border-[var(--navy-100)] transition-colors cursor-pointer"
              title="Xem thông tin chi tiết hồ sơ"
              aria-label="Thông tin"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              data-tour="hs-history"
              onClick={() => setHistoryId(row.original.id)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--line)] transition-colors cursor-pointer"
              title="Xem lịch sử tương tác & thao tác"
              aria-label="Lịch sử"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      {/* bộ lọc + nút hành động */}
      <div data-tour="hs-filter" className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
          <div data-tour="hs-search" className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, mã BN, SĐT, CCCD…"
              className="input-field pl-9 pr-8 bg-white"
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
          <div className="flex-1 min-w-[150px] sm:flex-none sm:w-[210px]">
            <Dropdown value={tt} placeholder="Tất cả trạng thái" mono={false} labels={TT_LABELS} options={TT_OPTS} onChange={setTt} />
          </div>
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[180px]">
            <Dropdown value={nhom} placeholder="Tất cả nhóm" mono={false} labels={NHOM_LABELS} options={["", "A", "B"]} onChange={setNhom} />
          </div>
        </div>

        {/* Nút Đồng bộ Google Sheet (Chỉ Admin) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Nút Đồng bộ Google Sheet với Menu Lựa Chọn - Chỉ Admin */}
          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <div className="inline-flex rounded-lg shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheet(false)}
                  disabled={syncing}
                  className="btn border border-[var(--navy-100)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] h-9 px-3 text-[12.5px] font-bold flex items-center gap-1.5 rounded-l-lg rounded-r-none cursor-pointer disabled:opacity-50 transition-all"
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--navy)]" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                  )}
                  <span>{syncing ? "Đang đồng bộ…" : "Đồng bộ Google Sheet"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncMenuOpen((o) => !o)}
                  disabled={syncing}
                  className="btn border border-l-0 border-[var(--navy-100)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] h-9 px-2 rounded-r-lg rounded-l-none cursor-pointer disabled:opacity-50 transition-all"
                  title="Tùy chọn đồng bộ Sheet"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Menu thả xuống lựa chọn chế độ đồng bộ */}
              <AnimatePresence>
                {syncMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className="absolute right-0 mt-1 w-64 rounded-xl border border-[var(--line-strong)] bg-white dark:bg-slate-900 shadow-xl py-1 z-50 text-[12.5px] font-medium"
                  >
                    <button
                      type="button"
                      onClick={() => handleSyncGoogleSheet(false)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[var(--surface-soft)] dark:hover:bg-slate-800 text-[var(--ink)] dark:text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-[var(--navy)] dark:text-[var(--teal)] shrink-0" />
                      <div>
                        <div className="font-bold text-[12.5px]">Đồng bộ hàng đợi</div>
                        <div className="text-[11px] text-[var(--mute)]">Đẩy các thay đổi mới nhất lên Sheet</div>
                      </div>
                    </button>

                    <div className="border-t border-[var(--line)] dark:border-white/5 my-1"></div>

                    <button
                      type="button"
                      onClick={() => handleSyncGoogleSheet(true)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[var(--rose-soft)] dark:hover:bg-rose-950/40 text-[var(--rose)] flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-4 h-4 text-[var(--rose)] shrink-0" />
                      <div>
                        <div className="font-bold text-[12.5px]">Dựng lại Sheet từ đầu</div>
                        <div className="text-[11px] text-[var(--rose)]/80">Xóa dữ liệu cũ trên Sheet & đẩy lại 100%</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="text-xs text-[var(--mute)] font-medium">
            Tổng <span className="font-mono font-bold text-[var(--ink)]">{total.toLocaleString("vi-VN")}</span> hồ sơ
          </div>
        </div>
      </div>

      <DataView<HoSo, unknown>
        columns={columns}
        data={rows}
        isLoading={loading}
        manualPagination
        pageCount={Math.max(1, Math.ceil(total / pageSize))}
        total={total}
        pageSize={pageSize}
        pageIndex={Math.max(0, page - 1)}
        onPaginationChange={(pi, ps) => {
          setPage(pi + 1);
          setPageSize(ps);
        }}
      >
      <div className="card p-0 overflow-hidden mt-3">
        {/* Mobile: danh sách thẻ */}
        <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
          {loading && rows.length === 0 ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-[var(--mute)] text-[13px]">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-[var(--mute-soft)]" />
              Không có hồ sơ khớp điều kiện.
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[14px] text-[var(--ink)] truncate">{r.hoTen}</div>
                    <div className="font-mono text-[11px] font-bold text-[var(--navy)] mt-0.5">
                      <span className="text-[var(--mute-soft)] font-normal">BN-</span>
                      {r.maBN.replace(/^BN-?/i, "")}
                    </div>
                  </div>
                  <StatusBadge label={statusOf(r.trangThai).label} cls={statusOf(r.trangThai).cls} sm />
                </div>

                <div className="text-[12px] text-[var(--ink-soft)] space-y-1">
                  <div>
                    {[r.gioiTinh, fmtSinhTuoi(r)].filter(Boolean).join(" · ")}{r.nhom ? ` · Nhóm ${r.nhom}` : ""}
                    {bhytLevel(r.bhyt) ? ` · BHYT ${bhytLevel(r.bhyt)}` : ""}
                  </div>
                  <div className="text-[var(--mute)]">
                    Chẩn đoán: <span className="text-[var(--ink)]">{diagText(r) || "—"}</span>
                  </div>
                  <div className="text-[var(--mute)]">
                    Khuyến nghị: <span className="text-[var(--ink)]">{r.khuyenNghi || "—"}</span>
                  </div>
                  <div className="text-[var(--mute)]">
                    Buổi khám: {fmtBuoiKhamName(r.buoiKham)} · {fmtDate(r.buoiKham?.ngayKham)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => setInfoId(r.id)}
                    className="flex-1 justify-center px-2.5 py-2 rounded-[var(--r-sm)] bg-[var(--navy-50)] text-[var(--navy)] font-semibold text-xs flex items-center gap-1 border border-[var(--navy-100)] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Thông tin
                  </button>
                  <button
                    onClick={() => setHistoryId(r.id)}
                    className="flex-1 justify-center px-2.5 py-2 rounded-[var(--r-sm)] bg-[var(--surface-soft)] text-[var(--ink-soft)] font-semibold text-xs flex items-center gap-1 border border-[var(--line)] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" /> Lịch sử
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Bảng dữ liệu (TanStack — chuẩn VISIHUB) */}
        <div className="hidden md:block" data-tour="hs-table">
          <DataTable<HoSo>
            dense
            emptyIcon={ClipboardList}
            emptyTitle="Không có hồ sơ khớp điều kiện"
            onRowClick={(r) => setInfoId(r.id)}
          />
        </div>

        <DataPagination pageSizeOptions={PAGE_SIZE_OPTS} />
      </div>
      </DataView>

      {infoId && <PatientInfoModal hoSoId={infoId} onClose={() => setInfoId(null)} />}
      {historyId && <PatientHistoryModal hoSoId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

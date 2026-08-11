"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2,
  Search,
  ClipboardList,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  RotateCw,
} from "lucide-react";
import { ageOf, fmtDate, fmtBuoiKhamName, parseDiag, statusOf, bhytLevel, type HoSo } from "@/lib/csr";
import { Dropdown, StatusBadge } from "@/components/csr/fields";
import { SkeletonTable } from "@/components/layout/Skeleton";
import PageHeader from "@/components/layout/PageHeader";
import { PatientInfoModal, PatientHistoryModal } from "@/components/csr/PatientModals";
import { useToast } from "@/components/providers/ToastProvider";

const TT_OPTS = ["", "TiepNhan", "DaKham", "TheoDoi", "CoChiDinhMo", "NhomA", "NhomB", "DaMoHauPhau", "HuyKhongDen"];
const TT_LABELS: Record<string, string> = Object.fromEntries(TT_OPTS.filter(Boolean).map((k) => [k, statusOf(k).label]));
const NHOM_LABELS = { A: "Nhóm A · đã chốt mổ", B: "Nhóm B · theo dõi" };
const PAGE_SIZE_OPTS = [20, 50, 100, 200];

export default function HoSoPage() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tt, setTt] = useState("");
  const [nhom, setNhom] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
          setTotalPages(data.totalPages || 1);
        } else {
          setRows(data);
          setTotal(data.length);
          setTotalPages(1);
        }
      } else {
        setRows([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
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

  // Tạo dải số trang cần hiển thị
  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div>
      <PageHeader
        title="Hồ sơ bệnh nhân"
        description="Tra cứu toàn bộ hồ sơ trong cơ sở. Lọc theo trạng thái / nhóm, tìm theo tên · mã · SĐT · CCCD."
        guide={[
          { selector: '[data-tour="hs-search"]', title: "Tìm kiếm hồ sơ", desc: "Nhập tên, mã bệnh nhân, số điện thoại hoặc CCCD vào ô này." },
          { selector: '[data-tour="hs-filter"]', title: "Lọc danh sách", desc: "Dùng bộ lọc theo trạng thái hoặc nhóm (A/B) để thu hẹp kết quả." },
          { selector: '[data-tour="hs-info"]', title: "Xem thông tin", desc: 'Bấm "Thông tin" ở mỗi dòng để xem chi tiết hồ sơ bệnh nhân.' },
          { selector: '[data-tour="hs-history"]', title: "Xem lịch sử", desc: 'Bấm "Lịch sử" để xem toàn bộ thao tác đã thực hiện trên hồ sơ.' },
        ]}
        guideTip="Đây là nơi tra cứu tổng hợp toàn bộ hồ sơ của cơ sở đang làm việc."
      />

      {/* bộ lọc + nút hành động */}
      <div data-tour="hs-filter" className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mt-5">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
          <div data-tour="hs-search" className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, mã BN, SĐT, CCCD…"
              className="input-field pl-9 bg-white"
            />
          </div>
          <div className="flex-1 min-w-[150px] sm:flex-none sm:w-[210px]">
            <Dropdown value={tt} placeholder="Tất cả trạng thái" mono={false} labels={TT_LABELS} options={TT_OPTS} onChange={setTt} />
          </div>
          <div className="flex-1 min-w-[135px] sm:flex-none sm:w-[180px]">
            <Dropdown value={nhom} placeholder="Tất cả nhóm" mono={false} labels={NHOM_LABELS} options={["", "A", "B"]} onChange={setNhom} />
          </div>
        </div>

        {/* Nút Đồng bộ Google Sheet + Chọn số bản ghi mỗi trang */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Nút Đồng bộ Google Sheet với Menu Lựa Chọn */}
          <div className="relative" ref={menuRef}>
            <div className="inline-flex rounded-lg shadow-xs">
              <button
                type="button"
                onClick={() => handleSyncGoogleSheet(false)}
                disabled={syncing}
                className="btn border border-[var(--navy-100)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] h-9 px-3 text-[12.5px] font-bold flex items-center gap-1.5 rounded-l-lg rounded-r-none cursor-pointer disabled:opacity-50"
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
                className="btn border border-l-0 border-[var(--navy-100)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] h-9 px-2 rounded-r-lg rounded-l-none cursor-pointer disabled:opacity-50"
                title="Tùy chọn đồng bộ Sheet"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu thả xuống lựa chọn chế độ đồng bộ */}
            {syncMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-xl border border-[var(--line-strong)] bg-white shadow-lg py-1 z-50 text-[12.5px] font-medium animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheet(false)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-soft)] text-[var(--ink)] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-[var(--navy)] shrink-0" />
                  <div>
                    <div className="font-bold text-[12.5px]">Đồng bộ hàng đợi</div>
                    <div className="text-[11px] text-[var(--mute)]">Đẩy các thay đổi mới nhất lên Sheet</div>
                  </div>
                </button>

                <div className="border-t border-[var(--line)] my-1"></div>

                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheet(true)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--rose-soft)] text-[var(--rose)] flex items-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 text-[var(--rose)] shrink-0" />
                  <div>
                    <div className="font-bold text-[12.5px]">Dựng lại Sheet từ đầu</div>
                    <div className="text-[11px] text-[var(--rose)]/80">Xóa dữ liệu cũ trên Sheet & đẩy lại 100%</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--mute)] font-medium">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="input-field h-9 py-0 px-2 font-mono text-[12px] bg-white w-20 cursor-pointer"
            >
              {PAGE_SIZE_OPTS.map((sz) => (
                <option key={sz} value={sz}>
                  {sz} / trang
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mt-3">
        {/* Mobile: danh sách thẻ */}
        <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
          {loading ? (
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
                    {r.gioiTinh} · {ageOf(r)} tuổi{r.nhom ? ` · Nhóm ${r.nhom}` : ""}
                    {bhytLevel(r.bhyt) ? ` · BHYT ${bhytLevel(r.bhyt)}` : ""}
                  </div>
                  <div className="text-[var(--mute)]">
                    Chẩn đoán: <span className="text-[var(--ink)]">{parseDiag(r.chanDoan).join(", ") || "—"}</span>
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

        {/* Desktop: Bảng dữ liệu */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left border-collapse">
            <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
              <tr>
                {[
                  "Mã BN",
                  "Họ tên",
                  "Giới / Tuổi",
                  "Chẩn đoán",
                  "Khuyến nghị",
                  "BHYT",
                  "Nhóm",
                  "Trạng thái",
                  "Buổi khám",
                  "Thao tác",
                ].map((h) => (
                  <th key={h} className={`py-3 px-3.5 border-b border-[var(--line)] whitespace-nowrap ${h === "Thao tác" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
              {loading ? (
                <SkeletonTable rows={10} cols={10} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[var(--mute)]">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-[var(--mute-soft)]" />
                    Không có hồ sơ khớp điều kiện.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--surface-soft)] transition-colors border-b border-[var(--line-soft)] group">
                    <td className="py-3.5 px-3.5 align-middle font-mono font-bold text-[var(--navy)] text-[11.5px] whitespace-nowrap">
                      <span className="text-[var(--mute-soft)] font-normal">BN-</span>
                      {r.maBN.replace(/^BN-?/i, "")}
                    </td>
                    <td className="py-3.5 px-3.5 align-middle font-bold text-[var(--ink)] whitespace-nowrap text-[13px] group-hover:text-[var(--navy)]">
                      {r.hoTen}
                    </td>
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                      {r.gioiTinh} · {ageOf(r)}t
                    </td>
                    <td className="py-3.5 px-3.5 align-middle max-w-[220px] truncate" title={parseDiag(r.chanDoan).join(", ")}>
                      {parseDiag(r.chanDoan).join(", ") || "—"}
                    </td>
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">{r.khuyenNghi || "—"}</td>
                    <td className="py-3.5 px-3.5 align-middle font-mono whitespace-nowrap">{bhytLevel(r.bhyt) || "—"}</td>
                    <td className="py-3.5 px-3.5 align-middle text-center font-bold">{r.nhom || "—"}</td>
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                      <StatusBadge label={statusOf(r.trangThai).label} cls={statusOf(r.trangThai).cls} sm />
                    </td>
                    <td className="py-3.5 px-3.5 align-middle text-xs text-[var(--mute)] whitespace-nowrap">
                      {fmtBuoiKhamName(r.buoiKham)} · {fmtDate(r.buoiKham?.ngayKham)}
                    </td>
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          data-tour="hs-info"
                          onClick={() => setInfoId(r.id)}
                          className="px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] font-semibold text-xs flex items-center gap-1 transition border border-[var(--navy-100)] cursor-pointer"
                          title="Xem thông tin chi tiết hồ sơ"
                        >
                          <Eye className="w-3.5 h-3.5" /> Thông tin
                        </button>
                        <button
                          data-tour="hs-history"
                          onClick={() => setHistoryId(r.id)}
                          className="px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--surface-soft)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] font-semibold text-xs flex items-center gap-1 transition border border-[var(--line)] cursor-pointer"
                          title="Xem lịch sử tương tác & thao tác (Google Sheet style)"
                        >
                          <Clock className="w-3.5 h-3.5" /> Lịch sử
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Pagination Bar) */}
        <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--mute)] font-medium">
          <div>
            Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{startItem.toLocaleString("vi-VN")}–{endItem.toLocaleString("vi-VN")}</span> trong tổng số{" "}
            <span className="font-mono font-bold text-[var(--ink)]">{total.toLocaleString("vi-VN")}</span> hồ sơ
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                title="Trang đầu"
                className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                title="Trang trước"
                className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {getPageNumbers().map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  disabled={loading}
                  className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                    pNum === page
                      ? "bg-[var(--navy)] text-white shadow-xs"
                      : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                title="Trang kế"
                className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                title="Trang cuối"
                className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {infoId && <PatientInfoModal hoSoId={infoId} onClose={() => setInfoId(null)} />}
      {historyId && <PatientHistoryModal hoSoId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

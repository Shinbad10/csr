"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, ClipboardList, Eye, Clock } from "lucide-react";
import { ageOf, fmtDate, parseDiag, statusOf, bhytLevel, type HoSo } from "@/lib/csr";
import { Dropdown, StatusBadge } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import { PatientInfoModal, PatientHistoryModal } from "@/components/csr/PatientModals";

const TT_OPTS = ["", "TiepNhan", "DaKham", "TheoDoi", "CoChiDinhMo", "NhomA", "NhomB", "DaMoHauPhau", "HuyKhongDen"];
const TT_LABELS: Record<string, string> = Object.fromEntries(TT_OPTS.filter(Boolean).map((k) => [k, statusOf(k).label]));
const NHOM_LABELS = { A: "Nhóm A · đã chốt mổ", B: "Nhóm B · theo dõi" };

export default function HoSoPage() {
  const [rows, setRows] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tt, setTt] = useState("");
  const [nhom, setNhom] = useState("");
  const [infoId, setInfoId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (tt) sp.set("trangThai", tt);
    const res = await fetch(`/api/csr/hoso?${sp.toString()}`);
    let data: HoSo[] = res.ok ? await res.json() : [];
    if (nhom) data = data.filter((r) => r.nhom === nhom);
    setRows(data); setLoading(false);
  }, [search, tt, nhom]);

  useEffect(() => { const t = setTimeout(() => { (async () => { await load(); })(); }, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <PageHeader
        title="Hồ sơ bệnh nhân"
        description="Tra cứu toàn bộ hồ sơ trong cơ sở. Lọc theo trạng thái / nhóm, tìm theo tên · mã · SĐT · CCCD."
        guide={[
          { selector: '[data-tour="hs-search"]', title: "Tìm kiếm hồ sơ", desc: "Nhập tên, mã bệnh nhân, số điện thoại hoặc CCCD vào ô này." },
          { selector: '[data-tour="hs-filter"]', title: "Lọc danh sách", desc: "Dùng bộ lọc theo trạng thái hoặc nhóm (A/B) để thu hẹp kết quả." },
          { selector: '[data-tour="hs-info"]', title: "Xem thông tin", desc: "Bấm \"Thông tin\" ở mỗi dòng để xem chi tiết hồ sơ bệnh nhân." },
          { selector: '[data-tour="hs-history"]', title: "Xem lịch sử", desc: "Bấm \"Lịch sử\" để xem toàn bộ thao tác đã thực hiện trên hồ sơ." },
        ]}
        guideTip="Đây là nơi tra cứu tổng hợp toàn bộ hồ sơ của cơ sở đang làm việc."
      />

      {/* bộ lọc — ĐỂ NGOÀI card overflow-hidden để dropdown không bị cắt */}
      <div data-tour="hs-filter" className="flex flex-wrap items-center gap-3 mt-5">
        <div data-tour="hs-search" className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, mã BN, SĐT, CCCD…" className="input-field pl-9 bg-white" />
        </div>
        <div className="w-[210px]"><Dropdown value={tt} placeholder="Tất cả trạng thái" mono={false} labels={TT_LABELS} options={TT_OPTS} onChange={setTt} /></div>
        <div className="w-[180px]"><Dropdown value={nhom} placeholder="Tất cả nhóm" mono={false} labels={NHOM_LABELS} options={["", "A", "B"]} onChange={setNhom} /></div>
      </div>

      <div className="card p-0 overflow-hidden mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
              <tr>
                {["Mã BN", "Họ tên", "Giới / Tuổi", "Chẩn đoán", "Khuyến nghị", "BHYT", "Nhóm", "Trạng thái", "Buổi khám", "Thao tác"].map((h) => <th key={h} className={`py-3 px-3.5 border-b border-[var(--line)] whitespace-nowrap ${h === "Thao tác" ? "text-right" : ""}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
              {loading ? <tr><td colSpan={10} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--navy)] mx-auto" /></td></tr>
              : rows.length === 0 ? <tr><td colSpan={10} className="py-16 text-center text-[var(--mute)]"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-[var(--mute-soft)]" />Không có hồ sơ khớp điều kiện.</td></tr>
              : rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-soft)] transition-colors border-b border-[var(--line-soft)] group">
                  <td className="py-3.5 px-3.5 align-middle font-mono font-bold text-[var(--navy)] text-[11.5px] whitespace-nowrap">
                    <span className="text-[var(--mute-soft)] font-normal">BN-</span>{r.maBN.replace(/^BN-?/i, "")}
                  </td>
                  <td className="py-3.5 px-3.5 align-middle font-bold text-[var(--ink)] whitespace-nowrap text-[13px] group-hover:text-[var(--navy)]">{r.hoTen}</td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">{r.gioiTinh} · {ageOf(r)}t</td>
                  <td className="py-3.5 px-3.5 align-middle max-w-[220px] truncate" title={parseDiag(r.chanDoan).join(", ")}>{parseDiag(r.chanDoan).join(", ") || "—"}</td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">{r.khuyenNghi || "—"}</td>
                  <td className="py-3.5 px-3.5 align-middle font-mono whitespace-nowrap">{bhytLevel(r.bhyt) || "—"}</td>
                  <td className="py-3.5 px-3.5 align-middle text-center font-bold">{r.nhom || "—"}</td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap"><StatusBadge label={statusOf(r.trangThai).label} cls={statusOf(r.trangThai).cls} sm /></td>
                  <td className="py-3.5 px-3.5 align-middle text-xs text-[var(--mute)] whitespace-nowrap">Xã {r.buoiKham?.xa} · {fmtDate(r.buoiKham?.ngayKham)}</td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        data-tour="hs-info"
                        onClick={() => setInfoId(r.id)}
                        className="px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--navy-50)] text-[var(--navy)] hover:bg-[var(--navy-100)] font-semibold text-xs flex items-center gap-1 transition border border-[var(--navy-100)]"
                        title="Xem thông tin chi tiết hồ sơ"
                      >
                        <Eye className="w-3.5 h-3.5" /> Thông tin
                      </button>
                      <button
                        data-tour="hs-history"
                        onClick={() => setHistoryId(r.id)}
                        className="px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--surface-soft)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] font-semibold text-xs flex items-center gap-1 transition border border-[var(--line)]"
                        title="Xem lịch sử tương tác & thao tác (Google Sheet style)"
                      >
                        <Clock className="w-3.5 h-3.5" /> Lịch sử
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
          <div>
            Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{rows.length > 0 ? 1 : 0}–{rows.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{rows.length}</span> hồ sơ
          </div>
          <div className="flex items-center gap-1 font-mono">
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
            <button className="w-7 h-7 rounded flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
          </div>
        </div>
      </div>

      {infoId && <PatientInfoModal hoSoId={infoId} onClose={() => setInfoId(null)} />}
      {historyId && <PatientHistoryModal hoSoId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

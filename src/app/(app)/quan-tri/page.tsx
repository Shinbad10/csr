"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Plus, Building2, Users, ScrollText, X, Check, Pencil, Trash2, FileSpreadsheet, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { fmtTime } from "@/lib/csr";
import { roleLabel } from "@/lib/permissions";
import { Field, Dropdown, StatusBadge, SectionHeader } from "@/components/csr/fields";

interface CoSo { id: string; ten: string; diaChi: string | null; trangThai: string; bhxhUser?: string | null; bhxhPass?: string | null; bhxhMaCSKCB?: string | null; bhxhHoTenCB?: string | null; bhxhCccdCB?: string | null; hisHost?: string | null; hisPort?: string | null; hisUser?: string | null; hisPass?: string | null; hisDbName?: string | null }
interface NguoiDung { maNV: string; hoTen: string; vaiTro: string; coSoId: string | null; tenDangNhap: string; trangThai: string; coSo?: { ten: string } }
interface Audit { id: number; bang: string; banGhiId: string; hanhDong: string; nguoiDung: string; thoiDiem: string }

const ROLES = ["CSKH", "TuVanVien", "KeToan", "QuanLy"];

export default function QuanTriPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"coso" | "nguoidung" | "audit" | "gsheet">("coso");
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [users, setUsers] = useState<NguoiDung[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "coso" | "user"; rec?: CoSo | NguoiDung } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [selectedCosos, setSelectedCosos] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const changeTab = (k: "coso" | "nguoidung" | "audit" | "gsheet") => { setTab(k); setSelectedCosos(new Set()); setSelectedUsers(new Set()); };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [c, u, a] = await Promise.all([fetch("/api/csr/coso?all=1"), fetch("/api/csr/nguoidung"), fetch("/api/csr/audit")]);
    if (c.ok) setCosos(await c.json());
    if (u.ok) setUsers(await u.json());
    if (a.ok) setAudits(await a.json());
    if (!silent) setLoading(false);
  }, []);
  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const lockCoso = (id: string) => {
    setConfirmDialog({
      title: "Xóa cơ sở",
      message: "Bạn có chắc chắn muốn xóa cơ sở này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos(prev => prev.filter(c => c.id !== id)); // Optimistic UI
        const res = await fetch(`/api/csr/coso/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { addToast({ type: "success", message: "Đã xóa cơ sở." }); load(true); } else { addToast({ type: "error", message: data.error || "Lỗi" }); load(true); }
      }
    });
  };
  const lockUser = (id: string) => {
    setConfirmDialog({
      title: "Xóa tài khoản",
      message: "Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers(prev => prev.filter(u => u.maNV !== id)); // Optimistic UI
        const res = await fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { addToast({ type: "success", message: "Đã xóa tài khoản." }); load(true); } else { addToast({ type: "error", message: data.error || "Lỗi" }); load(true); }
      }
    });
  };

  const bulkDeleteCosos = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt cơ sở",
      message: `Bạn có chắc chắn muốn xóa ${selectedCosos.size} cơ sở đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setCosos(prev => prev.filter(c => !selectedCosos.has(c.id))); // Optimistic UI
        const results = await Promise.all(Array.from(selectedCosos).map(id => fetch(`/api/csr/coso/${id}`, { method: "DELETE" })));
        const success = results.filter(r => r.ok).length;
        const failed = results.length - success;
        addToast({ type: success > 0 ? "success" : "error", message: `Đã xóa ${success} cơ sở.${failed > 0 ? ` Lỗi ${failed} cơ sở.` : ""}` });
        setSelectedCosos(new Set());
        await load(true);
      }
    });
  };

  const bulkDeleteUsers = () => {
    setConfirmDialog({
      title: "Xóa hàng loạt tài khoản",
      message: `Bạn có chắc chắn muốn xóa ${selectedUsers.size} tài khoản đã chọn?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setUsers(prev => prev.filter(u => !selectedUsers.has(u.maNV))); // Optimistic UI
        const results = await Promise.all(Array.from(selectedUsers).map(id => fetch(`/api/csr/nguoidung/${id}`, { method: "DELETE" })));
        const success = results.filter(r => r.ok).length;
        const failed = results.length - success;
        addToast({ type: success > 0 ? "success" : "error", message: `Đã xóa ${success} tài khoản.${failed > 0 ? ` Lỗi ${failed} tài khoản.` : ""}` });
        setSelectedUsers(new Set());
        await load(true);
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Quản trị hệ thống"
        description="Cơ sở, tài khoản (gán vai trò + cơ sở) và nhật ký kiểm toán. Xoá có ràng buộc → ngừng hoạt động (BR-13)."
        guide={[
          { selector: '[data-tour="qt-tabs"]', title: "Chọn mục quản trị", desc: "Dùng các tab: Cơ sở, Tài khoản, Google Sheet, Nhật ký." },
          { selector: '[data-tour="qt-table"]', title: "Quản lý cơ sở", desc: "Xem/sửa danh sách cơ sở. Bấm \"Thêm cơ sở\" để tạo mới và cấu hình kết nối BHYT / HIS." },
          { title: "Quản lý tài khoản", desc: "Ở tab \"Tài khoản\": tạo tài khoản, gán vai trò và cơ sở làm việc cho từng người dùng." },
          { title: "Cấu hình Google Sheet", desc: "Ở tab \"Google Sheet\": gán ID Google Sheet cho từng cơ sở để đồng bộ báo cáo." },
          { title: "Xem nhật ký kiểm toán", desc: "Tab \"Nhật ký\" ghi lại các thao tác quan trọng trong hệ thống." },
        ]}
        guideTip={'Bản ghi đang có ràng buộc dữ liệu sẽ được chuyển sang "ngừng hoạt động" thay vì xoá cứng (BR-13).'}
      />

      <div data-tour="qt-tabs" className="flex items-center gap-1 mt-5 bg-white border border-[var(--line)] rounded-[var(--r-md)] p-1 w-full sm:w-fit overflow-x-auto hide-scrollbar">
        {([["coso", "Cơ sở", Building2], ["nguoidung", "Tài khoản", Users], ["gsheet", "Google Sheet", FileSpreadsheet], ["audit", "Nhật ký", ScrollText]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => changeTab(k)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r-sm)] text-[13px] font-bold whitespace-nowrap ${tab === k ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}><Icon className="w-4 h-4 shrink-0" /> {label}</button>
        ))}
      </div>

      {loading ? <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" /></div> : (
        <div className="mt-4">
          {(tab === "coso" || tab === "nguoidung") && (
            <div className="flex flex-col-reverse sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {tab === "coso" && selectedCosos.size > 0 && (
                  <button onClick={bulkDeleteCosos} className="btn w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-[var(--r-md)] shadow-[var(--shadow-sm)] transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> Xóa {selectedCosos.size} đã chọn</button>
                )}
                {tab === "nguoidung" && selectedUsers.size > 0 && (
                  <button onClick={bulkDeleteUsers} className="btn w-full sm:w-auto px-4 py-2 text-[13px] font-bold text-[var(--rose)] bg-[var(--rose-soft)] hover:bg-[var(--rose)] hover:text-white rounded-[var(--r-md)] shadow-[var(--shadow-sm)] transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> Xóa {selectedUsers.size} đã chọn</button>
                )}
              </div>
              <button onClick={() => setModal({ type: tab === "coso" ? "coso" : "user" })} className="btn btn-primary w-full sm:w-auto px-5 py-2.5 text-[13px] font-bold flex justify-center items-center gap-2 shadow-[var(--shadow-sm)]"><Plus className="w-4 h-4 text-[var(--teal)]" /> Thêm {tab === "coso" ? "cơ sở" : "tài khoản"}</button>
            </div>
          )}

          {tab === "coso" && (
            <div data-tour="qt-table" className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-[13px]">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]"><tr>
                    <th className="py-3.5 px-3.5 border-b border-[var(--line)] w-12"><input type="checkbox" className="rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer" checked={cosos.length > 0 && selectedCosos.size === cosos.length} onChange={(e) => setSelectedCosos(e.target.checked ? new Set(cosos.map(c => c.id)) : new Set())} /></th>
                    {["Mã", "Tên cơ sở", "Địa chỉ", "Trạng thái", "Thao tác"].map((h) => <th key={h} className={`py-3.5 px-3.5 border-b border-[var(--line)] ${h === "Thao tác" ? "text-right" : ""}`}>{h}</th>)}
                  </tr></thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {cosos.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-[var(--mute)]">Chưa có cơ sở nào.</td></tr>
                    : cosos.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                        <td className="py-3.5 px-3.5"><input type="checkbox" className="rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer" checked={selectedCosos.has(c.id)} onChange={(e) => { const n = new Set(selectedCosos); if (e.target.checked) n.add(c.id); else n.delete(c.id); setSelectedCosos(n); }} /></td>
                        <td className="py-3.5 px-3.5 font-mono font-bold text-[var(--teal-deep)]">{c.id}</td>
                        <td className="py-3.5 px-3.5 font-bold text-[var(--ink)]">{c.ten}</td>
                        <td className="py-3.5 px-3.5 text-[var(--mute)] whitespace-nowrap">{c.diaChi || "—"}</td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">{c.trangThai === "active" ? <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" /> : <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" />}</td>
                        <td className="py-3.5 px-3.5"><div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><button onClick={() => setModal({ type: "coso", rec: c })} className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Sửa"><Pencil className="w-4 h-4" /></button><button onClick={() => lockCoso(c.id)} className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]" title="Xóa cơ sở"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                Tổng số <span className="font-mono font-bold text-[var(--ink)]">{cosos.length}</span> cơ sở
              </div>
            </div>
          )}

          {tab === "nguoidung" && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]"><tr>
                    <th className="py-3.5 px-3.5 border-b border-[var(--line)] w-12"><input type="checkbox" className="rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer" checked={users.length > 0 && selectedUsers.size === users.length} onChange={(e) => setSelectedUsers(e.target.checked ? new Set(users.map(u => u.maNV)) : new Set())} /></th>
                    {["Mã NV", "Họ tên", "Vai trò", "Cơ sở", "Đăng nhập", "Trạng thái", "Thao tác"].map((h) => <th key={h} className={`py-3.5 px-3.5 border-b border-[var(--line)] ${h === "Thao tác" ? "text-right whitespace-nowrap" : "whitespace-nowrap"}`}>{h}</th>)}
                  </tr></thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {users.length === 0 ? <tr><td colSpan={8} className="py-16 text-center text-[var(--mute)]">Chưa có tài khoản nào.</td></tr>
                    : users.map((u) => (
                      <tr key={u.maNV} className="hover:bg-[var(--surface-hover)] transition-colors group">
                        <td className="py-3.5 px-3.5"><input type="checkbox" className="rounded-[4px] border-[var(--line-heavy)] text-[var(--navy)] focus:ring-[var(--navy)] w-4 h-4 cursor-pointer" checked={selectedUsers.has(u.maNV)} onChange={(e) => { const n = new Set(selectedUsers); if (e.target.checked) n.add(u.maNV); else n.delete(u.maNV); setSelectedUsers(n); }} /></td>
                        <td className="py-3.5 px-3.5 font-mono font-bold text-[var(--teal-deep)] whitespace-nowrap">{u.maNV}</td>
                        <td className="py-3.5 px-3.5 font-bold text-[var(--ink)] whitespace-nowrap">{u.hoTen}</td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">{roleLabel(u.vaiTro)}</span></td>
                        <td className="py-3.5 px-3.5 text-[var(--mute)] font-medium whitespace-nowrap">{u.coSo?.ten || "Toàn hệ thống"}</td>
                        <td className="py-3.5 px-3.5 font-mono text-xs whitespace-nowrap">{u.tenDangNhap}</td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">{u.trangThai === "active" ? <StatusBadge label="Hoạt động" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" /> : <StatusBadge label="Đã xóa" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" />}</td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap"><div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><button onClick={() => setModal({ type: "user", rec: u })} className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Sửa"><Pencil className="w-4 h-4" /></button><button onClick={() => lockUser(u.maNV)} className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)]" title="Xóa tài khoản"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                Tổng số <span className="font-mono font-bold text-[var(--ink)]">{users.length}</span> tài khoản
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-[13px]">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]"><tr>{["Thời điểm", "Người dùng", "Hành động", "Bảng", "Bản ghi"].map((h) => <th key={h} className="py-3.5 px-3.5 border-b border-[var(--line)] whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {audits.length === 0 ? <tr><td colSpan={5} className="py-16 text-center text-[var(--mute)]">Chưa có nhật ký kiểm toán.</td></tr>
                    : audits.map((a) => (
                      <tr key={a.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-3.5 px-3.5 font-mono text-[11.5px] text-[var(--mute)] whitespace-nowrap">{fmtTime(a.thoiDiem)}</td>
                        <td className="py-3.5 px-3.5 font-mono font-bold text-[var(--navy)] whitespace-nowrap">{a.nguoiDung}</td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--ink-soft)] border border-[var(--line)] uppercase tracking-wider">{a.hanhDong}</span></td>
                        <td className="py-3.5 px-3.5 text-[var(--mute)] font-mono text-[11.5px] whitespace-nowrap">{a.bang}</td>
                        <td className="py-3.5 px-3.5 font-mono text-[11.5px] text-[var(--mute)] whitespace-nowrap">{a.banGhiId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--mute)] font-medium">
                Tổng số <span className="font-mono font-bold text-[var(--ink)]">{audits.length}</span> bản ghi
              </div>
            </div>
          )}

          {tab === "gsheet" && <GoogleSheetPanel />}
        </div>
      )}

      {modal?.type === "coso" && <CoSoModal cosos={cosos} edit={modal.rec as CoSo | undefined} onClose={() => setModal(null)} onDone={() => { setModal(null); load(true); }} />}
      {modal?.type === "user" && <UserModal cosos={cosos} users={users} edit={modal.rec as NguoiDung | undefined} onClose={() => setModal(null)} onDone={() => { setModal(null); load(true); }} />}
      
      {confirmDialog && (
        <Modal open={true} title={confirmDialog.title} onClose={() => setConfirmDialog(null)} maxWidth="max-w-[460px]">
          <div className="py-2">
            <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--line-soft)]">
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl">Hủy</button>
              <button onClick={confirmDialog.onConfirm} className="btn px-5 py-2.5 font-bold text-white bg-[var(--rose)] hover:bg-[#e11d48] rounded-xl shadow-sm">Xóa dữ liệu</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CoSoModal({ cosos, edit, onClose, onDone }: { cosos: CoSo[]; edit?: CoSo; onClose: () => void; onDone: () => void }) {
  const { addToast } = useToast();
  const autoId = useMemo(() => {
    if (edit) return edit.id;
    let maxNum = 0;
    cosos.forEach((c) => {
      const match = c.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `CS${String(maxNum + 1).padStart(2, "0")}`;
  }, [edit, cosos]);

  const [id, setId] = useState(edit?.id ?? autoId); const [ten, setTen] = useState(edit?.ten ?? ""); const [diaChi, setDiaChi] = useState(edit?.diaChi ?? "");
  const [bhxhUser, setBhxhUser] = useState(edit?.bhxhUser ?? ""); const [bhxhPass, setBhxhPass] = useState(edit?.bhxhPass ?? "");
  const [bhxhMaCSKCB, setBhxhMaCSKCB] = useState(edit?.bhxhMaCSKCB ?? ""); const [bhxhHoTenCB, setBhxhHoTenCB] = useState(edit?.bhxhHoTenCB ?? ""); const [bhxhCccdCB, setBhxhCccdCB] = useState(edit?.bhxhCccdCB ?? "");
  const [hisHost, setHisHost] = useState(edit?.hisHost ?? ""); const [hisPort, setHisPort] = useState(edit?.hisPort ?? "1433");
  const [hisUser, setHisUser] = useState(edit?.hisUser ?? ""); const [hisPass, setHisPass] = useState(edit?.hisPass ?? ""); const [hisDbName, setHisDbName] = useState(edit?.hisDbName ?? "");
  const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    const res = await fetch(edit ? `/api/csr/coso/${edit.id}` : "/api/csr/coso", { method: edit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ten, diaChi, bhxhUser, bhxhPass, bhxhMaCSKCB, bhxhHoTenCB, bhxhCccdCB, hisHost, hisPort, hisUser, hisPass, hisDbName }) });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setErr(d.error || "Lỗi"); return; }
    addToast({ type: "success", message: edit ? "Đã cập nhật cơ sở." : "Đã thêm cơ sở." }); onDone();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={edit ? "Sửa thông tin cơ sở" : "Thêm cơ sở y tế mới"}
      subtitle={
        edit ? (
          <span className="flex items-center gap-2">
            <span>Quản lý thông tin chi nhánh & cấu hình</span>
            <span className="font-mono text-[11.5px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] px-2 py-0.5 rounded border border-[var(--teal)]">Mã CS: {edit.id}</span>
          </span>
        ) : (
          "Quản lý thông tin chi nhánh & cấu hình kết nối BHYT / HIS"
        )
      }
      icon={Building2}
      maxWidth="max-w-[700px]"
      noPadding
    >
      <form onSubmit={submit} className="p-7 space-y-6 bg-white">
        {err && <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2"><X className="w-4 h-4 shrink-0" /> {err}</div>}
        
        <div className="space-y-4">
          <SectionHeader n={1} accent="Thông tin chung" />
          <Field label="Tên cơ sở" required>
            <input value={ten} onChange={(e) => setTen(e.target.value)} required className="input-field h-10 font-semibold text-[14.5px]" placeholder="VD: Bệnh viện Mắt VISI Đắk Lắk" />
          </Field>
          <Field label="Địa chỉ cơ sở">
            <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field h-10" placeholder="Số nhà, đường, phường/xã, tỉnh/thành..." />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={2} accent="Cấu hình tra cứu BHYT" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tài khoản BHXH"><input value={bhxhUser} onChange={(e) => setBhxhUser(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 0101000..." /></Field>
            <Field label="Mật khẩu BHXH"><input type="password" value={bhxhPass} onChange={(e) => setBhxhPass(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder={edit && edit.bhxhPass ? "••••••••" : "Nhập mật khẩu..."} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Mã CSKCB"><input value={bhxhMaCSKCB} onChange={(e) => setBhxhMaCSKCB(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 01001" /></Field>
            <Field label="Họ tên cán bộ"><input value={bhxhHoTenCB} onChange={(e) => setBhxhHoTenCB(e.target.value)} className="input-field text-[13.5px] h-10" placeholder="Họ tên CB tra cứu" /></Field>
            <Field label="CCCD cán bộ"><input value={bhxhCccdCB} onChange={(e) => setBhxhCccdCB(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="Số CCCD cán bộ" /></Field>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={3} accent="Cấu hình HIS (SQL Server)" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="IP / Host HIS"><input value={hisHost} onChange={(e) => setHisHost(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: 192.168.10.250" /></Field>
            <Field label="Cổng (Port)"><input value={hisPort} onChange={(e) => setHisPort(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="1433" /></Field>
            <Field label="Tên Database"><input value={hisDbName} onChange={(e) => setHisDbName(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: shpt_phongKham" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tài khoản SQL HIS"><input value={hisUser} onChange={(e) => setHisUser(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder="VD: reader" /></Field>
            <Field label="Mật khẩu SQL HIS"><input type="password" value={hisPass} onChange={(e) => setHisPass(e.target.value)} className="input-field font-mono text-[13.5px] h-10" placeholder={edit && edit.hisPass ? "••••••••" : "Nhập mật khẩu HIS..."} /></Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} {edit ? "Lưu thay đổi" : "Tạo cơ sở"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UserModal({ cosos, users, edit, onClose, onDone }: { cosos: CoSo[]; users: NguoiDung[]; edit?: NguoiDung; onClose: () => void; onDone: () => void }) {
  const { addToast } = useToast();
  const autoMaNV = useMemo(() => {
    if (edit) return edit.maNV;
    let maxNum = 0;
    users.forEach((u) => {
      const match = u.maNV.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `NV${String(maxNum + 1).padStart(2, "0")}`;
  }, [edit, users]);

  const [maNV, setMaNV] = useState(edit?.maNV ?? autoMaNV); const [hoTen, setHoTen] = useState(edit?.hoTen ?? ""); const [vaiTro, setVaiTro] = useState(edit?.vaiTro ?? "CSKH"); const [coSoId, setCoSoId] = useState(edit?.coSoId ?? ""); const [tenDangNhap, setTen] = useState(edit?.tenDangNhap ?? ""); const [matKhau, setMk] = useState(""); const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    const body = edit ? { hoTen, vaiTro, coSoId, matKhau: matKhau || undefined } : { maNV, hoTen, vaiTro, coSoId, tenDangNhap, matKhau };
    const res = await fetch(edit ? `/api/csr/nguoidung/${edit.maNV}` : "/api/csr/nguoidung", { method: edit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setErr(d.error || "Lỗi"); return; }
    addToast({ type: "success", message: edit ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản." }); onDone();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={edit ? "Sửa thông tin tài khoản" : "Thêm tài khoản người dùng"}
      subtitle={
        edit ? (
          <span className="flex items-center gap-2">
            <span>Cấp quyền truy cập & phân bổ vai trò</span>
            <span className="font-mono text-[11.5px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] px-2 py-0.5 rounded border border-[var(--teal)]">Mã NV: {edit.maNV}</span>
          </span>
        ) : (
          "Cấp quyền truy cập & phân bổ vai trò nhân sự trong hệ thống"
        )
      }
      icon={Users}
      maxWidth="max-w-[620px]"
      noPadding
    >
      <form onSubmit={submit} className="p-7 space-y-6 bg-white">
        {err && <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2"><X className="w-4 h-4 shrink-0" /> {err}</div>}
        
        <div className="space-y-4">
          <SectionHeader n={1} accent="Thông tin nhân sự" />
          <Field label="Họ và tên" required>
            <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required className="input-field h-10 font-semibold text-[14.5px]" placeholder="VD: Nguyễn Văn A" />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={2} accent="Phân quyền & Vai trò" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vai trò hệ thống" required>
              <Dropdown value={vaiTro} mono={false} options={ROLES} labels={{ TuVanVien: "Tư vấn viên", KeToan: "Kế toán", QuanLy: "Quản lý" }} onChange={setVaiTro} />
            </Field>
            <Field label="Cơ sở làm việc">
              <Dropdown value={coSoId} mono={false} placeholder={vaiTro === "QuanLy" ? "Toàn hệ thống" : "Chọn cơ sở…"} options={["", ...cosos.filter((c) => c.trangThai === "active").map((c) => c.id)]} labels={Object.fromEntries(cosos.map((c) => [c.id, c.ten]))} onChange={setCoSoId} />
            </Field>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={3} accent="Thông tin đăng nhập" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tên đăng nhập" required>
              <input value={tenDangNhap} onChange={(e) => setTen(e.target.value)} required disabled={!!edit} className="input-field font-mono h-10 disabled:bg-[var(--surface-hover)] disabled:text-[var(--mute)]" placeholder="VD: cskh.hcm" />
            </Field>
            <Field label={edit ? "Mật khẩu mới" : "Mật khẩu"} required={!edit}>
              <input type="text" value={matKhau} onChange={(e) => setMk(e.target.value)} required={!edit} className="input-field font-mono h-10" placeholder={edit ? "Để trống nếu không đổi..." : "Nhập mật khẩu..."} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} {edit ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Cấu hình & trạng thái đồng bộ Google Sheet (UC-10 / BR-15) ───
interface GSheetCoSo { id: string; ten: string; sheetId: string | null; envSheetId: string | null }
interface GSheetStatus { enabled: boolean; shareEmail: string | null; tab: string; sharedSheetId: string | null; cronConfigured: boolean; pending: number }

function GoogleSheetPanel() {
  const { addToast } = useToast();
  const [status, setStatus] = useState<GSheetStatus | null>(null);
  const [rows, setRows] = useState<GSheetCoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/csr/googlesheet");
    if (res.ok) { const d = await res.json(); setStatus(d.status); setRows(d.cosos); }
    else addToast({ type: "error", message: "Không tải được cấu hình Google Sheet." });
    setLoading(false);
  }, [addToast]);
  useEffect(() => { load(); }, [load]);

  const saveSheetId = async (coSoId: string) => {
    setSavingId(coSoId);
    const res = await fetch("/api/csr/googlesheet", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coSoId, sheetId: drafts[coSoId] ?? "" }) });
    const d = await res.json(); setSavingId(null);
    if (res.ok) { addToast({ type: "success", message: "Đã lưu spreadsheetId." }); setDrafts((p) => { const n = { ...p }; delete n[coSoId]; return n; }); load(); }
    else addToast({ type: "error", message: d.error || "Lỗi" });
  };

  const syncNow = async () => {
    setSyncing(true);
    const res = await fetch("/api/csr/googlesheet", { method: "POST" });
    const d = await res.json(); setSyncing(false);
    if (res.ok) addToast({ type: "success", message: `Đồng bộ xong: ${d.processed} hồ sơ${d.failed ? `, lỗi ${d.failed}` : ""}.` });
    else addToast({ type: "error", message: d.error || "Lỗi đồng bộ" });
    load();
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-[var(--navy)]" /></div>;

  const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}`;
  const shared = !!status?.sharedSheetId; // chế độ dùng chung 1 bảng tính

  return (
    <div className="space-y-4">
      {/* Trạng thái tổng */}
      <div className="bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-sm)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${status?.enabled ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--rose-soft)] text-[var(--rose)]"}`}><FileSpreadsheet className="w-5 h-5" /></div>
            <div>
              <div className="font-serif text-[16px] font-semibold text-[var(--ink)]">Đồng bộ Google Sheet</div>
              <div className="text-[12.5px] text-[var(--mute)]">{!status?.enabled ? "Chưa bật: thiếu GOOGLE_CREDENTIALS trong .env." : status?.sharedSheetId ? "Đã bật — dùng chung 1 bảng tính, mỗi cơ sở là 1 tab riêng." : "Đã bật — mỗi cơ sở đồng bộ 1 chiều lên spreadsheet riêng."}</div>
            </div>
          </div>
          <button onClick={syncNow} disabled={syncing || !status?.enabled} className="btn btn-primary px-5 py-2.5 font-bold">{syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-[var(--teal)]" />} Đồng bộ ngay</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Credentials", val: status?.enabled ? "Đã cấu hình" : "Chưa có", ok: status?.enabled },
            { label: "Email chia sẻ", val: status?.shareEmail || "Chưa đặt", ok: !!status?.shareEmail },
            { label: "Cron dự phòng", val: status?.cronConfigured ? "Đã đặt" : "Chưa đặt", ok: status?.cronConfigured },
            { label: "Hàng đợi chờ", val: `${status?.pending ?? 0} hồ sơ`, ok: (status?.pending ?? 0) === 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-[var(--r-md)] border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2.5">
              <div className="text-[10.5px] uppercase tracking-wide font-bold text-[var(--mute)]">{s.label}</div>
              <div className={`text-[13px] font-bold mt-0.5 truncate ${s.ok ? "text-[var(--teal-deep)]" : "text-[var(--ink-soft)]"}`} title={s.val}>{s.val}</div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-[var(--mute)] mt-3 leading-relaxed">
          Cấu hình bí mật (JSON service account, email chia sẻ, cron) đặt trong <span className="font-mono">.env</span>.
          {status?.sharedSheetId
            ? " Đang ở chế độ dùng chung: mọi cơ sở ghi vào 1 bảng tính (mỗi cơ sở 1 tab). Đổi/bỏ ở khóa GOOGLE_SHEET_ID trong .env."
            : " Bên dưới bạn có thể gán thủ công spreadsheetId cho từng cơ sở; để trống thì hệ thống tự tạo file lần đồng bộ đầu và lưu lại."}
        </p>
      </div>

      {/* Bảng tính dùng chung */}
      {status?.sharedSheetId && (
        <div className="bg-[var(--navy-50)] border border-[var(--navy-100)] rounded-[var(--r-xl)] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-[var(--navy)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[var(--ink)]">Bảng tính dùng chung của mọi cơ sở</div>
              <a href={sheetUrl(status.sharedSheetId)} target="_blank" rel="noopener noreferrer" className="text-[11.5px] font-semibold text-[var(--navy)] hover:underline truncate block" title={sheetUrl(status.sharedSheetId)}>{sheetUrl(status.sharedSheetId)}</a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(sheetUrl(status.sharedSheetId!)); addToast({ type: "success", message: "Đã copy link." }); }} className="btn btn-secondary px-3 py-2 text-[12px] font-bold"><Copy className="w-3.5 h-3.5" /> Copy</button>
            <a href={sheetUrl(status.sharedSheetId)} target="_blank" rel="noopener noreferrer" className="btn btn-primary px-4 py-2 text-[12px] font-bold"><ExternalLink className="w-3.5 h-3.5 text-[var(--teal)]" /> Mở bảng tính</a>
          </div>
        </div>
      )}

      {/* Sheet theo cơ sở */}
      <div className="bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]"><tr>
              {["Cơ sở", shared ? "Tab trong bảng tính" : "Spreadsheet ID", "Trạng thái", "Thao tác"].map((h) => <th key={h} className={`py-3.5 px-3.5 border-b border-[var(--line)] whitespace-nowrap ${h === "Thao tác" ? "text-right" : ""}`}>{h}</th>)}
            </tr></thead>
            <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
              {rows.map((c) => {
                const effective = shared ? status!.sharedSheetId! : (c.sheetId || c.envSheetId);
                const draft = drafts[c.id] ?? (c.sheetId ?? "");
                const dirty = drafts[c.id] !== undefined && drafts[c.id] !== (c.sheetId ?? "");
                return (
                  <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors align-middle">
                    <td className="py-3 px-5"><div className="font-bold text-[var(--ink)]">{c.ten}</div><div className="font-mono text-[11px] text-[var(--mute)]">{c.id}</div></td>
                    <td className="py-3 px-5">
                      {shared ? (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)]"><span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)]">Tab</span> {c.ten}</span>
                      ) : (
                        <>
                          <input value={draft} onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={c.envSheetId ? `env: ${c.envSheetId}` : "Tự tạo khi đồng bộ…"} className="input-field font-mono text-[12px] w-[260px] max-w-full" />
                          {effective && !dirty && (
                            <a href={sheetUrl(effective)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[var(--navy)] hover:underline truncate" title={sheetUrl(effective)}>
                              <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{sheetUrl(effective)}</span>
                            </a>
                          )}
                        </>
                      )}
                    </td>
                    <td className="py-3 px-5 whitespace-nowrap">
                      {shared
                        ? <StatusBadge label="Trong bảng chung" cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" />
                        : effective
                          ? <StatusBadge label={c.sheetId ? "Đã có sheet" : "Từ .env"} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" />
                          : <StatusBadge label="Chưa có" cls="bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" />}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        {effective && <button onClick={() => { navigator.clipboard?.writeText(sheetUrl(effective)); addToast({ type: "success", message: "Đã copy link." }); }} className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Copy link"><Copy className="w-4 h-4" /></button>}
                        {effective && <a href={sheetUrl(effective)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-[var(--mute)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]" title="Mở Google Sheet"><ExternalLink className="w-4 h-4" /></a>}
                        {!shared && <button onClick={() => saveSheetId(c.id)} disabled={!dirty || savingId === c.id} className="btn btn-secondary px-3 py-1.5 text-[12px] font-bold disabled:opacity-40">{savingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[var(--teal)]" />} Lưu</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={4} className="py-16 text-center text-[var(--mute)]">Chưa có cơ sở.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

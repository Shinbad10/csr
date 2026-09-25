"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Loader2,
  MinusCircle,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import Modal from "@/components/layout/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import { fmtBuoiKhamCode } from "@/lib/csr";
import type { DoiChieuLog } from "@/lib/hisReconcile";

export type { DoiChieuLog };

/** Số đợt khám gửi đối chiếu cùng lúc. Mỗi đợt ở server lại tra song song nhiều BN,
 *  nên giữ mức vừa phải để không dồn quá nhiều kết nối vào máy chủ HIS. */
const BULK_CONCURRENCY = 3;

type ItemStatus = "queued" | "running" | "done" | "error" | "skipped" | "cancelled";

interface RunItem {
  id: string;
  name: string;
  status: ItemStatus;
  log?: DoiChieuLog;
  error?: string;
}

export interface ReconcileTarget {
  id: string;
  name: string;
  /** Số BN Nhóm A + B — bằng 0 thì bỏ qua, không gọi HIS. */
  soCa: number;
}

interface BulkRun {
  items: RunItem[];
  startedAt: number;
  finishedAt?: number;
  cancelled?: boolean;
}

/* ─────────────────────────── Thời gian tương đối ─────────────────────────── */

export function fmtRelative(iso?: string | null, now = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t) / 1000;
  if (diff < 45) return "vừa xong";
  if (diff < 3600) return `${Math.round(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.round(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

const fmtDuration = (ms?: number) => (ms == null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

/* ─────────────────────────── Hook điều phối ─────────────────────────── */

async function postReconcile(id: string, kieu: "don_le" | "hang_loat"): Promise<DoiChieuLog> {
  const res = await fetch(`/api/csr/buoikham/${id}/doi-chieu-his`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kieu }),
  });
  const data = await res.json().catch(() => ({}));
  // 502 vẫn trả về bản ghi lịch sử (trạng thái "loi") — coi là kết quả hợp lệ để hiển thị
  if (!res.ok && !data?.id) throw new Error(data?.error || `Lỗi máy chủ (${res.status})`);
  return data as DoiChieuLog;
}

export function useHisReconcile({
  onLog,
  onFinish,
}: {
  /** Mỗi đợt xong → cập nhật "đối chiếu gần nhất" ngay trên danh sách. */
  onLog: (buoiKhamId: string, log: DoiChieuLog) => void;
  /** Cả lượt hàng loạt xong (hoặc một đợt đơn lẻ xong) → nạp lại số liệu. */
  onFinish: () => void;
}) {
  const { addToast } = useToast();
  const [bulk, setBulk] = useState<BulkRun | null>(null);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const cancelRef = useRef(false);
  const onLogRef = useRef(onLog);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onLogRef.current = onLog;
    onFinishRef.current = onFinish;
  });

  const markRunning = (id: string, on: boolean) =>
    setRunningIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const patchItem = (id: string, patch: Partial<RunItem>) =>
    setBulk((prev) => (prev ? { ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : prev));

  const bulkActive = !!bulk && !bulk.finishedAt;

  const runOne = useCallback(
    async (t: ReconcileTarget) => {
      if (runningIds.has(t.id)) return;
      if (t.soCa <= 0) {
        addToast({ type: "info", message: `${t.name}: không có BN Nhóm A/B cần đối chiếu HIS` });
        return;
      }
      markRunning(t.id, true);
      try {
        const log = await postReconcile(t.id, "don_le");
        onLogRef.current(t.id, log);
        if (log.trangThai === "loi") {
          addToast({ type: "error", title: "Đối chiếu HIS thất bại", message: log.loi || "Không kết nối được HIS" });
        } else {
          addToast({
            type: "success",
            title: "Đã đối chiếu HIS",
            message: `${t.name}: tìm thấy ${log.found ?? 0}/${log.total ?? 0} BN, ${log.surgery ?? 0} ca mổ sau khám${log.surgeryPrior ? ` (+${log.surgeryPrior} mổ trước)` : ""} — ${fmtDuration(log.durationMs)}`,
          });
        }
        onFinishRef.current();
      } catch (e) {
        addToast({ type: "error", title: "Đối chiếu HIS thất bại", message: e instanceof Error ? e.message : "Lỗi kết nối" });
      } finally {
        markRunning(t.id, false);
      }
    },
    [runningIds, addToast],
  );

  const runBulk = useCallback(
    async (targets: ReconcileTarget[]) => {
      if (bulkActive) {
        addToast({ type: "info", message: "Đang có một lượt đối chiếu HIS chạy nền" });
        return;
      }
      const items: RunItem[] = targets.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.soCa > 0 ? "queued" : "skipped",
      }));
      const queue = items.filter((i) => i.status === "queued").map((i) => i.id);
      if (queue.length === 0) {
        addToast({ type: "info", message: "Các đợt đang hiển thị không có BN Nhóm A/B nào cần đối chiếu" });
        return;
      }

      cancelRef.current = false;
      setBulk({ items, startedAt: Date.now() });

      let cursor = 0;
      const worker = async () => {
        while (cursor < queue.length) {
          const id = queue[cursor++];
          if (cancelRef.current) {
            patchItem(id, { status: "cancelled" });
            continue;
          }
          patchItem(id, { status: "running" });
          markRunning(id, true);
          try {
            const log = await postReconcile(id, "hang_loat");
            patchItem(id, { status: log.trangThai === "loi" ? "error" : "done", log, error: log.loi ?? undefined });
            onLogRef.current(id, log);
          } catch (e) {
            patchItem(id, { status: "error", error: e instanceof Error ? e.message : "Lỗi kết nối" });
          } finally {
            markRunning(id, false);
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(BULK_CONCURRENCY, queue.length) }, worker));
      setBulk((prev) => (prev ? { ...prev, finishedAt: Date.now(), cancelled: cancelRef.current } : prev));
      onFinishRef.current();
    },
    [bulkActive, addToast],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const dismiss = useCallback(() => {
    if (!bulkActive) setBulk(null);
  }, [bulkActive]);

  const progress = bulk
    ? (() => {
        const work = bulk.items.filter((i) => i.status !== "skipped");
        const finished = work.filter((i) => i.status === "done" || i.status === "error" || i.status === "cancelled").length;
        return { total: work.length, finished, pct: work.length ? Math.round((finished / work.length) * 100) : 100 };
      })()
    : null;

  return { bulk, bulkActive, progress, runningIds, runOne, runBulk, cancel, dismiss };
}

/* ─────────────────────────── Bảng tiến độ nổi ─────────────────────────── */

const STATUS_META: Record<ItemStatus, { icon: React.ElementType; cls: string; label: string }> = {
  queued: { icon: Clock, cls: "text-[var(--mute-soft)]", label: "Chờ" },
  running: { icon: Loader2, cls: "text-[var(--navy)] animate-spin", label: "Đang tra" },
  done: { icon: CheckCircle2, cls: "text-[var(--teal)]", label: "Xong" },
  error: { icon: XCircle, cls: "text-[var(--rose)]", label: "Lỗi" },
  skipped: { icon: MinusCircle, cls: "text-[var(--mute-soft)]", label: "Không có A/B" },
  cancelled: { icon: MinusCircle, cls: "text-[var(--amber)]", label: "Đã dừng" },
};

export function HisReconcilePanel({
  bulk,
  progress,
  onCancel,
  onDismiss,
}: {
  bulk: BulkRun | null;
  progress: { total: number; finished: number; pct: number } | null;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const running = !!bulk && !bulk.finishedAt;

  // Đồng hồ chạy — cập nhật mỗi giây khi đang đối chiếu
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!bulk || !progress) return null;

  const logs = bulk.items.map((i) => i.log).filter(Boolean) as DoiChieuLog[];
  const sum = (k: "total" | "found" | "surgery" | "surgeryPrior") => logs.reduce((s, l) => s + (l[k] ?? 0), 0);
  const errors = bulk.items.filter((i) => i.status === "error").length;
  const elapsed = Math.max(0, (bulk.finishedAt ?? now) - bulk.startedAt) / 1000;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 right-4 z-[900] w-[420px] max-w-[calc(100vw-32px)] bg-[var(--surface)] border border-[var(--line-strong)] rounded-[14px] shadow-[var(--shadow-lg)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)]">
          <div className="relative w-8 h-8 rounded-[10px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white flex items-center justify-center shrink-0 shadow-[var(--navy-shadow)]">
            <Activity className="w-4 h-4 text-[var(--teal)]" />
            {running && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--teal)] ring-2 ring-[var(--surface)] animate-pulse" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[var(--ink)]">
              {running ? "Đang đối chiếu HIS" : bulk.cancelled ? "Đã dừng đối chiếu" : "Đối chiếu HIS hoàn tất"}
            </div>
            <div className="text-[11px] text-[var(--mute)] font-mono">
              {progress.finished}/{progress.total} đợt · {elapsed.toFixed(0)}s
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] cursor-pointer"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {!running && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Thanh tiến độ */}
        <div className="h-1 bg-[var(--line)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--navy)] to-[var(--teal)] transition-all duration-500"
            style={{ width: `${progress.pct}%` }}
          />
        </div>

        {!collapsed && (
          <>
            {/* Tổng hợp */}
            <div className="grid grid-cols-5 divide-x divide-[var(--line-soft)] border-b border-[var(--line)]">
              {[
                { label: "BN tra", value: sum("total"), cls: "text-[var(--ink)]" },
                { label: "Khớp HIS", value: sum("found"), cls: "text-[var(--navy)]" },
                { label: "Mổ sau khám", value: sum("surgery"), cls: "text-[var(--teal-deep)]" },
                { label: "Mổ trước", value: sum("surgeryPrior"), cls: "text-[#7c3aed]" },
                { label: "Lỗi", value: errors, cls: errors ? "text-[var(--rose)]" : "text-[var(--mute-soft)]" },
              ].map((s) => (
                <div key={s.label} className="px-2.5 py-2 min-w-0">
                  <div className={`font-mono text-[17px] font-bold leading-tight tabular-nums ${s.cls}`}>{s.value.toLocaleString("vi-VN")}</div>
                  <div className="text-[10.5px] font-medium text-[var(--mute)] whitespace-nowrap truncate">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Danh sách đợt */}
            <ul className="max-h-[240px] overflow-y-auto custom-scrollbar divide-y divide-[var(--line-soft)]">
              {bulk.items.map((it) => {
                const m = STATUS_META[it.status];
                const Icon = m.icon;
                return (
                  <li key={it.id} className="flex items-center gap-2.5 px-4 py-2" title={it.error || undefined}>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${m.cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] truncate ${it.status === "skipped" ? "text-[var(--mute)]" : "text-[var(--ink)] font-semibold"}`}>{it.name}</div>
                      <div className="text-[10.5px] font-mono text-[var(--mute)] truncate">
                        {fmtBuoiKhamCode(it.id)}
                        {it.status === "error" && it.error ? <span className="text-[var(--rose)]"> · {it.error}</span> : null}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink-soft)]">
                      {it.log && it.status === "done" ? (
                        <>
                          <b className="text-[var(--navy)]">{it.log.found ?? 0}</b>/{it.log.total ?? 0}
                          {(it.log.surgery ?? 0) > 0 && <span className="text-[var(--teal-deep)]"> · {it.log.surgery} mổ</span>}
                          {(it.log.surgeryPrior ?? 0) > 0 && <span className="text-[#7c3aed]"> · +{it.log.surgeryPrior} trước</span>}
                        </>
                      ) : (
                        <span className="text-[10.5px] text-[var(--mute)]">{m.label}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {running && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[var(--line)] bg-[var(--surface-soft)]">
            <span className="text-[11px] text-[var(--mute)]">Có thể tiếp tục làm việc — kết quả tự cập nhật vào bảng.</span>
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 h-7 px-2.5 rounded-[8px] text-[11.5px] font-bold text-[var(--rose)] border border-rose-200 bg-[var(--rose-soft)] hover:bg-rose-100 cursor-pointer"
            >
              Dừng
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────── Ô "Đối chiếu HIS" trên bảng ─────────────────────────── */

export function DoiChieuCell({
  log,
  running,
  onOpenHistory,
}: {
  log?: DoiChieuLog | null;
  running?: boolean;
  onOpenHistory?: () => void;
}) {
  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--navy)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--teal)]" /> Đang đối chiếu…
      </span>
    );
  }
  if (!log) return <span className="text-[11.5px] text-[var(--mute-soft)]">Chưa đối chiếu</span>;

  const isErr = log.trangThai === "loi";
  /** Bản ghi trước khi tách mổ trước/sau: `surgery` khi đó gộp cả ca mổ trước ngày khám → không hiển thị số mổ. */
  const legacy = log.surgeryPrior === undefined;
  const title = isErr
    ? `Lỗi: ${log.loi || "không xác định"}`
    : `${fmtDateTime(log.thoiDiem)} · ${log.nguoiThucHien || log.nguoiDung}\nTìm thấy ${log.found ?? 0}/${log.total ?? 0} BN` +
      (legacy
        ? "\nLần đối chiếu cũ chưa tách ca mổ trước ngày khám — đối chiếu lại để cập nhật"
        : ` · ${log.surgery ?? 0} ca mổ sau khám${log.surgeryPrior ? ` · ${log.surgeryPrior} ca đã mổ trước ngày khám` : ""}`);

  return (
    <button
      type="button"
      data-no-row-click
      onClick={onOpenHistory}
      title={title}
      className="group text-left min-w-0 cursor-pointer"
    >
      <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${isErr ? "text-[var(--rose)]" : "text-[var(--ink)]"} group-hover:text-[var(--navy)]`}>
        {isErr ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] shrink-0" />}
        <span className="truncate">{fmtRelative(log.thoiDiem)}</span>
      </div>
      <div className="text-[10.5px] font-mono text-[var(--mute)] tabular-nums truncate">
        {isErr ? (
          "Lần gần nhất lỗi"
        ) : log.trangThai === "bo_qua" ? (
          "Không có BN A/B"
        ) : (
          <>
            {log.found ?? 0}/{log.total ?? 0} khớp
            {!legacy && (
              <>
                {" · "}
                <span className={log.surgery ? "text-[var(--teal-deep)] font-semibold" : undefined}>{log.surgery ?? 0} mổ</span>
                {(log.surgeryPrior ?? 0) > 0 && <span className="text-[#7c3aed]"> · +{log.surgeryPrior} trước</span>}
              </>
            )}
          </>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────── Modal lịch sử đối chiếu ─────────────────────────── */

/** Ô số liệu gọn: số mono + nhãn, kèm mức tăng/giảm so với lần đối chiếu trước. */
function Metric({
  label,
  value,
  tone = "text-[var(--ink)]",
  delta,
  hint,
  legacyTitle,
}: {
  label: string;
  value?: number;
  tone?: string;
  delta?: number;
  hint?: string;
  legacyTitle?: string;
}) {
  return (
    <div
      className="w-[84px] px-2.5 py-1.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line-soft)]"
      title={legacyTitle || hint}
    >
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-[15px] font-bold tabular-nums leading-tight ${value === undefined ? "text-[var(--mute-soft)]" : tone}`}>
          {value === undefined ? "—" : value.toLocaleString("vi-VN")}
        </span>
        {!!delta && (
          <span className={`font-mono text-[10px] font-bold tabular-nums ${delta > 0 ? "text-[var(--teal-deep)]" : "text-[var(--rose)]"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="text-[10.5px] text-[var(--mute)] whitespace-nowrap">{label}</div>
    </div>
  );
}

function RunStatusBadge({ r }: { r: DoiChieuLog }) {
  const [cls, label] =
    r.trangThai === "loi"
      ? ["bg-[var(--rose-soft)] text-[var(--rose)]", "Lỗi kết nối"]
      : r.trangThai === "bo_qua"
      ? ["bg-[var(--line-soft)] text-[var(--mute)]", "Bỏ qua"]
      : (r.errors ?? 0) > 0
      ? ["bg-[var(--amber-soft)] text-[var(--amber-deep)]", `Hoàn tất · ${r.errors} lỗi`]
      : ["bg-[var(--teal-soft)] text-[var(--teal-deep)]", "Hoàn tất"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-px rounded-md text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      <span className="w-[5px] h-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}

async function fetchHistory(id: string): Promise<{ id: string; rows: DoiChieuLog[]; err: string }> {
  try {
    const res = await fetch(`/api/csr/buoikham/${id}/doi-chieu-his`);
    if (!res.ok) throw new Error("Không tải được lịch sử đối chiếu");
    return { id, rows: await res.json(), err: "" };
  } catch (e) {
    return { id, rows: [], err: e instanceof Error ? e.message : "Lỗi" };
  }
}

export function DoiChieuHistoryModal({
  target,
  onClose,
  onRerun,
  running,
}: {
  target: { id: string; name: string } | null;
  onClose: () => void;
  onRerun?: () => void;
  running?: boolean;
}) {
  /* Gắn kết quả với id đợt đã nạp — đổi đợt thì tự coi như "đang tải", khỏi reset state trong effect. */
  const [loaded, setLoaded] = useState<{ id: string; rows: DoiChieuLog[]; err: string } | null>(null);
  const rows = loaded && loaded.id === target?.id ? loaded.rows : null;
  const err = loaded && loaded.id === target?.id ? loaded.err : "";

  useEffect(() => {
    if (!target) return;
    let active = true;
    fetchHistory(target.id).then((r) => active && setLoaded(r));
    return () => {
      active = false;
    };
  }, [target]);

  // Chạy lại xong → nạp lại lịch sử
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running && target) fetchHistory(target.id).then(setLoaded);
    wasRunning.current = !!running;
  }, [running, target]);

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Lịch sử đối chiếu HIS"
      subtitle={target ? `${target.name} · ${fmtBuoiKhamCode(target.id)}` : ""}
      icon={History}
      maxWidth="max-w-[900px]"
      noPadding
      footer={
        onRerun ? (
          <button
            type="button"
            onClick={onRerun}
            disabled={running}
            className="btn-primary h-9 px-4 text-[12.5px] rounded-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--teal)]" /> : <RefreshCw className="w-3.5 h-3.5 text-[var(--teal)]" />}
            {running ? "Đang đối chiếu…" : "Đối chiếu lại ngay"}
          </button>
        ) : undefined
      }
    >
      <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
        {rows === null ? (
          <div className="py-14 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" />
          </div>
        ) : err ? (
          <div className="m-5 p-3 rounded-[10px] bg-[var(--rose-soft)] text-[var(--rose)] text-[12.5px] font-semibold">{err}</div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center">
            <History className="w-8 h-8 text-[var(--mute-soft)] mx-auto mb-2" />
            <div className="text-[13px] font-semibold text-[var(--ink-soft)]">Đợt khám chưa được đối chiếu HIS lần nào</div>
          </div>
        ) : (
          <ol className="divide-y divide-[var(--line-soft)]">
            {rows.map((r, i) => {
              const prev = rows[i + 1];
              const legacy = r.surgeryPrior === undefined;
              const prevLegacy = !prev || prev.surgeryPrior === undefined;
              const d = new Date(r.thoiDiem);
              return (
                <li key={r.id} className="grid grid-cols-[96px_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface-soft)] transition-colors">
                  {/* Thời điểm */}
                  <div className="min-w-0">
                    <div className="font-mono text-[15px] font-bold text-[var(--ink)] tabular-nums leading-tight">
                      {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--mute)] tabular-nums">{d.toLocaleDateString("vi-VN")}</div>
                  </div>

                  {/* Trạng thái + người thực hiện */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <RunStatusBadge r={r} />
                      <span className="px-1.5 py-px rounded-md text-[11px] font-semibold bg-[var(--line-soft)] text-[var(--ink-soft)] whitespace-nowrap">
                        {r.kieu === "hang_loat" ? "Hàng loạt" : "Đơn lẻ"}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--mute)] whitespace-nowrap">{fmtDuration(r.durationMs)}</span>
                    </div>
                    <div className="mt-1 text-[12.5px] text-[var(--ink-soft)] truncate">
                      {r.nguoiThucHien || r.nguoiDung}
                      <span className="text-[var(--mute)]"> · {fmtRelative(r.thoiDiem)}</span>
                    </div>
                    {r.trangThai === "loi" && r.loi && <div className="mt-1 text-[11.5px] text-[var(--rose)] line-clamp-2">{r.loi}</div>}
                  </div>

                  {/* Số liệu */}
                  {r.trangThai === "loi" ? (
                    <span />
                  ) : (
                    <div className="flex items-stretch gap-1.5">
                      <Metric label="BN tra" value={r.total} />
                      <Metric
                        label="Khớp HIS"
                        value={r.found}
                        tone="text-[var(--navy)]"
                        delta={prev ? (r.found ?? 0) - (prev.found ?? 0) : undefined}
                        hint={r.exactMatch ? `${r.exactMatch} khớp CCCD/BHYT` : undefined}
                      />
                      <Metric
                        label="Mổ sau khám"
                        value={legacy ? undefined : r.surgery}
                        tone="text-[var(--teal-deep)]"
                        delta={!legacy && !prevLegacy ? (r.surgery ?? 0) - (prev!.surgery ?? 0) : undefined}
                        legacyTitle={legacy ? `Lần chạy cũ chưa tách mổ trước/sau (gộp: ${r.surgery ?? 0} ca)` : undefined}
                      />
                      <Metric
                        label="Mổ trước"
                        value={legacy ? undefined : r.surgeryPrior}
                        tone="text-[#7c3aed]"
                        delta={!legacy && !prevLegacy ? (r.surgeryPrior ?? 0) - (prev!.surgeryPrior ?? 0) : undefined}
                        legacyTitle={legacy ? "Lần chạy cũ chưa tách mổ trước/sau" : undefined}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Modal>
  );
}

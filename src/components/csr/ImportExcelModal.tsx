"use client";

import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  Upload,
  AlertTriangle,
  Check,
  Users,
  Download,
  FileText,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "@/components/layout/Modal";
import { Field, DateField } from "@/components/csr/fields";
import { useToast } from "@/components/providers/ToastProvider";
import { parseSheet, parseSheetMonth, daysInMonth, type ImportBlock, type Aoa } from "@/lib/importExcel";

/** Một khối trong file + phần thông tin người dùng phải bổ sung (file không có). */
interface BlockForm extends ImportBlock {
  ngayKham: string; // yyyy-mm-dd — suy từ tháng của sheet, vẫn sửa tay được
  xa: string;
  diaDiem: string;
  bo: boolean; // bỏ qua khối này
  sheet: string; // tên sheet chứa khối
  thuTu: number; // thứ tự khối trong sheet -> ngày tự tăng
  tuDongNgay: boolean; // false khi người dùng đã sửa tay, không ghi đè nữa
}

/** Ngày tự gán cho khối thứ `thuTu` của tháng `ym`: mỗi đợt lùi 1 ngày, kẹp trong tháng. */
function autoNgay(ym: string, thuTu: number): string {
  if (!ym) return "";
  const max = daysInMonth(ym);
  if (!max) return "";
  return `${ym}-${String(Math.min(thuTu + 1, max)).padStart(2, "0")}`;
}

/** "Trạm y tế xã Lương Hòa (Phong Mỹ cũ - Giồng Trôm cũ)" → xã "Lương Hòa" */
function guessXa(tieuDe: string): string {
  const m = tieuDe.match(/xã\s+([^(\-–,]+)/i);
  return m ? m[1].trim() : tieuDe.replace(/\s*\(.*$/, "").trim();
}

export default function ImportExcelModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [blocks, setBlocks] = useState<BlockForm[]>([]);
  const [orphans, setOrphans] = useState<{ dong: number; noiDung: string }[]>([]);
  const [orphanCount, setOrphanCount] = useState(0);
  /** Tháng của từng sheet (yyyy-mm) — đổi ở đây là mọi đợt trong sheet dời theo */
  const [sheetMonths, setSheetMonths] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setBlocks([]);
    setOrphans([]);
    setOrphanCount(0);
    setSheetMonths({});
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const readFile = async (file: File) => {
    setReading(true);
    try {
      const buf = await file.arrayBuffer();
      // cellDates: để xlsx trả Date thay vì số serial cho ô định dạng ngày
      const wb = XLSX.read(buf, { cellDates: true });
      const all: BlockForm[] = [];
      const orph: { dong: number; noiDung: string }[] = [];
      const months: Record<string, string> = {};
      let orphN = 0;
      for (const name of wb.SheetNames) {
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], {
          header: 1,
          blankrows: true,
          defval: null,
        }) as Aoa;
        const res = parseSheet(aoa);
        orphN += res.orphanRows;
        orph.push(...res.orphanSample.map((o) => ({ ...o, noiDung: `${name}: ${o.noiDung}` })));
        // Tháng lấy từ TÊN SHEET (file đặt mỗi tháng một sheet); ngày tự tăng theo
        // thứ tự đợt trong sheet — dữ liệu lịch sử không cần ngày chính xác.
        const thang = parseSheetMonth(name);
        res.blocks.forEach((b, k) => {
          const xa = guessXa(b.tieuDe);
          all.push({
            ...b,
            ngayKham: autoNgay(thang, k),
            xa,
            diaDiem: b.tieuDe.replace(/\s*\(.*$/, "").trim() || xa,
            bo: false,
            sheet: name,
            thuTu: k,
            tuDongNgay: true,
          });
        });
        if (thang) months[name] = thang;
      }
      setOrphanCount(orphN);
      setOrphans(orph.slice(0, 3));
      setSheetMonths(months);
      if (all.length === 0) {
        addToast({
          type: "error",
          title: "Không đọc được khối nào",
          message: "File cần có dòng tiêu đề chứa Họ Tên và Năm Sinh.",
        });
        reset();
        return;
      }
      setFileName(file.name);
      setBlocks(all);
    } catch {
      addToast({ type: "error", message: "Không đọc được file Excel." });
      reset();
    } finally {
      setReading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        readFile(f);
      } else {
        addToast({ type: "error", message: "Vui lòng chọn file Excel (.xlsx, .xls)" });
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const data = [
        ["Đợt khám sức khỏe người cao tuổi xã Lương Hòa (15/08/2026)"],
        ["STT", "Họ Tên", "Năm Sinh", "Chẩn đoán", "Bác sĩ chỉ định", "Mức BHYT", "Số điện thoại"],
        [1, "Nguyễn Văn An", 1958, "Tăng huyết áp, Đái tháo đường", "BS. Chánh", 80, "0912345678"],
        [2, "Trần Thị Bình", 1962, "Đục thủy tinh thể", "BS. Cường", 100, "0987654321"],
        [3, "Lê Văn Cường", 1955, "Thoái hóa khớp gối", "BS. Tuấn", 80, "0901234567"],
        [],
        ["Đợt khám mắt miễn phí xã Phong Nẫm (20/08/2026)"],
        ["STT", "Họ Tên", "Năm Sinh", "Chẩn đoán", "Bác sĩ chỉ định", "Mức BHYT", "Số điện thoại"],
        [1, "Phạm Văn Đồng", 1960, "Mộng thịt mắt phải", "BS. Minh", 80, "0933445566"],
        [2, "Vũ Thị Mai", 1952, "Cườm khô 2 mắt", "BS. Hùng", 100, "0977889900"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 24 },
        { wch: 10 },
        { wch: 38 },
        { wch: 18 },
        { wch: 12 },
        { wch: 15 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Ho_So");
      XLSX.writeFile(wb, "Mau_File_Nhap_Danh_Sach_Kham.xlsx");
      addToast({ type: "success", message: "Đã tải file Excel mẫu về máy!" });
    } catch {
      addToast({ type: "error", message: "Lỗi tạo file mẫu Excel" });
    }
  };

  /** Đổi tháng của một sheet: mọi đợt trong sheet đó dời ngày theo, TRỪ đợt đã sửa tay. */
  const setThangSheet = (sheet: string, ym: string) => {
    setSheetMonths((p) => ({ ...p, [sheet]: ym }));
    setBlocks((p) =>
      p.map((b) => (b.sheet === sheet && b.tuDongNgay ? { ...b, ngayKham: autoNgay(ym, b.thuTu) } : b))
    );
  };

  const active = blocks.filter((b) => !b.bo);
  /** Mọi dòng có họ tên đều nhập được; năm sinh trống vẫn lưu (cột đã cho phép NULL). */
  const usable = (b: BlockForm) => b.rows.length;
  const totalRows = active.reduce((s, b) => s + usable(b), 0);
  /** Dòng thật sự không dùng được: tiêu đề lạc, dòng "Tổng cộng"… */
  const totalDropped = active.reduce((s, b) => s + b.boQua, 0);
  const totalNoYear = active.reduce((s, b) => s + b.rows.filter((r) => r.namSinh == null).length, 0);
  const totalWarn = active.reduce((s, b) => s + b.rows.filter((r) => r.warnings.length > 0).length, 0);
  const missingDate = active.filter((b) => !b.ngayKham).length;
  const canSubmit = active.length > 0 && missingDate === 0 && active.every((b) => b.xa.trim());

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/csr/hoso/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: active.map((b) => ({
            ngayKham: b.ngayKham,
            xa: b.xa.trim(),
            diaDiem: b.diaDiem.trim(),
            ghiChu: b.tieuDe,
            rows: b.rows,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Không nhập được" });
        return;
      }

      type Res = { tieuDe: string; created: number; skipped: number; errors: string[] };
      const results: Res[] = d.results || [];
      const failed = results.filter((r) => r.errors.length > 0);
      const skipped = results.reduce((s, r) => s + r.skipped, 0);

      if (failed.length) {
        // Hiện LÝ DO thật của khối đầu tiên lỗi — trước đây chỉ đếm số khối nên
        // không ai biết vì sao đợt khám lại rỗng.
        console.error("[Nhập Excel] Chi tiết khối lỗi:", failed);
        addToast({
          type: "error",
          title: `Nhập ${d.total}/${totalRows} hồ sơ — ${failed.length} đợt lỗi`,
          message: `${failed[0].tieuDe}: ${failed[0].errors[0]}`,
        });
      } else {
        addToast({
          type: "success",
          title: `Đã nhập ${d.total} hồ sơ`,
          message: [
            `${active.length} đợt khám.`,
            skipped ? `Bỏ qua ${skipped} dòng trùng họ tên + năm sinh.` : "",
          ].filter(Boolean).join(" "),
        });
      }

      // Còn khối lỗi thì giữ modal để anh xem lại, chỉ đóng khi mọi thứ đã vào
      if (!failed.length) reset();
      onDone();
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nhập danh sách từ Excel"
      subtitle="Đọc tự động danh sách bệnh nhân từ file Excel các đợt khám trước"
      icon={FileSpreadsheet}
      maxWidth="w-[95vw] max-w-[95vw] h-[92vh] max-h-[92vh]"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="text-[12px] text-[var(--mute)] font-medium min-w-0">
            {blocks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--navy-50)] text-[var(--navy)] font-bold text-[12px] whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                  {active.length} đợt được chọn
                </span>
                <span className="font-bold text-[var(--ink)] whitespace-nowrap">• {totalRows} hồ sơ sẽ tạo</span>
                {totalDropped > 0 && (
                  <span className="text-[var(--rose)] font-bold whitespace-nowrap">• {totalDropped} dòng không phải BN</span>
                )}
                {totalNoYear > 0 && (
                  <span className="text-[var(--mute)] whitespace-nowrap" title="Vẫn được nhập, ô năm sinh để trống">
                    • {totalNoYear} chưa có năm sinh
                  </span>
                )}
                {totalWarn > 0 && (
                  <span className="text-[var(--amber-deep)] font-bold whitespace-nowrap">• {totalWarn} cảnh báo</span>
                )}
                {missingDate > 0 && (
                  <span className="text-[var(--rose)] font-bold whitespace-nowrap">• {missingDate} đợt chưa chọn ngày</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="btn btn-secondary h-10 px-4 text-[13px] font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Hủy bỏ
            </button>
            {blocks.length > 0 && (
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || saving}
                className="btn btn-primary h-10 px-5 text-[13px] font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />
                )}
                Nhập {totalRows > 0 ? `${totalRows} hồ sơ` : ""}
              </button>
            )}
          </div>
        </div>
      }
    >
      {blocks.length === 0 ? (
        <div className="space-y-5 py-2">
          {/* Hero Banner Feature Badges */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[var(--navy-50)] via-white to-[var(--teal-soft)]/40 border border-[var(--navy-100)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-[var(--teal)]" />
              </div>
              <div>
                <h4 className="text-[13.5px] font-bold text-[var(--ink)]">Tự động xử lý & phân tách thông tin đợt khám</h4>
                <p className="text-[12px] text-[var(--mute)]">Hệ thống sẽ tự nhận diện tiêu đề đợt, danh sách bệnh nhân, bác sĩ và chẩn đoán.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--navy-100)] bg-white text-[12px] font-bold text-[var(--navy)] hover:bg-[var(--navy-50)] transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
              Tải file mẫu (.xlsx)
            </button>
          </div>

          {/* Interactive Drag & Drop Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !reading && fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              isDragging
                ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-md scale-[1.005]"
                : "border-[var(--line-heavy)] bg-gradient-to-b from-white via-[var(--surface-bg)] to-white hover:border-[var(--navy)] hover:bg-[var(--navy-50)]/40 hover:shadow-xs"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-md flex items-center justify-center transform transition-transform group-hover:scale-105">
              {reading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[var(--teal)]" />
              ) : (
                <Upload className="w-8 h-8 text-[var(--teal)]" />
              )}
            </div>

            <div className="text-center space-y-1 max-w-[480px]">
              <div className="text-[15px] font-bold text-[var(--ink)]">
                {reading ? "Đang đọc và phân tích file Excel…" : "Kéo thả file Excel vào đây hoặc click để chọn file"}
              </div>
              <p className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                Hỗ trợ tập tin định dạng <b className="text-[var(--ink-soft)] font-mono">.xlsx</b> hoặc <b className="text-[var(--ink-soft)] font-mono">.xls</b> từ Excel, Google Sheets
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                disabled={reading}
                className="btn btn-primary h-9 px-4 text-[12.5px] font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[var(--teal)]" />
                Chọn file từ máy tính
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate();
                }}
                className="sm:hidden btn btn-secondary h-9 px-3 text-[12.5px] font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                Tải file mẫu
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
          </div>

          {/* Guide & Excel Format Preview Box */}
          <div className="rounded-xl border border-[var(--line-strong)] bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--ink)]">
                <FileText className="w-4 h-4 text-[var(--navy)]" />
                Hướng dẫn cấu trúc bảng trong file Excel
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[12px] font-bold text-[var(--navy)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                Tải file Excel mẫu chuẩn
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--line)] space-y-1.5">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--navy-soft)] text-[var(--navy)] font-mono text-[11px] flex items-center justify-center font-bold">1</span>
                  Tiêu đề đợt khám (Dòng 1)
                </div>
                <p className="text-[var(--mute)] leading-relaxed pl-6">
                  Nằm ở dòng đầu mỗi đợt. Ví dụ: <i className="text-[var(--ink-soft)] font-medium">&ldquo;Đợt khám sức khỏe người cao tuổi xã Lương Hòa&rdquo;</i>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-bg)] border border-[var(--line)] space-y-1.5">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--navy-soft)] text-[var(--navy)] font-mono text-[11px] flex items-center justify-center font-bold">2</span>
                  Dòng tiêu đề cột (Dòng 2)
                </div>
                <p className="text-[var(--mute)] leading-relaxed pl-6">
                  Bắt buộc chứa các cột: <b className="text-[var(--ink-soft)] font-mono">STT · Họ Tên · Năm Sinh · Chẩn đoán · Bác sĩ · BHYT · SĐT</b>
                </p>
              </div>
            </div>

            {/* Visual Sample Table Row */}
            <div className="overflow-hidden rounded-lg border border-[var(--line-strong)] text-[11.5px]">
              <div className="bg-[var(--navy-ink)] text-white px-3 py-1.5 font-bold font-mono text-[11px]">
                Mẫu đợt khám 1: Đợt khám sức khỏe người cao tuổi xã Lương Hòa (15/08/2026)
              </div>
              <div className="bg-[var(--surface-soft)] font-bold text-[var(--ink-soft)] border-b border-[var(--line-strong)] grid grid-cols-12 gap-2 px-3 py-1.5">
                <div className="col-span-1 font-mono text-[10.5px]">STT</div>
                <div className="col-span-3">Họ Tên</div>
                <div className="col-span-1 font-mono text-[10.5px]">Năm Sinh</div>
                <div className="col-span-4">Chẩn đoán</div>
                <div className="col-span-2">Bác sĩ chỉ định</div>
                <div className="col-span-1 font-mono text-[10.5px]">BHYT</div>
              </div>
              <div className="bg-white grid grid-cols-12 gap-2 px-3 py-1.5 text-[var(--ink-soft)] font-medium border-b border-[var(--line-soft)]">
                <div className="col-span-1 font-mono text-[var(--mute)]">1</div>
                <div className="col-span-3 font-semibold text-[var(--ink)]">Nguyễn Văn An</div>
                <div className="col-span-1 font-mono">1958</div>
                <div className="col-span-4 text-[var(--teal-deep)]">Tăng huyết áp, Đái tháo đường</div>
                <div className="col-span-2">BS. Chánh</div>
                <div className="col-span-1 font-mono">80%</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active File Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--line-strong)] flex-wrap">
            <div className="flex items-center gap-2.5 text-[13px] text-[var(--ink-soft)] font-semibold min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="truncate font-bold text-[var(--ink)]">{fileName}</span>
              <span className="text-[var(--mute)] font-medium">
                — Đã quét tìm thấy <b className="text-[var(--navy)]">{blocks.length} đợt khám</b> ({totalRows} hồ sơ hợp lệ)
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--navy)] hover:bg-[var(--navy-50)] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải file khác
            </button>
          </div>

          {/* Orphan Alert */}
          {orphanCount > 0 && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)]/30 border-l-4 border-l-[var(--rose)] shadow-xs">
              <AlertTriangle className="w-5 h-5 text-[var(--rose)] shrink-0 mt-0.5" />
              <div className="min-w-0 text-[12.5px] leading-relaxed">
                <div className="font-bold text-[var(--rose)]">
                  {orphanCount} dòng dữ liệu bệnh nhân KHÔNG thuộc bảng nào — sẽ bị bỏ qua
                </div>
                <p className="text-[var(--ink-soft)] mt-1">
                  Nguyên nhân do bảng thiếu dòng tiêu đề <b>STT · Họ Tên · Năm Sinh · Chẩn đoán · BHYT · SĐT</b>. Bạn có thể thêm dòng đó vào file Excel và tải lại.
                </p>
                <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-[var(--mute)]">
                  {orphans.map((o, i) => (
                    <li key={i} className="truncate">
                      dòng {o.dong}: {o.noiDung}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Blocks List */}
          <div className="space-y-4">
            {blocks.map((b, bi) => (
              <div key={bi} className="space-y-4">
              {/* Đầu mỗi sheet: một ô chọn tháng áp cho toàn bộ đợt trong sheet đó */}
              {(bi === 0 || blocks[bi - 1].sheet !== b.sheet) && (
                <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-[var(--r-lg)] bg-[var(--navy-50)] border border-[var(--navy-100)] mt-1">
                  <FileSpreadsheet className="w-4 h-4 text-[var(--navy)] shrink-0" />
                  <span className="font-serif text-[15px] font-bold text-[var(--ink)]">Sheet {b.sheet}</span>
                  <span className="text-[12px] text-[var(--mute)] font-medium">
                    {blocks.filter((x) => x.sheet === b.sheet).length} đợt khám
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-[12px] font-bold text-[var(--ink-soft)] whitespace-nowrap">Tháng khám:</label>
                    <input
                      type="month"
                      value={sheetMonths[b.sheet] || ""}
                      onChange={(e) => setThangSheet(b.sheet, e.target.value)}
                      className={`input-field font-mono h-9 w-[215px] shrink-0 ${!sheetMonths[b.sheet] ? "border-[var(--rose)]/60" : ""}`}
                    />
                  </div>
                  <p className="w-full text-[11.5px] text-[var(--ink-soft)] leading-relaxed">
                    {sheetMonths[b.sheet]
                      ? <>Ngày khám tự tăng theo thứ tự đợt: đợt 1 → ngày 01, đợt 2 → ngày 02… Sửa tay từng đợt bên dưới nếu cần.</>
                      : <span className="text-[var(--rose)] font-bold">Không đọc được tháng từ tên sheet — chọn tháng ở đây để gán ngày cho cả {blocks.filter((x) => x.sheet === b.sheet).length} đợt.</span>}
                  </p>
                </div>
              )}
              <div
                className={`rounded-xl border border-[var(--line-strong)] bg-white overflow-hidden shadow-xs transition-all ${
                  b.bo ? "opacity-50 grayscale bg-[var(--surface-bg)]" : ""
                }`}
              >
                {/* Block Header */}
                <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-soft)] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--navy-soft)] text-[var(--navy)] font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                        {bi + 1}
                      </span>
                      <h3 className="font-serif text-[15.5px] font-bold text-[var(--ink)] truncate">
                        {b.tieuDe.replace(/^\d+[\.\s\-–]+/, "")}
                      </h3>
                    </div>
                    <div className="text-[11.5px] text-[var(--mute)] mt-1 font-medium flex items-center gap-2 flex-wrap">
                      <span>Dòng {b.headerRow + 2} trở đi</span>
                      <span>•</span>
                      <span className="text-[var(--ink)] font-bold">{usable(b)} hồ sơ sẽ tạo</span>
                      {b.boQua > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--rose)] font-bold">
                            {b.boQua} dòng không phải bệnh nhân
                          </span>
                        </>
                      )}
                      {b.rows.filter((r) => r.warnings.length).length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--amber-deep)] font-bold">
                            {b.rows.filter((r) => r.warnings.length).length} cảnh báo
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBlocks((p) => p.map((x, i) => (i === bi ? { ...x, bo: !x.bo } : x)))}
                    className={`shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      b.bo
                        ? "bg-white border-[var(--line-heavy)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"
                        : "bg-white border-[var(--rose)]/40 text-[var(--rose)] hover:bg-[var(--rose-soft)]"
                    }`}
                  >
                    {b.bo ? "Khôi phục đợt này" : "Bỏ qua đợt này"}
                  </button>
                </div>

                {!b.bo && (
                  <>
                    {/* Block Fields Config */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3 border-b border-[var(--line-soft)] bg-white">
                      <Field label="Ngày khám" required>
                        <DateField
                          value={b.ngayKham}
                          // Sửa tay -> cắt liên kết với tháng của sheet, đổi tháng sau không ghi đè
                          onChange={(v) =>
                            setBlocks((p) => p.map((x, i) => (i === bi ? { ...x, ngayKham: v, tuDongNgay: false } : x)))
                          }
                          placeholder="dd/mm/yyyy"
                        />
                      </Field>
                      <Field label="Xã / phường" required>
                        <input
                          value={b.xa}
                          onChange={(e) =>
                            setBlocks((p) => p.map((x, i) => (i === bi ? { ...x, xa: e.target.value } : x)))
                          }
                          className="input-field"
                          placeholder="Ví dụ: Lương Hòa"
                        />
                      </Field>
                      <Field label="Địa điểm khám">
                        <input
                          value={b.diaDiem}
                          onChange={(e) =>
                            setBlocks((p) => p.map((x, i) => (i === bi ? { ...x, diaDiem: e.target.value } : x)))
                          }
                          className="input-field"
                          placeholder="Ví dụ: Trạm y tế xã Lương Hòa"
                        />
                      </Field>
                    </div>

                    {/* Data Table */}
                    <div className="max-h-[280px] overflow-auto">
                      <table className="w-full text-left border-collapse text-[12.5px]">
                        <thead className="sticky top-0 bg-[var(--surface-soft)] text-[10.5px] font-bold uppercase tracking-wider text-[var(--mute)] shadow-xs">
                          <tr className="[&>th]:py-2.5 [&>th]:px-3 [&>th]:border-b [&>th]:border-[var(--line)] [&>th]:whitespace-nowrap">
                            <th className="w-[46px] text-center">STT</th>
                            <th>Họ tên</th>
                            <th>Năm sinh</th>
                            <th>Chẩn đoán</th>
                            <th>Bác sĩ chỉ định</th>
                            <th className="text-center">Mức BHYT</th>
                            <th>Số điện thoại</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line-soft)] bg-white">
                          {b.rows.map((r, ri) => (
                            <tr
                              key={ri}
                              className={`hover:bg-[var(--surface-hover)]/70 transition-colors ${
                                r.warnings.length ? "bg-[var(--amber-soft)]/50" : ""
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-[11px] text-[var(--mute)]">
                                {r.sttGoc ?? "—"}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[var(--ink)] whitespace-nowrap">
                                {r.hoTen}
                                {r.warnings.length > 0 && (
                                  <span title={r.warnings.join("\n")} className="ml-1.5 inline-flex align-middle cursor-help">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--amber-deep)]" />
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11.5px] whitespace-nowrap">
                                {r.ngaySinh ? (
                                  r.ngaySinh.split("-").reverse().join("/")
                                ) : r.namSinh ? (
                                  <span className="text-[var(--ink-soft)]">năm {r.namSinh}</span>
                                ) : (
                                  <span className="text-[var(--rose)] font-bold">thiếu</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {r.chanDoan.length ? (
                                  <span className="inline-flex flex-wrap gap-1">
                                    {r.chanDoan.map((c) => (
                                      <span
                                        key={c}
                                        className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[var(--gold-soft)] border border-[var(--gold-line)] text-[var(--gold-deep)] whitespace-nowrap"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="text-[var(--mute-soft)]">—</span>
                                )}
                                {r.chanDoanKhac && (
                                  <div className="text-[10.5px] text-[var(--mute)] mt-0.5 font-mono">
                                    {r.chanDoanKhac}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[11.5px] whitespace-nowrap">
                                {r.bacSiChiDinh || <span className="text-[var(--mute-soft)]">—</span>}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-[11.5px]">
                                {r.mucHuongBHYT != null ? (
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--navy-50)] text-[var(--navy)] font-bold">
                                    {r.mucHuongBHYT}%
                                  </span>
                                ) : (
                                  <span className="text-[var(--mute-soft)]">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11.5px] whitespace-nowrap">
                                {r.sdt || <span className="text-[var(--mute-soft)]">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              </div>
            ))}
          </div>

          {/* Bottom Info Note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--navy-50)] border border-[var(--navy-100)] text-[12px] text-[var(--ink-soft)] leading-relaxed">
            <Info className="w-4 h-4 text-[var(--navy)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                Hồ sơ nhập từ Excel <b>không bắt buộc có giới tính</b> và <b>miễn ràng buộc SĐT</b>.
              </p>
              <p>
                Mã bệnh nhân được cấp theo ngày khám đã chọn. Hãy kiểm tra ngày khám kỹ trước khi ấn nhập.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

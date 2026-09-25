import { getPrisma } from "./prisma";
import { batchCheckHISForPatients } from "./his";
import { classifyCSRNhom } from "./csr";

/**
 * Lịch sử đối chiếu HIS theo đợt khám — lưu vào bảng AuditLog sẵn có
 * (bang = "BuoiKham", hanhDong = "doi_chieu_his", banGhiId = id đợt khám),
 * nên không cần thêm bảng mới ở cả DB cloud (SQL Server) lẫn DB cục bộ (SQLite).
 */
export const DOI_CHIEU_BANG = "BuoiKham";
export const DOI_CHIEU_HANH_DONG = "doi_chieu_his";

export type DoiChieuKieu = "don_le" | "hang_loat";

export interface DoiChieuSummary {
  total: number;
  found: number;
  /** Ca mổ SAU ngày khám tầm soát — tính vào tiến độ CSR. */
  surgery: number;
  /** Ca đã mổ TRƯỚC ngày khám — thống kê riêng, không tính tiến độ. */
  surgeryPrior: number;
  exactMatch: number;
  partialMatch: number;
  errors: number;
  durationMs: number;
}

export interface DoiChieuLog extends Partial<DoiChieuSummary> {
  id: number;
  buoiKhamId: string;
  thoiDiem: string;
  nguoiDung: string;
  nguoiThucHien?: string | null;
  kieu: DoiChieuKieu;
  trangThai: "thanh_cong" | "loi" | "bo_qua";
  loi?: string | null;
}


export function parseDoiChieuLog(row: {
  id: number;
  banGhiId: string;
  thoiDiem: Date;
  nguoiDung: string;
  thayDoi: string;
}): DoiChieuLog {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(row.thayDoi || "{}");
  } catch {}
  return {
    ...(data as Partial<DoiChieuLog>),
    id: row.id,
    buoiKhamId: row.banGhiId,
    thoiDiem: row.thoiDiem.toISOString(),
    nguoiDung: row.nguoiDung,
    kieu: (data.kieu as DoiChieuKieu) || "don_le",
    trangThai: (data.trangThai as DoiChieuLog["trangThai"]) || "thanh_cong",
  };
}

/** Đối chiếu toàn bộ BN Nhóm A + Nhóm B của một đợt khám với HIS, rồi ghi một dòng lịch sử. */
export async function reconcileBuoiKham(
  buoiKhamId: string,
  user: { id: string; name?: string | null },
  kieu: DoiChieuKieu,
): Promise<{ log: DoiChieuLog; coSoId: string | null }> {
  const prisma = getPrisma();
  const started = Date.now();

  const buoiKham = await prisma.buoiKham.findUnique({ where: { id: buoiKhamId }, select: { id: true, coSoId: true } });
  if (!buoiKham) throw new Error("Không tìm thấy đợt khám");

  /* Chọn BN bằng ĐÚNG hàm phân nhóm của hệ thống (classifyCSRNhom) — cùng nguồn với cột
     "Phân nhóm" trên danh sách đợt khám, nên số BN tra luôn bằng A + B đang hiển thị. */
  const all = await prisma.hoSoBenhNhan.findMany({
    where: { buoiKhamId },
    include: { buoiKham: true },
  });
  const patients = all.filter((h) => {
    const c = classifyCSRNhom(h);
    return c.isNhomA || c.isNhomB;
  });

  let payload: Record<string, unknown>;
  if (patients.length === 0) {
    payload = { total: 0, found: 0, surgery: 0, surgeryPrior: 0, exactMatch: 0, partialMatch: 0, errors: 0, trangThai: "bo_qua", loi: "Đợt khám không có BN Nhóm A/B cần đối chiếu" };
  } else {
    try {
      const results = await batchCheckHISForPatients(buoiKham.coSoId, patients);
      payload = {
        total: results.length,
        found: results.filter((r) => r.found).length,
        surgery: results.filter((r) => r.isDaMo).length,
        surgeryPrior: results.filter((r) => r.isDaMoTruoc).length,
        exactMatch: results.filter((r) => r.matchType === "exact").length,
        partialMatch: results.filter((r) => r.found && r.matchType === "partial").length,
        errors: results.filter((r) => r.error).length,
        trangThai: "thanh_cong",
      };
    } catch (e) {
      payload = { total: patients.length, trangThai: "loi", loi: e instanceof Error ? e.message : "Lỗi không xác định" };
    }
  }

  payload = { ...payload, kieu, nguoiThucHien: user.name || user.id, durationMs: Date.now() - started };

  const row = await prisma.auditLog.create({
    data: {
      bang: DOI_CHIEU_BANG,
      banGhiId: buoiKhamId,
      hanhDong: DOI_CHIEU_HANH_DONG,
      nguoiDung: user.id,
      thayDoi: JSON.stringify(payload),
    },
  });

  return { log: parseDoiChieuLog(row), coSoId: buoiKham.coSoId };
}

/** Lần đối chiếu gần nhất của từng đợt khám (một truy vấn cho cả danh sách). */
export async function latestDoiChieuMap(buoiKhamIds: string[]): Promise<Map<string, DoiChieuLog>> {
  const map = new Map<string, DoiChieuLog>();
  if (buoiKhamIds.length === 0) return map;
  const rows = await getPrisma().auditLog.findMany({
    where: { bang: DOI_CHIEU_BANG, hanhDong: DOI_CHIEU_HANH_DONG, banGhiId: { in: buoiKhamIds } },
    orderBy: { thoiDiem: "desc" },
  });
  for (const r of rows) {
    if (!map.has(r.banGhiId)) map.set(r.banGhiId, parseDoiChieuLog(r));
  }
  return map;
}

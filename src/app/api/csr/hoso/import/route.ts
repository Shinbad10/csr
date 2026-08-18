import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { genMaBN, getNextMaSeq, yymmdd } from "@/lib/maBN";
import type { ImportRow } from "@/lib/importExcel";
import { triggerSync } from "@/lib/syncWorker";
import { broadcastEvent } from "@/lib/events";

interface BlockPayload {
  /** Gán vào đợt khám có sẵn; bỏ trống thì tạo đợt mới từ 4 trường bên dưới */
  buoiKhamId?: string;
  ngayKham?: string;   // yyyy-mm-dd (màn xem trước chọn tháng → ngày 01)
  xa?: string;
  diaDiem?: string;
  ghiChu?: string;
  rows: ImportRow[];
}

// Nhập danh sách bệnh nhân lịch sử từ Excel.
// KHÁC với POST /api/csr/hoso: bỏ qua BR-06 (bắt buộc SĐT) và không đòi giới tính,
// vì file lịch sử không có 2 thông tin này. Ràng buộc đầy đủ vẫn giữ nguyên cho
// luồng tiếp nhận trực tiếp.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "hoso.create"))
    return NextResponse.json({ error: "Bạn không có quyền tiếp nhận bệnh nhân" }, { status: 403 });

  const prisma = getPrisma();

  try {
    const { blocks } = (await request.json()) as { blocks: BlockPayload[] };
    if (!Array.isArray(blocks) || blocks.length === 0)
      return NextResponse.json({ error: "Không có khối dữ liệu nào để nhập" }, { status: 400 });

    const coSoId = await getWorkingCoSoId(session);
    if (!coSoId) return NextResponse.json({ error: "Chưa xác định được cơ sở làm việc" }, { status: 400 });

    // Tạo đợt khám mới thì cần thêm quyền quản lý đợt khám
    const needsCreate = blocks.some((b) => !b.buoiKhamId);
    if (needsCreate && !can(session.user.role, "buoikham.manage"))
      return NextResponse.json({ error: "Bạn không có quyền tạo đợt khám mới" }, { status: 403 });

    const results: { tieuDe: string; buoiKhamId: string; created: number; skipped: number; errors: string[] }[] = [];

    for (const blk of blocks) {
      // Chỉ cần HỌ TÊN. Thiếu năm sinh vẫn nhập — dữ liệu lịch sử nhiều hồ sơ không ghi.
      const rows = (blk.rows || []).filter((r) => r.hoTen?.trim());
      const errors: string[] = [];
      let skipped = (blk.rows || []).length - rows.length;

      let buoiKhamId = blk.buoiKhamId;
      let ngayKham: Date;

      if (buoiKhamId) {
        const bk = await prisma.buoiKham.findUnique({ where: { id: buoiKhamId } });
        if (!bk) { results.push({ tieuDe: blk.xa || buoiKhamId, buoiKhamId, created: 0, skipped: rows.length, errors: ["Không tìm thấy đợt khám"] }); continue; }
        ngayKham = bk.ngayKham;
      } else {
        if (!blk.ngayKham || !blk.xa?.trim()) {
          results.push({ tieuDe: blk.xa || "(chưa đặt tên)", buoiKhamId: "", created: 0, skipped: rows.length, errors: ["Thiếu tháng khám hoặc xã"] });
          continue;
        }
        ngayKham = new Date(`${blk.ngayKham}T00:00:00`);
        // Mã đợt khám giữ đúng quy ước ĐK-YYMMDD-NN như luồng tạo thủ công
        const dateStr = yymmdd(ngayKham);
        const bkPrefix = `ĐK-${dateStr}-`;
        const lastBk = await prisma.buoiKham.findFirst({
          where: { id: { startsWith: bkPrefix } },
          orderBy: { id: "desc" },
          select: { id: true },
        });
        const maxBkSeq = lastBk?.id ? parseInt(lastBk.id.slice(bkPrefix.length), 10) || 0 : 0;
        const bkId = `${bkPrefix}${String(maxBkSeq + 1).padStart(2, "0")}`;
        const bk = await prisma.buoiKham.create({
          data: {
            id: bkId,
            coSoId,
            ngayKham,
            xa: blk.xa.trim(),
            diaDiem: (blk.diaDiem || blk.xa).trim(),
            ghiChu: blk.ghiChu?.trim() || null,
            nguoiTao: session.user.id,
          },
        });
        buoiKhamId = bk.id;
      }

      // STT nối tiếp hồ sơ đã có trong đợt (import 2 lần không đè lên nhau)
      const last = await prisma.hoSoBenhNhan.findFirst({ where: { buoiKhamId }, orderBy: { stt: "desc" } });
      let stt = (last?.stt ?? 0) + 1;

      // Mã BN chỉ mã hoá {CƠ SỞ}-{MMDD}-{số}. Hai đợt khám CÙNG NGÀY mà cùng bắt đầu
      // từ 001 sẽ đụng khoá duy nhất, nên số thứ tự trong mã phải tính theo TIỀN TỐ
      // ngày trên toàn cơ sở, tách khỏi STT hiển thị của từng đợt.
      let maSeq = await getNextMaSeq(prisma, coSoId, ngayKham);

      const data = [];
      for (const r of rows) {
        data.push({
          maBN: genMaBN(coSoId, ngayKham, maSeq++),
          stt: stt++,
          buoiKhamId,
          coSoId,
          hoTen: r.hoTen.trim(),
          gioiTinh: "",                       // file lịch sử không có cột giới tính
          ngaySinh: r.ngaySinh ? new Date(`${r.ngaySinh}T00:00:00`) : null,
          namSinh: r.namSinh ?? null,
          sdt: r.sdt || null,                 // BR-06 được miễn ở luồng import
          mucHuongBHYT: r.mucHuongBHYT ?? null,
          chanDoan: JSON.stringify(r.chanDoan || []),
          chanDoanKhac: r.chanDoanKhac?.trim() || null,
          bacSiChiDinh: r.bacSiChiDinh?.trim() || null,
          trangThai: (r.chanDoan?.length ?? 0) > 0 ? "DaKham" : "TiepNhan",
          updatedBy: session.user.id,
        });
      }

      // Ghi theo lô, lô nào hỏng thì rơi về từng dòng: một bản ghi lỗi không được
      // phép kéo cả đợt khám xuống 0 như trước.
      const msg = (e: unknown) => (e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "Lỗi ghi dữ liệu");
      let created = 0;
      let failedRows = 0;
      const CHUNK = 100;
      for (let i = 0; i < data.length; i += CHUNK) {
        const slice = data.slice(i, i + CHUNK);
        try {
          await prisma.hoSoBenhNhan.createMany({ data: slice });
          created += slice.length;
        } catch {
          for (const row of slice) {
            try {
              await prisma.hoSoBenhNhan.create({ data: row });
              created++;
            } catch (e) {
              failedRows++;
              if (errors.length < 3) errors.push(`${row.hoTen}: ${msg(e)}`);
            }
          }
        }
      }
      if (failedRows > errors.length) errors.push(`…tổng ${failedRows} dòng lỗi`);

      results.push({
        tieuDe: blk.xa || blk.ghiChu || buoiKhamId,
        buoiKhamId,
        created,
        skipped,
        errors,
      });
    }

    // Tự động đẩy toàn bộ hồ sơ mới tạo vào SyncQueue và kích hoạt đồng bộ Google Sheet
    const allBuoiKhamIds = results.map((r) => r.buoiKhamId).filter(Boolean);
    if (allBuoiKhamIds.length > 0) {
      const createdHoSos = await prisma.hoSoBenhNhan.findMany({
        where: { buoiKhamId: { in: allBuoiKhamIds } },
        select: { id: true },
      });
      if (createdHoSos.length > 0) {
        await prisma.syncQueue.createMany({
          data: createdHoSos.map((h) => ({ hoSoId: h.id })),
        });
        triggerSync(); // Kích hoạt đồng bộ nền đẩy lên Google Sheet
      }
    }

    const total = results.reduce((s, r) => s + r.created, 0);

    if (total > 0) {
      broadcastEvent({
        type: "buoikham_change",
        action: "create",
        coSoId,
      });
      broadcastEvent({
        type: "hoso_change",
        action: "create",
        coSoId,
      });
    }

    return NextResponse.json({ success: true, total, results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi nhập dữ liệu" }, { status: 500 });
  }
}

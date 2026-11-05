import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, resolveCoSoScope } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { HOSO_HEADER, hoSoToCells, KHAM_SUC_KHOE_HEADER, hoSoToKhamSucKhoeCells } from "@/lib/csr";
import { buildRutGonExcelWorkbook } from "@/lib/exportRutGonExcel";
import { buildTiepNhanExcelWorkbook } from "@/lib/exportTiepNhanExcel";
import * as XLSX from "xlsx";

import { DOT_CON_HIEU_LUC, HOSO_CUA_DOT_CON_HIEU_LUC } from "@/lib/dotKham";
const dateStr = (d?: Date | string | null) => (d ? new Date(d) : new Date()).toISOString().slice(0, 10);
const cleanXa = (xa: string | undefined, fallback: string) =>
  (xa || fallback).replace(/[^a-zA-Z0-9_À-ɏḀ-ỿ]/g, "_");

function xlsxResponse(body: BodyInit, fileName: string) {
  const asciiName = fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "_");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

// UC-08 / SRS §11.1 — xuất danh sách theo bộ lọc + phân quyền cơ sở.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "report.export"))
    return NextResponse.json({ error: "Bạn không có quyền xuất dữ liệu" }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const trangThai = sp.get("trangThai") || undefined;
  const format = sp.get("format") || "default";
  const fromDate = sp.get("from") || undefined;
  const toDate = sp.get("to") || undefined;

  // Phạm vi cơ sở do SERVER quyết định (không tin ?coSoId= của nhân viên cơ sở, không bao giờ xuất "tất cả").
  const scope = await resolveCoSoScope(session, sp.get("coSoId"));
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });
  const { coSoId } = scope;

  const gte = fromDate ? new Date(fromDate) : null;
  const lte = toDate ? new Date(`${toDate}T23:59:59.999Z`) : null;
  if ((gte && isNaN(gte.getTime())) || (lte && isNaN(lte.getTime())))
    return NextResponse.json({ error: "Khoảng ngày không hợp lệ" }, { status: 400 });

  try {
    const prisma = getPrisma();

    // Đợt khám phải thuộc đúng cơ sở đang xuất (và chưa bị xoá mềm).
    let buoiKhamInfo: { xa?: string; diaDiem?: string; ngayKham?: Date } | null = null;
    if (buoiKhamId) {
      buoiKhamInfo = await prisma.buoiKham.findFirst({
        where: { id: buoiKhamId, coSoId, ...DOT_CON_HIEU_LUC },
        select: { xa: true, diaDiem: true, ngayKham: true },
      });
      if (!buoiKhamInfo) return NextResponse.json({ error: "Không tìm thấy đợt khám của cơ sở này" }, { status: 404 });
    }

    const ngayKhamRange = gte || lte ? { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } : null;

    const rows = await prisma.hoSoBenhNhan.findMany({
      where: {
        AND: [
          { coSoId },
          { buoiKham: { coSoId } }, // hồ sơ và đợt khám cùng cơ sở: chặn dữ liệu lệch chéo cơ sở
          buoiKhamId ? { buoiKhamId } : {},
          trangThai ? { trangThai } : {},
          ngayKhamRange ? { buoiKham: { ngayKham: ngayKhamRange } } : {},
          HOSO_CUA_DOT_CON_HIEU_LUC, // bỏ hồ sơ thuộc đợt khám đã xoá mềm
        ],
      },
      include: {
        buoiKham: { select: { id: true, ngayKham: true, xa: true, diaDiem: true, ghiChu: true, bacSiKham: true } },
        tuVanVien: { select: { hoTen: true } },
      },
      orderBy: [{ buoiKhamId: "asc" }, { stt: "asc" }],
    });

    if (format === "rutGon" || format === "tiepNhan") {
      const ids = rows.map((r) => r.id);
      const CHUNK_SIZE = 500;
      const nhatKyMap = new Map<string, Array<{ noiDung: string; ngay: Date }>>();

      // Các lô nhật ký độc lập nhau → chạy song song thay vì tuần tự.
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) chunks.push(ids.slice(i, i + CHUNK_SIZE));
      const logBatches = await Promise.all(
        chunks.map((chunk) =>
          prisma.nhatKyTheoDoi.findMany({
            where: { hoSoId: { in: chunk } },
            select: { hoSoId: true, noiDung: true, ngay: true },
            orderBy: { ngay: "desc" },
          }),
        ),
      );
      for (const logs of logBatches) {
        for (const log of logs) {
          const list = nhatKyMap.get(log.hoSoId);
          if (list) list.push({ noiDung: log.noiDung, ngay: log.ngay });
          else nhatKyMap.set(log.hoSoId, [{ noiDung: log.noiDung, ngay: log.ngay }]);
        }
      }

      const rowsWithNhatKy = rows.map((r) => ({
        ...r,
        nhatKy: nhatKyMap.get(r.id) || [],
      }));

      // M\u1EABu ti\u1EBFp nh\u1EADn: m\u1ED7i \u0111\u1EE3t kh\u00E1m m\u1ED9t sheet (\u0111\u0103ng k\u00FD / kh\u00F4ng \u0111\u0103ng k\u00FD)
      const excelWb =
        format === "tiepNhan"
          ? await buildTiepNhanExcelWorkbook(rowsWithNhatKy)
          : await buildRutGonExcelWorkbook(rowsWithNhatKy, buoiKhamInfo);
      const buf = await excelWb.xlsx.writeBuffer();

      return xlsxResponse(
        buf as unknown as BodyInit,
        `${format === "tiepNhan" ? "Danh_Sach_Tiep_Nhan" : "Danh_Sach_Rut_Gon"}_${cleanXa(buoiKhamInfo?.xa, format === "tiepNhan" ? "Tat_ca_dot" : "RutGon")}_${dateStr(buoiKhamInfo?.ngayKham)}.xlsx`,
      );
    }

    const isKhamSucKhoe = format === "khamSucKhoe";
    const headerRow = isKhamSucKhoe ? [...KHAM_SUC_KHOE_HEADER] : [...HOSO_HEADER];
    const dataRows = rows.map((h) => (isKhamSucKhoe ? hoSoToKhamSucKhoeCells(h) : hoSoToCells(h)));
    const aoa: (string | number)[][] = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Căn chỉnh độ rộng các cột
    if (isKhamSucKhoe) {
      ws["!cols"] = KHAM_SUC_KHOE_HEADER.map((hdr, colIdx) => {
        const headerLen = Math.max(...hdr.split("\n").map((l) => l.length));
        let maxLen = headerLen;
        for (const r of dataRows) {
          const val = String(r[colIdx] ?? "");
          if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
      });
    } else {
      ws["!cols"] = [
        { wch: 18 }, // Xã
        { wch: 25 }, // Điểm xã
        { wch: 14 }, // Ngày khám
        { wch: 18 }, // Mã định danh
        { wch: 26 }, // Họ tên bệnh nhân
        { wch: 10 }, // Năm sinh
        { wch: 8 },  // Tuổi
        { wch: 10 }, // Giới tính
        { wch: 14 }, // Số điện thoại
        { wch: 10 }, // BHYT
        { wch: 14 }, // Có bệnh lý
        { wch: 18 }, // Đục thủy tinh thể
        { wch: 10 }, // Mộng
        { wch: 10 }, // Khác
        { wch: 35 }, // Chi tiết chẩn đoán
        { wch: 20 }, // Bác sỹ khám
        { wch: 22 }, // Nhân viên tư vấn
        { wch: 20 }, // Xác nhận điều trị
        { wch: 20 }, // Ngày điều trị dự kiến
        { wch: 14 }, // Ngày đến BV
        { wch: 14 }, // Ngày mổ thực tế
        { wch: 18 }, // Trạng thái điều trị
        { wch: 16 }, // Thực thu HIS
        { wch: 16 }, // Mã BN HIS
        { wch: 40 }, // Ghi chú
        { wch: 18 }, // Mã BN
      ];
    }

    const wb = XLSX.utils.book_new();
    const sheetName = buoiKhamInfo?.xa
      ? (isKhamSucKhoe ? `KSK_${buoiKhamInfo.xa}` : `KhamMat_${buoiKhamInfo.xa}`).slice(0, 31)
      : (isKhamSucKhoe ? "KhamSucKhoe" : "Danh sách BN");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    let fileName = isKhamSucKhoe ? `Kham_Suc_Khoe_VISI_${dateStr()}.xlsx` : `VISI_CSR_${dateStr()}.xlsx`;
    if (buoiKhamInfo) {
      const xa = cleanXa(buoiKhamInfo.xa, "KhamMat");
      const ngay = dateStr(buoiKhamInfo.ngayKham);
      fileName = isKhamSucKhoe ? `Kham_Suc_Khoe_${xa}_${ngay}.xlsx` : `Danh_Sach_Kham_Mat_${xa}_${ngay}.xlsx`;
    }

    return xlsxResponse(buf, fileName);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

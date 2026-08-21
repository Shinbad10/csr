import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { HOSO_HEADER, hoSoToCells, KHAM_SUC_KHOE_HEADER, hoSoToKhamSucKhoeCells } from "@/lib/csr";
import * as XLSX from "xlsx";

// UC-08 / SRS §11.1 — xuất danh sách theo bộ lọc + phân quyền cơ sở.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "report.export"))
    return NextResponse.json({ error: "Bạn không có quyền xuất dữ liệu" }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const trangThai = sp.get("trangThai") || undefined;
  const format = sp.get("format") || "default";

  try {
    let buoiKhamInfo: { xa?: string; diaDiem?: string; ngayKham?: Date } | null = null;
    if (buoiKhamId) {
      buoiKhamInfo = await getPrisma().buoiKham.findUnique({
        where: { id: buoiKhamId },
        select: { xa: true, diaDiem: true, ngayKham: true },
      });
    }

    const rows = await getPrisma().hoSoBenhNhan.findMany({
      where: { AND: [coSoId ? { coSoId } : {}, buoiKhamId ? { buoiKhamId } : {}, trangThai ? { trangThai } : {}] },
      include: { buoiKham: true, tuVanVien: { select: { hoTen: true } } },
      orderBy: [{ buoiKhamId: "asc" }, { stt: "asc" }],
    });

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
        { wch: 40 }, // Ghi chú
        { wch: 18 }, // Mã BN
      ];
    }

    const wb = XLSX.utils.book_new();
    const sheetName = buoiKhamInfo?.xa ? `KhamMat_${buoiKhamInfo.xa}`.slice(0, 31) : "Danh sách BN";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    let fileName = `VISI_CSR_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (buoiKhamInfo) {
      const dateStr = buoiKhamInfo.ngayKham
        ? new Date(buoiKhamInfo.ngayKham).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const cleanXa = (buoiKhamInfo.xa || "KhamMat").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_");
      fileName = `Danh_Sach_Kham_Mat_${cleanXa}_${dateStr}.xlsx`;
    }

    const asciiName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s+/g, "_");

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

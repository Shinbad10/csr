import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { HOSO_HEADER, hoSoToCells } from "@/lib/csr";
import * as XLSX from "xlsx";

// UC-08 / SRS §11.1 — xuất danh sách theo bộ lọc + phân quyền cơ sở.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "report.export"))
    return NextResponse.json({ error: "Chỉ Kế toán hoặc Quản lý được xuất dữ liệu" }, { status: 403 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const trangThai = sp.get("trangThai") || undefined;

  try {
    const rows = await getPrisma().hoSoBenhNhan.findMany({
      where: { AND: [coSoId ? { coSoId } : {}, buoiKhamId ? { buoiKhamId } : {}, trangThai ? { trangThai } : {}] },
      include: {
        coSo: true, buoiKham: true, _count: { select: { nhatKy: true } },
        tuVanVien: { select: { hoTen: true } }, nguoiChotCuoi: { select: { hoTen: true } },
      },
      orderBy: [{ buoiKhamId: "asc" }, { stt: "asc" }],
    });

    const aoa: (string | number)[][] = [[...HOSO_HEADER], ...rows.map((h) => hoSoToCells({ ...h, soLanLienHe: h._count.nhatKy }))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách BN");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="VISI_CSR_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

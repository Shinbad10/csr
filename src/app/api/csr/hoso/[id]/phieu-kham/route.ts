import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, canAccessCoSo } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { docToaThuoc } from "@/lib/csr";

export const dynamic = "force-dynamic";

/** Dữ liệu in "Phiếu khám mắt": bệnh nhân + chẩn đoán, đợt khám, thông tin bệnh viện và toa thuốc mặc định của cơ sở. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const h = await getPrisma().hoSoBenhNhan.findUnique({
    where: { id },
    select: {
      id: true,
      maBN: true,
      coSoId: true,
      hoTen: true,
      gioiTinh: true,
      ngaySinh: true,
      namSinh: true,
      diaChi: true,
      khuPho: true,
      xaPhuong: true,
      thiLucMP: true,
      thiLucMT: true,
      thiLucCoKinhMP: true,
      thiLucCoKinhMT: true,
      chanDoanMP: true,
      chanDoanMT: true,
      chanDoanKhacMP: true,
      chanDoanKhacMT: true,
      chanDoan: true,
      chanDoanKhac: true,
      loaiBenhLy: true,
      loaiBenhLyKhac: true,
      tienSuPhauThuat: true,
      huongXuTri: true,
      huongXuTriKhac: true,
      khuyenNghi: true,
      bacSiChiDinh: true,
      buoiKham: { select: { id: true, ngayKham: true, xa: true, diaDiem: true, bacSiKham: true } },
      coSo: { select: { id: true, ten: true, diaChi: true, dienThoai: true, email: true, website: true, toaThuoc: true } },
    },
  });
  if (!h) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (!canAccessCoSo(session, h.coSoId)) return NextResponse.json({ error: "Hồ sơ thuộc cơ sở khác" }, { status: 403 });

  const { coSo, ...hoSo } = h;
  return NextResponse.json({
    hoSo,
    benhVien: { ten: coSo.ten, diaChi: coSo.diaChi, dienThoai: coSo.dienThoai, email: coSo.email, website: coSo.website },
    toa: docToaThuoc(coSo.toaThuoc),
  });
}

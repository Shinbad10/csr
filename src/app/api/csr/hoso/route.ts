import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { genMaBN } from "@/lib/maBN";
import { audit } from "@/lib/audit";
import { triggerSync } from "@/lib/syncWorker";
import { bhytLevel } from "@/lib/csr";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const trangThai = sp.get("trangThai") || undefined;
  const search = sp.get("search") || "";

  try {
    const data = await getPrisma().hoSoBenhNhan.findMany({
      where: {
        AND: [
          coSoId ? { coSoId } : {},
          buoiKhamId ? { buoiKhamId } : {},
          trangThai ? { trangThai } : {},
          search
            ? { OR: [{ maBN: { contains: search } }, { hoTen: { contains: search } }, { sdt: { contains: search } }, { cccd: { contains: search } }] }
            : {},
        ],
      },
      include: { buoiKham: true, coSo: true, tuVanVien: true },
      orderBy: [{ stt: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "hoso.create"))
    return NextResponse.json({ error: "Bạn không có quyền tiếp nhận bệnh nhân" }, { status: 403 });

  const prisma = getPrisma();
  try {
    const b = await request.json();
    if (!b.buoiKhamId || !b.hoTen || !b.gioiTinh)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (họ tên, giới tính, buổi khám)" }, { status: 400 });

    // ngày sinh: nhận ISO (ngaySinh) → suy năm; hoặc namSinh nhập tay
    const ngaySinh = b.ngaySinh ? new Date(b.ngaySinh) : null;
    const namSinh = ngaySinh ? ngaySinh.getFullYear() : b.namSinh ? parseInt(b.namSinh) : null;
    if (!namSinh) return NextResponse.json({ error: "Thiếu ngày sinh / năm sinh" }, { status: 400 });

    // BR-06
    if (!b.sdt && !b.sdtNguoiNha)
      return NextResponse.json({ error: "Phải nhập SĐT hoặc SĐT người nhà" }, { status: 400 });

    const buoiKham = await prisma.buoiKham.findUnique({ where: { id: b.buoiKhamId }, include: { coSo: true } });
    if (!buoiKham) return NextResponse.json({ error: "Không tìm thấy buổi khám" }, { status: 404 });

    // Mức hưởng BHYT: ưu tiên giá trị nhập tay, nếu không thì suy từ mã thẻ (ký tự thứ 3)
    const mucHuongRaw = b.mucHuongBHYT ?? bhytLevel(b.bhyt);
    const mucHuongBHYT = Number.isFinite(parseInt(String(mucHuongRaw), 10)) ? parseInt(String(mucHuongRaw), 10) : null;

    // Chống trùng trong cùng buổi khám (Trừ khi người dùng bấm Yes confirm bỏ qua cảnh báo)
    if (!b.boQuaTrung && !b.forceCreate) {
      const dup = await prisma.hoSoBenhNhan.findFirst({
        where: {
          buoiKhamId: b.buoiKhamId,
          OR: [
            ...(b.cccd ? [{ cccd: String(b.cccd).trim() }] : []),
            { hoTen: b.hoTen.trim(), namSinh },
          ],
        },
      });
      if (dup) return NextResponse.json({ error: `Bệnh nhân đã có trong buổi khám (STT ${dup.stt}, ${dup.maBN})`, isDuplicate: true }, { status: 409 });
    }

    // BR-02 STT + BR-01 mã BN (transaction)
    const last = await prisma.hoSoBenhNhan.findFirst({ where: { buoiKhamId: b.buoiKhamId }, orderBy: { stt: "desc" } });
    const stt = (last?.stt ?? 0) + 1;
    const maBN = genMaBN(buoiKham.coSo.id, buoiKham.ngayKham, stt);

    const data = await prisma.hoSoBenhNhan.create({
      data: {
        maBN, stt, buoiKhamId: b.buoiKhamId, coSoId: buoiKham.coSoId,
        hoTen: b.hoTen.trim(), gioiTinh: b.gioiTinh, ngaySinh, namSinh,
        cccd: b.cccd || null, diaChi: b.diaChi || null, sdt: b.sdt || null,
        sdtNguoiNha: b.sdtNguoiNha || null, bhyt: b.bhyt || null,
        mucHuongBHYT, khuPho: b.khuPho || null, xaPhuong: b.xaPhuong || null,
        trangThai: "TiepNhan", createdBy: session.user.id,
      },
    });

    await audit(session.user.id, "HoSoBenhNhan", data.id, "them", { maBN, hoTen: data.hoTen });
    await prisma.syncQueue.create({ data: { hoSoId: data.id } }); // BR-15
    triggerSync(); // đẩy Sheet ngay, không chặn response
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

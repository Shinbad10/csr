import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { genMaBN, getNextMaSeq } from "@/lib/maBN";
import { audit } from "@/lib/audit";
import { triggerSync } from "@/lib/syncWorker";
import { bhytLevel } from "@/lib/csr";
import { broadcastEvent } from "@/lib/events";

// Quan hệ kèm theo cho danh sách hồ sơ trả về TRÌNH DUYỆT.
// Không dùng `coSo: true` / `tuVanVien: true`: nó gửi cả bhxhPass, hisPass, matKhauHash ra client
// và lặp lại trên từng dòng (danh sách ~160 kB mỗi lần nạp).
const RELATIONS_DANH_SACH = {
  buoiKham: true,
  coSo: { select: { id: true, ten: true, diaChi: true, cauHinhTruong: true } },
  tuVanVien: { select: { maNV: true, hoTen: true } },
} as const;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const trangThai = sp.get("trangThai") || undefined;
  const nhom = sp.get("nhom") || undefined;
  const search = sp.get("search") || "";
  const isPaginated = sp.has("page") || sp.has("pageSize");

  try {
    const where: any = {
      AND: [
        coSoId ? { coSoId } : {},
        buoiKhamId ? { buoiKhamId } : {},
        trangThai ? { trangThai } : {},
        nhom ? { nhom } : {},
        search
          ? { OR: [{ maBN: { contains: search } }, { hoTen: { contains: search } }, { sdt: { contains: search } }, { cccd: { contains: search } }] }
          : {},
      ],
    };

    if (isPaginated) {
      const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
      const pageSize = Math.min(200, Math.max(10, parseInt(sp.get("pageSize") || "50", 10)));
      const prisma = getPrisma();
      const [total, items] = await Promise.all([
        prisma.hoSoBenhNhan.count({ where }),
        prisma.hoSoBenhNhan.findMany({
          where,
          include: RELATIONS_DANH_SACH,
          orderBy: [{ stt: "asc" }, { createdAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return NextResponse.json({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    const data = await getPrisma().hoSoBenhNhan.findMany({
      where,
      include: RELATIONS_DANH_SACH,
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

    // BR-02 STT hiển thị trong đợt khám
    const last = await prisma.hoSoBenhNhan.findFirst({ where: { buoiKhamId: b.buoiKhamId }, orderBy: { stt: "desc" } });
    const stt = (last?.stt ?? 0) + 1;

    // BR-01 mã BN (transaction / retry protection):
    // Mã BN = {CƠ SỞ}-{MMDD}-{số}. Nếu có 2 đợt khám cùng ngày, maSeq phải tính
    // theo tiền tố ngày của cơ sở để tránh trùng khoá maBN.
    let maSeq = await getNextMaSeq(prisma, buoiKham.coSoId, buoiKham.ngayKham);

    let data;
    let attempts = 0;
    while (attempts < 5) {
      const maBN = genMaBN(buoiKham.coSo.id, buoiKham.ngayKham, maSeq);
      try {
        data = await prisma.hoSoBenhNhan.create({
          data: {
            maBN, stt, buoiKhamId: b.buoiKhamId, coSoId: buoiKham.coSoId,
            hoTen: b.hoTen.trim().toUpperCase(), gioiTinh: b.gioiTinh, ngaySinh, namSinh,
            cccd: b.cccd || null, diaChi: b.diaChi || null, sdt: b.sdt || null,
            sdtNguoiNha: b.sdtNguoiNha || null, bhyt: b.bhyt || null,
            mucHuongBHYT, khuPho: b.khuPho || null, xaPhuong: b.xaPhuong || null,
            bacSiChiDinh: buoiKham.bacSiKham || null,
            trangThai: "TiepNhan", createdBy: session.user.id,
          },
          include: { buoiKham: true, coSo: true, tuVanVien: true },
        });
        break;
      } catch (e: any) {
        if (e?.code === "P2002" || String(e?.message).includes("maBN") || String(e?.message).includes("Unique constraint")) {
          maSeq++;
          attempts++;
          if (attempts >= 5) throw e;
        } else {
          throw e;
        }
      }
    }

    if (!data) throw new Error("Không thể tạo mã bệnh nhân duy nhất");

    await audit(session.user.id, "HoSoBenhNhan", data.id, "them", { maBN: data.maBN, hoTen: data.hoTen });
    await prisma.syncQueue.create({ data: { hoSoId: data.id } }); // BR-15
    triggerSync(); // đẩy Sheet ngay, không chặn response

    broadcastEvent({
      type: "hoso_change",
      action: "create",
      coSoId: data.coSoId,
      buoiKhamId: data.buoiKhamId,
      hoSoId: data.id,
      data,
    });

    broadcastEvent({
      type: "buoikham_change",
      action: "update",
      coSoId: data.coSoId,
      buoiKhamId: data.buoiKhamId,
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

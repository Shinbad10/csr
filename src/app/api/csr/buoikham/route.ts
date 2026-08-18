import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { yymmdd } from "@/lib/maBN";
import { can } from "@/lib/permissions";
import { broadcastEvent } from "@/lib/events";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coSoId = new URL(request.url).searchParams.get("coSoId") || (await getWorkingCoSoId(session));
  try {
    const prisma = getPrisma();
    const whereCoSo = coSoId ? { coSoId } : undefined;

    // Tối ưu tốc độ nạp: Dùng aggregation ở cấp DB thay vì tải toàn bộ hàng ngàn dòng hồ sơ về bộ nhớ Node.js
    const [buoiKhams, hoSoGroups, daMoGroups, doctorsFallback] = await Promise.all([
      prisma.buoiKham.findMany({
        where: whereCoSo,
        include: {
          coSo: true,
          _count: { select: { hoSo: true } },
        },
        orderBy: [{ createdAt: "desc" }, { ngayKham: "desc" }],
      }),
      prisma.hoSoBenhNhan.groupBy({
        by: ["buoiKhamId", "nhom", "trangThai"],
        _count: { _all: true },
        where: whereCoSo,
      }),
      prisma.hoSoBenhNhan.groupBy({
        by: ["buoiKhamId"],
        _count: { _all: true },
        where: {
          ...(coSoId ? { coSoId } : {}),
          ngayMoThucTe: { not: null },
        },
      }),
      prisma.hoSoBenhNhan.findMany({
        where: {
          ...(coSoId ? { coSoId } : {}),
          bacSiChiDinh: { not: null },
          buoiKham: { bacSiKham: null },
        },
        select: { buoiKhamId: true, bacSiChiDinh: true },
        distinct: ["buoiKhamId"],
      }),
    ]);

    const daMoMap = new Map<string, number>();
    for (const g of daMoGroups) {
      if (g.buoiKhamId) daMoMap.set(g.buoiKhamId, g._count._all);
    }

    const docMap = new Map<string, string>();
    for (const d of doctorsFallback) {
      if (d.buoiKhamId && d.bacSiChiDinh && !docMap.has(d.buoiKhamId)) {
        docMap.set(d.buoiKhamId, d.bacSiChiDinh);
      }
    }

    const statsMap = new Map<string, { nhomA: number; nhomB: number }>();
    for (const g of hoSoGroups) {
      if (!g.buoiKhamId) continue;
      let curr = statsMap.get(g.buoiKhamId);
      if (!curr) {
        curr = { nhomA: 0, nhomB: 0 };
        statsMap.set(g.buoiKhamId, curr);
      }
      const cnt = g._count._all;
      const isA = g.nhom === "A" || ["NhomA", "DaNhacLich", "DaDonVien", "DaMoHauPhau"].includes(g.trangThai);
      const isB = g.nhom === "B" || g.trangThai === "NhomB";
      if (isA) curr.nhomA += cnt;
      else if (isB) curr.nhomB += cnt;
    }

    const result = buoiKhams.map((bk) => {
      const st = statsMap.get(bk.id) || { nhomA: 0, nhomB: 0 };
      const daMo = daMoMap.get(bk.id) || 0;
      const chuaMo = Math.max(0, st.nhomA - daMo);
      const bacSiKham = bk.bacSiKham || docMap.get(bk.id) || null;
      return {
        ...bk,
        bacSiKham,
        stats: {
          nhomA: st.nhomA,
          nhomB: st.nhomB,
          daMo,
          chuaMo,
        },
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "buoikham.manage"))
    return NextResponse.json({ error: "Bạn không có quyền tạo buổi khám" }, { status: 403 });

  try {
    const { coSoId, ngayKham, xa, diaDiem, bacSiKham, ghiChu } = await request.json();
    if (!coSoId || !ngayKham || !xa || !diaDiem)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (cơ sở, ngày, xã, địa điểm)" }, { status: 400 });

    const dateStr = yymmdd(new Date(ngayKham)); // YYMMDD theo giờ địa phương
    const prefix = `ĐK-${dateStr}-`;
    const lastBk = await getPrisma().buoiKham.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const maxBkSeq = lastBk?.id ? parseInt(lastBk.id.slice(prefix.length), 10) || 0 : 0;
    const id = `${prefix}${String(maxBkSeq + 1).padStart(2, "0")}`;


    const trimmedBacSi = bacSiKham?.trim() || null;
    if (trimmedBacSi) {
      const docNames = trimmedBacSi.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
      for (const docName of docNames) {
        const existingUser = await getPrisma().nguoiDungCSR.findFirst({
          where: { hoTen: { equals: docName } },
        });
        if (!existingUser) {
          const cleanName = docName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          const rand = Math.random().toString(36).slice(2, 6);
          const maNV = `BS-${Date.now().toString().slice(-6)}-${rand}`.toUpperCase();
          const tenDangNhap = `bs_${cleanName || "user"}_${rand}`.slice(0, 50);
          await getPrisma().nguoiDungCSR.create({
            data: {
              maNV,
              maHIS: null, // Để trống mã HIS theo yêu cầu, chờ đồng bộ sau
              hoTen: docName,
              vaiTro: "BacSi",
              coSoId,
              tenDangNhap,
              matKhauHash: "CSR_LOCAL_CREATED",
              trangThai: "active",
            },
          }).catch((err) => console.error("Auto create doctor error:", err));
        }
      }
    }

    const data = await getPrisma().buoiKham.create({
      data: { id, coSoId, ngayKham: new Date(ngayKham), xa, diaDiem, bacSiKham: trimmedBacSi, ghiChu: ghiChu || null, nguoiTao: session.user.id },
      include: { coSo: true, _count: { select: { hoSo: true } } },
    });

    broadcastEvent({
      type: "buoikham_change",
      action: "create",
      coSoId: data.coSoId,
      buoiKhamId: data.id,
      data,
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

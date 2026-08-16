import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { syncHisDoctors } from "@/lib/his";

// Lưu vết thời điểm sync gần nhất để không gọi kết nối HIS quá dồn dập
let lastSyncTimestamp = 0;
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 phút

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const coSoId = searchParams.get("coSoId") || session?.user?.coSoId || null;
    const prisma = getPrisma();

    // Tự động kích hoạt đồng bộ nền từ HIS nếu đã qua 15 phút kể từ lần đồng bộ trước
    const now = Date.now();
    if (now - lastSyncTimestamp > SYNC_INTERVAL_MS) {
      lastSyncTimestamp = now;
      syncHisDoctors(coSoId).catch((err) => {
        console.error("Background HIS Doctors Sync Error:", err);
      });
    }

    // 1. Chỉ lấy danh sách người dùng chính thức có vai trò Bác sĩ (bao gồm cả bác sĩ đã đồng bộ từ DMNhanSu HIS)
    let users: any[] = [];
    try {
      users = await prisma.nguoiDungCSR.findMany({
        where: {
          trangThai: "active",
          OR: [
            { vaiTro: "BacSi" },
            { vaiTro: { contains: "BacSi" } },
            { vaiTro: { contains: "Bác sỹ" } },
            { vaiTro: { contains: "Bác sĩ" } },
            { hoTen: { startsWith: "BS" } },
            { hoTen: { startsWith: "Bác sỹ" } },
            { hoTen: { startsWith: "Bác sĩ" } },
          ],
        },
        select: { maNV: true, hoTen: true, maHIS: true, coSoId: true } as any,
        orderBy: { hoTen: "asc" },
      });
    } catch (err) {
      // Fallback nếu Prisma client đang reload
      users = await prisma.nguoiDungCSR.findMany({
        where: {
          trangThai: "active",
          OR: [
            { vaiTro: "BacSi" },
            { vaiTro: { contains: "BacSi" } },
            { vaiTro: { contains: "Bác sỹ" } },
            { vaiTro: { contains: "Bác sĩ" } },
            { hoTen: { startsWith: "BS" } },
            { hoTen: { startsWith: "Bác sỹ" } },
            { hoTen: { startsWith: "Bác sĩ" } },
          ],
        },
        select: { maNV: true, hoTen: true, coSoId: true },
        orderBy: { hoTen: "asc" },
      });
    }

    // Lọc trùng theo họ tên
    const map = new Map<string, { maNV: string; hoTen: string; maHIS: string | null; coSoId: string | null }>();
    for (const u of users) {
      const name = u.hoTen?.trim();
      if (name && name.length >= 3) {
        if (!map.has(name) || (!map.get(name)?.maHIS && u.maHIS)) {
          map.set(name, {
            maNV: u.maNV,
            hoTen: name,
            maHIS: u.maHIS || null,
            coSoId: u.coSoId || null,
          });
        }
      }
    }

    const doctors = Array.from(map.values()).sort((a, b) => a.hoTen.localeCompare(b.hoTen, "vi"));
    return NextResponse.json(doctors);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

// Endpoint POST cho phép đồng bộ từ HIS hoặc thêm bác sĩ mới (để trống mã HIS)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const coSoId = body.coSoId || session?.user?.coSoId || null;
    const prisma = getPrisma();

    // 1. Thêm bác sĩ mới thủ công (để trống mã HIS chờ đồng bộ sau)
    if (body.action === "create" || (body.hoTen && body.hoTen.trim())) {
      const hoTen = String(body.hoTen).trim();
      let existing = await prisma.nguoiDungCSR.findFirst({
        where: { hoTen: { equals: hoTen } },
      });

      if (!existing) {
        const cleanName = hoTen.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const rand = Math.random().toString(36).slice(2, 6);
        const maNV = `BS-${Date.now().toString().slice(-6)}-${rand}`.toUpperCase();
        const tenDangNhap = `bs_${cleanName || "user"}_${rand}`.slice(0, 50);

        try {
          existing = await (prisma.nguoiDungCSR as any).create({
            data: {
              maNV,
              maHIS: null, // Để trống mã HIS theo yêu cầu
              hoTen,
              vaiTro: "BacSi",
              coSoId,
              tenDangNhap,
              matKhauHash: "CSR_LOCAL_CREATED",
              trangThai: "active",
            },
          });
        } catch {
          existing = await prisma.nguoiDungCSR.create({
            data: {
              maNV,
              hoTen,
              vaiTro: "BacSi",
              coSoId,
              tenDangNhap,
              matKhauHash: "CSR_LOCAL_CREATED",
              trangThai: "active",
            },
          });
        }
      }

      return NextResponse.json({
        ok: true,
        doctor: {
          maNV: existing?.maNV || `BS-${Date.now()}`,
          hoTen: existing?.hoTen || hoTen,
          maHIS: (existing as any)?.maHIS || null,
        },
        message: `Đã lưu bác sĩ "${hoTen}" (Mã HIS: Trống - Chờ đồng bộ)`,
      });
    }

    // 2. Đồng bộ danh mục bác sĩ từ HIS
    const res = await syncHisDoctors(coSoId);
    lastSyncTimestamp = Date.now();

    return NextResponse.json({
      ok: true,
      syncedCount: res.syncedCount,
      doctors: res.doctors,
      message: `Đã đồng bộ ${res.syncedCount} bác sĩ từ HIS DMNhanSu`,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi xử lý" }, { status: 500 });
  }
}

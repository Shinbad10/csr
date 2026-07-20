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

    // 1. Lấy danh sách người dùng có vai trò Bác sĩ (bao gồm cả bác sĩ đã đồng bộ từ DMNhanSu HIS)
    const users = await prisma.nguoiDungCSR.findMany({
      where: {
        trangThai: "active",
        OR: [
          { vaiTro: "BacSi" },
          { vaiTro: { contains: "Bác sỹ" } },
          { vaiTro: { contains: "Bác sĩ" } },
          { hoTen: { startsWith: "BS" } },
          { hoTen: { startsWith: "Bác sỹ" } },
          { hoTen: { startsWith: "Bác sĩ" } },
        ],
      },
      select: { hoTen: true },
    });

    // 2. Lấy danh sách bác sĩ đã từng ghi nhận tại các buổi khám
    const buoiKhams = await prisma.buoiKham.findMany({
      where: { bacSiKham: { not: null } },
      select: { bacSiKham: true },
      distinct: ["bacSiKham"],
    });

    // 3. Lấy danh sách bác sĩ chỉ định trên hồ sơ bệnh nhân
    const hoSos = await prisma.hoSoBenhNhan.findMany({
      where: { bacSiChiDinh: { not: null } },
      select: { bacSiChiDinh: true },
      distinct: ["bacSiChiDinh"],
    });

    // Gộp tất cả danh sách và lọc trùng, loại bỏ chuỗi rỗng
    const set = new Set<string>([
      "BS. Chánh",
      "BS. Kiền",
      "BS. Cường",
      "BS. Tuấn",
      "BS. Hùng",
      "BS. Minh",
      "BS. Long",
      "BS. Hưng",
    ]);

    for (const u of users) {
      if (u.hoTen?.trim()) set.add(u.hoTen.trim());
    }
    for (const b of buoiKhams) {
      if (b.bacSiKham?.trim()) set.add(b.bacSiKham.trim());
    }
    for (const h of hoSos) {
      if (h.bacSiChiDinh?.trim()) set.add(h.bacSiChiDinh.trim());
    }

    const doctors = Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
    return NextResponse.json(doctors);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

// Endpoint POST cho phép đồng bộ ngay lập tức từ bảng DMNhanSu HIS của từng bệnh viện
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const coSoId = body.coSoId || session?.user?.coSoId || null;

    const res = await syncHisDoctors(coSoId);
    lastSyncTimestamp = Date.now();

    return NextResponse.json({
      ok: true,
      syncedCount: res.syncedCount,
      doctors: res.doctors,
      message: `Đã đồng bộ ${res.syncedCount} bác sĩ từ HIS DMNhanSu`,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi đồng bộ HIS" }, { status: 500 });
  }
}

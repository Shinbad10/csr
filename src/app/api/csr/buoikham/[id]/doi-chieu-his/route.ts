import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { broadcastEvent } from "@/lib/events";
import {
  reconcileBuoiKham,
  parseDoiChieuLog,
  DOI_CHIEU_BANG,
  DOI_CHIEU_HANH_DONG,
  type DoiChieuKieu,
} from "@/lib/hisReconcile";

type Ctx = { params: Promise<{ id: string }> };

/** Lịch sử các lần đối chiếu HIS của đợt khám (mới nhất trước). */
export async function GET(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await getPrisma().auditLog.findMany({
    where: { bang: DOI_CHIEU_BANG, hanhDong: DOI_CHIEU_HANH_DONG, banGhiId: id },
    orderBy: { thoiDiem: "desc" },
    take: 50,
  });
  return NextResponse.json(rows.map(parseDoiChieuLog));
}

/** Đối chiếu HIS cho toàn bộ BN Nhóm A của đợt khám và ghi lịch sử. */
export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "hoso.treatment"))
    return NextResponse.json({ error: "Bạn không có quyền đối chiếu HIS" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const kieu: DoiChieuKieu = body?.kieu === "hang_loat" ? "hang_loat" : "don_le";

  try {
    const { log, coSoId } = await reconcileBuoiKham(id, { id: session.user.id, name: session.user.name }, kieu);

    if ((log.found ?? 0) > 0) {
      broadcastEvent({ type: "hoso_change", action: "update", coSoId: coSoId ?? undefined, buoiKhamId: id });
    }
    // Luôn báo để danh sách cập nhật "đối chiếu gần nhất" ở các máy khác
    broadcastEvent({ type: "buoikham_change", action: "update", coSoId: coSoId ?? undefined, buoiKhamId: id });

    return NextResponse.json(log, { status: log.trangThai === "loi" ? 502 : 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}

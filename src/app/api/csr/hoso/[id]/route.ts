import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, canAny, type Capability } from "@/lib/permissions";
import { inferNextState } from "@/lib/stateMachine";
import { audit } from "@/lib/audit";
import { triggerSync } from "@/lib/syncWorker";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const data = await getPrisma().hoSoBenhNhan.findUnique({
      where: { id },
      include: { buoiKham: true, coSo: true, tuVanVien: true, nhatKy: { include: { nguoiGoi: true }, orderBy: { ngay: "desc" } } },
    });
    if (!data) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prisma = getPrisma();

  try {
    const current = await prisma.hoSoBenhNhan.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const body = await request.json();
    const update: Record<string, unknown> = { ...body, updatedBy: session.user.id };
    delete update.daNhacLich; // cờ kích hoạt, không phải cột trong DB

    if (body.chanDoan && typeof body.chanDoan !== "string") update.chanDoan = JSON.stringify(body.chanDoan);

    // BR-07
    if (typeof update.chanDoan === "string" && update.chanDoan.includes("Khác") && !body.chanDoanKhac && !current.chanDoanKhac)
      return NextResponse.json({ error: "Vui lòng nhập Chẩn đoán khác" }, { status: 400 });

    // BR-08 suy trạng thái
    const next = inferNextState(current.trangThai, { ...body, chanDoan: update.chanDoan });
    update.trangThai = next;

    // BR-04
    if (next === "NhomA" && !body.ngayDieuTri && !current.ngayDieuTri)
      return NextResponse.json({ error: "Nhóm A bắt buộc nhập Ngày điều trị" }, { status: 400 });

    // BR-03 người chốt (tư vấn viên) = người đăng nhập khi LƯU phần tư vấn (nhóm A/B)
    if ((next === "NhomA" || next === "NhomB") && !current.tuVanVienMa) update.tuVanVienMa = session.user.id;
    // BR-05 người chốt cuối + ngày chốt
    if (next === "NhomA" || next === "NhomB") {
      if (!current.nguoiChotCuoiMa) update.nguoiChotCuoiMa = session.user.id;
      if (next === "NhomA" && !current.ngayChot) update.ngayChot = new Date();
    }

    // Phân quyền theo bước (SRS §3)
    const cap: Capability | null =
      ["DaKham", "TheoDoi", "CoChiDinhMo", "NhomA", "NhomB"].includes(next) ? "hoso.clinical"
      : ["DaDonVien", "DaMoHauPhau", "DaNhacLich", "HuyKhongDen"].includes(next) ? "hoso.treatment"
      : null;
    const allowed = cap ? can(session.user.role, cap) : canAny(session.user.role, ["hoso.create", "hoso.clinical", "hoso.treatment", "hoso.followup"]);
    if (!allowed) return NextResponse.json({ error: "Bạn không có quyền cập nhật ở bước này" }, { status: 403 });

    // ép kiểu số/ngày
    if (body.ngaySinh !== undefined) { update.ngaySinh = body.ngaySinh ? new Date(body.ngaySinh) : null; if (body.ngaySinh) update.namSinh = new Date(body.ngaySinh).getFullYear(); }
    if (body.namSinh) update.namSinh = parseInt(body.namSinh);
    if (body.soTienBao !== undefined) update.soTienBao = body.soTienBao != null ? Number(body.soTienBao) : null;
    if (body.soTienThucThu !== undefined) update.soTienThucThu = body.soTienThucThu != null ? Number(body.soTienThucThu) : null;
    for (const f of ["ngayDieuTri", "ngayMoThucTe", "ngayTaiKham", "ngayChot"] as const)
      if (body[f] !== undefined) update[f] = body[f] ? new Date(body[f]) : null;

    const data = await prisma.hoSoBenhNhan.update({ where: { id }, data: update });
    await audit(session.user.id, "HoSoBenhNhan", id, "sua", body);
    await prisma.syncQueue.create({ data: { hoSoId: id } }); // BR-15
    triggerSync(); // đẩy Sheet ngay, không chặn response
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, canAny, type Capability } from "@/lib/permissions";
import { inferNextState } from "@/lib/stateMachine";
import { audit } from "@/lib/audit";
import { triggerSync } from "@/lib/syncWorker";
import { parseDiag } from "@/lib/csr";
import { parseFieldConfig, isFieldOn, huongXuTriToKhuyenNghi } from "@/lib/formFields";
import { broadcastEvent } from "@/lib/events";

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

// Chỉ sửa thông tin hành chính bệnh nhân (modal "Sửa thông tin bệnh nhân").
// Tách riêng khỏi PUT để KHÔNG chạy máy trạng thái BR-08 / validate phiếu sàng lọc —
// đổi số điện thoại hay mã thẻ BHYT thì không được phép làm nhảy trạng thái hồ sơ.
// Trường tùy chọn: chuỗi rỗng → null. Trường bắt buộc (hoTen, gioiTinh) không cho phép xoá trắng.
const TRUONG_TUY_CHON = ["cccd", "bhyt", "sdt", "sdtNguoiNha", "diaChi", "khuPho", "xaPhuong"] as const;
const TRUONG_BAT_BUOC = ["hoTen", "gioiTinh"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAny(session.user.role, ["hoso.create", "hoso.clinical", "hoso.treatment", "hoso.followup"]))
    return NextResponse.json({ error: "Bạn không có quyền sửa thông tin bệnh nhân" }, { status: 403 });

  const { id } = await params;
  const prisma = getPrisma();

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedBy: session.user.id };

    for (const f of TRUONG_TUY_CHON) {
      if (body[f] === undefined) continue;
      const v = body[f];
      update[f] = typeof v === "string" ? v.trim() || null : v ?? null;
    }
    for (const f of TRUONG_BAT_BUOC) {
      if (body[f] === undefined) continue;
      const v = String(body[f] ?? "").trim();
      if (!v) return NextResponse.json({ error: `Trường ${f} không được để trống` }, { status: 400 });
      update[f] = f === "hoTen" ? v.toUpperCase() : v;
    }

    if (body.ngaySinh !== undefined) {
      const d = body.ngaySinh ? new Date(body.ngaySinh) : null;
      if (d && Number.isNaN(d.getTime())) return NextResponse.json({ error: "Ngày sinh không hợp lệ" }, { status: 400 });
      update.ngaySinh = d;
      update.namSinh = d ? d.getFullYear() : null;
    }
    if (body.mucHuongBHYT !== undefined) {
      const n = parseInt(String(body.mucHuongBHYT), 10);
      update.mucHuongBHYT = Number.isFinite(n) ? n : null;
    }

    const data = await prisma.hoSoBenhNhan.update({
      where: { id },
      data: update,
      include: { buoiKham: true, coSo: true, tuVanVien: true },
    });

    await Promise.all([
      audit(session.user.id, "HoSoBenhNhan", id, "sua", body),
      prisma.syncQueue.create({ data: { hoSoId: id } }), // BR-15
    ]);
    triggerSync();

    broadcastEvent({
      type: "hoso_change",
      action: "update",
      coSoId: data.coSoId,
      buoiKhamId: data.buoiKhamId,
      hoSoId: data.id,
      data,
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi cập nhật hồ sơ" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prisma = getPrisma();

  try {
    // Nạp hồ sơ kèm luôn bacSiKham của buổi khám + cauHinhTruong của cơ sở trong MỘT truy vấn.
    // Trước đây là 3 lần round-trip riêng lẻ tới SQL Server — trên DB cloud mỗi lần tốn 1–3s.
    const current = await prisma.hoSoBenhNhan.findUnique({
      where: { id },
      include: {
        buoiKham: { select: { bacSiKham: true } },
        coSo: { select: { cauHinhTruong: true } },
      },
    });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const body = await request.json();
    const update: Record<string, unknown> = { ...body, updatedBy: session.user.id };
    if (body.hoTen) update.hoTen = String(body.hoTen).trim().toUpperCase();
    delete update.daNhacLich; // cờ kích hoạt, không phải cột trong DB

    if (body.chanDoan !== undefined && typeof body.chanDoan !== "string") {
      update.chanDoan = JSON.stringify(body.chanDoan ?? []);
    }
    if (body.chanDoanMP !== undefined && typeof body.chanDoanMP !== "string") {
      update.chanDoanMP = body.chanDoanMP == null ? null : JSON.stringify(body.chanDoanMP);
    }
    if (body.chanDoanMT !== undefined && typeof body.chanDoanMT !== "string") {
      update.chanDoanMT = body.chanDoanMT == null ? null : JSON.stringify(body.chanDoanMT);
    }

    // Các trường mảng của phiếu sàng lọc → JSON string (giống chanDoan)
    for (const f of ["loaiBenhSu", "loaiBenhLy"] as const)
      if (body[f] !== undefined && typeof body[f] !== "string") update[f] = JSON.stringify(body[f] ?? []);

    // "Hướng xử trí" đồng bộ sang khuyenNghi để giữ nguyên luồng Tư vấn / Theo dõi / Báo cáo
    if (body.huongXuTri !== undefined) update.khuyenNghi = huongXuTriToKhuyenNghi(body.huongXuTri);

    if (update.bacSiChiDinh === undefined && !current.bacSiChiDinh && current.buoiKham?.bacSiKham) {
      update.bacSiChiDinh = current.buoiKham.bacSiKham;
    }

    // BR-07
    if (typeof update.chanDoan === "string" && update.chanDoan.includes("Khác") && !body.chanDoanKhac && !current.chanDoanKhac)
      return NextResponse.json({ error: "Vui lòng nhập Chẩn đoán khác" }, { status: 400 });
    if (typeof update.loaiBenhSu === "string" && update.loaiBenhSu.includes("Khác") && !body.loaiBenhSuKhac && !current.loaiBenhSuKhac)
      return NextResponse.json({ error: "Vui lòng nhập Loại bệnh sử khác" }, { status: 400 });

    // Validate phiếu sàng lọc — chỉ áp dụng cho trường đang BẬT ở cơ sở này
    const cfg = parseFieldConfig(current.coSo?.cauHinhTruong);
    const eff = (k: string): unknown => (body[k] !== undefined ? body[k] : (current as Record<string, unknown>)[k]);
    const loaiBenhLyArr: string[] = (() => {
      const v = eff("loaiBenhLy");
      return typeof v === "string" ? parseDiag(v) : Array.isArray(v) ? v : [];
    })();
    const chanDoanArr: string[] = (() => {
      const v = eff("chanDoan");
      return typeof v === "string" ? parseDiag(v) : Array.isArray(v) ? v : [];
    })();
    const chanDoanMPArr: string[] = (() => {
      const v = eff("chanDoanMP");
      return typeof v === "string" ? parseDiag(v) : Array.isArray(v) ? v : [];
    })();
    const chanDoanMTArr: string[] = (() => {
      const v = eff("chanDoanMT");
      return typeof v === "string" ? parseDiag(v) : Array.isArray(v) ? v : [];
    })();
    const hasEyeDiag = chanDoanArr.length > 0 || chanDoanMPArr.length > 0 || chanDoanMTArr.length > 0;

    // Chỉ bắt buộc loaiBenhLy khi cơ sở dùng phiếu tổng quát (không dùng chẩn đoán mắt) và chưa có bất kỳ chẩn đoán nào
    if (!isFieldOn(cfg, "chanDoan") && isFieldOn(cfg, "benhLy") && isFieldOn(cfg, "loaiBenhLy") && eff("benhLy") === "Nghi ngờ bệnh lý" && loaiBenhLyArr.length === 0 && !hasEyeDiag)
      return NextResponse.json({ error: "Nghi ngờ bệnh lý: vui lòng chọn ít nhất một Loại bệnh lý" }, { status: 400 });
    if (loaiBenhLyArr.includes("Khác") && !eff("loaiBenhLyKhac"))
      return NextResponse.json({ error: "Vui lòng ghi rõ Loại bệnh lý khác" }, { status: 400 });
    if (isFieldOn(cfg, "huongXuTri") && eff("huongXuTri") === "Điều trị khác" && !eff("huongXuTriKhac"))
      return NextResponse.json({ error: "Vui lòng ghi rõ nội dung Điều trị khác" }, { status: 400 });

    // BR-08 suy trạng thái (dùng khuyenNghi đã đồng bộ từ huongXuTri)
    const next = inferNextState(current.trangThai, { ...body, chanDoan: update.chanDoan, benhLy: eff("benhLy"), khuyenNghi: update.khuyenNghi ?? body.khuyenNghi });
    update.trangThai = next;

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

    // Phiếu sàng lọc: Int? và Boolean?
    if (body.mucHuongBHYT !== undefined) {
      const n = parseInt(String(body.mucHuongBHYT), 10);
      update.mucHuongBHYT = Number.isFinite(n) ? n : null;
    }
    for (const f of ["benhSu", "xacNhanDieuTri"] as const)
      if (body[f] !== undefined) update[f] = body[f] == null ? null : Boolean(body[f]);

    const data = await prisma.hoSoBenhNhan.update({
      where: { id },
      data: update,
      include: { buoiKham: true, coSo: true, tuVanVien: true },
    });
    // Chạy song song thay vì nối tiếp — vẫn chờ syncQueue để giữ đảm bảo bền vững của BR-15
    await Promise.all([
      audit(session.user.id, "HoSoBenhNhan", id, "sua", body),
      prisma.syncQueue.create({ data: { hoSoId: id } }),
    ]);
    triggerSync(); // đẩy Sheet ngay, không chặn response

    broadcastEvent({
      type: "hoso_change",
      action: "update",
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

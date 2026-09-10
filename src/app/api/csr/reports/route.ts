import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { classifyCSRNhom } from "@/lib/csr";
import { fetchPhaco2LanStats } from "@/lib/his";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const fromDate = sp.get("from");
  const toDate = sp.get("to");
  const buoiKhamId = sp.get("buoiKhamId");

  const prisma = getPrisma();
  try {
    const where: any = {};
    if (coSoId) where.coSoId = coSoId;
    if (buoiKhamId) where.buoiKhamId = buoiKhamId;

    const ngayKhamRange =
      fromDate || toDate
        ? {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(`${toDate}T23:59:59.999Z`) } : {}),
          }
        : null;

    if (ngayKhamRange) {
      where.buoiKham = { ngayKham: ngayKhamRange };
    }

    // Bộ lọc cho bảng BuoiKham — phải áp CÙNG khoảng ngày, nếu không thì
    // số "đợt khám" và danh sách đợt sẽ lệch với các chỉ số hồ sơ đã lọc.
    const buoiKhamWhere: { coSoId?: string; ngayKham?: { gte?: Date; lte?: Date } } = {
      ...(coSoId ? { coSoId } : {}),
      ...(ngayKhamRange ? { ngayKham: ngayKhamRange } : {}),
    };

    const [
      tong,
      theoTrangThai,
      soBuoi,
      coSo,
      daMo,
      allHoSos,
    ] = await Promise.all([
      prisma.hoSoBenhNhan.count({ where }),
      prisma.hoSoBenhNhan.groupBy({ by: ["trangThai"], where, _count: { _all: true } }),
      prisma.buoiKham.count({ where: buoiKhamWhere }),
      coSoId ? prisma.coSo.findUnique({ where: { id: coSoId }, select: { sheetId: true, ten: true } }) : Promise.resolve(null),
      prisma.hoSoBenhNhan.count({
        where: {
          ...where,
          ngayMoThucTe: { not: null },
        },
      }),
      prisma.hoSoBenhNhan.findMany({
        where,
        select: {
          id: true,
          gioiTinh: true,
          namSinh: true,
          ngaySinh: true,
          bhyt: true,
          mucHuongBHYT: true,
          trangThai: true,
          nhom: true,
          xacNhanDieuTri: true,
          khuyenNghi: true,
          huongXuTri: true,
          benhLy: true,
          chanDoan: true,
          chanDoanMP: true,
          chanDoanMT: true,
          chanDoanKhac: true,
          chanDoanKhacMP: true,
          chanDoanKhacMT: true,
          loaiBenhLy: true,
          bacSiChiDinh: true,
          nhanVienTuVan: true,
          ngayMoThucTe: true,
          buoiKhamId: true,
          buoiKham: {
            select: {
              id: true,
              ngayKham: true,
              xa: true,
              diaDiem: true,
              bacSiKham: true,
            },
          },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of theoTrangThai) byStatus[r.trangThai] = r._count._all;

    let nhomA = 0;
    let nhomB = 0;
    let coBhytCount = 0;
    let daKhamCount = 0;
    let daChotTuVanCount = 0;

    // Phân tích bệnh lý
    let ducThuyTinhThe = 0;
    let mongThit = 0;
    let glocom = 0;
    let tatKhucXa = 0;
    let benhDayMat = 0;
    let khacHoacBinhThuong = 0;

    // Phân tích nhân khẩu học
    let ageU18 = 0;
    let age18to40 = 0;
    let age41to60 = 0;
    let ageOver60 = 0;
    let maleCount = 0;
    let femaleCount = 0;

    // Phân tích BHYT
    let bhyt100 = 0;
    let bhyt95 = 0;
    let bhyt80 = 0;
    let bhytNone = 0;

    // Phân tích bác sĩ & tư vấn viên
    const doctorMap: Record<string, { total: number; nhomA: number; daMo: number }> = {};
    const counselorMap: Record<string, { total: number; chotMo: number; daMo: number }> = {};

    // Phân tích theo từng buổi khám
    const sessionMap: Record<
      string,
      {
        id: string;
        ngayKham: string;
        xa: string;
        diaDiem: string;
        bacSi: string;
        tong: number;
        nhomA: number;
        nhomB: number;
        daMo: number;
        phaco2Lan: number;
      }
    > = {};

    const currentYear = new Date().getFullYear();

    for (const h of allHoSos) {
      const { isNhomA, isNhomB, isDaMo } = classifyCSRNhom(h);

      if (isNhomA) {
        nhomA++;
      } else if (isNhomB) {
        nhomB++;
      }

      if (h.trangThai !== "TiepNhan") {
        daKhamCount++;
      }
      if (isNhomA || h.trangThai === "DaNhacLich" || h.trangThai === "DaDonVien" || h.trangThai === "DaMoHauPhau") {
        daChotTuVanCount++;
      }

      // BHYT
      if (h.bhyt && h.bhyt.trim().length >= 8) {
        coBhytCount++;
        const mh = h.mucHuongBHYT || (h.bhyt ? parseInt(h.bhyt.replace(/\D/g, "").slice(0, 1), 10) : null);
        if (mh === 100 || mh === 1 || mh === 2) bhyt100++;
        else if (mh === 95 || mh === 3) bhyt95++;
        else bhyt80++;
      } else {
        bhytNone++;
      }

      // Giới tính
      const gt = (h.gioiTinh || "").toLowerCase();
      if (gt.includes("nam")) maleCount++;
      else if (gt.includes("nữ") || gt.includes("nu")) femaleCount++;

      // Tuổi
      let age = 0;
      if (h.namSinh && h.namSinh > 1900) {
        age = currentYear - h.namSinh;
      } else if (h.ngaySinh) {
        age = currentYear - new Date(h.ngaySinh).getFullYear();
      }
      if (age > 0) {
        if (age < 18) ageU18++;
        else if (age <= 40) age18to40++;
        else if (age <= 60) age41to60++;
        else ageOver60++;
      }

      // Bệnh lý
      const diagStr = [h.chanDoan, h.chanDoanMP, h.chanDoanMT, h.chanDoanKhac, h.loaiBenhLy].filter(Boolean).join(" ").toLowerCase();
      let matchedDisease = false;
      if (diagStr.includes("đục") || diagStr.includes("thủy tinh thể") || diagStr.includes("cataract") || diagStr.includes("cườm khô")) {
        ducThuyTinhThe++;
        matchedDisease = true;
      }
      if (diagStr.includes("mộng") || diagStr.includes("pterygium")) {
        mongThit++;
        matchedDisease = true;
      }
      if (diagStr.includes("glaucoma") || diagStr.includes("glocom") || diagStr.includes("cườm nước") || diagStr.includes("thiên đầu thống")) {
        glocom++;
        matchedDisease = true;
      }
      if (diagStr.includes("khúc xạ") || diagStr.includes("cận") || diagStr.includes("viễn") || diagStr.includes("loạn") || diagStr.includes("lão")) {
        tatKhucXa++;
        matchedDisease = true;
      }
      if (diagStr.includes("đáy mắt") || diagStr.includes("võng mạc") || diagStr.includes("dịch kính") || diagStr.includes("thoái hóa")) {
        benhDayMat++;
        matchedDisease = true;
      }
      if (!matchedDisease) {
        khacHoacBinhThuong++;
      }

      // Bác sĩ
      const bs = (h.bacSiChiDinh || h.buoiKham?.bacSiKham || "").trim();
      if (bs) {
        if (!doctorMap[bs]) doctorMap[bs] = { total: 0, nhomA: 0, daMo: 0 };
        doctorMap[bs].total++;
        if (isNhomA) doctorMap[bs].nhomA++;
        if (isDaMo) doctorMap[bs].daMo++;
      }

      // Tư vấn viên
      const tvv = (h.nhanVienTuVan || "").trim();
      if (tvv) {
        if (!counselorMap[tvv]) counselorMap[tvv] = { total: 0, chotMo: 0, daMo: 0 };
        counselorMap[tvv].total++;
        if (isNhomA) counselorMap[tvv].chotMo++;
        if (isDaMo) counselorMap[tvv].daMo++;
      }

      // Buổi khám
      if (h.buoiKhamId && h.buoiKham) {
        if (!sessionMap[h.buoiKhamId]) {
          sessionMap[h.buoiKhamId] = {
            id: h.buoiKham.id,
            ngayKham: h.buoiKham.ngayKham ? new Date(h.buoiKham.ngayKham).toISOString().slice(0, 10) : "",
            xa: h.buoiKham.xa || "",
            diaDiem: h.buoiKham.diaDiem || "",
            bacSi: h.buoiKham.bacSiKham || "",
            tong: 0,
            nhomA: 0,
            nhomB: 0,
            daMo: 0,
            phaco2Lan: 0,
          };
        }
        sessionMap[h.buoiKhamId].tong++;
        if (isNhomA) sessionMap[h.buoiKhamId].nhomA++;
        if (isNhomB) sessionMap[h.buoiKhamId].nhomB++;
        if (isDaMo) sessionMap[h.buoiKhamId].daMo++;
      }
    }

    /* Số ca mổ Phaco 2 lần (Mắt 2) lấy từ HIS theo từng đợt khám.
       Hàm này tự nuốt lỗi và trả Map rỗng nếu đơn vị chưa cấu hình HIS. */
    let phaco2LanMap = new Map<string, number>();
    try {
      phaco2LanMap = await fetchPhaco2LanStats(coSoId || undefined);
    } catch {
      // bỏ qua — cột Mắt 2 sẽ hiển thị 0
    }

    let phaco2LanTong = 0;
    for (const s of Object.values(sessionMap)) {
      s.phaco2Lan = phaco2LanMap.get(s.id) || 0;
      phaco2LanTong += s.phaco2Lan;
    }

    const sessionsList = Object.values(sessionMap).sort((a, b) => (b.ngayKham > a.ngayKham ? 1 : -1));

    const topDoctors = Object.entries(doctorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const topCounselors = Object.entries(counselorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.chotMo - a.chotMo)
      .slice(0, 8);

    // Google Sheet link
    const sharedId = process.env.GOOGLE_SHEET_ID?.trim();
    const sheetId = sharedId || coSo?.sheetId || null;
    const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null;

    const chuyenDoiMoPct = nhomA > 0 ? Math.round((daMo / nhomA) * 100) : 0;
    const bhytPct = tong > 0 ? Math.round((coBhytCount / tong) * 100) : 0;

    return NextResponse.json({
      tong,
      soBuoi,
      byStatus,
      nhomA,
      nhomB,
      daMo,
      phaco2Lan: phaco2LanTong,
      chuyenDoiMoPct,
      coBhytCount,
      bhytPct,
      sheetUrl,
      coSoName: coSo?.ten || "Tất cả cơ sở",
      funnel: [
        { stage: "Tiếp nhận", count: tong, pct: 100 },
        { stage: "Đã khám mắt", count: daKhamCount, pct: tong > 0 ? Math.round((daKhamCount / tong) * 100) : 0 },
        { stage: "Nhóm A (Đồng ý phẫu thuật)", count: nhomA, pct: tong > 0 ? Math.round((nhomA / tong) * 100) : 0 },
        { stage: "Đã chốt mổ / Đón viện", count: daChotTuVanCount, pct: nhomA > 0 ? Math.round((daChotTuVanCount / nhomA) * 100) : 0 },
        { stage: "Đã phẫu thuật (HIS)", count: daMo, pct: nhomA > 0 ? Math.round((daMo / nhomA) * 100) : 0 },
      ],
      diseases: [
        { label: "Đục thủy tinh thể", value: ducThuyTinhThe, color: "#3452d8" },
        { label: "Mộng thịt", value: mongThit, color: "#0d9488" },
        { label: "Glaucoma (Cườm nước)", value: glocom, color: "#e11d48" },
        { label: "Tật khúc xạ", value: tatKhucXa, color: "#d97706" },
        { label: "Bệnh đáy mắt / Võng mạc", value: benhDayMat, color: "#9333ea" },
        { label: "Bình thường / Khác", value: khacHoacBinhThuong, color: "#64748b" },
      ].filter((d) => d.value > 0),
      demographics: {
        age: [
          { label: "Dưới 18 tuổi", value: ageU18, color: "#38bdf8" },
          { label: "18 - 40 tuổi", value: age18to40, color: "#0ea5e9" },
          { label: "41 - 60 tuổi", value: age41to60, color: "#2563eb" },
          { label: "Trên 60 tuổi (Người cao tuổi)", value: ageOver60, color: "#1e3a8a" },
        ],
        gender: [
          { label: "Nam", value: maleCount, color: "#3b82f6" },
          { label: "Nữ", value: femaleCount, color: "#ec4899" },
        ],
        bhyt: [
          { label: "BHYT 100%", value: bhyt100, color: "#10b981" },
          { label: "BHYT 95%", value: bhyt95, color: "#06b6d4" },
          { label: "BHYT 80%", value: bhyt80, color: "#3b82f6" },
          { label: "Không có BHYT", value: bhytNone, color: "#94a3b8" },
        ],
      },
      sessions: sessionsList,
      topDoctors,
      topCounselors,
    });
  } catch (e) {
    console.error("Error generating reports:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}


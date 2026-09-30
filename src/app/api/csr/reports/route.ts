import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { classifyCSRFunnel } from "@/lib/csr";
import { fetchPhaco2LanPatientIds } from "@/lib/his";

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
      phaco2Ids,
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
          daDon: true,
          ngayDenBV: true,
          trangThaiDieuTri: true,
          ghiChuMat2: true,
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
      /* BN mổ Phaco 2 lần (Mắt 2) nằm bên HIS. Hàm tự nuốt lỗi và trả Set rỗng
         nếu đơn vị chưa cấu hình HIS — khi đó chỉ còn nguồn ghi chú "Mắt 2". */
      fetchPhaco2LanPatientIds(undefined, coSoId || undefined).catch(() => new Set<string>()),
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of theoTrangThai) byStatus[r.trangThai] = r._count._all;

    let nhomA = 0;
    let nhomB = 0;
    let coBhytCount = 0;
    let daKhamCount = 0;

    // Phân tích bệnh lý
    let ducThuyTinhThe = 0;
    let mongThit = 0;
    let glocom = 0;
    let tatKhucXa = 0;
    let benhDayMat = 0;
    let khacHoacBinhThuong = 0;

    // Phân tích nhân khẩu học
    let ageU6 = 0;
    let age6to18 = 0;
    let age18to55 = 0;
    let age55to60 = 0;
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
        denKhongMo: number;
        phaco2Lan: number;
      }
    > = {};

    let daDenCount = 0;
    let denKhongMoCount = 0;

    // Phễu "Số liệu quan trọng thống kê"
    let chiDinhCount = 0;
    let duKienCount = 0;
    let daLenCount = 0;
    let nguoiDaMoCount = 0;
    let mat2Count = 0;

    const currentYear = new Date().getFullYear();

    for (const h of allHoSos) {
      const isPhaco2Lan = phaco2Ids.has(h.id);
      const { isNhomA, isNhomB, isDaMo, isDaDen, isDenKhongMo, isChiDinh, isDuKien, isDaLen, isMat2 } =
        classifyCSRFunnel(h, isPhaco2Lan);

      if (isChiDinh) chiDinhCount++;
      if (isDuKien) duKienCount++;
      if (isDaLen) daLenCount++;
      if (isDaMo) nguoiDaMoCount++;
      if (isMat2) mat2Count++;

      if (isDaDen) {
        daDenCount++;
      }
      if (isDenKhongMo) {
        denKhongMoCount++;
      }

      if (isNhomA) {
        nhomA++;
      } else if (isNhomB) {
        nhomB++;
      }

      if (h.trangThai !== "TiepNhan") {
        daKhamCount++;
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
      let hasAge = false;
      let age = 0;
      if (h.namSinh && h.namSinh > 1900) {
        age = currentYear - h.namSinh;
        hasAge = true;
      } else if (h.ngaySinh) {
        age = currentYear - new Date(h.ngaySinh).getFullYear();
        hasAge = true;
      }
      if (hasAge && age >= 0) {
        if (age < 6) ageU6++;
        else if (age < 18) age6to18++;
        else if (age < 55) age18to55++;
        else if (age < 60) age55to60++;
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
            denKhongMo: 0,
            phaco2Lan: 0,
          };
        }
        sessionMap[h.buoiKhamId].tong++;
        if (isNhomA) sessionMap[h.buoiKhamId].nhomA++;
        if (isNhomB) sessionMap[h.buoiKhamId].nhomB++;
        if (isDaMo) sessionMap[h.buoiKhamId].daMo++;
        if (isDenKhongMo) sessionMap[h.buoiKhamId].denKhongMo++;
        if (isPhaco2Lan) sessionMap[h.buoiKhamId].phaco2Lan++;
      }
    }

    let phaco2LanTong = 0;
    for (const s of Object.values(sessionMap)) phaco2LanTong += s.phaco2Lan;

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
      daDen: daDenCount,
      denKhongMo: denKhongMoCount,
      phaco2Lan: phaco2LanTong,
      chuyenDoiMoPct,
      coBhytCount,
      bhytPct,
      sheetUrl,
      coSoName: coSo?.ten || "Tất cả cơ sở",
      funnel: buildFunnel({
        diemKham: soBuoi,
        tongKham: tong,
        chiDinh: chiDinhCount,
        duKien: duKienCount,
        daLen: daLenCount,
        nguoiDaMo: nguoiDaMoCount,
        mat2: mat2Count,
      }),
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
          { key: "u6", label: "Dưới 6 tuổi", value: ageU6, color: "#38bdf8" },
          { key: "6to18", label: "Từ 6 đến dưới 18 tuổi", value: age6to18, color: "#0ea5e9" },
          { key: "18to55", label: "Từ 18 tuổi đến dưới 55 tuổi", value: age18to55, color: "#2563eb" },
          { key: "55to60", label: "Từ 55 tuổi đến dưới 60 tuổi", value: age55to60, color: "#4f46e5" },
          { key: "over60", label: "Từ 60 tuổi trở lên", value: ageOver60, color: "#1e3a8a" },
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


type FunnelRatio = { label: string; value: number; unit: "%" | "avg" };

const ratio = (num: number, den: number, label: string, unit: FunnelRatio["unit"] = "%"): FunnelRatio => ({
  label,
  unit,
  value: den > 0 ? Math.round((num / den) * (unit === "%" ? 1000 : 10)) / 10 : 0,
});

/**
 * 8 chỉ số "Số liệu quan trọng thống kê". Tỷ lệ "/điểm khám" là số bình quân mỗi điểm
 * (1 đợt khám = 1 điểm khám), không phải phần trăm.
 */
function buildFunnel(n: {
  diemKham: number;
  tongKham: number;
  chiDinh: number;
  duKien: number;
  daLen: number;
  nguoiDaMo: number;
  mat2: number;
}) {
  const caMo = n.nguoiDaMo + n.mat2;
  return [
    { key: "kpi_soBuoi", stage: "Điểm khám", count: n.diemKham, ratios: [] },
    { key: "funnel_tiepNhan", stage: "Tổng khám", count: n.tongKham, ratios: [] },
    {
      key: "funnel_chiDinh",
      stage: "Chỉ định",
      count: n.chiDinh,
      ratios: [ratio(n.chiDinh, n.tongKham, "tổng khám")],
    },
    {
      key: "funnel_duKien",
      stage: "Dự kiến",
      note: "Người đồng ý lên BV mổ",
      count: n.duKien,
      ratios: [ratio(n.duKien, n.tongKham, "tổng khám"), ratio(n.duKien, n.chiDinh, "chỉ định")],
    },
    {
      key: "funnel_daLen",
      stage: "Đã lên",
      count: n.daLen,
      ratios: [ratio(n.daLen, n.duKien, "dự kiến"), ratio(n.daLen, n.chiDinh, "chỉ định")],
    },
    {
      key: "funnel_daMo",
      stage: "Người đã mổ",
      count: n.nguoiDaMo,
      ratios: [ratio(n.nguoiDaMo, n.tongKham, "tổng khám"), ratio(n.nguoiDaMo, n.diemKham, "người / điểm khám", "avg")],
    },
    {
      key: "funnel_mat2",
      stage: "Số mắt 2",
      count: n.mat2,
      ratios: [ratio(n.mat2, n.nguoiDaMo, "người đã mổ")],
    },
    {
      key: "funnel_caMo",
      stage: "Số ca mổ",
      note: "Người đã mổ + mắt 2",
      count: caMo,
      ratios: [ratio(caMo, n.tongKham, "tổng khám"), ratio(caMo, n.diemKham, "ca / điểm khám", "avg")],
    },
  ];
}

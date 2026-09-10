import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { classifyCSRNhom } from "@/lib/csr";
import { fetchPhaco2LanPatientIds } from "@/lib/his";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const fromDate = sp.get("from");
  const toDate = sp.get("to");
  const type = sp.get("type") || "kpi_tong";
  const val = sp.get("val") || "";
  const buoiKhamId = sp.get("buoiKhamId");

  const prisma = getPrisma();
  try {
    const baseWhere: any = {};
    if (coSoId) baseWhere.coSoId = coSoId;
    if (buoiKhamId) baseWhere.buoiKhamId = buoiKhamId;

    if (fromDate || toDate) {
      baseWhere.buoiKham = {
        ngayKham: {
          ...(fromDate ? { gte: new Date(fromDate) } : {}),
          ...(toDate ? { lte: new Date(`${toDate}T23:59:59.999Z`) } : {}),
        },
      };
    }

    const allHoSos = await prisma.hoSoBenhNhan.findMany({
      where: baseWhere,
      select: {
        id: true,
        maBN: true,
        maBNHIS: true,
        stt: true,
        hoTen: true,
        gioiTinh: true,
        ngaySinh: true,
        namSinh: true,
        cccd: true,
        diaChi: true,
        sdt: true,
        sdtNguoiNha: true,
        mucHuongBHYT: true,
        khuPho: true,
        xaPhuong: true,
        thiLucMP: true,
        thiLucMT: true,
        matKham: true,
        chanDoanMP: true,
        chanDoanKhacMP: true,
        chanDoanMT: true,
        chanDoanKhacMT: true,
        chanDoan: true,
        chanDoanKhac: true,
        khuyenNghi: true,
        benhLy: true,
        loaiBenhLy: true,
        loaiBenhLyKhac: true,
        huongXuTri: true,
        bacSiChiDinh: true,
        nhanVienTuVan: true,
        xacNhanDieuTri: true,
        lyDoKhongDieuTri: true,
        diemKham: true,
        bhyt: true,
        soTienBao: true,
        ngayDieuTri: true,
        diemDon: true,
        gioDon: true,
        nhom: true,
        ghiChuTuVan: true,
        followUpStatus: true,
        daDon: true,
        ngayDenBV: true,
        ngayMoThucTe: true,
        soTienThucThu: true,
        trangThaiDieuTri: true,
        ngayTaiKham: true,
        trangThai: true,
        createdAt: true,
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
      orderBy: [{ stt: "asc" }, { createdAt: "desc" }],
    });

    const currentYear = new Date().getFullYear();

    /* Danh sách BN mổ Phaco 2 lần (Mắt 2) nằm bên HIS, không có trong CSDL CSR —
       phải nạp trước vì hàm lọc bên dưới chạy đồng bộ. */
    let phaco2Ids: Set<string> | null = null;
    if (type === "session_phaco2" || type === "kpi_phaco2") {
      try {
        phaco2Ids = await fetchPhaco2LanPatientIds(
          type === "session_phaco2" ? val || undefined : undefined,
          coSoId || undefined
        );
      } catch {
        phaco2Ids = new Set();
      }
    }

    const filtered = allHoSos.filter((h) => {
      const { isNhomA, isNhomB, isDaMo } = classifyCSRNhom(h);

      const hasBhyt = Boolean(h.bhyt && h.bhyt.trim().length >= 8);

      let mh = h.mucHuongBHYT;
      if (mh == null && h.bhyt) {
        const num = parseInt(h.bhyt.replace(/\D/g, "").slice(0, 1), 10);
        if (num === 1 || num === 2) mh = 100;
        else if (num === 3) mh = 95;
        else if (num > 0) mh = 80;
      }

      let age = 0;
      if (h.namSinh && h.namSinh > 1900) {
        age = currentYear - h.namSinh;
      } else if (h.ngaySinh) {
        age = currentYear - new Date(h.ngaySinh).getFullYear();
      }

      const diagStr = [
        h.chanDoan,
        h.chanDoanMP,
        h.chanDoanMT,
        h.chanDoanKhac,
        h.loaiBenhLy,
        h.loaiBenhLyKhac,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      switch (type) {
        case "kpi_tong":
        case "all":
        case "funnel_tiepNhan":
          return true;

        case "kpi_nhomA":
        case "funnel_chiDinhMo":
          return isNhomA;

        case "kpi_nhomB":
          return isNhomB;

        case "kpi_daMo":
        case "funnel_daMo":
          return isDaMo;

        case "kpi_bhyt":
          return hasBhyt;

        case "funnel_daKham":
          return h.trangThai !== "TiepNhan";

        case "funnel_chotMo":
          return (
            h.trangThai === "NhomA" ||
            h.trangThai === "DaNhacLich" ||
            h.trangThai === "DaDonVien" ||
            h.trangThai === "DaMoHauPhau" ||
            h.nhom === "A"
          );

        case "disease": {
          const v = val.toLowerCase();
          if (v.includes("đục") || v.includes("cataract") || v.includes("thủy tinh thể")) {
            return (
              diagStr.includes("đục") ||
              diagStr.includes("thủy tinh thể") ||
              diagStr.includes("cataract") ||
              diagStr.includes("cườm khô")
            );
          }
          if (v.includes("mộng") || v.includes("pterygium")) {
            return diagStr.includes("mộng") || diagStr.includes("pterygium");
          }
          if (v.includes("glocom") || v.includes("glaucoma") || v.includes("cườm nước")) {
            return (
              diagStr.includes("glaucoma") ||
              diagStr.includes("glocom") ||
              diagStr.includes("cườm nước") ||
              diagStr.includes("thiên đầu thống")
            );
          }
          if (v.includes("khúc xạ") || v.includes("refraction") || v.includes("cận") || v.includes("viễn") || v.includes("loạn")) {
            return (
              diagStr.includes("khúc xạ") ||
              diagStr.includes("cận") ||
              diagStr.includes("viễn") ||
              diagStr.includes("loạn") ||
              diagStr.includes("lão")
            );
          }
          if (v.includes("đáy mắt") || v.includes("võng mạc") || v.includes("retina")) {
            return (
              diagStr.includes("đáy mắt") ||
              diagStr.includes("võng mạc") ||
              diagStr.includes("dịch kính") ||
              diagStr.includes("thoái hóa")
            );
          }
          // Khác / Bình thường
          const isCommon =
            diagStr.includes("đục") ||
            diagStr.includes("thủy tinh thể") ||
            diagStr.includes("cataract") ||
            diagStr.includes("cườm khô") ||
            diagStr.includes("mộng") ||
            diagStr.includes("pterygium") ||
            diagStr.includes("glaucoma") ||
            diagStr.includes("glocom") ||
            diagStr.includes("cườm nước") ||
            diagStr.includes("thiên đầu thống") ||
            diagStr.includes("khúc xạ") ||
            diagStr.includes("cận") ||
            diagStr.includes("viễn") ||
            diagStr.includes("loạn") ||
            diagStr.includes("lão") ||
            diagStr.includes("đáy mắt") ||
            diagStr.includes("võng mạc") ||
            diagStr.includes("dịch kính") ||
            diagStr.includes("thoái hóa");
          return !isCommon;
        }

        case "age": {
          if (val === "u18") return age > 0 && age < 18;
          if (val === "18to40") return age >= 18 && age <= 40;
          if (val === "41to60") return age >= 41 && age <= 60;
          if (val === "over60") return age > 60;
          return true;
        }

        case "gender": {
          const gt = (h.gioiTinh || "").toLowerCase();
          if (val === "nam") return gt.includes("nam");
          if (val === "nu") return gt.includes("nữ") || gt.includes("nu");
          return true;
        }

        case "bhyt_tier": {
          if (val === "100") return hasBhyt && (mh === 100 || mh === 1 || mh === 2);
          if (val === "95") return hasBhyt && (mh === 95 || mh === 3);
          if (val === "80") return hasBhyt && (mh === 80 || (mh !== 100 && mh !== 95 && mh !== 1 && mh !== 2 && mh !== 3));
          if (val === "none") return !hasBhyt;
          return true;
        }

        case "doctor": {
          const bs = (h.bacSiChiDinh || h.buoiKham?.bacSiKham || "").trim().toLowerCase();
          return bs === val.trim().toLowerCase();
        }

        case "counselor": {
          const tvv = (h.nhanVienTuVan || "").trim().toLowerCase();
          return tvv === val.trim().toLowerCase();
        }

        case "session": {
          return h.buoiKhamId === val;
        }

        /* Bấm vào từng con số trên bảng "Đợt khám trong kỳ":
           lọc đồng thời theo đợt khám (val) và phân loại. */
        case "session_nhomA":
          return h.buoiKhamId === val && isNhomA;

        case "session_nhomB":
          return h.buoiKhamId === val && isNhomB;

        case "session_daMo":
          return h.buoiKhamId === val && isDaMo;

        case "session_phaco2":
          return h.buoiKhamId === val && Boolean(phaco2Ids?.has(h.id));

        case "kpi_phaco2":
          return Boolean(phaco2Ids?.has(h.id));

        default:
          return true;
      }
    });

    return NextResponse.json({
      total: filtered.length,
      items: filtered,
    });
  } catch (e) {
    console.error("Error fetching report details:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi nạp chi tiết báo cáo" },
      { status: 500 }
    );
  }
}

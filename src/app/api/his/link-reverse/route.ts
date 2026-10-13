import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { triggerSync } from "@/lib/syncWorker";
import sql from "mssql";
import { appendHisNote, getHisConfig, fetchHisRevenue, clearPhacoCache } from "@/lib/his";
import { broadcastEvent } from "@/lib/events";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const items = body.items || [body]; // hỗ trợ cả liên kết đơn hoặc danh sách nhiều BN
    const prisma = getPrisma();

    let updatedCount = 0;
    for (const item of items) {
      if (!item.hoSoId || !item.maHIS) continue;

      const hoSo = await prisma.hoSoBenhNhan.findUnique({ where: { id: item.hoSoId } });
      if (!hoSo) continue;

      const updateData: any = {
        maBNHIS: item.maHIS,
        daDon: true,
        trangThaiDieuTri: "Đã mổ",
        trangThai: "DaMoHauPhau",
        followUpStatus: "Đã chốt",
      };

      const isMat2 = Boolean(
        item.isMat2 ||
        (hoSo.daDon && hoSo.ngayMoThucTe && item.ngayMo && new Date(item.ngayMo).getTime() > new Date(hoSo.ngayMoThucTe).getTime() + 86400000)
      );

      if (item.ngayMo) {
        if (!hoSo.ngayMoThucTe) {
          updateData.ngayMoThucTe = new Date(item.ngayMo);
        } else if (!isMat2) {
          updateData.ngayMoThucTe = new Date(item.ngayMo);
        }
      } else if (!hoSo.ngayMoThucTe) {
        updateData.ngayMoThucTe = new Date();
      }

      if (item.soTienThucThu != null && Number(item.soTienThucThu) > 0) {
        updateData.soTienThucThu = Number(item.soTienThucThu);
      } else {
        try {
          const config = await getHisConfig(hoSo.coSoId);
          const pool = await new sql.ConnectionPool({
            user: config.user,
            password: config.pass,
            server: config.host,
            port: config.port,
            database: config.dbName,
            options: { encrypt: true, trustServerCertificate: true },
            connectionTimeout: 5000,
            requestTimeout: 10000,
          }).connect();
          const rev = await fetchHisRevenue(pool, item.maHIS);
          await pool.close();
          if (rev != null && rev > 0) {
            updateData.soTienThucThu = rev;
          }
        } catch (err) {
          console.error("Error fetching revenue in link-reverse:", err);
        }
      }

      if (isMat2) {
        const matInfo = item.matMo ? ` - ${item.matMo}` : "";
        const svcInfo = item.tenDichVu ? ` (${item.tenDichVu})` : "";
        const dateStr = item.ngayMo ? new Date(item.ngayMo).toLocaleDateString("vi-VN") : "";
        const mat2Note = `[Mắt 2]: Mổ ngày ${dateStr}${svcInfo}${matInfo}`;
        updateData.ghiChuMat2 = appendHisNote(hoSo.ghiChuMat2, mat2Note);
      }

      await prisma.hoSoBenhNhan.update({
        where: { id: item.hoSoId },
        data: updateData,
      });

      /* KHÔNG xoá nhật ký cuộc gọi ở đây. Lệnh cũ deleteMany({ noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } })
         trên SQL Server thành LIKE '[⚡ Đối chiếu HIS]%' — ngoặc vuông là "1 ký tự bất kỳ trong nhóm" nên đã xoá
         nhầm mọi cuộc gọi mở đầu bằng Đ/H/I/S/… (vd. "Đã gọi - Đồng ý mổ") sau mỗi lần đối chiếu.
         Rác hệ thống cần dọn đã hết (0 dòng) và không còn được tạo ra. */

      try {
        await prisma.syncQueue.create({ data: { hoSoId: item.hoSoId } });
      } catch {}

      updatedCount++;
    }

    // Vừa liên kết mã HIS (có thể là Mắt 2) → tính lại số liệu Mắt 2 ở lần tải sau
    clearPhacoCache();
    triggerSync();

    if (updatedCount > 0) {
      broadcastEvent({
        type: "hoso_change",
        action: "update",
      });
      broadcastEvent({
        type: "buoikham_change",
        action: "update",
      });
    }

    return NextResponse.json({
      success: true,
      count: updatedCount,
    });
  } catch (e) {
    console.error("Link Reverse HIS Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}

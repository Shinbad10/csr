import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { triggerSync } from "@/lib/syncWorker";
import sql from "mssql";
import { appendHisNote, getHisConfig, fetchHisRevenue } from "@/lib/his";
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

      if (item.ngayMo) {
        updateData.ngayMoThucTe = new Date(item.ngayMo);
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

      const chiTiet = item.chiTiet || `Bệnh nhân phẫu thuật HIS (Mã HIS: ${item.maHIS})`;
      updateData.ghiChuMat2 = appendHisNote(hoSo.ghiChuMat2, chiTiet);

      await prisma.hoSoBenhNhan.update({
        where: { id: item.hoSoId },
        data: updateData,
      });

      // Xoá rác nhật ký liên hệ nếu có
      await prisma.nhatKyTheoDoi.deleteMany({
        where: { hoSoId: item.hoSoId, noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } },
      });

      try {
        await prisma.syncQueue.create({ data: { hoSoId: item.hoSoId } });
      } catch {}

      updatedCount++;
    }

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

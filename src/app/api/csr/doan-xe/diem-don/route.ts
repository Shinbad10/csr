import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { broadcastEvent } from "@/lib/events";

const ROUTES_FILE = path.join(process.cwd(), "data", "doan-xe-routes.json");

interface StoredRoute {
  id: string;
  tenDoan: string;
  ngayDon: string; // YYYY-MM-DD
  coSoId?: string | null;
  cacDiem: Array<{
    id: string;
    diemDon: string;
    gioDon: string;
  }>;
  createdAt: string;
}

async function readStoredRoutes(): Promise<StoredRoute[]> {
  try {
    const raw = await fs.readFile(ROUTES_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveStoredRoutes(routes: StoredRoute[]) {
  try {
    const dir = path.dirname(ROUTES_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ROUTES_FILE, JSON.stringify(routes, null, 2), "utf8");
  } catch (err) {
    console.error("[DoanXe] Lỗi lưu routes:", err);
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const ngayQuery = sp.get("ngay"); // YYYY-MM-DD nếu muốn xem theo ngày cụ thể

  try {
    const prisma = getPrisma();

    // Mốc thời gian đầu ngày hôm nay theo giờ địa phương
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // 1. Đọc các đoàn xe đã được người dùng tạo nhanh
    const stored = await readStoredRoutes();

    // 2. Lấy bệnh nhân có xếp xe từ Database
    const where: any = {
      diemDon: { not: null },
      AND: [coSoId ? { coSoId } : {}],
    };

    if (ngayQuery) {
      const startOfDay = new Date(`${ngayQuery}T00:00:00.000Z`);
      const endOfDay = new Date(`${ngayQuery}T23:59:59.999Z`);
      where.AND.push({
        ngayDieuTri: {
          gte: startOfDay,
          lte: endOfDay,
        },
      });
    } else {
      // Chỉ lấy các chuyến xe chưa qua ngày (hoặc fallback nếu DB mẫu không có tương lai)
      where.AND.push({
        ngayDieuTri: {
          gte: startOfToday,
        },
      });
    }

    let records = await prisma.hoSoBenhNhan.findMany({
      where,
      select: {
        id: true,
        diemDon: true,
        gioDon: true,
        ngayDieuTri: true,
        buoiKham: {
          select: { id: true, xa: true, diaDiem: true },
        },
      },
      orderBy: [{ ngayDieuTri: "asc" }, { gioDon: "asc" }],
    });

    // Fallback: nếu không có chuyến tương lai trong DB mẫu, lấy các chuyến của ngày mới nhất
    if (records.length === 0 && !ngayQuery) {
      const latestRecords = await prisma.hoSoBenhNhan.findMany({
        where: {
          diemDon: { not: null },
          ngayDieuTri: { not: null },
          coSoId: coSoId ? coSoId : undefined,
        },
        select: {
          id: true,
          diemDon: true,
          gioDon: true,
          ngayDieuTri: true,
          buoiKham: { select: { id: true, xa: true, diaDiem: true } },
        },
        orderBy: [{ ngayDieuTri: "desc" }],
        take: 100,
      });

      if (latestRecords.length > 0) {
        const latestDateStr = latestRecords[0].ngayDieuTri?.toISOString().slice(0, 10);
        if (latestDateStr) {
          records = latestRecords.filter(
            (r) => r.ngayDieuTri?.toISOString().slice(0, 10) === latestDateStr
          );
        }
      }
    }

    // 3. Gom nhóm thành các đoàn xe (DoanXe)
    // Mỗi Đoàn xe có: Tên đoàn, Ngày đón, và Danh sách các chặng/thời gian đón (cacDiem)
    const doanXeMap = new Map<
      string,
      {
        id: string;
        tenDoan: string;
        ngayDon: string; // YYYY-MM-DD
        cacDiem: Array<{
          id: string;
          diemDon: string;
          gioDon: string;
          soBN: number;
          cacXa: string[];
        }>;
      }
    >();

    // Nạp các đoàn xe lưu từ JSON (nếu chưa qua ngày)
    for (const s of stored) {
      if (coSoId && s.coSoId && s.coSoId !== coSoId) continue;
      // Kiểm tra chưa qua ngày (trừ khi client đang xem ngày cụ thể)
      if (!ngayQuery && s.ngayDon) {
        const sDate = new Date(`${s.ngayDon}T23:59:59.999Z`);
        if (sDate < startOfToday) continue; // Bỏ qua nếu đã qua ngày
      }
      if (ngayQuery && s.ngayDon !== ngayQuery) continue;

      const groupKey = `${s.ngayDon}___${s.tenDoan}`;
      doanXeMap.set(groupKey, {
        id: s.id,
        tenDoan: s.tenDoan,
        ngayDon: s.ngayDon,
        cacDiem: s.cacDiem.map((c) => ({
          id: c.id,
          diemDon: c.diemDon,
          gioDon: c.gioDon,
          soBN: 0,
          cacXa: [],
        })),
      });
    }

    // Nạp dữ liệu bệnh nhân từ DB vào các đoàn xe
    for (const r of records) {
      const diem = r.diemDon?.trim();
      if (!diem) continue;
      const gio = r.gioDon?.trim() || "06:00";
      const ngay = r.ngayDieuTri ? r.ngayDieuTri.toISOString().slice(0, 10) : "";
      if (!ngay) continue;

      const xa = r.buoiKham?.xa?.trim();

      // Tìm xem điểm này đã nằm trong đoàn xe nào chưa
      let foundInExisting = false;
      for (const dx of doanXeMap.values()) {
        if (dx.ngayDon === ngay) {
          const matchDiem = dx.cacDiem.find((d) => d.diemDon.toLowerCase() === diem.toLowerCase());
          if (matchDiem) {
            matchDiem.soBN += 1;
            if (xa && !matchDiem.cacXa.includes(xa)) matchDiem.cacXa.push(xa);
            foundInExisting = true;
            break;
          }
        }
      }

      if (!foundInExisting) {
        // Tự động suy ra tên đoàn xe dựa trên xã hoặc điểm đón
        const tenDoan = xa ? `Tuyến ${xa}` : `Tuyến ${diem}`;
        const groupKey = `${ngay}___${tenDoan}`;

        let dx = doanXeMap.get(groupKey);
        if (!dx) {
          dx = {
            id: `dx_${ngay}_${encodeURIComponent(tenDoan)}`,
            tenDoan,
            ngayDon: ngay,
            cacDiem: [],
          };
          doanXeMap.set(groupKey, dx);
        }

        let dItem = dx.cacDiem.find(
          (d) => d.diemDon.toLowerCase() === diem.toLowerCase() && d.gioDon === gio
        );
        if (!dItem) {
          dItem = {
            id: `pt_${ngay}_${encodeURIComponent(diem)}_${gio}`,
            diemDon: diem,
            gioDon: gio,
            soBN: 0,
            cacXa: [],
          };
          dx.cacDiem.push(dItem);
        }
        dItem.soBN += 1;
        if (xa && !dItem.cacXa.includes(xa)) dItem.cacXa.push(xa);
      }
    }

    // Sắp xếp các điểm đón trong từng đoàn xe theo giờ đón tăng dần
    for (const dx of doanXeMap.values()) {
      dx.cacDiem.sort((a, b) => a.gioDon.localeCompare(b.gioDon));
    }

    // Sắp xếp danh sách đoàn xe theo ngày đón tăng dần
    const doanXeList = Array.from(doanXeMap.values()).sort((a, b) => {
      if (a.ngayDon !== b.ngayDon) return a.ngayDon.localeCompare(b.ngayDon);
      return a.tenDoan.localeCompare(b.tenDoan);
    });

    // Thu thập danh sách unique điểm đón
    const diemDonSet = new Set<string>();
    for (const dx of doanXeList) {
      for (const c of dx.cacDiem) {
        if (c.diemDon) diemDonSet.add(c.diemDon);
      }
    }

    return NextResponse.json({
      doanXeList,
      diemDonList: Array.from(diemDonSet).sort(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi tải đoàn xe" },
      { status: 500 }
    );
  }
}

// POST: Tạo nhanh đoàn xe mới với nhiều điểm đón & giờ đón khác nhau
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { tenDoan, ngayDon, cacDiem } = body;

    if (!tenDoan || !tenDoan.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập tên đoàn xe / tuyến xe" }, { status: 400 });
    }
    if (!ngayDon) {
      return NextResponse.json({ error: "Vui lòng chọn ngày đón của đoàn xe" }, { status: 400 });
    }
    if (!Array.isArray(cacDiem) || cacDiem.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng thêm ít nhất 1 điểm đón kèm giờ đón cho đoàn xe" },
        { status: 400 }
      );
    }

    // Chuẩn hóa danh sách các điểm đón
    const validChangs = cacDiem
      .map((c: any) => ({
        id: c.id || `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        diemDon: String(c.diemDon || "").trim(),
        gioDon: String(c.gioDon || "06:00").trim(),
      }))
      .filter((c: any) => c.diemDon.length > 0);

    if (validChangs.length === 0) {
      return NextResponse.json({ error: "Điểm đón không được để trống" }, { status: 400 });
    }

    const coSoId = await getWorkingCoSoId(session);
    const stored = await readStoredRoutes();

    const newRoute: StoredRoute = {
      id: `dx_${Date.now()}`,
      tenDoan: tenDoan.trim(),
      ngayDon: ngayDon.slice(0, 10),
      coSoId,
      cacDiem: validChangs,
      createdAt: new Date().toISOString(),
    };

    stored.push(newRoute);
    await saveStoredRoutes(stored);

    // Phát sự kiện realtime
    broadcastEvent({
      type: "hoso_change",
      action: "create",
      data: { action: "create_doan_xe", routeId: newRoute.id },
    });

    return NextResponse.json({ success: true, route: newRoute });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi lưu đoàn xe mới" },
      { status: 500 }
    );
  }
}

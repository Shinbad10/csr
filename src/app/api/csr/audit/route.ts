import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const data = await getPrisma().auditLog.findMany({ orderBy: { thoiDiem: "desc" }, take: 200 });
    return NextResponse.json(data.map((a) => ({ ...a, id: Number(a.id) })));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

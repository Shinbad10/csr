"use server";

import { getPrisma } from "@/lib/prisma";

export async function getActiveFacilities() {
  try {
    const data = await getPrisma().coSo.findMany({
      where: { trangThai: "active" },
      select: { id: true, ten: true },
      orderBy: { ten: "asc" },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch facilities:", error);
    return [];
  }
}

import { cookies } from "next/headers";

export async function setSelectedFacilityCookie(coSoId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_coso_id", coSoId, { path: "/", maxAge: 8 * 60 * 60 });
}

"use server";

import { getPrisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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

export async function setSelectedFacilityCookie(coSoId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_coso_id", coSoId, { path: "/", maxAge: 8 * 60 * 60 });
}

export async function getLoginUserFacility(username: string) {
  try {
    const trimmed = username.trim();
    if (trimmed === "admin") {
      return { isCorporate: true, defaultCoSoId: null };
    }
    const user = await getPrisma().nguoiDungCSR.findUnique({
      where: { tenDangNhap: trimmed },
      select: { vaiTro: true, coSoId: true },
    });
    if (!user) {
      return { isCorporate: false, defaultCoSoId: null };
    }
    const isCorporate = user.vaiTro === "QuanLy" || user.vaiTro === "Admin";
    return {
      isCorporate,
      defaultCoSoId: user.coSoId,
    };
  } catch (error) {
    console.error("Failed to get login user facility:", error);
    return { isCorporate: false, defaultCoSoId: null };
  }
}


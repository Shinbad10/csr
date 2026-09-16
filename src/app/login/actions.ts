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

export async function setSelectedFacilityCookie(coSoId: string, facilityName?: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_coso_id", coSoId, { path: "/", maxAge: 31536000 });
  let name = facilityName;
  if (!name) {
    try {
      const coso = await getPrisma().coSo.findUnique({
        where: { id: coSoId },
        select: { ten: true },
      });
      if (coso) name = coso.ten;
    } catch {}
  }
  if (name) {
    cookieStore.set("selected_coso_name", encodeURIComponent(name), { path: "/", maxAge: 31536000 });
  }
}

export async function finalizeLogin(username: string) {
  try {
    const trimmed = username.trim();
    const cookieStore = await cookies();

    if (trimmed === "admin") {
      cookieStore.set("user_name", encodeURIComponent("Quản trị hệ thống"), { path: "/", maxAge: 31536000 });
      cookieStore.set("user_role", "Admin", { path: "/", maxAge: 31536000 });
      return { isCorporate: true, defaultCoSoId: null };
    }
    const user = await getPrisma().nguoiDungCSR.findUnique({
      where: { tenDangNhap: trimmed },
      select: { hoTen: true, vaiTro: true, coSoId: true, coSo: { select: { ten: true } } },
    });

    if (user) {
      if (user.hoTen) cookieStore.set("user_name", encodeURIComponent(user.hoTen), { path: "/", maxAge: 31536000 });
      if (user.vaiTro) cookieStore.set("user_role", user.vaiTro, { path: "/", maxAge: 31536000 });
    }

    const isCorporate = user?.vaiTro === "QuanLy" || user?.vaiTro === "Admin";
    if (!isCorporate && user?.coSoId) {
      cookieStore.set("selected_coso_id", user.coSoId, { path: "/", maxAge: 31536000 });
      if (user.coSo?.ten) {
        cookieStore.set("selected_coso_name", encodeURIComponent(user.coSo.ten), { path: "/", maxAge: 31536000 });
      }
    }
    return {
      isCorporate,
      defaultCoSoId: user?.coSoId || null,
    };
  } catch (error) {
    console.error("Failed to finalize login:", error);
    return { isCorporate: false, defaultCoSoId: null };
  }
}



import AppShell from "@/components/layout/AppShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();

  let userName = session?.user?.name || "";
  let userRole = session?.user?.role || "";
  const userCoSoId = session?.user?.coSoId || null;

  if (!userName) {
    const raw = cookieStore.get("user_name")?.value;
    if (raw) {
      try { userName = decodeURIComponent(raw); } catch { userName = raw; }
    }
  }
  if (!userRole) {
    userRole = cookieStore.get("user_role")?.value || "";
  }

  let selectedCoSoId = cookieStore.get("selected_coso_id")?.value || userCoSoId || "";
  let selectedCoSoName = "";
  const rawCoSoName = cookieStore.get("selected_coso_name")?.value;
  if (rawCoSoName) {
    try { selectedCoSoName = decodeURIComponent(rawCoSoName); } catch { selectedCoSoName = rawCoSoName; }
  }

  if (selectedCoSoId && !selectedCoSoName) {
    try {
      const coso = await getPrisma().coSo.findUnique({
        where: { id: selectedCoSoId },
        select: { ten: true },
      });
      if (coso) selectedCoSoName = coso.ten;
    } catch {}
  } else if (!selectedCoSoId) {
    try {
      const firstCoSo = await getPrisma().coSo.findFirst({
        where: { trangThai: "active" },
        select: { id: true, ten: true },
        orderBy: { ten: "asc" },
      });
      if (firstCoSo) {
        selectedCoSoId = firstCoSo.id;
        selectedCoSoName = firstCoSo.ten;
      }
    } catch {}
  }

  return (
    <AppShell
      initialUser={{
        id: session?.user?.id || "",
        name: userName,
        role: userRole,
        coSoId: userCoSoId,
      }}
      initialCoSo={{
        id: selectedCoSoId,
        name: selectedCoSoName,
      }}
    >
      {children}
    </AppShell>
  );
}

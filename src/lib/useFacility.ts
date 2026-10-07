"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { isCorporate as isCorporateRole } from "@/lib/permissions";

export interface CoSoInfo {
  id: string;
  ten: string;
  diaChi?: string | null;
  trangThai: string;
  /** Cơ sở đã cấu hình kết nối HIS (API không còn trả thông tin kết nối cho người dùng thường). */
  hisConfigured?: boolean;
  hisHost?: string | null;
  hisPort?: string | null;
  hisDbName?: string | null;
  hisUser?: string | null;
  bhxhUser?: string | null;
  bhxhMaCSKCB?: string | null;
}

const coSoHasHis = (c: CoSoInfo) => c.hisConfigured ?? Boolean(c.hisHost?.trim() && c.hisDbName?.trim());

export function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

/**
 * Hook theo dõi cơ sở hiện tại và trạng thái cấu hình kết nối CSDL HIS.
 * Chỉ khi cơ sở có cấu hình CSDL HIS (hisHost và hisDbName) thì các tính năng Đối chiếu HIS mới hiển thị.
 */
export function useCurrentFacility() {
  const { data: session } = useSession();
  const [coSos, setCoSos] = useState<CoSoInfo[]>([]);
  const [activeCoSoId, setActiveCoSoId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const isCorporate = isCorporateRole(session?.user?.role || "");

  const refreshCosos = useCallback(async () => {
    try {
      const res = await fetch("/api/csr/coso");
      if (!res.ok) return;
      const data: CoSoInfo[] = await res.json();
      if (!Array.isArray(data)) return;
      setCoSos(data);
      const cookieId = readCosoCookie();
      const effectiveId = cookieId || session?.user?.coSoId || data[0]?.id || "";
      setActiveCoSoId(effectiveId);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session?.user?.coSoId]);

  useEffect(() => {
    refreshCosos();
  }, [refreshCosos]);

  useEffect(() => {
    const checkCookie = () => {
      const cookieId = readCosoCookie();
      if (cookieId && cookieId !== activeCoSoId) {
        setActiveCoSoId(cookieId);
      }
    };
    const interval = setInterval(checkCookie, 800);
    return () => clearInterval(interval);
  }, [activeCoSoId]);

  const currentCoSo = coSos.find((c) => c.id === activeCoSoId) || null;

  const facilityHasHis = useCallback(
    (coSoId?: string | null): boolean => {
      if (!coSoId) return false;
      const target = coSos.find((c) => c.id === coSoId);
      return Boolean(target && coSoHasHis(target));
    },
    [coSos]
  );

  // Đơn vị có cấu hình Database HIS: có hisHost & hisDbName
  const hasHisConfig = Boolean(
    currentCoSo
      ? coSoHasHis(currentCoSo)
      : isCorporate && coSos.some(coSoHasHis)
  );

  return {
    coSos,
    activeCoSoId,
    currentCoSo,
    hasHisConfig,
    facilityHasHis,
    loading,
    refreshCosos,
  };
}

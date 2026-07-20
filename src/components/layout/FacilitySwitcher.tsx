"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2 } from "lucide-react";
import { isCorporate as isCorporateRole } from "@/lib/permissions";
import { Dropdown } from "@/components/csr/fields";

interface CoSo { id: string; ten: string }

function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

/** Chọn cơ sở đang làm việc. Quản lý toàn hệ thống được đổi; vai trò khác chỉ xem.
 *  Việc ẩn/hiện theo breakpoint do nơi gọi quyết định (topbar desktop vs drawer mobile). */
export default function FacilitySwitcher({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const [coSos, setCoSos] = useState<CoSo[]>([]);
  const [selected, setSelected] = useState<string>(readCosoCookie);

  const isCorporate = isCorporateRole(session?.user?.role || "");

  useEffect(() => {
    fetch("/api/csr/coso").then((r) => r.json()).then((data) => {
      if (!Array.isArray(data)) return;
      setCoSos(data);
      setSelected((cur) => {
        if (cur) return cur;
        const id = session?.user?.coSoId || data[0]?.id || "";
        if (id && typeof document !== "undefined") document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
        return id;
      });
    }).catch(() => {});
  }, [session]);

  const onChange = (id: string) => {
    setSelected(id);
    document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const facilityName = coSos.find((c) => c.id === (selected || session?.user?.coSoId))?.ten ?? "—";

  if (isCorporate) {
    return (
      <div className={className}>
        <Dropdown
          value={selected}
          onChange={onChange}
          options={coSos.map((c) => c.id)}
          labels={Object.fromEntries(coSos.map((c) => [c.id, c.ten]))}
          placeholder="Chọn cơ sở…"
          mono={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] rounded-[var(--r-md)] px-2.5 py-1.5 text-xs font-bold ${className}`}
      title={facilityName}
    >
      <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--teal)]" />
      <span className="truncate">{facilityName}</span>
    </div>
  );
}

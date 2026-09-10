'use client';

import React, { useMemo, useState } from 'react';
import { type LucideIcon } from 'lucide-react';
import { ToolbarSelect } from './ToolbarSelect';

/**
 * Bộ lọc dùng chung cho các danh sách chạy trên `DataToolbar`.
 * Lựa chọn luôn dựng TỪ chính dữ liệu đang có, nên không lệch với bảng.
 */

export type CauHinhLoc<T> = {
  /** Khoá duy nhất trong một trang. */
  key: string;
  /** Nhãn khi chưa lọc, ví dụ 'Tất cả trạng thái'. */
  nhanTatCa: string;
  /** Icon lucide phân biệt các ô lọc với nhau. */
  icon?: LucideIcon;
  /** Giá trị thô của một dòng theo chiều này. Rỗng/null nghĩa là dòng không thuộc nhóm nào. */
  lay: (row: T) => string | number | null | undefined;
  /** Đổi giá trị thô sang nhãn hiển thị. Mặc định giữ nguyên. */
  nhan?: (giaTri: string) => string;
  /** Thứ tự ưu tiên khi hiển thị; không khai thì xếp theo số lượng giảm dần. */
  thuTu?: string[];
};

const chuoiHoa = (v: string | number | null | undefined) => String(v ?? '').trim();

function nhanCua<T>(c: CauHinhLoc<T>, tho: string): string {
  return c.nhan ? c.nhan(tho) : tho;
}

/**
 * @returns `ketQua` — danh sách đã lọc; `controls` — JSX truyền thẳng vào `DataToolbar filters=`;
 * `dangLoc` — có bộ lọc nào đang bật; `xoaLoc` — gỡ hết.
 */
export function useListFilters<T>(rows: T[], cauHinh: CauHinhLoc<T>[]) {
  const [chon, setChon] = useState<Record<string, string>>({});

  const dangLoc = cauHinh.some((c) => chon[c.key] && chon[c.key] !== 'all');

  /** Lọc theo mọi chiều TRỪ chiều đang xét — để mỗi ô lọc tự đếm trên phạm vi các ô còn lại. */
  const locTru = useMemo(() => {
    const map: Record<string, T[]> = {};
    for (const c of cauHinh) {
      map[c.key] = rows.filter((row) =>
        cauHinh.every((khac) => {
          if (khac.key === c.key) return true;
          const dangChon = chon[khac.key];
          if (!dangChon || dangChon === 'all') return true;
          return nhanCua(khac, chuoiHoa(khac.lay(row))) === dangChon;
        }),
      );
    }
    return map;
  }, [rows, cauHinh, chon]);

  const ketQua = useMemo(
    () =>
      rows.filter((row) =>
        cauHinh.every((c) => {
          const dangChon = chon[c.key];
          if (!dangChon || dangChon === 'all') return true;
          return nhanCua(c, chuoiHoa(c.lay(row))) === dangChon;
        }),
      ),
    [rows, cauHinh, chon],
  );

  const controls = (
    <>
      {cauHinh.map((c) => {
        const nguon = locTru[c.key] ?? rows;
        const dem = new Map<string, number>();
        for (const row of nguon) {
          const tho = chuoiHoa(c.lay(row));
          if (!tho) continue;
          const nhan = nhanCua(c, tho);
          dem.set(nhan, (dem.get(nhan) ?? 0) + 1);
        }

        let muc = Array.from(dem, ([nhan, soLuong]) => ({ nhan, soLuong }));
        if (c.thuTu) {
          const uuTien = (n: string) => {
            const i = c.thuTu!.indexOf(n);
            return i === -1 ? c.thuTu!.length : i;
          };
          muc.sort((a, b) => uuTien(a.nhan) - uuTien(b.nhan) || a.nhan.localeCompare(b.nhan, 'vi'));
        } else {
          muc.sort((a, b) => b.soLuong - a.soLuong || a.nhan.localeCompare(b.nhan, 'vi'));
        }

        const dangChon = chon[c.key] ?? 'all';

        if (dangChon !== 'all' && !muc.some((m) => m.nhan === dangChon)) {
          muc = [{ nhan: dangChon, soLuong: 0 }, ...muc];
        }

        // Một chiều chỉ có đúng một giá trị thì lọc theo nó là vô nghĩa — ẩn đi cho gọn.
        if (muc.length <= 1 && dangChon === 'all') return null;

        return (
          <ToolbarSelect
            key={c.key}
            value={dangChon}
            onChange={(v) => setChon((prev) => ({ ...prev, [c.key]: v }))}
            searchable={muc.length > 8}
            icon={c.icon}
            active={dangChon !== 'all'}
            className="w-auto min-w-[132px] max-w-[210px] shrink-0"
            options={[
              { label: `${c.nhanTatCa} (${(locTru[c.key] ?? rows).length})`, value: 'all' },
              ...muc.map((m) => ({ label: `${m.nhan} (${m.soLuong})`, value: m.nhan })),
            ]}
          />
        );
      })}
    </>
  );

  return { ketQua, controls, dangLoc, xoaLoc: () => setChon({}) };
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class Tailwind an toàn (loại trùng, ưu tiên class sau). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dải dấu thanh tổ hợp Unicode (U+0300–U+036F) — viết bằng \u để không phụ thuộc mã hoá file.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Bỏ dấu tiếng Việt + hạ chữ thường — dùng cho tìm kiếm/so khớp không dấu. */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

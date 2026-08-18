// Helper đọc response an toàn cho phía client.
// Next.js trả body RỖNG cho 405 (sai method), 502/504 (proxy), hoặc khi request bị huỷ giữa chừng —
// gọi thẳng res.json() sẽ ném "Unexpected end of JSON input" và người dùng thấy lỗi vô nghĩa.

/** Đọc JSON từ Response, không bao giờ ném lỗi parse. Body rỗng/không phải JSON → trả object rỗng. */
export async function readJson<T = any>(res: Response): Promise<T> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    return {} as T;
  }
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/** Thông báo lỗi dễ hiểu cho người dùng khi response không OK. */
export function loiTuResponse(res: Response, data: any, macDinh = "Không thể lưu dữ liệu"): string {
  if (data?.error) return String(data.error);
  if (res.status === 401) return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
  if (res.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (res.status === 404) return "Không tìm thấy dữ liệu trên máy chủ.";
  if (res.status === 405) return "Máy chủ không hỗ trợ thao tác này (405). Vui lòng tải lại trang.";
  if (res.status >= 500) return `Máy chủ gặp sự cố (${res.status}). Vui lòng thử lại.`;
  return `${macDinh} (mã ${res.status})`;
}

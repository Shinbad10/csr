import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { subscribeEvents, CSREvent } from "@/lib/events";
import { isCorporate } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  // Nhân viên cơ sở chỉ nghe sự kiện của cơ sở mình (không tin ?coSoId=, không nhận sự kiện thiếu coSoId).
  // Quản lý giữ hành vi cũ: lọc theo ?coSoId= nếu có, không có thì nhận tất cả.
  const corporate = isCorporate(session.user?.role);
  const ownCoSoId = session.user?.coSoId ?? null;
  if (!corporate && !ownCoSoId) return new Response("Forbidden", { status: 403 });
  const filterCoSoId = corporate ? url.searchParams.get("coSoId") : ownCoSoId;
  const filterBuoiKhamId = url.searchParams.get("buoiKhamId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Gửi tín hiệu kết nối thành công ban đầu
      const initData = JSON.stringify({
        type: "connected",
        user: session.user?.name || session.user?.id,
        timestamp: Date.now(),
      });
      controller.enqueue(encoder.encode(`event: connected\ndata: ${initData}\n\n`));

      // Heartbeat ping định kỳ mỗi 15 giây để duy trì kết nối SSE qua reverse proxy / firewall
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      // Lắng nghe sự kiện từ EventHub
      const unsubscribe = subscribeEvents((event: CSREvent) => {
        try {
          // Lọc cơ sở nếu client có yêu cầu cụ thể
          if (filterCoSoId && event.coSoId !== filterCoSoId && (event.coSoId || !corporate)) {
            return;
          }
          if (filterBuoiKhamId && event.buoiKhamId && event.buoiKhamId !== filterBuoiKhamId) {
            return;
          }

          const eventName = event.type || "message";
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`));
        } catch (err) {
          console.error("[SSE] Lỗi ghi stream SSE tới client:", err);
        }
      });

      // Dọn dẹp listener khi client ngắt kết nối
      const cleanup = () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Browser ngắt kết nối
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Tắt buffer trên Nginx
    },
  });
}

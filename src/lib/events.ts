import { EventEmitter } from "events";

export type EventType =
  | "buoikham_change"
  | "hoso_change"
  | "nhatky_change"
  | "stats_change";

export interface CSREvent {
  type: EventType;
  action?: "create" | "update" | "delete" | "sync";
  coSoId?: string | null;
  buoiKhamId?: string | null;
  hoSoId?: string | null;
  timestamp?: number;
  data?: any;
}

// Lưu trên globalThis để đảm bảo singleton tồn tại xuyên suốt các API Route Handler & hot-reload trong runtime Node.js
const GLOBAL_CSR_EVENT_EMITTER = Symbol.for("__CSR_EVENT_EMITTER__");

type GlobalWithEvents = typeof globalThis & {
  [GLOBAL_CSR_EVENT_EMITTER]?: EventEmitter;
};

const globalObj = globalThis as GlobalWithEvents;

if (!globalObj[GLOBAL_CSR_EVENT_EMITTER]) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(1000); // Cho phép nhiều thiết bị kết nối SSE đồng thời
  globalObj[GLOBAL_CSR_EVENT_EMITTER] = emitter;
}

export const eventHub = globalObj[GLOBAL_CSR_EVENT_EMITTER]!;

/**
 * Phát sự kiện thời gian thực (SSE) đến tất cả các client đang kết nối
 */
export function broadcastEvent(event: CSREvent) {
  try {
    const payload: CSREvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };
    eventHub.emit("csr_event", payload);
    if (payload.type) {
      eventHub.emit(payload.type, payload);
    }
  } catch (err) {
    console.error("[EventHub] Lỗi phát sự kiện SSE:", err);
  }
}

/**
 * Đăng ký lắng nghe sự kiện từ EventHub
 */
export function subscribeEvents(callback: (event: CSREvent) => void): () => void {
  eventHub.on("csr_event", callback);
  return () => {
    eventHub.off("csr_event", callback);
  };
}

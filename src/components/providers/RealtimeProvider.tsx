"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { CSREvent, EventType } from "@/lib/events";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface RealtimeContextType {
  status: ConnectionStatus;
  isConnected: boolean;
  lastEvent: CSREvent | null;
  addListener: (type: EventType | "*" | EventType[], handler: (event: CSREvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  status: "disconnected",
  isConnected: false,
  lastEvent: null,
  addListener: () => () => {},
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus } = useSession();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<CSREvent | null>(null);
  
  const listenersRef = useRef<Map<string, Set<(event: CSREvent) => void>>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  const notifyListeners = useCallback((event: CSREvent) => {
    setLastEvent(event);
    
    // Gửi cho listener của event type cụ thể
    const typeListeners = listenersRef.current.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error("[Realtime] Lỗi trong event listener:", err);
        }
      });
    }

    // Gửi cho wildcard listener ("*")
    const wildcardListeners = listenersRef.current.get("*");
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error("[Realtime] Lỗi trong wildcard listener:", err);
        }
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (authStatus !== "authenticated") {
      setStatus("disconnected");
      return;
    }

    if (typeof window === "undefined") return;

    // Đóng kết nối cũ nếu có
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus("connecting");

    try {
      const es = new EventSource("/api/csr/events");
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        setStatus("connected");
        reconnectAttemptRef.current = 0;
      });

      es.addEventListener("buoikham_change", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          notifyListeners({ type: "buoikham_change", ...data });
        } catch {}
      });

      es.addEventListener("hoso_change", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          notifyListeners({ type: "hoso_change", ...data });
        } catch {}
      });

      es.addEventListener("nhatky_change", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          notifyListeners({ type: "nhatky_change", ...data });
        } catch {}
      });

      es.addEventListener("stats_change", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          notifyListeners({ type: "stats_change", ...data });
        } catch {}
      });

      es.onerror = () => {
        setStatus("disconnected");
        es.close();
        eventSourceRef.current = null;

        // Thử kết nối lại với độ trễ tăng dần (tối đa 5s)
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 5000);
        reconnectAttemptRef.current++;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch {
      setStatus("disconnected");
    }
  }, [authStatus, notifyListeners]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      connect();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus("disconnected");
    }

    // Kết nối lại khi tab được focus hoặc mạng online trở lại
    const handleFocus = () => {
      if (authStatus === "authenticated" && (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED)) {
        connect();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
    };
  }, [authStatus, connect]);

  const addListener = useCallback(
    (typeOrTypes: EventType | "*" | EventType[], handler: (event: CSREvent) => void) => {
      const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];

      types.forEach((t) => {
        if (!listenersRef.current.has(t)) {
          listenersRef.current.set(t, new Set());
        }
        listenersRef.current.get(t)!.add(handler);
      });

      return () => {
        types.forEach((t) => {
          const set = listenersRef.current.get(t);
          if (set) {
            set.delete(handler);
            if (set.size === 0) listenersRef.current.delete(t);
          }
        });
      };
    },
    []
  );

  return (
    <RealtimeContext.Provider
      value={{
        status,
        isConnected: status === "connected",
        lastEvent,
        addListener,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

/**
 * Hook lắng nghe sự kiện SSE theo kiểu tự động đăng ký & huỷ đăng ký
 */
export function useRealtimeEvent(
  typeOrTypes: EventType | "*" | EventType[],
  handler: (event: CSREvent) => void,
  deps: any[] = []
) {
  const { addListener } = useRealtime();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = addListener(typeOrTypes, (evt) => {
      if (handlerRef.current) {
        handlerRef.current(evt);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addListener, JSON.stringify(typeOrTypes), ...deps]);
}

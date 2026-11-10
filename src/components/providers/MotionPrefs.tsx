"use client";

import { MotionConfig } from "framer-motion";

/** Mọi animation framer-motion tôn trọng "Giảm chuyển động" của hệ điều hành:
 *  bỏ dịch chuyển / phóng to, vẫn giữ đổi độ mờ để trạng thái còn rõ. */
export default function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

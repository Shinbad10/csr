"use client";

import React, { useState } from "react";
import { KeyRound, Check, Loader2, X } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { SectionHeader, Field } from "@/components/csr/fields";
import { useToast } from "@/components/providers/ToastProvider";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function ChangePasswordModal({ open, onClose, userId }: ChangePasswordModalProps) {
  const { addToast } = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (newPassword.length < 6) {
      setErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/csr/nguoidung/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, matKhau: newPassword }),
      });
      const d = await res.json();
      setSaving(false);

      if (!res.ok) {
        setErr(d.error || "Không thể đổi mật khẩu.");
        return;
      }

      addToast({ type: "success", message: "Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới trong lần đăng nhập tiếp theo." });
      onClose();
    } catch {
      setSaving(false);
      setErr("Lỗi kết nối máy chủ.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đổi mật khẩu tài khoản"
      subtitle="Cập nhật mật khẩu bảo mật cho tài khoản cá nhân của bạn"
      icon={KeyRound}
      maxWidth="max-w-[500px]"
      noPadding
    >
      <form onSubmit={submit} className="p-4 sm:p-7 space-y-6 bg-white">
        {err && (
          <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2 animate-shake">
            <X className="w-4 h-4 shrink-0" /> {err}
          </div>
        )}

        <div className="space-y-4">
          <SectionHeader n={1} accent="Mật khẩu hiện tại" />
          <Field label="Mật khẩu đang sử dụng" required>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="input-field font-mono h-10 text-[14px]"
              placeholder="Nhập mật khẩu hiện tại..."
              autoFocus
            />
          </Field>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader n={2} accent="Mật khẩu mới" />
          <Field label="Mật khẩu mới (ít nhất 6 ký tự)" required>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input-field font-mono h-10 text-[14px]"
              placeholder="Nhập mật khẩu mới..."
            />
          </Field>
          <Field label="Xác nhận mật khẩu mới" required>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input-field font-mono h-10 text-[14px]"
              placeholder="Nhập lại mật khẩu mới..."
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} Cập nhật mật khẩu
          </button>
        </div>
      </form>
    </Modal>
  );
}

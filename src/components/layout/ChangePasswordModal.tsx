"use client";

import React, { useState } from "react";
import { KeyRound, Check, Loader2, AlertCircle } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { SectionHeader } from "@/components/csr/fields";
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
      <form onSubmit={submit} className="p-5 sm:p-7 flex flex-col gap-6 bg-[var(--surface-bg)]">
        {err && (
          <div className="p-3.5 rounded-[12px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SectionHeader n={1} accent="Mật khẩu hiện tại" />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Mật khẩu đang sử dụng *
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoFocus
              placeholder="Nhập mật khẩu hiện tại..."
              className="w-full h-11 px-3.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] font-mono text-sm placeholder:text-[var(--mute)] outline-none transition-all focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/15"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <SectionHeader n={2} accent="Mật khẩu mới" />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Mật khẩu mới (ít nhất 6 ký tự) *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Nhập mật khẩu mới..."
              className="w-full h-11 px-3.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] font-mono text-sm placeholder:text-[var(--mute)] outline-none transition-all focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/15"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Nhập lại mật khẩu mới..."
              className="w-full h-11 px-3.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] font-mono text-sm placeholder:text-[var(--mute)] outline-none transition-all focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/15"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--line-soft)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] text-sm font-bold transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-[12px] bg-gradient-to-r from-[var(--teal)] to-[var(--navy)] text-white hover:opacity-95 text-sm font-bold shadow-md shadow-[var(--teal)]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
            <span>Cập nhật mật khẩu</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

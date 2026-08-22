"use client";

import React, { useState } from "react";
import { KeyRound, Check, Loader2 } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { SectionHeader } from "@/components/csr/fields";
import { useToast } from "@/components/providers/ToastProvider";
import { TextField, Button, Alert, Box } from "@mui/material";

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
      <Box component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 3, bgcolor: "background.paper" }}>
        {err && (
          <Alert severity="error" sx={{ borderRadius: "12px", fontWeight: 600 }}>
            {err}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionHeader n={1} accent="Mật khẩu hiện tại" />
          <TextField
            fullWidth
            type="password"
            label="Mật khẩu đang sử dụng *"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            autoFocus
            slotProps={{
              input: {
                sx: { fontFamily: "var(--font-mono)", borderRadius: "12px" },
              },
            }}
            placeholder="Nhập mật khẩu hiện tại..."
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <SectionHeader n={2} accent="Mật khẩu mới" />
          <TextField
            fullWidth
            type="password"
            label="Mật khẩu mới (ít nhất 6 ký tự) *"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            slotProps={{
              input: {
                sx: { fontFamily: "var(--font-mono)", borderRadius: "12px" },
                inputProps: { minLength: 6 },
              },
            }}
            placeholder="Nhập mật khẩu mới..."
          />
          <TextField
            fullWidth
            type="password"
            label="Xác nhận mật khẩu mới *"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            slotProps={{
              input: {
                sx: { fontFamily: "var(--font-mono)", borderRadius: "12px" },
                inputProps: { minLength: 6 },
              },
            }}
            placeholder="Nhập lại mật khẩu mới..."
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, pt: 2, borderTop: "1px solid var(--line-soft)" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            sx={{ px: 3, py: 1, borderRadius: "12px", fontWeight: 700 }}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />}
            sx={{ px: 3.5, py: 1, borderRadius: "12px", fontWeight: 700 }}
          >
            Cập nhật mật khẩu
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

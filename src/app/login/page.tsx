"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  OutlinedInput,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Building2,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { getActiveFacilities, setSelectedFacilityCookie, getLoginUserFacility } from "./actions";

export default function LoginPage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilities, setFacilities] = useState<{ id: string; ten: string }[]>([]);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("visi_theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("visi_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    getActiveFacilities().then((data) => {
      setFacilities(data);
      if (data.length > 0) {
        setSelectedFacility(data[0].id);
      }
    });
  }, []);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      const newErrors: { username?: string; password?: string } = {};
      if (!username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập hoặc mã cán bộ";
      if (!password.trim()) newErrors.password = "Mật khẩu không được để trống";

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        return;
      }

      setIsLoading(true);
      setError("");
      setFieldErrors({});

      try {
        const res = await signIn("credentials", { username, password, redirect: false });
        if (res?.error) {
          setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
          setIsLoading(false);
        } else {
          const userCtx = await getLoginUserFacility(username);

          if (!userCtx.isCorporate && userCtx.defaultCoSoId) {
            await setSelectedFacilityCookie(userCtx.defaultCoSoId);
            setIsRedirecting(true);
            router.push("/");
            router.refresh();
          } else if (userCtx.isCorporate && facilities.length > 0) {
            setShowFacilityModal(true);
            setIsLoading(false);
          } else {
            if (userCtx.defaultCoSoId || facilities[0]?.id) {
              await setSelectedFacilityCookie(userCtx.defaultCoSoId || facilities[0]?.id);
            }
            setIsRedirecting(true);
            router.push("/");
            router.refresh();
          }
        }
      } catch {
        setError("Không thể kết nối máy chủ xác thực hệ thống");
        setIsLoading(false);
      }
    },
    [username, password, isLoading, router, facilities]
  );

  const handleConfirmFacility = async (facilityId?: string) => {
    const targetFacility = facilityId || selectedFacility;
    if (!targetFacility) return;
    setIsRedirecting(true);
    await setSelectedFacilityCookie(targetFacility);
    router.push("/");
    router.refresh();
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)] relative overflow-hidden font-sans transition-colors duration-500 p-6 select-none"
    >
      {/* Background Ambient Lights */}
      <div
        suppressHydrationWarning
        className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[var(--teal)]/10 dark:bg-[var(--teal)]/15 rounded-full blur-[160px] pointer-events-none animate-pulse"
      />
      <div
        suppressHydrationWarning
        className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[var(--navy)]/10 dark:bg-[var(--navy)]/20 rounded-full blur-[160px] pointer-events-none animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Theme Switch Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-8 right-8 z-[60] w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--line-strong)] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group cursor-pointer"
        title="Đổi giao diện Sáng / Tối"
      >
        {isMounted ? (
          theme === "dark" ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} className="text-[var(--navy)]" />
          )
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-[var(--line)]" />
        )}
      </button>

      <div
        suppressHydrationWarning
        className="container max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-32 items-center relative z-10"
      >
        {/* Left: CSR Branding Column */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-10"
        >
          <div suppressHydrationWarning className="flex items-center gap-5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--teal)]/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="VISI Logo"
                className="relative w-auto h-20 object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-[var(--navy)] dark:text-white tracking-tighter font-serif transition-colors duration-500">
                VISI CSR
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--teal)] opacity-90 font-mono">
                Chăm sóc mắt cộng đồng
              </span>
            </div>
          </div>

          <div suppressHydrationWarning className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-[var(--ink)] dark:text-slate-100 font-serif transition-colors duration-500">
              Khám tầm soát <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--teal)] to-[var(--teal-deep)] leading-normal">
                &amp; Tư vấn phẫu thuật
              </span>
            </h1>
            <p className="text-[var(--ink-soft)] dark:text-slate-300 font-semibold leading-relaxed text-lg border-l-4 border-[var(--teal)]/40 pl-5 max-w-xl transition-colors duration-500">
              Đồng hành cùng đội ngũ y bác sĩ trong công tác thăm khám, theo dõi thị lực và mang lại đôi mắt sáng khỏe cho người bệnh.
            </p>
          </div>

          {/* Key Medical Values */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[var(--line)] dark:border-white/10 max-w-lg">
            <div>
              <div className="text-2xl font-black text-[var(--navy)] dark:text-[var(--teal)] font-serif">Tận tâm</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Đồng hành người bệnh</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--navy)] dark:text-[var(--teal)] font-serif">Chính xác</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Chẩn đoán &amp; Tư vấn</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--teal)] font-serif">Minh bạch</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Hồ sơ thăm khám</div>
            </div>
          </div>
        </motion.div>

        {/* Right: Login Card with MUI Component Integration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full flex justify-center lg:justify-end"
        >
          <div suppressHydrationWarning className="relative w-full max-w-[520px]">
            <div className="absolute -inset-4 sm:-inset-8 bg-[var(--navy)]/5 dark:bg-[var(--teal)]/10 rounded-[36px] sm:rounded-[60px] blur-3xl opacity-40 transition-colors duration-700" />

            <div
              suppressHydrationWarning
              className="relative backdrop-blur-3xl border p-6 sm:p-12 rounded-[28px] sm:rounded-[44px] transition-all duration-700 overflow-hidden
                bg-white/95 dark:bg-slate-900/80 
                border-white/60 dark:border-white/10 
                shadow-[0_32px_128px_-20px_rgba(3,29,166,0.12)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.8)]
                ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--teal)] via-[var(--navy)] to-[var(--teal)] opacity-80" />

              {/* Mobile Branding Header */}
              <div className="flex lg:hidden items-center justify-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black text-[var(--navy)] dark:text-white font-serif leading-none">
                    VISI CSR
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--teal)] font-mono">
                    Chăm sóc mắt cộng đồng
                  </span>
                </div>
              </div>

              <div className="text-center mb-6 sm:mb-10">
                <div className="inline-flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 justify-center">
                    <Sparkles size={14} className="text-[var(--teal)] animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[var(--teal)] font-mono">
                      Xác thực truy cập
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] dark:text-white tracking-tight font-serif mb-2 transition-colors duration-500">
                    Đăng nhập hệ thống
                  </h2>
                  <p className="text-[var(--ink-soft)] dark:text-slate-400 font-medium text-xs sm:text-sm opacity-80 transition-colors duration-500">
                    Vui lòng nhập tài khoản cán bộ để tiếp tục.
                  </p>
                </div>
              </div>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: "16px",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    border: "1px solid rgba(225, 29, 72, 0.2)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, sm: 3 } }}>
                {/* Username Input using MUI OutlinedInput */}
                <div className="space-y-2">
                  <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] dark:text-slate-400 ml-1 transition-colors font-mono">
                    <User size={13} className="text-[var(--teal)]" /> Tên đăng nhập / Mã cán bộ
                  </label>
                  <OutlinedInput
                    fullWidth
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                    }}
                    error={!!fieldErrors.username}
                    placeholder="VD: admin, mkt01, tvv01..."
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1, mr: 1.5 }}>
                        <User size={18} className="text-[var(--mute)]" />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: { xs: "16px", sm: "20px" },
                      backgroundColor: "var(--surface-soft)",
                      fontWeight: 700,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      transition: "all 0.3s ease",
                      "& .MuiOutlinedInput-input": {
                        py: { xs: "14px", sm: "16px" },
                        pl: 0,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--line-strong)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--teal)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 0 0 4px rgba(2, 184, 169, 0.1)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--teal)",
                        borderWidth: "1.5px",
                      },
                    }}
                  />
                  {fieldErrors.username && (
                    <p className="text-[11px] text-rose-500 font-bold pl-2 mt-1">{fieldErrors.username}</p>
                  )}
                </div>

                {/* Password Input using MUI OutlinedInput */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 pr-1">
                    <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] dark:text-slate-400 ml-1 transition-colors font-mono">
                      <Lock size={13} className="text-[var(--teal)]" /> Mật khẩu truy cập
                    </label>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => alert("Vui lòng liên hệ Quản trị viên hệ thống để reset mật khẩu.")}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--teal)] hover:text-[var(--teal-deep)] hover:underline transition-colors font-mono cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <OutlinedInput
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    error={!!fieldErrors.password}
                    placeholder="••••••••"
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1, mr: 1.5 }}>
                        <Lock size={18} className="text-[var(--mute)]" />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          sx={{ color: "var(--mute)", "&:hover": { color: "var(--teal)" } }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: { xs: "16px", sm: "20px" },
                      backgroundColor: "var(--surface-soft)",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      fontFamily: "var(--font-mono)",
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      transition: "all 0.3s ease",
                      "& .MuiOutlinedInput-input": {
                        py: { xs: "14px", sm: "16px" },
                        pl: 0,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--line-strong)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--teal)",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "var(--surface)",
                        boxShadow: "0 0 0 4px rgba(2, 184, 169, 0.1)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--teal)",
                        borderWidth: "1.5px",
                      },
                    }}
                  />
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 font-bold pl-2 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Checkbox using MUI Checkbox */}
                <div className="flex items-center gap-2 ml-1 py-1">
                  <label className="relative flex items-center cursor-pointer group select-none">
                    <Checkbox
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      icon={
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[var(--line-strong)] dark:border-white/20 rounded-lg sm:rounded-xl group-hover:border-[var(--teal)] transition-all" />
                      }
                      checkedIcon={
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[var(--teal)] border-2 border-[var(--teal)] rounded-lg sm:rounded-xl flex items-center justify-center transition-all">
                          <ShieldCheck size={14} className="text-white" strokeWidth={3.5} />
                        </div>
                      }
                      sx={{ p: 0 }}
                    />
                    <span
                      className={`ml-3 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-colors font-mono ${
                        remember
                          ? "text-[var(--teal-deep)] dark:text-[var(--teal)]"
                          : "text-[var(--mute)] dark:text-slate-500 group-hover:text-[var(--ink)] dark:group-hover:text-slate-300"
                      }`}
                    >
                      Duy trì đăng nhập
                    </span>
                  </label>
                </div>

                {/* Submit Button using MUI Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  fullWidth
                  size="large"
                  endIcon={
                    !isLoading ? (
                      <ChevronRight
                        size={18}
                        className="transition-transform duration-300"
                        strokeWidth={3}
                      />
                    ) : undefined
                  }
                  sx={{
                    py: { xs: 1.8, sm: 2 },
                    borderRadius: { xs: "16px", sm: "20px" },
                    fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    background: "linear-gradient(90deg, var(--teal) 0%, var(--navy) 50%, var(--navy) 100%)",
                    boxShadow: "0 20px 40px -10px rgba(3, 29, 166, 0.4)",
                    color: "#ffffff",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      background: "linear-gradient(90deg, var(--teal-deep) 0%, var(--navy-deep) 50%, var(--navy-ink) 100%)",
                      boxShadow: "0 28px 56px -10px rgba(3, 29, 166, 0.6)",
                      "& .MuiButton-endIcon": {
                        transform: "translateX(4px)",
                      },
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                  }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : "XÁC THỰC TRUY CẬP"}
                </Button>
              </Box>

              <div className="mt-8 sm:mt-10 pt-5 border-t border-[var(--line)] dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[9px] sm:text-[10px] font-black text-[var(--mute)] dark:text-slate-500 uppercase tracking-widest font-mono">
                  © 2026 VISI MEDICAL GROUP
                </p>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[var(--teal)] animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--teal)] font-mono">
                    Hệ thống Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Unit / Facility Selector Modal with MUI Dialog */}
      <Dialog
        open={showFacilityModal}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "32px",
              p: { xs: 2, sm: 4 },
              border: "1px solid var(--line-strong)",
              boxShadow: "0 30px 60px rgba(3,29,166,0.2)",
              backgroundColor: "var(--surface)",
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 1, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                backgroundColor: "var(--teal-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                border: "1px solid rgba(2, 184, 169, 0.25)",
              }}
            >
              <Building2 size={32} className="text-[var(--teal)]" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-serif)" }}>
              Xác định cơ sở làm việc
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--ink-soft)", mt: 1, maxWidth: 380, fontWeight: 600 }}>
              Tài khoản của bạn có quyền tại nhiều cơ sở, <br />
              vui lòng chọn đơn vị làm việc cho phiên này.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 1, py: 2 }}>
          {isRedirecting ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 2 }}>
              <CircularProgress size={36} sx={{ color: "var(--teal)" }} />
              <Typography sx={{ fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--teal)", fontFamily: "var(--font-mono)" }}>
                Đang nạp phiên làm việc...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 340, overflowY: "auto", pr: 1 }}>
              {facilities.map((f) => (
                <Button
                  key={f.id}
                  onClick={() => handleConfirmFacility(f.id)}
                  disabled={isRedirecting}
                  variant="outlined"
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    p: 2,
                    borderRadius: "22px",
                    borderColor: "var(--line-strong)",
                    backgroundColor: "var(--surface-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    textAlign: "left",
                    "&:hover": {
                      borderColor: "var(--teal)",
                      backgroundColor: "var(--surface)",
                      boxShadow: "var(--shadow-sm)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "16px",
                      backgroundColor: "var(--teal-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px solid rgba(2, 184, 169, 0.2)",
                    }}
                  >
                    <Activity size={20} className="text-[var(--teal)]" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                      {f.ten}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={`Cơ sở: ${f.id}`}
                        size="small"
                        color="secondary"
                        sx={{ fontSize: "0.625rem", height: 20 }}
                      />
                    </Box>
                  </Box>
                  <ChevronRight size={18} className="text-[var(--teal)]" />
                </Button>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

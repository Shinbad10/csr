"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
  Check,
} from "lucide-react";
import { getActiveFacilities, setSelectedFacilityCookie, finalizeLogin } from "./actions";

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
          const userCtx = await finalizeLogin(username);

          if (!userCtx.isCorporate && userCtx.defaultCoSoId) {
            setIsRedirecting(true);
            window.location.href = "/";
          } else if (userCtx.isCorporate && facilities.length > 0) {
            setShowFacilityModal(true);
            setIsLoading(false);
          } else {
            if (userCtx.defaultCoSoId || facilities[0]?.id) {
              const targetId = userCtx.defaultCoSoId || facilities[0]?.id;
              const targetName = facilities.find((f) => f.id === targetId)?.ten;
              await setSelectedFacilityCookie(targetId, targetName);
            }
            setIsRedirecting(true);
            window.location.href = "/";
          }
        }
      } catch {
        setError("Không thể kết nối máy chủ xác thực hệ thống");
        setIsLoading(false);
      }
    },
    [username, password, isLoading, facilities]
  );

  const handleConfirmFacility = async (facilityId?: string) => {
    const targetFacility = facilityId || selectedFacility;
    if (!targetFacility) return;
    setIsRedirecting(true);
    const targetName = facilities.find((f) => f.id === targetFacility)?.ten;
    await setSelectedFacilityCookie(targetFacility, targetName);
    window.location.href = "/";
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

          <div suppressHydrationWarning className="grid grid-cols-3 gap-6 pt-4 border-t border-[var(--line)] max-w-lg">
            <div>
              <div className="text-2xl font-black text-[var(--navy)] dark:text-white font-serif">100%</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Dữ liệu số hóa</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--teal)] font-serif">Chuyên sâu</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Chẩn đoán &amp; Tư vấn</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--teal)] font-serif">Minh bạch</div>
              <div className="text-xs font-semibold text-[var(--mute)] mt-1">Hồ sơ thăm khám</div>
            </div>
          </div>
        </motion.div>

        {/* Right: Login Card */}
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
                <div className="mb-4 p-3.5 rounded-[14px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] dark:text-slate-400 ml-1 transition-colors font-mono">
                    <User size={13} className="text-[var(--teal)]" /> Tên đăng nhập / Mã cán bộ
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                      }}
                      placeholder="VD: admin, mkt01, tvv01..."
                      className={`w-full h-12 pl-10 pr-3.5 rounded-[16px] border bg-[var(--surface-soft)] font-sans font-bold text-sm text-[var(--ink)] placeholder:text-[var(--mute)] outline-none transition-all ${
                        fieldErrors.username
                          ? "border-rose-500 focus:ring-3 focus:ring-rose-500/20"
                          : "border-[var(--line-strong)] focus:border-[var(--teal)] focus:ring-3 focus:ring-[var(--teal)]/15"
                      }`}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-[11px] text-rose-500 font-bold pl-2 mt-1">{fieldErrors.username}</p>
                  )}
                </div>

                {/* Password Input */}
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
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                      }}
                      placeholder="••••••••"
                      className={`w-full h-12 pl-10 pr-10 rounded-[16px] border bg-[var(--surface-soft)] font-mono font-bold text-sm text-[var(--ink)] tracking-[0.15em] placeholder:text-[var(--mute)] outline-none transition-all ${
                        fieldErrors.password
                          ? "border-rose-500 focus:ring-3 focus:ring-rose-500/20"
                          : "border-[var(--line-strong)] focus:border-[var(--teal)] focus:ring-3 focus:ring-[var(--teal)]/15"
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--teal)] transition-colors p-1.5 rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 font-bold pl-2 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2 ml-1 py-1">
                  <label className="relative flex items-center cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <div
                      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                        remember
                          ? "bg-[var(--teal)] border-[var(--teal)] text-white shadow-xs"
                          : "border-[var(--line-strong)] dark:border-white/20 group-hover:border-[var(--teal)]"
                      }`}
                    >
                      {remember && <Check size={13} strokeWidth={3.5} />}
                    </div>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-[16px] text-xs sm:text-[13px] font-black uppercase tracking-[0.2em] font-sans text-white bg-gradient-to-r from-[var(--teal)] via-[var(--navy)] to-[var(--navy)] hover:opacity-95 shadow-[0_20px_40px_-10px_rgba(3,29,166,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Xác thực truy cập</span>
                      <ChevronRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>

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

      {/* Unit / Facility Selector Modal */}
      <AnimatePresence>
        {showFacilityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[560px] p-8 rounded-[32px] border shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 border-white/40 dark:border-white/10 shadow-[0_30px_60px_rgba(3,29,166,0.2)] max-h-[92vh] flex flex-col"
            >
              {isRedirecting ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-10 h-10 border-4 border-[var(--teal)]/30 border-t-[var(--teal)] rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--teal)] animate-pulse font-mono">
                    Đang nạp phiên làm việc...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center mb-6 shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center mb-3 ring-1 ring-[var(--teal)]/20">
                      <Building2 size={32} className="text-[var(--teal)]" />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--ink)] uppercase tracking-tight font-serif">
                      Xác định đơn vị
                    </h2>
                    <p className="text-[var(--ink-soft)] text-sm font-bold mt-1.5 opacity-70">
                      Tài khoản của bạn đang kiêm nhiệm nhiều cơ sở,<br />vui lòng chọn đơn vị làm việc cho phiên này.
                    </p>
                    <div className="w-full mt-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--teal)] text-center font-mono">
                        Vui lòng chọn cơ sở bên dưới
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[540px] overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {facilities.map((f) => {
                      const isGroup =
                        (f.id || "").toUpperCase().includes("GROUP") ||
                        (f.ten || "").toLowerCase().includes("tập đoàn");

                      const cardStyle = isGroup
                        ? {
                            icon: (
                              <Building2
                                size={20}
                                className="text-amber-500 dark:text-amber-400 group-hover:text-white transition-colors"
                              />
                            ),
                            iconBg:
                              "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 group-hover:from-amber-500 group-hover:to-orange-500 group-hover:border-transparent",
                            badge:
                              "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400",
                            badgeText: "Tập đoàn",
                            hoverClass:
                              "hover:border-amber-500/40 hover:bg-amber-500/[0.02] hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)]",
                            titleHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
                            arrowColor: "text-amber-500",
                          }
                        : {
                            icon: (
                              <Activity
                                size={20}
                                className="text-[var(--teal)] group-hover:text-white transition-colors"
                              />
                            ),
                            iconBg:
                              "bg-gradient-to-br from-[var(--teal)]/10 to-[var(--teal-deep)]/10 border border-[var(--teal)]/20 group-hover:from-[var(--teal)] group-hover:to-[var(--teal-deep)] group-hover:border-transparent",
                            badge:
                              "bg-[var(--teal)]/10 text-[var(--teal-deep)] border border-[var(--teal)]/20 dark:bg-[var(--teal)]/15 dark:text-[var(--teal)]",
                            badgeText: "Bệnh viện",
                            hoverClass:
                              "hover:border-[var(--teal)]/40 hover:bg-[var(--teal)]/[0.02] hover:shadow-[0_20px_40px_-15px_rgba(2,184,169,0.15)]",
                            titleHover: "group-hover:text-[var(--teal-deep)] dark:group-hover:text-[var(--teal)]",
                            arrowColor: "text-[var(--teal)]",
                          };

                      return (
                        <button
                          type="button"
                          key={f.id}
                          disabled={isRedirecting}
                          onClick={() => handleConfirmFacility(f.id)}
                          className={`w-full group flex items-center gap-5 p-5 rounded-[28px] border transition-all duration-300 disabled:opacity-50 cursor-pointer
                             bg-white/50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5 ${cardStyle.hoverClass}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${cardStyle.iconBg}`}
                          >
                            {cardStyle.icon}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p
                              className={`text-[13px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 transition-colors duration-300 ${cardStyle.titleHover}`}
                            >
                              {f.ten}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-[0.12em] ${cardStyle.badge}`}
                              >
                                {cardStyle.badgeText}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`text-[var(--mute)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 shrink-0 ${cardStyle.arrowColor}`}
                            strokeWidth={3}
                          />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

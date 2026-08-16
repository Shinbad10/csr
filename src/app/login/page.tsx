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
  ShieldCheck,
  Activity,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Building2,
} from "lucide-react";
import { getActiveFacilities, setSelectedFacilityCookie } from "./actions";

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
    // Default to light theme unless explicitly set to dark in localStorage
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
          if (facilities.length > 0) {
            setShowFacilityModal(true);
            setIsLoading(false);
          } else {
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="text-[12px] sm:text-[13px] font-bold text-rose-500">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] dark:text-slate-400 ml-1 transition-colors font-mono">
                    <User size={13} className="text-[var(--teal)]" /> Tên đăng nhập / Mã cán bộ
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within:text-[var(--teal)] transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      tabIndex={1}
                      autoComplete="username"
                      className="w-full pl-11 sm:pl-13 pr-5 py-3.5 sm:py-4 border rounded-[16px] sm:rounded-[20px] outline-none transition-all duration-300 font-bold text-sm sm:text-base
                        bg-[var(--surface-soft)] dark:bg-slate-800/40 
                        border-[var(--line-strong)] dark:border-white/10 
                        text-[var(--ink)] dark:text-white
                        focus:bg-white dark:focus:bg-slate-800/60 
                        focus:border-[var(--teal)] 
                        focus:ring-4 focus:ring-[var(--teal)]/10 dark:focus:ring-[var(--teal)]/10"
                      placeholder="VD: admin, mkt01, tvv01..."
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                      }}
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
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--teal)] hover:text-[var(--teal-deep)] hover:underline transition-colors font-mono"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within:text-[var(--teal)] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      tabIndex={2}
                      autoComplete="current-password"
                      className="w-full pl-11 sm:pl-13 pr-12 py-3.5 sm:py-4 border rounded-[16px] sm:rounded-[20px] outline-none transition-all duration-300 font-bold tracking-[0.2em] text-sm sm:text-base
                        bg-[var(--surface-soft)] dark:bg-slate-800/40 
                        border-[var(--line-strong)] dark:border-white/10 
                        text-[var(--ink)] dark:text-white
                        focus:bg-white dark:focus:bg-slate-800/60 
                        focus:border-[var(--teal)] 
                        focus:ring-4 focus:ring-[var(--teal)]/10 dark:focus:ring-[var(--teal)]/10 font-mono"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                      }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--teal)] transition-colors p-2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 font-bold pl-2 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-4 ml-1 py-1">
                  <label className="relative flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      tabIndex={3}
                      className="sr-only"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 border-2 rounded-lg sm:rounded-xl transition-all active:scale-90 flex items-center justify-center ${
                        remember
                          ? "bg-[var(--teal)] border-[var(--teal)]"
                          : "border-[var(--line-strong)] dark:border-white/20 group-hover:border-[var(--teal)]"
                      }`}
                    >
                      <ShieldCheck
                        className={`text-white transition-all duration-300 ${
                          remember ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                        size={13}
                        strokeWidth={4}
                      />
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
                  tabIndex={4}
                  className="w-full group relative overflow-hidden py-4 sm:py-4.5 rounded-[16px] sm:rounded-[20px] font-black text-[12px] sm:text-[13px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all duration-500 disabled:opacity-70
                    bg-gradient-to-r from-[var(--teal)] via-[var(--navy)] to-[var(--navy)] text-white shadow-[0_20px_40px_-10px_rgba(3,29,166,0.4)] hover:shadow-[0_28px_56px_-10px_rgba(3,29,166,0.6)] cursor-pointer"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <div className="w-5 h-5 border-[3px] border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        XÁC THỰC TRUY CẬP{" "}
                        <ChevronRight
                          size={18}
                          className="group-hover:translate-x-2 transition-transform duration-300"
                          strokeWidth={3}
                        />
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
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
              className="relative w-full max-w-[520px] p-8 rounded-[32px] border shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 border-white/40 dark:border-white/10 shadow-[0_30px_60px_rgba(3,29,166,0.2)]"
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
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center mb-4 ring-1 ring-[var(--teal)]/20">
                      <Building2 size={32} className="text-[var(--teal)]" />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--ink)] dark:text-white uppercase tracking-tight font-serif">
                      Xác định cơ sở làm việc
                    </h2>
                    <p className="text-[var(--ink-soft)] dark:text-slate-300 text-sm font-bold mt-2 opacity-80">
                      Tài khoản của bạn có quyền tại nhiều cơ sở, <br />
                      vui lòng chọn đơn vị làm việc cho phiên này.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                    {facilities.map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        disabled={isRedirecting}
                        onClick={() => handleConfirmFacility(f.id)}
                        className="w-full group flex items-center gap-4 p-4 rounded-[22px] border transition-all duration-300 disabled:opacity-50
                          bg-[var(--surface-soft)] dark:bg-slate-800/40 border-[var(--line-strong)] dark:border-white/5 
                          hover:border-[var(--teal)] hover:bg-white dark:hover:bg-slate-800 hover:shadow-md cursor-pointer text-left"
                      >
                        <div className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs bg-gradient-to-br from-[var(--teal)]/10 to-[var(--teal-deep)]/10 border border-[var(--teal)]/20 group-hover:from-[var(--teal)] group-hover:to-[var(--teal-deep)] group-hover:border-transparent shrink-0">
                          <Activity size={18} className="text-[var(--teal)] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black uppercase tracking-wider text-[var(--ink)] dark:text-white transition-colors duration-300 group-hover:text-[var(--teal-deep)] dark:group-hover:text-[var(--teal)]">
                            {f.ten}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-[0.12em] bg-[var(--teal)]/10 text-[var(--teal-deep)] border border-[var(--teal)]/20 dark:bg-[var(--teal)]/15 dark:text-[var(--teal)] font-mono">
                              Cơ sở: {f.id}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-[var(--teal)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 shrink-0"
                          strokeWidth={3}
                        />
                      </button>
                    ))}
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

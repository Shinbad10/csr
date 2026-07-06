"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, User, Eye, EyeOff, Sparkles, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      const newErrors: { username?: string; password?: string } = {};
      if (!username.trim()) newErrors.username = "Tên đăng nhập không được để trống";
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
        } else {
          router.push("/");
          router.refresh();
        }
      } catch {
        setError("Không thể kết nối máy chủ xác thực");
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, isLoading, router]
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--surface-bg)] relative overflow-hidden font-sans p-4 sm:p-6 lg:p-12">
      {/* Subtle Editorial Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_100%_0%,rgba(2,184,169,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_0%_100%,rgba(3,29,166,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left: Branding & Editorial Content (7 cols) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-10 pr-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] flex items-center justify-center shadow-[var(--navy-shadow)] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VISI" className="w-8 h-8 object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[var(--ink)] tracking-tight font-serif">VISI MEDICAL GROUP</span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--teal)] font-mono">
                Khám tầm soát cộng đồng &amp; Tư vấn
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.2] tracking-[-0.025em] text-[var(--ink)] font-serif">
              Sổ ghi nhận bệnh nhân <br />
              <span className="italic font-normal text-[var(--teal)]">điện tử đa cơ sở</span>
            </h1>
            <p className="text-[var(--ink-soft)] font-normal leading-relaxed text-[15px] max-w-lg border-l-2 border-[var(--teal)]/50 pl-5">
              Hệ thống tiếp nhận, theo dõi lâm sàng, tư vấn phẫu thuật và kiểm soát luồng dữ liệu chuyên sâu cho cán bộ y tế tại các cơ sở VISI.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[var(--line)]">
            <div>
              <div className="font-serif text-2xl font-bold text-[var(--navy)] font-mono">100%</div>
              <div className="text-[11px] font-medium text-[var(--mute)] mt-0.5">Số hóa hồ sơ</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-bold text-[var(--navy)] font-mono">Đa cơ sở</div>
              <div className="text-[11px] font-medium text-[var(--mute)] mt-0.5">Đồng bộ liên tục</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-bold text-[var(--teal)] font-mono">Chuẩn HIS</div>
              <div className="text-[11px] font-medium text-[var(--mute)] mt-0.5">Đối chiếu chuẩn xác</div>
            </div>
          </div>
        </div>

        {/* Right: Login Card (5 cols) */}
        <div className="w-full lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[440px] bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-lg)] p-8 sm:p-10 relative overflow-hidden">
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--teal)] to-[var(--navy)]" />

            {/* Mobile Branding */}
            <div className="flex lg:hidden items-center gap-3 mb-8 pb-6 border-b border-[var(--line-soft)]">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] flex items-center justify-center shadow-[var(--navy-shadow)] p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="VISI" className="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <div>
                <div className="font-serif font-bold text-lg text-[var(--ink)]">VISI Medical Group</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--teal)] font-mono">Khám tầm soát cộng đồng</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[var(--teal)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mute)] font-mono">Xác thực quyền</span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--ink)] font-serif">Đăng nhập hệ thống</h2>
              <p className="text-[12.5px] text-[var(--mute)] mt-1">Vui lòng nhập tài khoản cán bộ để tiếp tục.</p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/20 rounded-[var(--r-md)] flex items-center gap-2.5 text-[12.5px] font-semibold text-[var(--rose)] animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--rose)] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)] block font-mono">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    tabIndex={1}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-soft)] border border-[var(--line)] rounded-[var(--r-md)] text-[13.5px] font-medium text-[var(--ink)] outline-none transition-all focus:bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)]"
                    placeholder="VD: admin, bs.nguyenanh..."
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                    }}
                  />
                </div>
                {fieldErrors.username && <p className="text-[11px] text-[var(--rose)] font-medium mt-1">{fieldErrors.username}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)] block font-mono">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-[11px] font-semibold text-[var(--teal)] hover:text-[var(--teal-deep)] hover:underline transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    tabIndex={2}
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--surface-soft)] border border-[var(--line)] rounded-[var(--r-md)] text-[13.5px] font-medium text-[var(--ink)] outline-none transition-all focus:bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] font-mono"
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-[var(--rose)] font-medium mt-1">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    tabIndex={3}
                    className="w-4 h-4 rounded-[4px] border-[var(--line-strong)] text-[var(--navy)] focus:ring-[var(--navy-100)] cursor-pointer"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="text-[12px] font-medium text-[var(--ink-soft)]">Duy trì phiên làm việc</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                tabIndex={4}
                className="w-full mt-2 py-3 px-4 rounded-[var(--r-md)] font-bold text-[13px] uppercase tracking-[0.1em] text-white bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] shadow-[var(--navy-shadow)] hover:shadow-[var(--navy-shadow-hover)] active:scale-[0.99] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác thực truy cập</span>
                    <ChevronRight size={16} className="text-[var(--teal)]" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--line-soft)] flex items-center justify-between text-[11px] text-[var(--mute)] font-mono">
              <span>© 2026 VISI MEDICAL</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
                <span className="uppercase tracking-wider font-semibold text-[var(--ink-soft)]">Hệ thống Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

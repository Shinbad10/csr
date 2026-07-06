"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Lock, User, Eye, EyeOff, ShieldCheck,
  Activity, ChevronRight, Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string, password?: string }>({});

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const newErrors: { username?: string, password?: string } = {};
    if (!username.trim()) newErrors.username = 'Tên đăng nhập không được để trống';
    if (!password.trim()) newErrors.password = 'Mật khẩu không được để trống';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setError('');
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
      setError('Không thể kết nối máy chủ xác thực');
    } finally {
      setIsLoading(false);
    }
  }, [username, password, isLoading, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--surface-bg)] relative overflow-hidden font-sans transition-colors duration-500 p-6">
      {/* Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[var(--teal)]/10 rounded-full blur-[160px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[var(--navy)]/10 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="container max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-24 lg:gap-40 items-center relative z-10">

        {/* Left: Branding Column */}
        <div className="hidden lg:block space-y-12 animate-fade-in">
          <div className="flex items-center gap-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--teal)]/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-20 h-20 rounded-[20px] bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 ring-1 ring-[var(--line)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="VISI" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-[var(--navy)] tracking-tighter font-serif transition-colors duration-500">VISIHUB</span>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--teal)] opacity-90">CRM & Khám Tầm Soát</span>
            </div>
          </div>

          <div className="space-y-8">
            <h1 className="text-5xl xl:text-6xl font-black leading-tight tracking-tight text-[var(--ink)] font-serif transition-colors duration-500">
              Khám tầm soát <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--teal)] to-[var(--teal-deep)] leading-normal">cộng đồng</span>
            </h1>
            <p className="text-[var(--ink-soft)] font-semibold leading-relaxed text-xl border-l-4 border-[var(--teal)]/40 pl-6 max-w-xl transition-colors duration-500">
              Sổ ghi nhận bệnh nhân điện tử đa cơ sở — tiếp nhận, lâm sàng, tư vấn phẫu thuật & theo dõi điều trị chuyên sâu.
            </p>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="w-full flex justify-center lg:justify-end animate-fade-in">
          <div className="relative w-full max-w-[540px]">
            <div className="absolute -inset-10 bg-[var(--navy)]/5 rounded-[60px] blur-3xl opacity-40 transition-colors duration-700"></div>

            <div className="relative backdrop-blur-3xl border p-10 sm:p-14 rounded-[48px] transition-all duration-700 overflow-hidden bg-white/90 border-white/40 shadow-[0_32px_128px_-20px_rgba(3,29,166,0.15)] ring-1 ring-white/60">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--teal)] via-[var(--navy)] to-[var(--teal)] opacity-80"></div>

              <div className="text-center mb-12">
                <div className="inline-flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <Sparkles size={16} className="text-[var(--teal)] animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--teal)]">Identity Access</span>
                  </div>
                  <h2 className="text-4xl font-black text-[var(--ink)] tracking-tight font-serif mb-4 transition-colors duration-500">Chào mừng trở lại</h2>
                  <p className="text-[var(--ink-soft)] font-bold text-sm opacity-70 transition-colors duration-500">Vui lòng đăng nhập để bắt đầu phiên làm việc.</p>
                </div>
              </div>

              {error && (
                <div className="mb-10 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-3 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-[13px] font-bold text-rose-600">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] items-center gap-2.5 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] ml-1 transition-colors">
                    <User size={12} className="text-[var(--teal)]" /> Tên đăng nhập
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within:text-[var(--teal)] transition-colors">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      tabIndex={1}
                      className="w-full pl-14 pr-6 py-5 border rounded-[24px] outline-none transition-all duration-500 font-bold text-base bg-[var(--surface-soft)] border-[var(--line)] text-[var(--ink)] focus:bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[12px] focus:ring-[var(--teal)]/10 shadow-inner-soft"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1 pr-1">
                    <label className="text-[10px] items-center gap-2.5 flex font-black uppercase tracking-[0.2em] text-[var(--mute)] ml-1 transition-colors">
                      <Lock size={12} className="text-[var(--teal)]" /> Mật khẩu truy cập
                    </label>
                    <button type="button" tabIndex={-1} className="text-[10px] font-black uppercase tracking-widest text-[var(--teal)] hover:text-[var(--teal-deep)] hover:underline transition-colors">Quên mật khẩu?</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--mute)] group-focus-within:text-[var(--teal)] transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      tabIndex={2}
                      className="w-full pl-14 pr-14 py-5 border rounded-[24px] outline-none transition-all duration-500 font-bold tracking-[0.3em] text-base bg-[var(--surface-soft)] border-[var(--line)] text-[var(--ink)] focus:bg-[var(--surface)] focus:border-[var(--teal)] focus:ring-[12px] focus:ring-[var(--teal)]/10 shadow-inner-soft"
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
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--teal)] transition-colors p-2"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-1 py-1">
                  <label className="relative flex items-center cursor-pointer group">
                    <input type="checkbox" tabIndex={3} className="sr-only" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <div className={`w-6 h-6 border-2 rounded-xl transition-all active:scale-90 flex items-center justify-center ${remember ? 'bg-[var(--teal)] border-[var(--teal)]' : 'border-[var(--line-strong)] group-hover:border-[var(--teal)]'}`}>
                      <ShieldCheck className={`text-white transition-all duration-300 ${remember ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} size={14} strokeWidth={4} />
                    </div>
                    <span className={`ml-4 text-[11px] font-black uppercase tracking-widest transition-colors ${remember ? 'text-[var(--teal-deep)]' : 'text-[var(--mute)] group-hover:text-[var(--ink)]'}`}>
                      Duy trì đăng nhập
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  tabIndex={4}
                  className="w-full group relative overflow-hidden py-5 rounded-[24px] font-black text-[13px] uppercase tracking-[0.3em] active:scale-[0.98] transition-all duration-700 disabled:opacity-70 bg-gradient-to-r from-[var(--teal)] via-[var(--navy)] to-[var(--navy)] text-white shadow-[0_24px_48px_-12px_rgba(3,29,166,0.5)] hover:shadow-[0_32px_64px_-12px_rgba(3,29,166,0.7)]"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? <div className="w-6 h-6 border-[4px] border-current border-t-transparent rounded-full animate-spin"></div> : <>XÁC THỰC TRUY CẬP <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" strokeWidth={3} /></>}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                </button>
              </form>

              <div className="mt-14 pt-8 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-[10px] font-black text-[var(--mute)] uppercase tracking-widest opacity-70">© 2026 VISIHUB CSR CRM</p>
                <div className="flex items-center gap-3.5">
                  <Activity size={16} className="text-[var(--teal)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--teal)]">System Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

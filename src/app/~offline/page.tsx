"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-bg)] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] flex items-center justify-center mb-6 shadow-lg">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="font-serif text-2xl font-bold text-[var(--ink)] mb-2">
        Mất kết nối mạng
      </h1>
      <p className="text-sm text-[var(--mute)] max-w-sm mb-6">
        Bạn hiện đang ngoại tuyến. Vui lòng kiểm tra kết nối Internet và thử lại.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary px-6 py-2.5"
      >
        Thử lại
      </button>
    </div>
  );
}

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function PasswordUpdated() {
  const navigate = useNavigate();

  // Auto redirect ke signin setelah 5 detik
  useEffect(() => {
    const timer = setTimeout(() => navigate("/signin"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      
      {/* Background Blobs (Identik dengan SignIn & ForgotPassword) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#EC5B13]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/25 rounded-full blur-2xl" />
      </div>

      {/* Card Container (Glassmorphism) */}
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col overflow-hidden">
        
        {/* Header / Logo */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-8 bg-[#EC5B13] rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">domain</span>
            </div>
            <span className="font-bold text-lg text-slate-900">PropShare</span>
          </div>
          
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce-slow">
              <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
            </div>
            <div className="absolute -inset-2 bg-green-400/20 rounded-full blur-xl -z-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
            Password Diperbarui
          </h2>
          <p className="text-slate-500 mt-2 text-xs text-center leading-relaxed px-4">
            Password kamu berhasil diganti. Sekarang kamu bisa masuk kembali ke akun kamu.
          </p>
        </div>

        {/* Action Section */}
        <div className="px-6 pb-8 space-y-4">
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/50 flex items-center gap-3">
             <span className="material-symbols-outlined text-[#EC5B13] text-lg animate-spin">schedule</span>
             <p className="text-[10px] text-slate-500 font-medium">
               Mengalihkan ke halaman login secara otomatis dalam beberapa detik...
             </p>
          </div>

          <Link
            to="/signin"
            className="w-full h-11 flex items-center justify-center gap-2 bg-[#EC5B13] hover:bg-[#d44e0f] text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Masuk Sekarang
          </Link>
        </div>

        {/* Footer Branding */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            PropShare Campus • Security Verified
          </p>
        </div>
      </div>
    </div>
  );
}
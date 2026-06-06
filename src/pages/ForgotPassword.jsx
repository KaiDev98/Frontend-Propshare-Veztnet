import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import PacmanLoader from "../components/PacmanLoader";

const API_URL = "http://localhost:3000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { 
        email: email.trim().toLowerCase() 
      });

      setSent(true);
      setSuccessMsg(`Link reset password telah dikirim ke ${email}.`);
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorMsg("Email tidak terdaftar di sistem kami.");
      } else if (!err.response) {
        setErrorMsg("Tidak dapat terhubung ke server.");
      } else {
        setErrorMsg(err.response?.data?.message || "Gagal mengirim link. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      
      {/* Background (Identik dengan SignIn) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#EC5B13]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/25 rounded-full blur-2xl" />
      </div>

      {/* Card Container (Glassmorphism identik dengan SignIn) */}
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-[#EC5B13] rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <span className="font-bold text-lg text-slate-900">PropShare</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Lupa Password
              </h2>
              <p className="text-slate-500 mt-0.5 text-xs">
                Masukkan email kamu untuk mendapatkan link reset password.
              </p>
            </div>
            <Link
              to="/signin"
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
            </Link>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-6">
          {sent ? (
            /* Success State */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-3xl">mark_email_read</span>
                <p className="text-xs text-green-700 font-medium leading-relaxed">
                  {successMsg} <br /> 
                  <span className="text-[10px] opacity-80">Cek folder inbox atau spam kamu.</span>
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-10 text-xs font-bold text-[#EC5B13] hover:underline"
              >
                Kirim ulang ke email berbeda
              </button>
            </div>
          ) : (
            /* Input State */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Alamat Email</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg group-focus-within:text-[#EC5B13] transition-colors">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                    placeholder="nama@contoh.com"
                    required
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 bg-white/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="w-full px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                  <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#EC5B13] hover:bg-[#d44e0f] text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-80 flex items-center justify-center"
              >
                {loading ? (
                  <PacmanLoader size={28} color="#ffffff" />
                ) : (
                  "Kirim Link Reset"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <Link 
            to="/signin" 
            className="inline-flex items-center gap-1.5 text-xs text-[#EC5B13] font-bold hover:underline transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
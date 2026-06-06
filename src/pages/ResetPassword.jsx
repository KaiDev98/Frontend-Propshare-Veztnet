import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import PacmanLoader from "../components/PacmanLoader";

const API_URL = "http://localhost:3000/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Verifikasi token saat halaman dibuka
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMsg("Link reset tidak valid atau sudah kadaluarsa.");
        setVerifying(false);
        return;
      }
      try {
        await axios.get(`${API_URL}/auth/verify-reset-token?token=${token}`);
        setTokenValid(true);
      } catch {
        setErrorMsg("Link reset tidak valid atau sudah kadaluarsa.");
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword: form.password,
      });
      navigate("/password-updated");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Gagal reset password.");
    } finally {
      setLoading(false);
    }
  };

  const passwordMatch = form.confirmPassword ? form.password === form.confirmPassword : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      
      {/* Background Blobs (Identik dengan SignIn) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#EC5B13]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/25 rounded-full blur-2xl" />
      </div>

      {/* Card Container (Glassmorphism) */}
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-7 pb-4">
          <div className="flex justify-between items-start">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-[#EC5B13] rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                </div>
                <span className="font-bold text-lg text-slate-900">PropShare</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {verifying ? "Verifikasi..." : tokenValid ? "Password Baru" : "Link Error"}
              </h2>
              <p className="text-slate-500 mt-0.5 text-xs">
                {tokenValid ? "Silakan buat password baru kamu." : "Terjadi kendala pada link reset kamu."}
              </p>
            </div>
            <Link to="/signin" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6">
          {verifying ? (
            <div className="py-10 flex flex-col items-center justify-center gap-4">
              <PacmanLoader size={30} color="#EC5B13" />
              <p className="text-xs font-semibold text-slate-500 animate-pulse">Memvalidasi token...</p>
            </div>
          ) : !tokenValid ? (
            /* Error State */
            <div className="space-y-4 py-2 text-center">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                <p className="text-xs text-red-600 font-medium leading-relaxed">{errorMsg}</p>
              </div>
              <Link
                to="/forgot-password"
                className="w-full h-10 flex items-center justify-center rounded-xl bg-[#EC5B13] text-white text-xs font-bold shadow-lg shadow-orange-500/25"
              >
                Minta Link Baru
              </Link>
            </div>
          ) : (
            /* Form Reset */
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Password Baru */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={setField("password")}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 bg-white/70 text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={setField("confirmPassword")}
                    placeholder="Ulangi password baru"
                    required
                    className={`w-full h-10 px-3 pr-10 rounded-lg border bg-white/70 text-sm outline-none transition-all ${
                      passwordMatch === null ? "border-slate-200 focus:ring-[#EC5B13]" 
                      : passwordMatch ? "border-green-400 focus:ring-green-400" 
                      : "border-red-400 focus:ring-red-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                  <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                  <p className="text-[10px] text-red-600 font-bold">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passwordMatch}
                className="w-full h-10 mt-2 rounded-xl bg-[#EC5B13] hover:bg-[#d44e0f] text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                {loading ? <PacmanLoader size={28} color="#ffffff" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <Link to="/signin" className="text-xs text-[#EC5B13] font-bold hover:underline inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import PacmanLoader from "../components/PacmanLoader";

const RUTE_DASHBOARD = {
  INVESTOR: "/investor/dashboard",
  OWNER:    "/owner/proposal",
  TENANT:   "/tenant/dashboard",
  ADMIN:    "/admin/users",
};

// ─── Ikon Google SVG ───────────────────────────────────────────────
const IkonGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ─── Helper: preserve avatar di localStorage setelah login ────────
// Server kadang tidak mengembalikan field avatar → merge dari sesi sebelumnya
const mergeAndSyncUser = (userFromServer) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") ?? "{}");

    // Gunakan avatar dari server jika ada, fallback ke avatar lama
    // (hanya jika email sama = akun yang sama)
    const isSameAccount = existing.email === userFromServer.email;
    const mergedUser = {
      ...userFromServer,
      avatar: userFromServer.avatar
        ?? (isSameAccount ? existing.avatar : null)
        ?? null,
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));
    window.dispatchEvent(new CustomEvent("userUpdated", { detail: mergedUser }));

    return mergedUser;
  } catch {
    return userFromServer;
  }
};

export default function MasukAkun() {
  const navigate               = useNavigate();
  const { login, googleLogin } = useAuth();

  const [lihatPassword, setLihatPassword] = useState(false);
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [pesanError,    setPesanError]    = useState("");
  const [hoverGoogle,   setHoverGoogle]   = useState(false);

  const redirectBerdasarkanRole = (user) => {
    const rute = RUTE_DASHBOARD[user.role] ?? "/";
    navigate(rute, { replace: true });
  };

  // ─── 1. MASUK EMAIL / PASSWORD ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesanError("");
    setLoading(true);

    const hasil = await login(email, password);

    if (hasil.success) {
      // Merge avatar sebelum redirect agar header & sidebar langsung tampil
      const mergedUser = mergeAndSyncUser(hasil.user);
      redirectBerdasarkanRole(mergedUser);
    } else {
      setPesanError(hasil.message);
    }

    setLoading(false);
  };

  // ─── 2. MASUK DENGAN GOOGLE ───────────────────────────────────────
  const handleGoogleMasuk = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setPesanError("");

      const hasil = await googleLogin(tokenResponse.access_token, "INVESTOR");

      if (hasil.success) {
        const mergedUser = mergeAndSyncUser(hasil.user);
        redirectBerdasarkanRole(mergedUser);
      } else {
        setPesanError(hasil.message);
      }

      setLoading(false);
    },
    onError: () => {
      setPesanError("Masuk dengan Google gagal. Coba lagi.");
    },
    flow: "implicit",
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">

      {/* Latar belakang dekoratif */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#EC5B13]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Kartu utama */}
      <div className="w-full max-w-sm bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col overflow-hidden">

        {/* ── Kepala ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-[#EC5B13] rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                </div>
                <span className="font-bold text-lg text-slate-900">PropShare</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang</h2>
              <p className="text-slate-500 mt-0.5 text-xs">Masuk untuk mengelola portofolio kamu</p>
            </div>
            <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
            </Link>
          </div>
        </div>

        {/* ── Formulir ── */}
        <form onSubmit={handleSubmit} className="px-6 pb-5 space-y-3">

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              required
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white/70 text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: "10px" }}
                className="font-semibold text-[#EC5B13] hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <input
                type={lihatPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 bg-white/70 text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setLihatPassword(!lihatPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {lihatPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Pesan error */}
          {pesanError && (
            <div className="w-full px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
              <p className="text-xs text-red-600 font-semibold">{pesanError}</p>
            </div>
          )}

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-[#EC5B13] hover:bg-[#d44e0f] active:scale-[0.98] text-white text-sm font-bold shadow-lg transition-all disabled:opacity-60"
          >
            {loading
              ? <div className="flex justify-center"><PacmanLoader size={18} color="#ffffff" /></div>
              : "Masuk"
            }
          </button>

          {/* Pemisah */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white/80 px-2 text-slate-400 font-bold">Atau lanjutkan dengan</span>
            </div>
          </div>

          {/* ── Tombol Google Kustom ── */}
          <button
            type="button"
            onClick={() => handleGoogleMasuk()}
            disabled={loading}
            onMouseEnter={() => setHoverGoogle(true)}
            onMouseLeave={() => setHoverGoogle(false)}
            style={{
              background: hoverGoogle
                ? "linear-gradient(135deg, #f8f9ff 0%, #eef1ff 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
              boxShadow: hoverGoogle
                ? "0 4px 20px rgba(66, 133, 244, 0.18), 0 1px 4px rgba(0,0,0,0.08)"
                : "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
              borderColor: hoverGoogle ? "#a8c4f8" : "#e2e8f0",
              transform: hoverGoogle ? "translateY(-1px)" : "translateY(0)",
              transition: "all 0.2s ease",
            }}
            className="w-full h-11 rounded-xl border flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <IkonGoogle />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: hoverGoogle ? "#1a3a6b" : "#374151",
                transition: "color 0.2s ease",
                letterSpacing: "0.01em",
              }}
            >
              Lanjutkan dengan Google
            </span>
          </button>

        </form>

        {/* ── Kaki ── */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <p className="text-xs text-slate-500">
            Belum punya akun?{" "}
            <Link to="/signup" className="text-[#EC5B13] font-bold hover:underline ml-1">
              Daftar sekarang
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import PacmanLoader from "../components/PacmanLoader";

const ROLES = ["Investor", "Owner", "Tenant"];

const DESKRIPSI_ROLE = {
  Investor: "Investasikan modal di properti dan dapatkan return",
  Owner:    "Daftarkan properti untuk tokenisasi di platform",
  Tenant:   "Cari dan sewa properti kampus yang nyaman",
};

const RUTE_DASHBOARD = {
  INVESTOR: "/investor/dashboard",
  OWNER:    "/owner/proposal",
  TENANT:   "/tenant/dashboard",
  ADMIN:    "/admin/dashboard",
};

// ─── Ikon Google SVG ──────────────────────────────────────────────────────────
const IkonGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function DaftarAkun() {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();

  const [roleAktif,    setRoleAktif]    = useState("Investor");
  const [lihatPass,    setLihatPass]    = useState(false);
  const [lihatKonfirm, setLihatKonfirm] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [hoverGoogle,  setHoverGoogle]  = useState(false);
  const [pesanError,   setPesanError]   = useState("");
  const [pesanSukses,  setPesanSukses]  = useState("");
  const [setuju,       setSetuju]       = useState(false);

  const [form, setForm] = useState({
    namaLengkap:     "",
    email:           "",
    password:        "",
    konfirmasiPassword: "",
  });

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setPesanError("");
  };

  const redirectBerdasarkanRole = (user) => {
    navigate(RUTE_DASHBOARD[user.role] ?? "/", { replace: true });
  };

  // ─── 1. DAFTAR EMAIL / PASSWORD ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesanError("");
    setPesanSukses("");

    if (!setuju) {
      setPesanError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.");
      return;
    }
    if (form.password !== form.konfirmasiPassword) {
      setPesanError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setPesanError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);

    const hasil = await register(
      form.email.trim().toLowerCase(),
      form.password,
      form.namaLengkap.trim(),
      roleAktif.toUpperCase()
    );

    if (hasil.success) {
      setPesanSukses(`Akun ${roleAktif} berhasil dibuat! Mengalihkan...`);
      setTimeout(() => redirectBerdasarkanRole(hasil.user), 1500);
    } else {
      const pesan = hasil.message ?? "";
      if (pesan.toLowerCase().includes("email")) {
        setPesanError("Email ini sudah terdaftar. Coba masuk atau gunakan email lain.");
      } else {
        setPesanError(pesan || "Gagal membuat akun. Coba lagi.");
      }
    }

    setLoading(false);
  };

  // ─── 2. DAFTAR / MASUK DENGAN GOOGLE ─────────────────────────────────────────
  const handleGoogleDaftar = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setPesanError("");

      const hasil = await googleLogin(tokenResponse.access_token, roleAktif.toUpperCase());

      if (hasil.success) {
        setPesanSukses(`Berhasil masuk sebagai ${hasil.user.role}! Mengalihkan...`);
        setTimeout(() => redirectBerdasarkanRole(hasil.user), 1200);
      } else {
        if (hasil.message?.includes("sudah terdaftar")) {
          setPesanError("Email Google ini sudah terdaftar dengan peran berbeda. Coba masuk.");
        } else {
          setPesanError(hasil.message || "Masuk dengan Google gagal. Coba lagi.");
        }
      }

      setLoading(false);
    },
    onError: () => {
      setPesanError("Masuk dengan Google dibatalkan atau gagal.");
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/25 rounded-full blur-2xl" />
      </div>

      {/* Kartu */}
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 flex flex-col overflow-hidden">

        {/* ── Kepala ── */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-[#EC5B13] rounded-lg flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
              <div>
                <h2 className="text-lg font-bold leading-none text-slate-900">PropShare Campus</h2>
                <p className="text-xs text-slate-400 mt-0.5">Buat akun baru</p>
              </div>
            </div>
            <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
            </Link>
          </div>

          {/* Tab Peran */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setRoleAktif(role); setPesanError(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  roleAktif === role
                    ? "bg-white text-[#EC5B13] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Deskripsi peran */}
          <p className="text-[11px] text-slate-500 text-center mb-4 px-2 leading-relaxed">
            {DESKRIPSI_ROLE[roleAktif]}
          </p>
        </div>

        {/* ── Isi ── */}
        <div className="px-6 pb-2">

          {/* ── Tombol Google Kustom ── */}
          <button
            type="button"
            onClick={() => handleGoogleDaftar()}
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

          {/* Pemisah */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                atau daftar dengan email
              </span>
            </div>
          </div>

          {/* ── Formulir ── */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Nama Lengkap */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                person
              </span>
              <input
                type="text"
                value={form.namaLengkap}
                onChange={setField("namaLengkap")}
                placeholder="Nama lengkap"
                required
                autoComplete="name"
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                placeholder="Alamat email"
                required
                autoComplete="email"
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Kata Sandi */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                lock
              </span>
              <input
                type={lihatPass ? "text" : "password"}
                value={form.password}
                onChange={setField("password")}
                placeholder="Kata sandi"
                required
                autoComplete="new-password"
                className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-200 bg-white/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setLihatPass(!lihatPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {lihatPass ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                lock_reset
              </span>
              <input
                type={lihatKonfirm ? "text" : "password"}
                value={form.konfirmasiPassword}
                onChange={setField("konfirmasiPassword")}
                placeholder="Konfirmasi kata sandi"
                required
                autoComplete="new-password"
                className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-200 bg-white/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setLihatKonfirm(!lihatKonfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {lihatKonfirm ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Indikator kecocokan kata sandi */}
            {form.konfirmasiPassword && (
              <p className={`text-[10px] font-semibold flex items-center gap-1 ${
                form.password === form.konfirmasiPassword ? "text-green-500" : "text-red-400"
              }`}>
                <span className="material-symbols-outlined text-[12px]">
                  {form.password === form.konfirmasiPassword ? "check_circle" : "cancel"}
                </span>
                {form.password === form.konfirmasiPassword
                  ? "Kata sandi cocok"
                  : "Kata sandi tidak cocok"
                }
              </p>
            )}

            {/* Persetujuan Syarat */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={setuju}
                onChange={(e) => { setSetuju(e.target.checked); setPesanError(""); }}
                className="mt-0.5 w-4 h-4 accent-[#EC5B13] shrink-0"
              />
              <span className="text-[11px] text-slate-500 leading-relaxed">
                Saya menyetujui{" "}
                <Link
                  to="/syarat-ketentuan"
                  className="text-[#EC5B13] font-bold hover:underline"
                >
                  Syarat & Ketentuan
                </Link>
                {" "}dan{" "}
                <Link
                  to="/kebijakan-privasi"
                  className="text-[#EC5B13] font-bold hover:underline"
                >
                  Kebijakan Privasi
                </Link>
              </span>
            </label>

            {/* Pesan Error */}
            {pesanError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <span className="material-symbols-outlined text-red-500 text-[16px] shrink-0">error</span>
                <p className="text-xs text-red-600 font-semibold">{pesanError}</p>
              </div>
            )}

            {/* Pesan Sukses */}
            {pesanSukses && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                <span className="material-symbols-outlined text-green-500 text-[16px] shrink-0">check_circle</span>
                <p className="text-xs text-green-600 font-semibold">{pesanSukses}</p>
              </div>
            )}

            {/* Tombol Daftar */}
            <button
              type="submit"
              disabled={loading || !setuju}
              className="w-full h-10 rounded-xl bg-[#EC5B13] hover:bg-[#d44e0f] active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <PacmanLoader size={28} color="#ffffff" />
                </div>
              ) : (
                `Buat Akun ${roleAktif}`
              )}
            </button>
          </form>
        </div>

        {/* ── Kaki ── */}
        <div className="px-6 py-4 mt-2 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <p className="text-xs text-slate-500">
            Sudah punya akun?{" "}
            <Link to="/signin" className="text-[#EC5B13] font-bold hover:underline ml-1">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
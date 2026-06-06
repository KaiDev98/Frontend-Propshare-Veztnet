import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import AdminHeader from "../../components/AdminHeader";   // sesuaikan path
import AdminSidebar from "../../components/AdminSidebar"; // sesuaikan path

export default function EditProfileAdminPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [twoFA,    setTwoFA]    = useState(true);

  /* ── Fetch profile ─────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setFetching(true);
        const res  = await api.get("/auth/profile");
        const data = res.data?.data ?? res.data;
        setForm({
          fullName: data.fullName ?? "",
          email:    data.email    ?? "",
          phone:    data.phone    ?? "",
        });
        setPreview(data.avatar ?? null);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat profil",
          text: err.response?.data?.message ?? "Coba lagi.",
          confirmButtonColor: "#ff6b00",
        });
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      Swal.fire({ icon: "warning", title: "File terlalu besar", text: "Maksimal 800KB.", confirmButtonColor: "#ff6b00" });
      return;
    }
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      Swal.fire({ icon: "warning", title: "Nama tidak boleh kosong", confirmButtonColor: "#ff6b00" });
      return;
    }
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("fullName", form.fullName);
      payload.append("phone",    form.phone);
      if (avatar) payload.append("avatar", avatar);
      await api.patch("/auth/profile", payload, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.fire({ icon: "success", title: "Profil Berhasil Diperbarui!", timer: 1500, showConfirmButton: false });
      navigate(-1);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message ?? "Coba lagi.", confirmButtonColor: "#ff6b00" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () =>
    Swal.fire({
      title: "Ganti Password",
      html: `
        <input id="swal-old" type="password" placeholder="Password lama" class="swal2-input" />
        <input id="swal-new" type="password" placeholder="Password baru" class="swal2-input" />
      `,
      confirmButtonColor: "#ff6b00",
      confirmButtonText: "Simpan",
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: async () => {
        const oldPassword = document.getElementById("swal-old").value;
        const newPassword = document.getElementById("swal-new").value;
        if (!oldPassword || !newPassword) return Swal.showValidationMessage("Isi semua field!");
        try {
          await api.patch("/auth/change-password", { oldPassword, newPassword });
        } catch (err) {
          Swal.showValidationMessage(err.response?.data?.message ?? "Gagal mengubah password");
        }
      },
    }).then((r) =>
      r.isConfirmed &&
      Swal.fire({ icon: "success", title: "Password Berhasil Diubah!", timer: 1500, showConfirmButton: false })
    );

  const initials =
    form.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "SA";

  const inputCls =
    "w-full px-4 py-3 bg-[#f3f4f5] border-0 rounded-xl focus:ring-2 focus:ring-[#ff6b00]/50 outline-none transition-all text-[#191c1d] font-medium text-sm placeholder:text-[#8e7164]";

  /* ── Loading ───────────────────────────────────────────────────────── */
  if (fetching) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fa]">
        <AdminSidebar />
        <div className="ml-64 flex-1 flex flex-col">
          <AdminHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#8e7164]">
              <svg className="animate-spin h-8 w-8 text-[#ff6b00]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium">Memuat profil...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Page ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader />

        {/* Content */}
        <main className="flex-1 p-10 max-w-5xl w-full">

          {/* ── Page Title ───────────────────────────────────────────── */}
          <div className="mb-12">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-[#8e7164] hover:text-[#ff6b00] transition-colors font-medium mb-6"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali
            </button>
            <h2
              className="text-[2.5rem] font-extrabold tracking-tight text-[#191c1d] leading-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Edit Profile
            </h2>
            <p className="text-[#5a4136] text-lg" style={{ fontFamily: "Manrope, sans-serif" }}>
              Kelola pengaturan akun dan preferensi Anda.
            </p>
          </div>

          <div className="space-y-16">

            {/* ── Profile Image ─────────────────────────────────────── */}
            <section className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Foto Profil
                </h3>
                <p className="text-sm text-[#5a4136] leading-relaxed">
                  Ditampilkan di profil dan komunikasi internal Anda.
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#e1e3e4] shadow-lg">
                    {preview ? (
                      <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#ff6b00]/10 text-[#ff6b00] flex items-center justify-center text-3xl font-black">
                        {initials}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-[#ff6b00] text-white rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="cursor-pointer px-6 py-2.5 bg-[#ff6b00] text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95 inline-block">
                    Upload Foto Baru
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <p className="text-xs text-[#636467]">JPG, GIF atau PNG. Maks 800KB</p>
                </div>
              </div>
            </section>

            <div className="border-t border-[#e7e8e9]" />

            {/* ── Personal Information ──────────────────────────────── */}
            <section className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Informasi Personal
                </h3>
                <p className="text-sm text-[#5a4136] leading-relaxed">
                  Perbarui detail kontak dan informasi akun Anda.
                </p>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5a4136] opacity-70">Nama Lengkap</label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nama lengkap" className={inputCls} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5a4136] opacity-70">Email</label>
                  <input
                    type="email" name="email" value={form.email} disabled
                    className="w-full px-4 py-3 bg-[#edeeef] border-0 rounded-xl text-[#8e7164] font-medium text-sm cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-[#8e7164]">Email tidak dapat diubah</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5a4136] opacity-70">Nomor Telepon</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+62 xxx xxxx xxxx" className={inputCls} />
                </div>
              </div>
            </section>

            <div className="border-t border-[#e7e8e9]" />

            {/* ── Security ─────────────────────────────────────────── */}
            <section className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <h3 className="text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Keamanan
                </h3>
                <p className="text-sm text-[#5a4136] leading-relaxed">
                  Kelola kredensial dan perlindungan akun Anda.
                </p>
              </div>

              <div className="flex-1 w-full space-y-4">
                {/* Password */}
                <div className="p-6 bg-[#f3f4f5] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[#a04100]">lock</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1d]">Password Akun</p>
                      <p className="text-xs text-[#5a4136]">Ubah kata sandi Anda</p>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-[#e7e8e9] hover:bg-[#e1e3e4] transition-colors rounded-lg text-sm font-bold text-[#5d5e61]"
                  >
                    Ganti Password
                  </button>
                </div>

                {/* 2FA */}
                <div className="p-6 bg-[#f3f4f5] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[#a04100]">shield</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1d]">Two-Factor Authentication</p>
                      <p className="text-xs text-[#5a4136]">Tambahan keamanan login</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${twoFA ? "text-[#a04100]" : "text-[#8e7164]"}`}>
                      {twoFA ? "Aktif" : "Nonaktif"}
                    </span>
                    <button
                      onClick={() => setTwoFA((p) => !p)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${twoFA ? "bg-[#ff6b00]" : "bg-[#e1e3e4]"}`}
                    >
                      <span className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all duration-200 ${twoFA ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t border-[#e7e8e9]" />

            {/* ── Footer Actions ────────────────────────────────────── */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10">
              <div className="flex items-center gap-2 text-[#5a4136] text-sm">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Informasi Anda dienkripsi dan disimpan dengan aman.</span>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 sm:flex-none px-8 py-3.5 bg-[#e7e8e9] hover:bg-[#e1e3e4] transition-all rounded-xl text-[#5d5e61] font-bold text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-12 py-3.5 bg-gradient-to-br from-[#a04100] to-[#ff6b00] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
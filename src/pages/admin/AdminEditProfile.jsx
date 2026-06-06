import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader  from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

export default function AdminEditProfile() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [user,      setUser]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    phone:    "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          setUser(u);
          setForm({ fullName: u.fullName ?? "", email: u.email ?? "", phone: u.phone ?? "" });
          if (u.avatar) setPreview(u.avatar);
        }
        const res  = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        setUser(data);
        setForm({ fullName: data.fullName ?? "", email: data.email ?? "", phone: data.phone ?? "" });
        if (data.avatar) setPreview(data.avatar);
      } catch {}
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() : "AD";

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) {
      Swal.fire({ icon:"warning", title:"File > 5MB", confirmButtonColor:"#fd9914" });
      return;
    }
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Swal.fire({ icon:"warning", title:"Nama tidak boleh kosong", confirmButtonColor:"#fd9914" });
      return;
    }
    setSaving(true);
    Swal.fire({ title:"Menyimpan...", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    try {
      let avatarUrl = user?.avatar ?? null;
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append("file", photoFile);
          const uploadRes = await api.post("/upload/ipfs", formData, { headers:{"Content-Type":"multipart/form-data"} });
          avatarUrl = uploadRes.data?.url ?? uploadRes.data?.data?.url ?? null;
        } catch { /* lanjut tanpa avatar */ }
      }

      const payload = {
        fullName: form.fullName.trim(),
        phone:    form.phone || null,
        avatar:   avatarUrl,
      };

      await api.put("/auth/users/profile", payload);

      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...payload }));
      setUser(prev => ({ ...prev, ...payload }));
      setPhotoFile(null);

      // Dispatch event agar AdminHeader update
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: { ...stored, ...payload } }));

      await Swal.fire({ icon:"success", title:"Profil Tersimpan! ✅", timer:2000, showConfirmButton:false });
      navigate("/admin/profile");
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal", text:err.response?.data?.message ?? "Coba lagi.", confirmButtonColor:"#fd9914" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5] dark:bg-[#231a0f]">
      <AdminSidebar activeLabel="Admin Profile" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title="Edit Profile" icon="edit" />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-10">

            {/* Page title */}
            <div className="mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-2">
                Edit Profile
              </h2>
              <p className="text-slate-500 text-lg">Kelola pengaturan akun dan preferensi admin.</p>
            </div>

            <div className="space-y-16">

              {/* ── Profile Picture ── */}
              <section className="flex flex-col md:flex-row gap-12 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Profile Image</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Akan ditampilkan di profil dan komunikasi internal.</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 shadow-lg">
                      {preview ? (
                        <img src={preview} alt={user?.fullName} className="w-full h-full object-cover" onError={() => setPreview(null)} />
                      ) : (
                        <div className="w-full h-full bg-[#fd9914]/10 flex items-center justify-center text-[#fd9914] font-black text-4xl">
                          {initials}
                        </div>
                      )}
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-[#fd9914] text-white rounded-full shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => fileRef.current?.click()}
                      className="px-6 py-2.5 bg-[#fd9914] text-white font-bold rounded-xl text-sm hover:bg-[#fd9914]/90 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[#fd9914]/20"
                    >
                      Upload New Photo
                    </button>
                    <p className="text-xs text-slate-500">JPG, PNG. Maks 5MB.</p>
                    {photoFile && <p className="text-xs text-[#fd9914] font-medium">✓ {photoFile.name}</p>}
                  </div>
                </div>
              </section>

              {/* ── Personal Information ── */}
              <section className="flex flex-col md:flex-row gap-12 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Personal Information</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Update kontak dan informasi akun admin.</p>
                </div>

                {loading ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-14" />)}
                  </div>
                ) : (
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                      <input type="text" value={form.fullName}
                        onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:ring-2 focus:ring-[#fd9914]/30 outline-none text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Email — disabled */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                      <input type="email" value={form.email} disabled
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-400 cursor-not-allowed font-medium outline-none"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                      <input type="tel" value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:ring-2 focus:ring-[#fd9914]/30 outline-none text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    {/* Role — readonly */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                      <input type="text" value={user?.role ?? "ADMIN"} disabled
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-400 cursor-not-allowed font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* ── Security ── */}
              <section className="flex flex-col md:flex-row gap-12 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Security</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Kelola kredensial dan keamanan akun.</p>
                </div>
                <div className="flex-1 w-full space-y-4">

                  {/* Password */}
                  <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                        <span className="material-symbols-outlined text-[#fd9914]">lock</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Account Password</p>
                        <p className="text-xs text-slate-500">Perbarui password akun admin</p>
                      </div>
                    </div>
                    <button onClick={handleChangePassword}
                      className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </section>

              {/* ── Footer Actions ── */}
              <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>Informasi Anda dienkripsi dan disimpan dengan aman.</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button onClick={() => navigate("/admin/profile")}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all rounded-xl text-slate-600 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 sm:flex-none px-12 py-3.5 bg-gradient-to-br from-[#fd9914] to-[#e07800] text-white font-bold rounded-xl shadow-lg shadow-[#fd9914]/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                  >
                    {saving
                      ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Menyimpan...</>
                      : "Save Changes"}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import OwnerSidebar from "../../components/OwnerSidebar";

// ── Pinata gateway ─────────────────────────────────────────────────────────────
const PINATA_GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud";

// ── Helpers ────────────────────────────────────────────────────────────────────
const syncLocalStorage = (updatedUser) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    const merged   = { ...existing, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    window.dispatchEvent(new Event("userUpdated"));
    window.dispatchEvent(new Event("userProfileUpdated")); // agar sidebar ikut update
  } catch {}
};

const KYC_BADGE = {
  PENDING:      { label: "Belum Verifikasi", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",       icon: "badge"          },
  UNDER_REVIEW: { label: "Menunggu Review",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "pending_actions" },
  VERIFIED:     { label: "KYC Verified",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "verified_user" },
  REJECTED:     { label: "KYC Rejected",     cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",             icon: "gpp_bad"        },
};

export default function OwnerProfile() {
  const navigate     = useNavigate();
  const fileRef      = useRef(null);
  const kycInputRef  = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // Avatar
  const [preview,         setPreview]         = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError,     setAvatarError]     = useState(null);

  // KYC
  const [kycFile,      setKycFile]      = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycError,     setKycError]     = useState(null);

  const [formData, setFormData] = useState({
    fullName:         "",
    email:            "",
    phone:            "",
    avatar:           "",
    walletAddress:    "",
    emergencyName:    "",
    emergencyPhone:   "",
    emergencyRel:     "",
    listedProperties: 0,
    reputationScore:  0,
    kycStatus:        "PENDING",
    kycDocumentUrl:   "",
  });

  // ── Fetch profile ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res  = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        if (!data) throw new Error("Empty response");
        setFormData(prev => ({ ...prev, ...data }));
        if (data.avatar) setPreview(data.avatar);
        syncLocalStorage(data);
      } catch (err) {
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          if (stored) {
            setFormData(prev => ({ ...prev, ...stored }));
            if (stored.avatar) setPreview(stored.avatar);
          }
        } catch {}
        console.error("Gagal memuat profil:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Avatar: upload ke IPFS → simpan URL ───────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File terlalu besar", text: "Maksimal 10 MB", confirmButtonColor: "#EC5B13" });
      return;
    }

    setAvatarError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/upload/ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid       = uploadRes.data.data.cid;
      const avatarUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      const res  = await api.put("/auth/users/profile", { avatar: avatarUrl });
      const json = res.data;
      if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan");

      const merged = { ...json.data, avatar: avatarUrl };
      setFormData(prev  => ({ ...prev, ...merged }));
      setPreview(avatarUrl);
      syncLocalStorage(merged);

      Swal.fire({
        icon: "success",
        title: "Foto berhasil diperbarui!",
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: "#EC5B13",
      });

    } catch (err) {
      console.error("Avatar upload gagal:", err.message);
      setAvatarError("Gagal mengunggah foto. Coba lagi.");
      setPreview(formData.avatar || null);
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(localPreview);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── KYC Upload ────────────────────────────────────────────────────────────────
  const handleKycSubmit = async () => {
    if (!kycFile) return;
    setKycUploading(true);
    setKycError(null);

    try {
      const fd = new FormData();
      fd.append("file", kycFile);

      const uploadRes = await api.post("/upload/ipfs", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid         = uploadRes.data.data.cid;
      const documentUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      const kycRes = await api.post("/auth/users/kyc", { kycDocumentUrl: documentUrl });
      if (kycRes.data.status !== "success")
        throw new Error(kycRes.data.message || "Gagal menyimpan dokumen KYC");

      const updated = {
        ...formData,
        kycStatus:      "UNDER_REVIEW",
        kycDocumentUrl: documentUrl,
      };
      setFormData(updated);
      syncLocalStorage(updated);
      setKycFile(null);
      if (kycInputRef.current) kycInputRef.current.value = "";

      Swal.fire({
        icon: "success",
        title: "Dokumen Terkirim!",
        text: "Dokumen KYC Anda sedang ditinjau. Biasanya memakan waktu 1×24 jam kerja.",
        confirmButtonColor: "#EC5B13",
        timer: 3000,
        showConfirmButton: false,
      });

    } catch (err) {
      setKycError(err.response?.data?.message || err.message);
    } finally {
      setKycUploading(false);
    }
  };

  // ── Save personal info ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Swal.fire({ icon: "warning", title: "Nama tidak boleh kosong", confirmButtonColor: "#EC5B13" });
      return;
    }

    setSaving(true);
    Swal.fire({ title: "Menyimpan...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res  = await api.put("/auth/users/profile", {
        fullName:       formData.fullName.trim(),
        phone:          formData.phone          || null,
        emergencyName:  formData.emergencyName  || null,
        emergencyPhone: formData.emergencyPhone || null,
        emergencyRel:   formData.emergencyRel   || null,
      });
      const json = res.data;
      if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan");

      setFormData(prev => ({ ...prev, ...json.data }));
      syncLocalStorage(json.data);
      setIsEditing(false);

      await Swal.fire({
        icon: "success",
        title: "Profil berhasil diperbarui!",
        confirmButtonColor: "#EC5B13",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Logout dengan konfirmasi ──────────────────────────────────────────────────
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Akhiri Sesi?",
      text: "Anda akan keluar dari akun PropShare.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EC5B13",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        confirmButton: "rounded-xl font-bold px-6",
        cancelButton:  "rounded-xl font-bold px-6",
      },
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    await Swal.fire({
      title: "Sampai jumpa! 👋",
      text: `Sesi ${formData.fullName || "Owner"} telah diakhiri.`,
      icon: "success",
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl shadow-2xl" },
    });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const kycStatus = formData.kycStatus || "PENDING";
  const kycBadge  = KYC_BADGE[kycStatus] ?? KYC_BADGE.PENDING;

  const avatarSrc = preview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || "Owner")}&background=EC5B13&color=fff&size=256`;

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
        <OwnerSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#EC5B13] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Memuat profil…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">

      {/* ── Sidebar ── */}
      <OwnerSidebar />

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto">

        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Owner Profile</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kelola informasi akun dan verifikasi identitas Anda</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl transition-all border border-red-200 dark:border-red-800"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>

        {/* ── Page Content ── */}
        <div className="max-w-5xl mx-auto px-6 py-8 pb-20">

          {/* ── Profile Header Card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 mb-8 border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-center gap-6">

              {/* Avatar */}
              <div className="relative shrink-0 group">
                <div
                  className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg cursor-pointer"
                  onClick={() => !avatarUploading && fileRef.current?.click()}
                >
                  <img
                    src={avatarSrc}
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || "Owner")}&background=EC5B13&color=fff&size=256`;
                    }}
                  />
                </div>

                {/* Overlay hover / uploading */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center transition-opacity cursor-pointer ${
                    avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={() => !avatarUploading && fileRef.current?.click()}
                >
                  {avatarUploading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white text-[10px] font-bold mt-1">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                      <span className="text-white text-[10px] font-bold mt-0.5">Ganti Foto</span>
                    </>
                  )}
                </div>

                {/* Camera button */}
                <button
                  onClick={() => !avatarUploading && fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-2 -right-2 p-2 bg-[#EC5B13] text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-60 border-2 border-white dark:border-slate-900"
                >
                  {avatarUploading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-sm">photo_camera</span>
                  }
                </button>

                {kycStatus === "VERIFIED" && (
                  <div className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-600 p-1.5 rounded-lg shadow border border-emerald-200">
                    <span className="material-symbols-outlined text-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formData.fullName || "Owner"}
                  </h1>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${kycBadge.cls}`}>
                    {kycBadge.label}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{formData.email}</p>
                <div className="mt-3 flex items-center justify-center md:justify-start gap-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EC5B13]/10 text-[#EC5B13] text-xs font-bold uppercase">
                    Premium Owner
                  </span>
                </div>
                {avatarError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {avatarError}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-600">
                  Klik foto untuk mengganti · JPG, PNG, WEBP · Maks. 10 MB
                </p>
              </div>

              {/* Edit / Save buttons */}
              <div className="flex gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60"
                    >
                      {saving
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-[18px]">save</span>
                      }
                      Simpan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-orange-600 hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ══ LEFT COLUMN ══ */}
            <div className="lg:col-span-1 space-y-6">

              {/* Asset Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-[#EC5B13]">analytics</span>
                  Asset Summary
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Listed Properties</span>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      {formData.listedProperties || 0}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Reputation Score</span>
                      <span className="font-bold text-emerald-500">{formData.reputationScore || 0}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${formData.reputationScore || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#EC5B13]/30 rounded-full -mr-14 -mt-14 blur-3xl" />
                <div className="relative z-10">
                  <span
                    className="material-symbols-outlined text-[#EC5B13] text-3xl mb-3 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    manage_accounts
                  </span>
                  <h3 className="font-bold text-lg mb-4">Account Status</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5">
                      <span className="text-slate-400 text-xs">KYC Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${kycBadge.cls}`}>
                        {kycBadge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5">
                      <span className="text-slate-400 text-xs">Account</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase bg-emerald-900/30 text-emerald-400">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5">
                      <span className="text-slate-400 text-xs">Role</span>
                      <span className="text-xs font-bold text-white capitalize">Owner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div className="lg:col-span-2 space-y-6">

              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-8">
                  <span className="material-symbols-outlined text-[#EC5B13]">person</span>
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    {isEditing ? (
                      <input
                        name="fullName"
                        value={formData.fullName || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-800 text-sm">
                        {formData.fullName || "—"}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-400 font-medium border border-slate-100 dark:border-slate-800 text-sm cursor-not-allowed">
                      {formData.email || "—"}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                    {isEditing ? (
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="+62..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-800 text-sm">
                        {formData.phone || "—"}
                      </div>
                    )}
                  </div>

                  {/* Emergency Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Name</label>
                    {isEditing ? (
                      <input
                        name="emergencyName"
                        value={formData.emergencyName || ""}
                        onChange={handleChange}
                        placeholder="Nama kontak darurat"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-800 text-sm">
                        {formData.emergencyName || "—"}
                      </div>
                    )}
                  </div>

                  {/* Emergency Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Phone</label>
                    {isEditing ? (
                      <input
                        name="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone || ""}
                        onChange={handleChange}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-800 text-sm">
                        {formData.emergencyPhone || "—"}
                      </div>
                    )}
                  </div>

                  {/* Emergency Relation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Relation</label>
                    {isEditing ? (
                      <select
                        name="emergencyRel"
                        value={formData.emergencyRel || "parent"}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                      >
                        <option value="parent">Orang Tua</option>
                        <option value="sibling">Saudara</option>
                        <option value="spouse">Pasangan</option>
                        <option value="friend">Teman</option>
                        <option value="other">Lainnya</option>
                      </select>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-800 text-sm capitalize">
                        {formData.emergencyRel || "—"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet */}
                <div className="mt-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#EC5B13]/10 rounded-xl flex items-center justify-center text-[#EC5B13] shrink-0">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Linked Wallet Address</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        {formData.walletAddress || "No wallet linked"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── KYC Verification ── */}
              <div className={`rounded-2xl p-8 shadow-sm border ${
                kycStatus === "VERIFIED"
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  : kycStatus === "REJECTED"
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
              }`}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
                  <span className={`material-symbols-outlined ${kycStatus === "VERIFIED" ? "text-emerald-500" : "text-[#EC5B13]"}`}>
                    verified_user
                  </span>
                  Verifikasi Identitas (KYC)
                </h2>

                {kycStatus === "VERIFIED" ? (
                  <div className="flex items-start gap-4">
                    <span
                      className="material-symbols-outlined text-5xl text-emerald-500 shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      task_alt
                    </span>
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                        Verifikasi Selesai!
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1 leading-relaxed">
                        Identitas Anda telah terverifikasi. Anda memiliki akses penuh untuk mendaftarkan dan mengelola properti di PropShare.
                      </p>
                    </div>
                  </div>

                ) : kycStatus === "UNDER_REVIEW" ? (
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-5xl text-yellow-500 shrink-0">
                      pending_actions
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-lg">
                        Sedang Ditinjau
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Dokumen Anda sedang ditinjau oleh tim kami. Biasanya memakan waktu 1×24 jam kerja.
                      </p>
                      {formData.kycDocumentUrl && (
                        
                         <a href={formData.kycDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#EC5B13] transition-colors mt-3"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          Lihat dokumen yang dikirim
                        </a>
                      )}
                    </div>
                  </div>

                ) : (
                  <>
                    {kycStatus === "REJECTED" && (
                      <div className="flex items-start gap-3 mb-5 p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <span className="material-symbols-outlined text-red-500 shrink-0">gpp_bad</span>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Dokumen Anda sebelumnya ditolak. Silakan unggah KTP/Paspor yang lebih jelas.
                        </p>
                      </div>
                    )}

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Unggah KTP atau paspor Anda untuk memverifikasi identitas dan membuka akses penuh mendaftarkan properti.
                    </p>

                    {kycError && (
                      <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                        <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                        {kycError}
                      </div>
                    )}

                    {kycFile && (
                      <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="material-symbols-outlined text-[#EC5B13] text-2xl shrink-0">
                            {kycFile.type === "application/pdf" ? "picture_as_pdf" : "image"}
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                              {kycFile.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(kycFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setKycFile(null);
                            setKycError(null);
                            if (kycInputRef.current) kycInputRef.current.value = "";
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      ref={kycInputRef}
                      onChange={(e) => { setKycError(null); setKycFile(e.target.files[0] || null); }}
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      {!kycFile ? (
                        <button
                          onClick={() => kycInputRef.current?.click()}
                          className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[20px]">upload_file</span>
                          Pilih Dokumen (KTP / Paspor)
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleKycSubmit}
                            disabled={kycUploading}
                            className="flex-1 py-3.5 bg-[#EC5B13] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                          >
                            {kycUploading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Mengunggah ke IPFS…
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[20px]">send</span>
                                Kirim untuk Verifikasi
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => kycInputRef.current?.click()}
                            disabled={kycUploading}
                            className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm font-bold hover:underline disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl"
                          >
                            Ganti file
                          </button>
                        </>
                      )}
                    </div>

                    <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-600">
                      Format: JPG, PNG, WEBP, PDF · Maks. 10 MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
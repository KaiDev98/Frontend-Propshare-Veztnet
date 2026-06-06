import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import TenantSidebar from "../../components/TenantSidebar";
import Swal from "sweetalert2";
import { useLang } from "../../hooks/useLang";

// ── Pinata gateway ────────────────────────────────────────────────────────────
const PINATA_GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud";

// ── Helpers ───────────────────────────────────────────────────────────────────
const syncLocalStorage = (updatedUser) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    const merged   = { ...existing, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    window.dispatchEvent(new Event("userUpdated"));
  } catch {}
};

const KYC_BADGE = {
  PENDING:      { label: "Belum Verifikasi", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  UNDER_REVIEW: { label: "Menunggu Review",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  VERIFIED:     { label: "KYC Verified",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  REJECTED:     { label: "KYC Rejected",     cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
  );
}

export default function ProfileTenant() {
  const navigate          = useNavigate();
  const fileRef           = useRef(null);
  const kycInputRef       = useRef(null);
  const { lang, changeLang, t } = useLang();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [user,      setUser]      = useState(null);
  const [preview,   setPreview]   = useState(null);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError,     setAvatarError]     = useState(null);

  // KYC
  const [kycFile,      setKycFile]      = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycError,     setKycError]     = useState(null);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", dateOfBirth: "",
    emergencyName: "", emergencyPhone: "", emergencyRel: "parent",
    notifications: true,
  });

  // ── Fetch profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res  = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        setUser(data);
        setForm(prev => ({
          ...prev,
          fullName:       data.fullName       ?? "",
          email:          data.email          ?? "",
          phone:          data.phone          ?? "",
          dateOfBirth:    data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          emergencyName:  data.emergencyName  ?? "",
          emergencyPhone: data.emergencyPhone ?? "",
          emergencyRel:   data.emergencyRel   ?? "parent",
        }));
        if (data.avatar) setPreview(data.avatar);
        syncLocalStorage(data);
      } catch {
        try {
          const stored = JSON.parse(localStorage.getItem("user"));
          if (stored) {
            setUser(stored);
            setForm(prev => ({
              ...prev,
              fullName: stored.fullName ?? "",
              email:    stored.email    ?? "",
              phone:    stored.phone    ?? "",
            }));
            if (stored.avatar) setPreview(stored.avatar);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "TN";

  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  // ── Avatar: pilih file → upload IPFS → simpan URL ──────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File terlalu besar", text: "Maksimal 10 MB", confirmButtonColor: "#EC5B13" });
      return;
    }

    setAvatarError(null);

    // Preview lokal langsung (optimistic)
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setAvatarUploading(true);

    try {
      // TAHAP 1 — Upload ke Pinata via backend
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/upload/ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid       = uploadRes.data.data.cid;
      const avatarUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      // TAHAP 2 — Simpan URL ke profile
      const res  = await api.put("/auth/users/profile", { avatar: avatarUrl });
      const json = res.data;
      if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan");

      const merged = { ...json.data, avatar: avatarUrl };
      setUser(prev  => ({ ...prev, ...merged }));
      setPreview(avatarUrl);

      // ✅ Sync → TenantHeader & TenantSidebar ikut update
      syncLocalStorage(merged);

      Swal.fire({
        icon: "success",
        title: lang === "en" ? "Photo updated!" : "Foto berhasil diperbarui!",
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: "#EC5B13",
      });

    } catch (err) {
      console.error("Avatar upload gagal:", err.message);
      setAvatarError(lang === "en" ? "Upload failed. Try again." : "Gagal mengunggah foto. Coba lagi.");
      // Kembalikan preview lama
      setPreview(user?.avatar || null);
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(localPreview);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── KYC Upload ────────────────────────────────────────────────────────────
  const handleKycSubmit = async () => {
    if (!kycFile) return;
    setKycUploading(true);
    setKycError(null);

    try {
      // TAHAP 1 — Upload ke Pinata
      const formData = new FormData();
      formData.append("file", kycFile);

      const uploadRes = await api.post("/upload/ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid         = uploadRes.data.data.cid;
      const documentUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      // TAHAP 2 — Simpan ke endpoint KYC
      const kycRes = await api.post("/auth/users/kyc", { kycDocumentUrl: documentUrl });

      if (kycRes.data.status !== "success")
        throw new Error(kycRes.data.message || "Gagal menyimpan dokumen KYC");

      const updatedUser = {
        ...user,
        kycStatus:      "UNDER_REVIEW",
        kycDocumentUrl: documentUrl,
      };
      setUser(updatedUser);
      syncLocalStorage(updatedUser);
      setKycFile(null);
      if (kycInputRef.current) kycInputRef.current.value = "";

      Swal.fire({
        icon: "success",
        title: lang === "en" ? "Document Submitted!" : "Dokumen Terkirim!",
        text:  lang === "en"
          ? "Your KYC document is under review. Usually takes 1×24 working hours."
          : "Dokumen KYC Anda sedang ditinjau. Biasanya memakan waktu 1×24 jam kerja.",
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

  // ── Save personal info (tanpa avatar — avatar sudah auto-save) ─────────────
  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Swal.fire({ icon: "warning", title: "Nama tidak boleh kosong", confirmButtonColor: "#EC5B13" });
      return;
    }
    setSaving(true);
    Swal.fire({ title: t("saving"), allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const payload = {
        fullName:       form.fullName.trim(),
        phone:          form.phone          || null,
        dateOfBirth:    form.dateOfBirth    || null,
        emergencyName:  form.emergencyName  || null,
        emergencyPhone: form.emergencyPhone || null,
        emergencyRel:   form.emergencyRel   || null,
      };

      const res  = await api.put("/auth/users/profile", payload);
      const json = res.data;
      if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan");

      setUser(prev => ({ ...prev, ...json.data }));
      syncLocalStorage(json.data);

      await Swal.fire({
        icon: "success",
        title: t("profileSaved"),
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

  const handleChangeEmail = async () => {
    const { value } = await Swal.fire({
      title: "Ganti Email", input: "email", inputPlaceholder: "Email baru",
      confirmButtonColor: "#EC5B13", cancelButtonColor: "#94a3b8", showCancelButton: true,
    });
    if (!value) return;
    Swal.fire({
      icon: "info",
      title: "Verifikasi Dikirim",
      text: `Link dikirim ke ${value}`,
      confirmButtonColor: "#EC5B13",
    });
  };

  // ── KYC state helpers ─────────────────────────────────────────────────────
  const kycStatus = user?.kycStatus || "PENDING";
  const kycBadge  = KYC_BADGE[kycStatus] ?? { label: kycStatus, cls: "bg-slate-100 text-slate-500" };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Settings" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">

          {/* Top bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#EC5B13] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-semibold text-sm">{t("back")}</span>
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("editProfile")}</h1>
          </div>

          <div className="max-w-4xl mx-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ══ LEFT COLUMN ══ */}
              <div className="lg:col-span-1 space-y-5">

                {/* Avatar Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                  {loading ? (
                    <Skeleton className="w-32 h-32 rounded-full" />
                  ) : (
                    <div className="relative">
                      {/* Avatar image / initials */}
                      <div
                        className="w-32 h-32 rounded-full border-4 border-[#EC5B13]/20 overflow-hidden bg-[#EC5B13]/10 flex items-center justify-center cursor-pointer group"
                        onClick={() => !avatarUploading && fileRef.current?.click()}
                      >
                        {preview ? (
                          <img
                            src={preview}
                            alt={user?.fullName}
                            className="w-full h-full object-cover"
                            onError={() => setPreview(null)}
                          />
                        ) : (
                          <span className="text-[#EC5B13] font-black text-4xl select-none">
                            {initials}
                          </span>
                        )}

                        {/* Hover / uploading overlay */}
                        <div className={`absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center transition-opacity ${
                          avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}>
                          {avatarUploading ? (
                            <>
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-white text-[10px] font-bold mt-1">Uploading…</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                              <span className="text-white text-[10px] font-bold mt-0.5">
                                {lang === "en" ? "Change Photo" : "Ganti Foto"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Camera button */}
                      <button
                        onClick={() => !avatarUploading && fileRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute bottom-0 right-0 p-2 bg-[#EC5B13] text-white rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
                      >
                        {avatarUploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-sm">photo_camera</span>
                        )}
                      </button>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    {loading ? (
                      <>
                        <Skeleton className="h-5 w-32 mx-auto mb-2" />
                        <Skeleton className="h-3 w-24 mx-auto" />
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {user?.fullName ?? "Tenant"}
                        </h2>
                        <p className="text-sm text-slate-500">
                          ID: PSC-{user?.id?.slice(0, 8).toUpperCase() ?? "———"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* KYC badge */}
                  <div className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${kycBadge.cls}`}>
                    <span className="material-symbols-outlined text-sm">
                      {kycStatus === "VERIFIED" ? "verified" : kycStatus === "UNDER_REVIEW" ? "pending" : "badge"}
                    </span>
                    {kycBadge.label}
                  </div>

                  {/* Avatar error */}
                  {avatarError && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 w-full">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {avatarError}
                    </div>
                  )}

                  <button
                    onClick={() => !avatarUploading && fileRef.current?.click()}
                    disabled={avatarUploading}
                    className="mt-5 w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 disabled:opacity-60"
                  >
                    {avatarUploading
                      ? (lang === "en" ? "Uploading…" : "Mengunggah…")
                      : t("changePhoto")}
                  </button>

                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-600">
                    JPG, PNG, WEBP · Maks. 10 MB
                  </p>
                </div>

                {/* Tips */}
                <div className="bg-[#EC5B13]/5 p-4 rounded-xl border border-[#EC5B13]/10">
                  <h3 className="text-xs font-bold text-[#EC5B13] uppercase mb-2">Tips</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t("profileTip")}
                  </p>
                </div>
              </div>

              {/* ══ RIGHT COLUMN ══ */}
              <div className="lg:col-span-2 space-y-6">

                {/* Personal Info */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[#EC5B13]">person</span>
                    {t("personalInfo")}
                  </h3>
                  {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: t("fullName"),    name: "fullName",    type: "text" },
                        { label: t("phoneNumber"), name: "phone",       type: "tel"  },
                        { label: t("dateOfBirth"), name: "dateOfBirth", type: "date" },
                      ].map(f => (
                        <div key={f.name} className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {f.label}
                          </label>
                          <input
                            type={f.type}
                            value={form[f.name]}
                            onChange={handleChange(f.name)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {t("emailAddress")}
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={form.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed pr-20 outline-none"
                          />
                          <button
                            onClick={handleChangeEmail}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#EC5B13] hover:underline"
                          >
                            {lang === "en" ? "Change" : "Ganti"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Emergency Contact */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[#EC5B13]">emergency</span>
                    {t("emergencyContact")}
                  </h3>
                  {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {t("contactName")}
                        </label>
                        <input
                          type="text"
                          value={form.emergencyName}
                          onChange={handleChange("emergencyName")}
                          placeholder={lang === "en" ? "Full name" : "Nama lengkap"}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {t("relationship")}
                        </label>
                        <select
                          value={form.emergencyRel}
                          onChange={handleChange("emergencyRel")}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white"
                        >
                          <option value="parent">{lang === "en" ? "Parent" : "Orang Tua"}</option>
                          <option value="sibling">{lang === "en" ? "Sibling" : "Saudara"}</option>
                          <option value="spouse">{lang === "en" ? "Spouse" : "Pasangan"}</option>
                          <option value="friend">{lang === "en" ? "Friend" : "Teman"}</option>
                          <option value="other">{lang === "en" ? "Other" : "Lainnya"}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {t("contactPhone")}
                        </label>
                        <input
                          type="tel"
                          value={form.emergencyPhone}
                          onChange={handleChange("emergencyPhone")}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* ── KYC Verification ──────────────────────────────────── */}
                <section className={`p-6 rounded-xl border shadow-sm ${
                  kycStatus === "VERIFIED"
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                    : kycStatus === "REJECTED"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}>
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className={`material-symbols-outlined ${
                      kycStatus === "VERIFIED" ? "text-emerald-500" : "text-[#EC5B13]"
                    }`}>
                      verified_user
                    </span>
                    {lang === "en" ? "Identity Verification (KYC)" : "Verifikasi Identitas (KYC)"}
                  </h3>

                  {kycStatus === "VERIFIED" ? (
                    // ── VERIFIED ──────────────────────────────────────────
                    <div className="flex items-start gap-4">
                      <span
                        className="material-symbols-outlined text-4xl text-emerald-500 shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        task_alt
                      </span>
                      <div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">
                          {lang === "en" ? "Verification Complete!" : "Verifikasi Selesai!"}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                          {lang === "en"
                            ? "Your identity has been verified. You have full access to all tenant features."
                            : "Identitas Anda telah terverifikasi. Anda memiliki akses penuh ke semua fitur tenant."}
                        </p>
                      </div>
                    </div>

                  ) : kycStatus === "UNDER_REVIEW" ? (
                    // ── UNDER REVIEW ───────────────────────────────────────
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-4xl text-yellow-500 shrink-0">
                        pending_actions
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {lang === "en" ? "Under Review" : "Sedang Ditinjau"}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {lang === "en"
                            ? "Your document is being reviewed by our team. Usually takes 1×24 working hours."
                            : "Dokumen Anda sedang ditinjau oleh tim kami. Biasanya memakan waktu 1×24 jam kerja."}
                        </p>
                        {user?.kycDocumentUrl && (
                          
                           <a href={user.kycDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#EC5B13] transition-colors mt-3"
                          >
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            {lang === "en" ? "View submitted document" : "Lihat dokumen yang dikirim"}
                          </a>
                        )}
                      </div>
                    </div>

                  ) : (
                    // ── PENDING / REJECTED ─────────────────────────────────
                    <>
                      {kycStatus === "REJECTED" && (
                        <div className="flex items-start gap-3 mb-5 p-3 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <span className="material-symbols-outlined text-red-500 shrink-0">gpp_bad</span>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {lang === "en"
                              ? "Your previous document was rejected. Please upload a clearer ID/Passport."
                              : "Dokumen Anda sebelumnya ditolak. Silakan unggah KTP/Paspor yang lebih jelas."}
                          </p>
                        </div>
                      )}

                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                        {lang === "en"
                          ? "Upload your ID card or passport to verify your identity and unlock full access."
                          : "Unggah KTP atau paspor Anda untuk memverifikasi identitas dan membuka akses penuh."}
                      </p>

                      {/* KYC error */}
                      {kycError && (
                        <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                          {kycError}
                        </div>
                      )}

                      {/* File preview */}
                      {kycFile && (
                        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
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
                            onClick={() => { setKycFile(null); setKycError(null); if (kycInputRef.current) kycInputRef.current.value = ""; }}
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
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <span className="material-symbols-outlined text-[20px]">upload_file</span>
                            {lang === "en" ? "Choose Document (ID / Passport)" : "Pilih Dokumen (KTP / Paspor)"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleKycSubmit}
                              disabled={kycUploading}
                              className="flex-1 py-3 bg-[#EC5B13] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                            >
                              {kycUploading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  {lang === "en" ? "Uploading to IPFS…" : "Mengunggah ke IPFS…"}
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[20px]">send</span>
                                  {lang === "en" ? "Submit for Verification" : "Kirim untuk Verifikasi"}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => kycInputRef.current?.click()}
                              disabled={kycUploading}
                              className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:underline disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl"
                            >
                              {lang === "en" ? "Change file" : "Ganti file"}
                            </button>
                          </>
                        )}
                      </div>

                      <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-600">
                        {lang === "en" ? "Format: JPG, PNG, WEBP, PDF · Max. 10 MB" : "Format: JPG, PNG, WEBP, PDF · Maks. 10 MB"}
                      </p>
                    </>
                  )}
                </section>

                {/* Preferences */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[#EC5B13]">settings</span>
                    {t("accountPreferences")}
                  </h3>
                  <div className="space-y-2">
                    {/* Language */}
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">language</span>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{t("language")}</p>
                          <p className="text-xs text-slate-500">{t("systemLanguage")}</p>
                        </div>
                      </div>
                      <select
                        value={lang}
                        onChange={e => changeLang(e.target.value)}
                        className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 font-bold text-[#EC5B13] outline-none focus:ring-2 focus:ring-[#EC5B13]/20 cursor-pointer"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">notifications_active</span>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{t("notificationsLabel")}</p>
                          <p className="text-xs text-slate-500">{t("emailPushAlerts")}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setForm(prev => ({ ...prev, notifications: !prev.notifications }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.notifications ? "bg-[#EC5B13]" : "bg-slate-300 dark:bg-slate-600"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.notifications ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>

                    {/* Change password */}
                    <div
                      onClick={() => navigate("/forgot-password")}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">lock_reset</span>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{t("changePassword")}</p>
                          <p className="text-xs text-slate-500">{t("updatePassword")}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-[#EC5B13] transition-colors">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </section>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-4 pt-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 rounded-xl bg-[#EC5B13] text-white text-sm font-bold hover:bg-[#d44e0f] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        {t("save")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 mt-8">
            <p className="text-sm text-slate-500">© 2026 PropShare Campus.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-[#EC5B13]">Privacy Policy</a>
              <a href="#" className="text-sm text-slate-500 hover:text-[#EC5B13]">Terms of Service</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
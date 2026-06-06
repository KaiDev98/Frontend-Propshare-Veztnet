import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader from "../../components/InvestorHeader";
import api from "../../utils/api";

const PINATA_GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud";

const syncLocalStorage = (updatedUser) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    const merged   = { ...existing, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    window.dispatchEvent(new Event("userUpdated"));
  } catch {}
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const toInputDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
};

const KYC_BADGE = {
  PENDING:      { label: "Belum Verifikasi", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  UNDER_REVIEW: { label: "Menunggu Review",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  VERIFIED:     { label: "KYC Verified",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  REJECTED:     { label: "KYC Rejected",     cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

function Field({ label, value, mono = false }) {
  return (
    <div>
      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
        {label}
      </label>
      <div
        className={`bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl font-medium text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 ${
          mono ? "font-mono text-sm" : ""
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function EditField({ label, name, value, type = "text", onChange, placeholder = "" }) {
  return (
    <div>
      <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:border-[#EC5B13] focus:ring-2 focus:ring-[#EC5B13]/20 outline-none p-3.5 rounded-xl font-medium text-slate-800 dark:text-slate-100 text-sm transition-all"
      />
    </div>
  );
}

function SectionHeader({ title, editing, onEdit, onCancel, onSave, saving }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h3 className="font-bold text-xl text-slate-900 dark:text-white">{title}</h3>
      {!editing ? (
        <button
          onClick={onEdit}
          className="text-[#EC5B13] font-bold text-sm flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span> Edit
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-slate-500 font-bold text-sm hover:underline">
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            Simpan
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
      <span className="material-symbols-outlined text-[16px]">error</span>
      {message}
    </div>
  );
}

export default function InvestorProfile() {
  const [userData, setUserData]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [editPersonal, setEditPersonal]       = useState(false);
  const [personalDraft, setPersonalDraft]     = useState({});
  const [savingPersonal, setSavingPersonal]   = useState(false);
  const [personalError, setPersonalError]     = useState(null);
  const [personalSuccess, setPersonalSuccess] = useState(false);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]         = useState(null);
  const fileInputRef = useRef(null);

  // KYC
  const [kycFile, setKycFile]           = useState(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycError, setKycError]         = useState(null);
  const kycInputRef = useRef(null);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res  = await api.get("/auth/users/profile");
        const json = res.data;
        if (json.status !== "success") throw new Error(json.message || "Gagal memuat profil");
        setUserData(json.data);
        syncLocalStorage(json.data);
      } catch (err) {
        setFetchError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── PUT profile helper ──────────────────────────────────────────────────────
  const putProfile = async (payload) => {
    const res  = await api.put("/auth/users/profile", payload);
    const json = res.data;
    if (json.status !== "success") throw new Error(json.message || "Gagal menyimpan");
    return json.data;
  };

  // ── Personal info ───────────────────────────────────────────────────────────
  const openEditPersonal = () => {
    setPersonalDraft({
      fullName:    userData.fullName    || "",
      phone:       userData.phone       || "",
      dateOfBirth: toInputDate(userData.dateOfBirth),
    });
    setPersonalError(null);
    setPersonalSuccess(false);
    setEditPersonal(true);
  };

  const savePersonal = async () => {
    setSavingPersonal(true);
    setPersonalError(null);
    try {
      const updated = await putProfile({
        fullName:    personalDraft.fullName    || undefined,
        phone:       personalDraft.phone       || null,
        dateOfBirth: personalDraft.dateOfBirth || null,
      });
      setUserData((p) => ({ ...p, ...updated }));
      syncLocalStorage(updated);
      setEditPersonal(false);
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3500);
    } catch (err) {
      setPersonalError(err.response?.data?.message || err.message);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handlePersonalChange = (e) =>
    setPersonalDraft((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Avatar upload → IPFS → save URL ────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError(null);

    // Tampilkan preview lokal langsung (optimistic)
    const localPreview = URL.createObjectURL(file);
    setUserData((p) => ({ ...p, avatar: localPreview }));
    setAvatarUploading(true);

    try {
      // TAHAP 1 — Upload ke Pinata via backend (sama persis dengan KYC)
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/upload/ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid       = uploadRes.data.data.cid;
      const avatarUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      // TAHAP 2 — Simpan URL ke database via PUT profile
      const updated = await putProfile({ avatar: avatarUrl });

      // Gabungkan hasil backend + pastikan avatar pakai URL Pinata yang baru
      const merged = { ...updated, avatar: avatarUrl };
      setUserData((p) => ({ ...p, ...merged }));

      // ✅ Ini yang membuat InvestorHeader ikut update otomatis
      syncLocalStorage(merged);

    } catch (err) {
      console.error("Avatar upload gagal:", err.message);
      setAvatarError("Gagal mengunggah foto. Coba lagi.");
      // Kembalikan avatar lama jika gagal
      setUserData((p) => ({ ...p, avatar: userData?.avatar || null }));
    } finally {
      setAvatarUploading(false);
      // Revoke object URL agar tidak memory leak
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── KYC Upload ──────────────────────────────────────────────────────────────
  const handleKycSubmit = async () => {
    if (!kycFile) return;
    setKycUploading(true);
    setKycError(null);
    try {
      const formData = new FormData();
      formData.append("file", kycFile);

      const uploadRes = await api.post("/upload/ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.status !== "success")
        throw new Error(uploadRes.data.message || "Gagal mengunggah ke IPFS");

      const cid         = uploadRes.data.data.cid;
      const documentUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

      const kycRes = await api.post("/auth/users/kyc", { kycDocumentUrl: documentUrl });

      if (kycRes.data.status !== "success")
        throw new Error(kycRes.data.message || "Gagal menyimpan dokumen KYC");

      const updatedUser = { ...userData, kycStatus: "UNDER_REVIEW", kycDocumentUrl: documentUrl };
      setUserData(updatedUser);
      syncLocalStorage(updatedUser);
      setKycFile(null);
      if (kycInputRef.current) kycInputRef.current.value = "";
    } catch (err) {
      setKycError(err.response?.data?.message || err.message);
    } finally {
      setKycUploading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
        <InvestorSidebar activeLabel="Settings" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#EC5B13] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Memuat profil…</p>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
        <InvestorSidebar activeLabel="Settings" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-red-400">error</span>
            <p className="text-slate-700 dark:text-slate-300 font-semibold">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </main>
      </div>
    );
  }

  const kycStatus = userData.kycStatus || "PENDING";
  const kycBadge  = KYC_BADGE[kycStatus] ?? { label: kycStatus, cls: "bg-slate-100 text-slate-500" };
  const avatarSrc =
    userData.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=EC5B13&color=fff&size=256`;

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <InvestorSidebar activeLabel="Settings" />

      <main className="flex-1 flex flex-col">
        <InvestorHeader search="" onSearch={() => {}} />

        <div className="p-8 max-w-7xl mx-auto w-full">

          {/* Toast */}
          <div className="space-y-3 mb-2">
            {personalSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-xl text-sm font-semibold animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Informasi pribadi berhasil disimpan.
              </div>
            )}
            {avatarError && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-5 py-3.5 rounded-xl text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {avatarError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ══ LEFT ══ */}
            <div className="col-span-1 lg:col-span-7 space-y-8">

              {/* Profile Header Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

                  {/* Avatar */}
                  <div
                    className="relative shrink-0 group cursor-pointer"
                    onClick={() => !avatarUploading && fileInputRef.current?.click()}
                  >
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-slate-50 dark:border-slate-800">
                      <img
                        alt={userData.fullName}
                        src={avatarSrc}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Hover / uploading overlay */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center transition-opacity ${
                        avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {avatarUploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-white text-[10px] font-bold mt-1">Uploading…</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                          <span className="text-white text-[10px] font-bold">Ganti Foto</span>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />

                    {kycStatus === "VERIFIED" && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-100 text-emerald-600 p-1.5 rounded-lg shadow-lg border border-emerald-200">
                        <span
                          className="material-symbols-outlined text-sm block"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {userData.fullName}
                      </h2>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${kycBadge.cls}`}>
                        {kycBadge.label}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{userData.email}</p>

                    {userData.isSuspended && (
                      <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="material-symbols-outlined text-[14px]">block</span>
                        Account Suspended
                      </div>
                    )}

                    <div className="flex justify-center sm:justify-start gap-8">
                      <div className="text-sm">
                        <span className="block text-slate-400 text-[10px] uppercase tracking-widest mb-1">Member Since</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(userData.createdAt)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="block text-slate-400 text-[10px] uppercase tracking-widest mb-1">Role</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{userData.role}</span>
                      </div>
                    </div>

                    {/* Label hint */}
                    <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-600">
                      Klik foto untuk mengganti · JPG, PNG, WEBP · Maks. 10 MB
                    </p>
                  </div>
                </div>
              </section>

              {/* Personal Information Card */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <SectionHeader
                  title="Personal Information"
                  editing={editPersonal}
                  onEdit={openEditPersonal}
                  onCancel={() => setEditPersonal(false)}
                  onSave={savePersonal}
                  saving={savingPersonal}
                />
                <ErrorBanner message={personalError} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {editPersonal ? (
                    <>
                      <EditField label="Full Name" name="fullName" value={personalDraft.fullName} onChange={handlePersonalChange} />
                      <Field label="Email Address" value={userData.email} />
                      <EditField label="Phone Number" name="phone" value={personalDraft.phone} onChange={handlePersonalChange} placeholder="+62..." type="tel" />
                      <EditField label="Date of Birth" name="dateOfBirth" value={personalDraft.dateOfBirth} onChange={handlePersonalChange} type="date" />
                    </>
                  ) : (
                    <>
                      <Field label="Full Name"     value={userData.fullName} />
                      <Field label="Email Address" value={userData.email} />
                      <Field label="Phone Number"  value={userData.phone} />
                      <Field label="Date of Birth" value={formatDate(userData.dateOfBirth)} />
                    </>
                  )}
                </div>
              </section>
            </div>

            {/* ══ RIGHT ══ */}
            <div className="col-span-1 lg:col-span-5 space-y-8">

              {/* Dynamic KYC Card */}
              {kycStatus === "VERIFIED" ? (
                <section className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-8 shadow-sm border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <h3 className="font-bold text-2xl text-emerald-700 dark:text-emerald-400 mb-1">Verification Complete</h3>
                  <p className="text-emerald-600 dark:text-emerald-500 font-semibold mb-4">KYC Approved!</p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200/70 leading-relaxed">
                    Welcome to PropShare, <b>{userData.fullName}</b>. You are now authorized to invest in premium real estate assets.
                  </p>
                </section>

              ) : kycStatus === "UNDER_REVIEW" ? (
                <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                  <span className="material-symbols-outlined text-5xl mb-4 text-yellow-500">pending_actions</span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Menunggu Verifikasi Admin</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Dokumen Anda berhasil dikirim dan sedang ditinjau. Proses ini biasanya memakan waktu 1x24 jam kerja.
                  </p>
                  {userData.kycDocumentUrl && (
                    <a href={userData.kycDocumentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-[#EC5B13] transition-colors mb-6">
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      Lihat dokumen yang dikirim
                    </a>
                  )}
                  <button disabled className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                    Sedang Diproses...
                  </button>
                </section>

              ) : (
                <section className={`rounded-2xl p-8 shadow-sm border text-center ${
                  kycStatus === "REJECTED"
                    ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}>
                  <span className={`material-symbols-outlined text-5xl mb-4 ${kycStatus === "REJECTED" ? "text-red-500" : "text-[#EC5B13]"}`}>
                    {kycStatus === "REJECTED" ? "gpp_bad" : "id_card"}
                  </span>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                    {kycStatus === "REJECTED" ? "Verifikasi Ditolak" : "Verifikasi Identitas"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {kycStatus === "REJECTED"
                      ? "Dokumen yang Anda unggah sebelumnya ditolak. Silakan unggah ulang KTP/Paspor Anda yang lebih jelas."
                      : "Unggah dokumen identitas Anda (KTP/Paspor) untuk membuka akses investasi penuh di PropShare."}
                  </p>
                  {kycError && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-left">
                      <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                      {kycError}
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" ref={kycInputRef}
                    onChange={(e) => { setKycError(null); setKycFile(e.target.files[0] || null); }} />
                  {kycFile && (
                    <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-[#EC5B13] text-2xl shrink-0">
                          {kycFile.type === "application/pdf" ? "picture_as_pdf" : "image"}
                        </span>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{kycFile.name}</p>
                          <p className="text-xs text-slate-500">{(kycFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => { setKycFile(null); setKycError(null); if (kycInputRef.current) kycInputRef.current.value = ""; }}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {!kycFile ? (
                      <button onClick={() => kycInputRef.current?.click()}
                        className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        Pilih Dokumen (KTP / Paspor)
                      </button>
                    ) : (
                      <>
                        <button onClick={handleKycSubmit} disabled={kycUploading}
                          className="w-full py-3.5 bg-[#EC5B13] hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                          {kycUploading ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Mengunggah ke IPFS…</>
                          ) : (
                            <><span className="material-symbols-outlined text-[20px]">send</span>Kirim untuk Verifikasi</>
                          )}
                        </button>
                        <button onClick={() => kycInputRef.current?.click()} disabled={kycUploading}
                          className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-sm font-medium hover:underline disabled:opacity-50">
                          Ganti dokumen
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-600">
                    Format: JPG, PNG, WEBP, PDF · Maks. 10 MB
                  </p>
                </section>
              )}

              {/* Account Status Card */}
              <section className="bg-slate-900 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EC5B13]/30 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 inline-block ${kycBadge.cls}`}>
                        {kycBadge.label}
                      </span>
                      <h3 className="font-bold text-2xl">Account Status</h3>
                    </div>
                    <span className="material-symbols-outlined text-[#EC5B13] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      manage_accounts
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                      <span className="text-slate-400 text-sm">KYC Status</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${kycBadge.cls}`}>{kycBadge.label}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                      <span className="text-slate-400 text-sm">Account</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${userData.isSuspended ? "bg-red-900/40 text-red-400" : "bg-emerald-900/30 text-emerald-400"}`}>
                        {userData.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                      <span className="text-slate-400 text-sm">Role</span>
                      <span className="text-sm font-bold text-white capitalize">{userData.role}</span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
        <div className="h-12" />
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";
import LegalDocuments from "./steps/LegalDocuments";
import PhotosMedia from "./steps/PhotosMedia";
import FinancialGoals from "./steps/FinancialGoals";
import LocationPicker from "../../components/LocationPicker";
import api from "../../utils/api";
import Swal from "sweetalert2";

const STEPS = [
  { number: 1, label: "Property Details" },
  { number: 2, label: "Legal Documents" },
  { number: 3, label: "Photos & Media" },
  { number: 4, label: "Financial Goals" },
];

const PROPERTY_TYPES = [
  "Apartment / Dormitory",
  "Commercial / Retail",
  "Industrial",
  "Residential Land",
];

const FACILITY_OPTIONS = [
  "AC", "WiFi", "Kasur", "Lemari", "Kamar Mandi Dalam",
  "Dapur Bersama", "Parkir Motor", "Parkir Mobil", "CCTV", "Laundry",
];

export default function NewProperty() {
  const navigate = useNavigate();
  const [activeStep,   setActiveStep]   = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [walletAddress, setWalletAddress] = useState(null);

  const [form, setForm] = useState({
    name:          "",
    location:      "",
    latitude:      null,
    longitude:     null,
    description:   "",
    units:         "",
    pricePerMonth: "",
    facilities:    [],
    type:          "Apartment / Dormitory",
    ipfsLegalDoc:  "",
    imageUrls:     [],
    fundingTarget: "",
    tokenPrice:    "",
    totalTokens:   "",
  });

  // ─── Load wallet dari localStorage ───────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (stored.walletAddress) setWalletAddress(stored.walletAddress);
    } catch {}
  }, []);

  // ─── Connect MetaMask ─────────────────────────────────────────────────────────
  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      Swal.fire({
        icon:  "error",
        title: "MetaMask Tidak Ditemukan",
        html:  `Install MetaMask dulu. <a href="https://metamask.io/download/" target="_blank" style="color:#EC5B13;font-weight:bold">Download →</a>`,
        confirmButtonColor: "#EC5B13",
      });
      return;
    }
    try {
      Swal.fire({ title: "Menghubungkan MetaMask...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address  = accounts[0];

      await api.patch("/auth/users/wallet", { walletAddress: address });

      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, walletAddress: address }));
      setWalletAddress(address);

      Swal.fire({
        icon:  "success",
        title: "Wallet Terhubung! ✅",
        html:  `<span style="font-family:monospace;font-size:13px">${address.slice(0,8)}...${address.slice(-6)}</span>`,
        confirmButtonColor: "#EC5B13",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon:  "error",
        title: err.code === 4001 ? "Koneksi Ditolak" : "Gagal",
        text:  err.code === 4001 ? "Kamu menolak koneksi MetaMask." : err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    }
  };

  const CHECKLIST = [
    { label: "Profile Verified",          done: true },
    { label: "Wallet MetaMask Connected", done: !!walletAddress },
    { label: "Koordinat GPS Tersimpan",   done: !!(form.latitude && form.longitude) },
    { label: "Legal Docs Hash (SHA-256)", done: !!form.ipfsLegalDoc },
    { label: "ERC-3643 Compliance Check", done: activeStep >= 4 },
  ];

  // ─── Handle Change dengan guard maksimal 20 kamar ────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "units") {
      const parsed = parseInt(value);
      if (!isNaN(parsed) && parsed > 20) return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateForm = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  const toggleFacility = (fac) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(fac)
        ? prev.facilities.filter((f) => f !== fac)
        : [...prev.facilities, fac],
    }));
  };

  const validateStep = () => {
    if (activeStep === 1) {
      if (!form.name.trim())        return "Nama properti wajib diisi";
      if (!form.location.trim())    return "Lokasi wajib diisi";
      if (!form.description.trim()) return "Deskripsi wajib diisi";
      if (!form.latitude || !form.longitude)
        return "Silakan pilih lokasi di peta agar koordinat GPS tersimpan";
      if (!form.units || parseInt(form.units) < 1)
        return "Jumlah kamar wajib diisi (minimal 1)";
      if (parseInt(form.units) > 20)
        return "Jumlah kamar maksimal 20 kamar";
      if (!form.pricePerMonth || parseFloat(form.pricePerMonth) <= 0)
        return "Harga sewa per kamar wajib diisi";
    }
    if (activeStep === 4) {
      if (!form.fundingTarget) return "Target funding wajib diisi";
      if (!form.tokenPrice)    return "Harga token wajib diisi";
      if (!form.totalTokens)   return "Jumlah token wajib diisi";
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { setSubmitError(error); return; }
    setSubmitError("");
    setActiveStep((s) => s + 1);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const error = validateStep();
    if (error) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: error, confirmButtonColor: "#EC5B13" });
      return;
    }

    // ── Wajib connect wallet sebelum submit ──────────────────────────────────
    if (!walletAddress) {
      const ok = await Swal.fire({
        icon:  "warning",
        title: "Wallet Belum Terhubung!",
        html:  `<div style="font-size:13px;color:#64748b;line-height:1.8">
          Wallet MetaMask wajib terhubung agar properti bisa didaftarkan ke blockchain saat admin approve.<br/><br/>
          <div style="background:#fef9f6;padding:10px;border-radius:8px;border:1px solid #fed7aa;font-size:11px;color:#9a3412">
            ⚠️ Tanpa wallet, dana investasi tidak bisa dicairkan ke akun kamu.
          </div>
        </div>`,
        showCancelButton:   true,
        confirmButtonColor: "#EC5B13",
        cancelButtonColor:  "#94a3b8",
        confirmButtonText:  "Hubungkan MetaMask Sekarang",
        cancelButtonText:   "Nanti Saja",
      });
      if (ok.isConfirmed) await handleConnectWallet();
      return;
    }

    const confirm = await Swal.fire({
      icon:  "question",
      title: "Ajukan Proposal?",
      html:  `<div style="text-align:left;font-size:14px;color:#64748b;line-height:2">
        <b style="color:#0f172a">Ringkasan Proposal:</b><br/>
        📍 <b>${form.name}</b> — ${form.location}<br/>
        🌐 Koordinat: <b>${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}</b><br/>
        🛏️ Kamar: <b>${form.units} kamar</b> @ Rp ${Number(form.pricePerMonth).toLocaleString("id-ID")}/bulan<br/>
        💰 Target: <b>Rp ${Number(form.fundingTarget).toLocaleString("id-ID")}</b><br/>
        🪙 Token: <b>${Number(form.totalTokens).toLocaleString()} token</b> @ Rp ${Number(form.tokenPrice).toLocaleString()}<br/>
        🖼️ Foto: <b>${form.imageUrls.length} gambar</b><br/>
        👛 Wallet: <b style="font-family:monospace;font-size:11px">${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}</b>
      </div>`,
      showCancelButton:   true,
      confirmButtonColor: "#EC5B13",
      cancelButtonColor:  "#94a3b8",
      confirmButtonText:  "Ya, Ajukan Sekarang!",
      cancelButtonText:   "Cek Lagi Dulu",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Menyimpan Proposal...",
      html:  "Sedang mengirim data ke blockchain & database",
      allowOutsideClick: false,
      allowEscapeKey:    false,
      didOpen: () => Swal.showLoading(),
    });

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Step A — Buat properti
      const propertyRes = await api.post("/properties", {
        title:         form.name,
        description:   form.description,
        location:      form.location,
        latitude:      form.latitude,
        longitude:     form.longitude,
        category:      form.type,
        fundingTarget: parseFloat(form.fundingTarget),
        tokenPrice:    parseFloat(form.tokenPrice),
        totalTokens:   parseInt(form.totalTokens),
        ipfsLegalDoc:  form.ipfsLegalDoc || null,
      });

      const propertyId = propertyRes.data.data.id;

      // Step B — Buat kamar
      const totalKamar  = parseInt(form.units);
      const roomPromises = [];
      for (let i = 1; i <= totalKamar; i++) {
        roomPromises.push(
          api.post("/rooms", {
            propertyId,
            roomNumber:    `K-${String(i).padStart(2, "0")}`,
            pricePerMonth: parseFloat(form.pricePerMonth),
            isAvailable:   true,
            facilities:    form.facilities,
          })
        );
      }
      await Promise.all(roomPromises);

      // Step C — Upload gambar
      if (form.imageUrls.length > 0) {
        await api.post(`/properties/${propertyId}/images`, { urls: form.imageUrls });
      }

      await Swal.fire({
        icon:  "success",
        title: "Proposal Berhasil Diajukan! 🎉",
        html:  `<div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
          Proposal <b style="color:#EC5B13">${form.name}</b> sedang menunggu verifikasi admin.<br/><br/>
          <div style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0">
            ✅ Data properti tersimpan<br/>
            ✅ Koordinat GPS: ${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}<br/>
            ✅ ${totalKamar} kamar dibuat<br/>
            ✅ ${form.imageUrls.length} foto terupload<br/>
            ✅ Wallet: ${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}<br/>
            ⏳ Menunggu verifikasi admin (maks. 2x24 jam)
          </div>
        </div>`,
        confirmButtonColor: "#EC5B13",
        confirmButtonText:  "Lihat Dashboard",
      });

      navigate("/owner/proposal");

    } catch (err) {
      console.error("Submit error:", err);
      const status  = err.response?.status;
      const message = err.response?.data?.message || "";
      let title   = "Gagal Mengajukan Proposal";
      let htmlMsg = "";

      if (!navigator.onLine)   { title = "Tidak Ada Koneksi Internet"; htmlMsg = "Periksa koneksi internet kamu."; }
      else if (status === 401) { title = "Sesi Login Habis";           htmlMsg = "Silakan login ulang."; }
      else if (status === 403) { title = "Akses Ditolak";              htmlMsg = "Akun kamu tidak memiliki izin sebagai Owner."; }
      else if (status === 400) { title = "Data Tidak Valid";           htmlMsg = `Field bermasalah: <b>${message}</b>`; }
      else if (status === 500) { title = "Kesalahan Server";           htmlMsg = "Server sedang bermasalah. Coba lagi."; }
      else                     { htmlMsg = message || "Terjadi kesalahan yang tidak diketahui."; }

      Swal.fire({
        icon: "error", title,
        html: `<div style="font-size:13px;color:#64748b">${htmlMsg}</div>`,
        confirmButtonColor: "#EC5B13",
      });
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Manajemen Proposal RWA" />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-6">
          <button
            onClick={() => navigate("/owner/proposal")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#EC5B13] transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Create New Property Proposal
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Tokenize your real-world assets and start raising funds on-chain.
          </p>
        </header>

        {/* ── Wallet Banner ── */}
        {!walletAddress ? (
          <div className="max-w-4xl mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500">link_off</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  Wallet MetaMask Belum Terhubung
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Hubungkan wallet sebelum submit agar properti bisa didaftarkan ke blockchain
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectWallet}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Hubungkan Sekarang
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-500">verified</span>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-400">Wallet Terhubung ✅</p>
              <p className="text-xs font-mono text-green-600 dark:text-green-500">
                {walletAddress.slice(0,8)}...{walletAddress.slice(-6)}
              </p>
            </div>
            <button
              onClick={handleConnectWallet}
              className="ml-auto text-xs text-slate-400 hover:text-[#EC5B13] transition-colors"
              title="Ganti wallet"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </button>
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center gap-8 mb-12 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {STEPS.map((step) => {
            const isActive = activeStep === step.number;
            const isDone   = activeStep > step.number;
            return (
              <button
                key={step.number}
                onClick={() => isDone && setActiveStep(step.number)}
                className={`pb-4 border-b-2 flex items-center gap-2 whitespace-nowrap font-semibold transition-all ${
                  isActive ? "border-[#EC5B13] text-[#EC5B13] font-bold"
                  : isDone ? "border-emerald-500 text-emerald-500 cursor-pointer"
                           : "border-transparent text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className={`flex items-center justify-center size-6 rounded-full text-[10px] font-bold ${
                  isDone    ? "bg-emerald-500 text-white"
                  : isActive ? "bg-[#EC5B13] text-white"
                             : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}>
                  {isDone
                    ? <span className="material-symbols-outlined text-[14px]">check</span>
                    : step.number}
                </span>
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="max-w-4xl bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Step {activeStep}: {STEPS[activeStep - 1].label}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {activeStep === 1 && "Provide the fundamental information about your asset."}
              {activeStep === 2 && "Upload required legal documents for on-chain verification."}
              {activeStep === 3 && "Upload photos and media for your property listing."}
              {activeStep === 4 && "Define your funding goals and token distribution."}
            </p>
          </div>

          {/* ── Step 1 ── */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Property Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Sunset Heights Student Dormitory"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Lokasi Properti <span className="text-red-400">*</span>
                  {form.latitude && form.longitude && (
                    <span className="ml-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ GPS tersimpan
                    </span>
                  )}
                </label>
                <LocationPicker
                  value={{ location: form.location, latitude: form.latitude, longitude: form.longitude }}
                  onChange={(fields) => updateForm(fields)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  rows={4} placeholder="Tell potential investors about the property..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Jumlah Kamar <span className="text-red-400">*</span>
                  <span className="ml-2 text-xs font-normal text-slate-400">(maks. 20 kamar)</span>
                </label>
                <input
                  type="number" name="units" value={form.units} onChange={handleChange}
                  placeholder="0" min="1" max="20"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {form.units && parseInt(form.units) >= 20 && (
                  <p className="text-xs text-amber-500 mt-1 font-semibold">
                    ⚠️ Jumlah kamar telah mencapai batas maksimal (20 kamar)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Property Type
                </label>
                <select
                  name="type" value={form.type} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all appearance-none text-slate-900 dark:text-white"
                >
                  {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Harga Sewa Per Kamar / Bulan <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">Rp</span>
                  <input
                    type="number" name="pricePerMonth" value={form.pricePerMonth} onChange={handleChange}
                    placeholder="0" min="0"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                {form.pricePerMonth && (
                  <p className="text-xs text-slate-400 mt-1">
                    = Rp {Number(form.pricePerMonth).toLocaleString("id-ID")} / bulan per kamar
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Fasilitas Kamar
                  <span className="ml-2 text-xs font-normal text-slate-400">(opsional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FACILITY_OPTIONS.map((fac) => {
                    const selected = form.facilities.includes(fac);
                    return (
                      <button
                        key={fac} type="button" onClick={() => toggleFacility(fac)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected
                            ? "bg-[#EC5B13] border-[#EC5B13] text-white shadow-sm"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#EC5B13] hover:text-[#EC5B13]"
                        }`}
                      >
                        {selected && "✓ "}{fac}
                      </button>
                    );
                  })}
                </div>
                {form.facilities.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    {form.facilities.length} fasilitas: {form.facilities.join(", ")}
                  </p>
                )}
              </div>

              {form.units && parseInt(form.units) > 0 && (
                <div className="col-span-2 p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl">
                  <p className="text-xs font-bold text-[#EC5B13] mb-1">Preview Kamar</p>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-20 overflow-y-auto">
                    {Array.from({ length: Math.min(parseInt(form.units), 20) }, (_, i) => (
                      <span key={i} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                        K-{String(i + 1).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Total <b>{Math.min(parseInt(form.units), 20)} kamar</b> akan otomatis terdaftar di Manajemen Hunian.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <LegalDocuments value={form.ipfsLegalDoc} onChange={(cid) => updateForm({ ipfsLegalDoc: cid })} />
          )}
          {activeStep === 3 && (
            <PhotosMedia value={form.imageUrls} onChange={(urls) => updateForm({ imageUrls: urls })} />
          )}
          {activeStep === 4 && (
            <FinancialGoals
              values={{ fundingTarget: form.fundingTarget, tokenPrice: form.tokenPrice, totalTokens: form.totalTokens }}
              onChange={(fields) => updateForm(fields)}
            />
          )}

          {submitError && (
            <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
              <p className="text-sm text-red-600 font-semibold">{submitError}</p>
            </div>
          )}

          <div className="mt-10 p-4 rounded-xl bg-slate-900 text-white flex items-start gap-4">
            <span className="material-symbols-outlined text-[#EC5B13] mt-0.5">security</span>
            <div>
              <h4 className="text-sm font-bold">Secure Data Storage</h4>
              <p className="text-xs text-slate-400 mt-1">
                All sensitive information and property details are stored with military-grade IPFS encryption.
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-between gap-4">
            <button
              onClick={() => activeStep > 1 && setActiveStep((s) => s - 1)}
              disabled={activeStep === 1}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {activeStep === 1 ? "Back" : `Back to Step ${activeStep - 1}`}
            </button>

            <div className="flex gap-3">
              {activeStep === STEPS.length ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-[#EC5B13] text-white font-bold shadow-lg shadow-[#EC5B13]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {isSubmitting
                    ? <><span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>Submitting...</>
                    : <>Submit Proposal<span className="material-symbols-outlined text-[18px]">send</span></>}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-xl bg-[#EC5B13] text-white font-bold shadow-lg shadow-[#EC5B13]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  Continue to Step {activeStep + 1}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Preview + Checklist */}
        <div className="mt-12 max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-4">preview</span>
            <h4 className="font-bold text-slate-400">Proposal Preview</h4>
            <p className="text-sm text-slate-400 max-w-xs mt-1">Your progress will be reflected here in real-time.</p>
            {form.name && (
              <div className="mt-4 w-full text-left bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{form.name}</p>
                {form.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>{form.location}
                  </p>
                )}
                {form.latitude && form.longitude && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[13px]">my_location</span>
                    {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </p>
                )}
                {form.description && <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>}
                <div className="flex gap-2 flex-wrap text-xs">
                  {form.units && <span className="bg-[#EC5B13]/10 text-[#EC5B13] px-2 py-0.5 rounded-full font-semibold">{form.units} kamar</span>}
                  {form.pricePerMonth && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Rp {Number(form.pricePerMonth).toLocaleString("id-ID")}/bln</span>}
                  {form.fundingTarget && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Target: Rp {parseFloat(form.fundingTarget).toLocaleString("id-ID")}</span>}
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">Step {activeStep}/4</span>
                </div>
                {form.imageUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.imageUrls.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" onError={(e) => e.target.style.display = "none"} />
                    ))}
                    {form.imageUrls.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">+{form.imageUrls.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* On-Chain Checklist */}
          <div className="bg-[#EC5B13]/5 border border-[#EC5B13]/10 rounded-2xl p-6 h-fit">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">On-Chain Checklist</h4>
            <ul className="flex flex-col gap-3">
              {CHECKLIST.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className={`material-symbols-outlined text-sm ${item.done ? "text-emerald-500" : "text-slate-300"}`}>
                    {item.done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
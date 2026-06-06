import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ── Constants ──────────────────────────────────────────────────────────────────
const PINATA_GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud";

const CATEGORIES = [
  "Kos Putra", "Kos Putri", "Kos Campur",
  "Apartemen", "Rumah Kontrak", "Guest House", "Co-living",
];

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PROPERTY MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function EditPropertyModal({ property, onClose, onSuccess }) {
  const TABS = [
    { key: "basic",   label: "Info Dasar",  icon: "edit_note"           },
    { key: "finance", label: "Finansial",   icon: "payments"            },
    { key: "images",  label: "Foto",        icon: "photo_library"       },
    { key: "legal",   label: "Dokumen",     icon: "verified_user"       },
  ];

  const [tab,     setTab]     = useState("basic");
  const [saving,  setSaving]  = useState(false);
  const fileInputRef          = useRef(null);

  // ── Form State ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:       property.title       ?? "",
    description: property.description ?? "",
    location:    property.location    ?? "",
    category:    property.category    ?? "",
    roi:         property.roi         ?? "",
    latitude:    property.latitude    ?? "",
    longitude:   property.longitude   ?? "",
  });

  const [finance, setFinance] = useState({
    fundingTarget: property.fundingTarget ?? "",
    tokenPrice:    property.tokenPrice    ?? "",
    totalTokens:   property.totalTokens   ?? "",
  });

  // Images: existing (from API) + new (to upload)
  const [existingImages, setExistingImages] = useState(property.images ?? []);
  const [newImages,      setNewImages]      = useState([]); // { file, preview }
  const [deletedIds,     setDeletedIds]     = useState([]);
  const [imgUploading,   setImgUploading]   = useState(false);

  // Legal docs
  const [legalDoc1,     setLegalDoc1]     = useState(
    property.ipfsLegalDoc?.split("|")[0] ?? ""
  );
  const [legalDoc2,     setLegalDoc2]     = useState(
    property.ipfsLegalDoc?.split("|")[1] ?? ""
  );
  const [legalFile1,    setLegalFile1]    = useState(null);
  const [legalFile2,    setLegalFile2]    = useState(null);
  const [legalUploading, setLegalUploading] = useState(false);
  const legalRef1 = useRef(null);
  const legalRef2 = useRef(null);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange  = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFinance = (e) => setFinance(p => ({ ...p, [e.target.name]: e.target.value }));

  // Mark existing image for deletion
  const markDeleteExisting = (imgId) => {
    setDeletedIds(p => [...p, imgId]);
    setExistingImages(p => p.filter(i => i.id !== imgId));
  };

  // Add new image files (local preview)
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const mapped = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewImages(p => [...p, ...mapped]);
    e.target.value = "";
  };

  const removeNewImage = (idx) => {
    setNewImages(p => {
      URL.revokeObjectURL(p[idx].preview);
      return p.filter((_, i) => i !== idx);
    });
  };

  // Upload a single file to IPFS → return URL
  const uploadToIpfs = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/upload/ipfs", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.status !== "success") throw new Error(res.data.message);
    return `${PINATA_GATEWAY}/ipfs/${res.data.data.cid}`;
  };

  // Upload legal doc files → update CID strings
  const uploadLegalDocs = async () => {
    setLegalUploading(true);
    try {
      let cid1 = legalDoc1;
      let cid2 = legalDoc2;
      if (legalFile1) cid1 = await uploadToIpfs(legalFile1);
      if (legalFile2) cid2 = await uploadToIpfs(legalFile2);
      setLegalDoc1(cid1);
      setLegalDoc2(cid2);
      setLegalFile1(null);
      setLegalFile2(null);
      Swal.fire({ icon: "success", title: "Dokumen berhasil diunggah!", timer: 1500, showConfirmButton: false, confirmButtonColor: "#EC5B13" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal upload dokumen", text: err.message, confirmButtonColor: "#EC5B13" });
    } finally {
      setLegalUploading(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: "warning", title: "Judul tidak boleh kosong", confirmButtonColor: "#EC5B13" });
      return;
    }

    setSaving(true);
    Swal.fire({ title: "Menyimpan perubahan…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 1 — Upload new images to IPFS
      setImgUploading(true);
      const uploadedUrls = [];
      for (const item of newImages) {
        const url = await uploadToIpfs(item.file);
        uploadedUrls.push(url);
      }
      setImgUploading(false);

      // 2 — Build payload
      const payload = {
        ...form,
        ...finance,
        roi:         form.roi       ? parseFloat(form.roi)           : null,
        latitude:    form.latitude  ? parseFloat(form.latitude)      : null,
        longitude:   form.longitude ? parseFloat(form.longitude)     : null,
        fundingTarget: parseFloat(finance.fundingTarget),
        tokenPrice:    parseFloat(finance.tokenPrice),
        totalTokens:   parseInt(finance.totalTokens, 10),
        ipfsLegalDoc:  [legalDoc1, legalDoc2].filter(Boolean).join("|") || null,
        // tell backend which image ids to delete and which URLs to add
        deleteImageIds: deletedIds,
        addImageUrls:   uploadedUrls,
      };

      await api.put(`/properties/${property.id}`, payload);

      await Swal.fire({
        icon: "success",
        title: "Properti berhasil diperbarui!",
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: "#EC5B13",
      });

      onSuccess();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.response?.data?.message ?? err.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────────────
  const Field = ({ label, name, value, onChange, type = "text", placeholder = "", disabled = false }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );

  const TextArea = ({ label, name, value, onChange, placeholder = "", rows = 4 }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm resize-none"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Properti</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{property.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0 px-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-[#EC5B13] text-[#EC5B13]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── BASIC INFO ── */}
          {tab === "basic" && (
            <>
              <Field label="Judul Properti" name="title" value={form.title} onChange={handleChange} placeholder="Kos Melati Indah" />
              <TextArea label="Deskripsi" name="description" value={form.description} onChange={handleChange} placeholder="Deskripsikan properti Anda…" rows={5} />
              <Field label="Lokasi / Alamat" name="location" value={form.location} onChange={handleChange} placeholder="Jl. Kenanga No. 12, Makassar" />

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-sm"
                >
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <Field label="ROI Proyeksi (% / tahun)" name="roi" value={form.roi} onChange={handleChange} type="number" placeholder="8.5" />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} type="number" placeholder="-5.1234" />
                <Field label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} type="number" placeholder="119.4567" />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Perubahan pada properti yang sudah <strong>ACTIVE/FUNDED</strong> akan ditinjau ulang oleh admin sebelum ditampilkan.
                </p>
              </div>
            </>
          )}

          {/* ── FINANCE ── */}
          {tab === "finance" && (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-2">
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">shield</span>
                  Data finansial hanya dapat diubah selama properti berstatus <strong>PENDING</strong>. Setelah ada investor, perubahan terbatas.
                </p>
              </div>

              <Field
                label="Target Funding (Rp)"
                name="fundingTarget"
                value={finance.fundingTarget}
                onChange={handleFinance}
                type="number"
                placeholder="500000000"
                disabled={property.status !== "PENDING"}
              />
              <Field
                label="Harga per Token (Rp)"
                name="tokenPrice"
                value={finance.tokenPrice}
                onChange={handleFinance}
                type="number"
                placeholder="100000"
                disabled={property.status !== "PENDING"}
              />
              <Field
                label="Total Token (PROP)"
                name="totalTokens"
                value={finance.totalTokens}
                onChange={handleFinance}
                type="number"
                placeholder="5000"
                disabled={property.status !== "PENDING"}
              />

              {/* Preview calculation */}
              {finance.tokenPrice && finance.totalTokens && (
                <div className="p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Preview Kalkulasi</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Valuasi</span>
                    <span className="font-bold text-[#EC5B13]">
                      Rp {(parseFloat(finance.tokenPrice || 0) * parseInt(finance.totalTokens || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── IMAGES ── */}
          {tab === "images" && (
            <>
              {/* Existing Images */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Foto Saat Ini ({existingImages.length})
                </p>
                {existingImages.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <span className="material-symbols-outlined text-3xl">image_not_supported</span>
                    <p className="text-xs mt-1">Belum ada foto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => markDeleteExisting(img.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        {img === existingImages[0] && (
                          <span className="absolute top-2 left-2 text-[10px] bg-[#EC5B13] text-white px-2 py-0.5 rounded font-bold">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Images to Add */}
              {newImages.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Foto Baru ({newImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {newImages.map((item, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-[#EC5B13]/40">
                        <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeNewImage(idx)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                        <span className="absolute top-2 left-2 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold">
                          Baru
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleNewImages}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#EC5B13] text-slate-500 hover:text-[#EC5B13] rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-bold"
              >
                <span className="material-symbols-outlined">add_photo_alternate</span>
                Tambah Foto (JPG, PNG, WEBP)
              </button>

              <p className="text-[11px] text-slate-400">
                Foto pertama akan dijadikan cover properti. Maks. 10 MB per foto.
              </p>

              {deletedIds.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {deletedIds.length} foto akan dihapus saat disimpan.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── LEGAL DOCS ── */}
          {tab === "legal" && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload dokumen legal baru untuk mengganti dokumen yang ada. Dokumen akan disimpan di IPFS.
              </p>

              {/* Doc 1 — SHM */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-[#EC5B13]">verified_user</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Sertifikat Hak Milik (SHM)</p>
                    {legalDoc1 ? (
                      <a href={legalDoc1} target="_blank" rel="noreferrer" className="text-xs text-[#EC5B13] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        Lihat dokumen saat ini
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada dokumen</p>
                    )}
                  </div>
                </div>
                <input ref={legalRef1} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={(e) => setLegalFile1(e.target.files[0] || null)} />
                {legalFile1 ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#EC5B13] text-[18px]">
                        {legalFile1.type === "application/pdf" ? "picture_as_pdf" : "image"}
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{legalFile1.name}</span>
                    </div>
                    <button onClick={() => setLegalFile1(null)} className="text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => legalRef1.current?.click()}
                    className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-500 hover:border-[#EC5B13] hover:text-[#EC5B13] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    {legalDoc1 ? "Ganti Dokumen" : "Upload SHM"}
                  </button>
                )}
              </div>

              {/* Doc 2 — IMB */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-[#EC5B13]">architecture</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Izin Mendirikan Bangunan (IMB)</p>
                    {legalDoc2 ? (
                      <a href={legalDoc2} target="_blank" rel="noreferrer" className="text-xs text-[#EC5B13] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        Lihat dokumen saat ini
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada dokumen</p>
                    )}
                  </div>
                </div>
                <input ref={legalRef2} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={(e) => setLegalFile2(e.target.files[0] || null)} />
                {legalFile2 ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#EC5B13] text-[18px]">
                        {legalFile2.type === "application/pdf" ? "picture_as_pdf" : "image"}
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-[160px]">{legalFile2.name}</span>
                    </div>
                    <button onClick={() => setLegalFile2(null)} className="text-slate-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => legalRef2.current?.click()}
                    className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-500 hover:border-[#EC5B13] hover:text-[#EC5B13] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    {legalDoc2 ? "Ganti Dokumen" : "Upload IMB"}
                  </button>
                )}
              </div>

              {/* Upload legal docs button */}
              {(legalFile1 || legalFile2) && (
                <button
                  onClick={uploadLegalDocs}
                  disabled={legalUploading}
                  className="w-full py-3 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {legalUploading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Mengunggah ke IPFS…</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">cloud_upload</span>Upload Dokumen ke IPFS</>
                  )}
                </button>
              )}

              <p className="text-[11px] text-slate-400">
                Format: PDF, JPG, PNG · Dokumen tersimpan aman di IPFS (terdesentralisasi).
              </p>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || legalUploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#EC5B13] text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-60"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan…</>
              : <><span className="material-symbols-outlined text-[18px]">save</span>Simpan Perubahan</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DetailProperty() {
  const navigate                = useNavigate();
  const { id }                  = useParams();
  const [property,  setProperty] = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState("");
  const [editOpen,  setEditOpen]  = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) { setError("ID properti tidak ditemukan di URL."); setLoading(false); return; }
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data.data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? `Properti dengan ID "${id}" tidak ditemukan.`
          : "Gagal memuat data properti. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const fundedPct      = property ? Math.min(Math.round((property.currentFunding / property.fundingTarget) * 100), 100) : 0;
  const totalInvestors = property?.investments?.length ?? 0;
  const thumbnail      = property?.images?.[0]?.url ?? null;

  const ipfsCids = property?.ipfsLegalDoc
    ? property.ipfsLegalDoc.split("|").filter(Boolean)
    : [];

  const LEGAL_DOCS = [
    { icon: "verified_user", title: "Sertifikat Hak Milik (SHM)",    cid: ipfsCids[0] ?? null },
    { icon: "architecture",  title: "Izin Mendirikan Bangunan (IMB)", cid: ipfsCids[1] ?? null },
  ];

  const ASSET_INFO = property ? [
    { icon: "payments", label: "Target Valuation", value: `Rp ${property.fundingTarget.toLocaleString("id-ID")}` },
    { icon: "token",    label: "Harga per Token",  value: `Rp ${property.tokenPrice.toLocaleString("id-ID")}` },
    { icon: "toll",     label: "Total Token",      value: `${property.totalTokens.toLocaleString()} PROP` },
  ] : [];

  const STATUS_BADGE = {
    ACTIVE:  { bg: "bg-green-100 text-green-700",  icon: "check_circle", label: "Active"  },
    FUNDED:  { bg: "bg-blue-100 text-blue-700",    icon: "verified",     label: "Funded"  },
    PENDING: { bg: "bg-amber-100 text-amber-700",  icon: "pending",      label: "Pending" },
    CLOSED:  { bg: "bg-slate-100 text-slate-600",  icon: "lock",         label: "Closed"  },
  };
  const badge = STATUS_BADGE[property?.status] ?? STATUS_BADGE.PENDING;

  // Can edit if PENDING or ACTIVE (not FUNDED/CLOSED)
  const canEdit = ["PENDING", "ACTIVE"].includes(property?.status);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Dashboard Funding Real-time" />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Breadcrumb */}
          <nav className="flex text-sm text-slate-500 items-center gap-2">
            <button onClick={() => navigate("/owner/dashboard-funding")} className="hover:text-[#EC5B13] transition-colors">
              Dashboard
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {property?.title ?? "Property Details"}
            </span>
          </nav>

          {/* ── Skeleton ── */}
          {loading && (
            <>
              <div className="flex justify-between items-end gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-96 rounded-3xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-52" />
                <Skeleton className="h-52" />
              </div>
            </>
          )}

          {/* ── Error ── */}
          {!loading && (!!error || !property) && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-6xl text-red-300">home_work</span>
              <p className="text-xl font-bold text-slate-500">{error || "Properti tidak ditemukan"}</p>
              <p className="text-sm text-slate-400 text-center max-w-sm">
                ID: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">{id}</code>
              </p>
              <div className="flex gap-3 mt-2">
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                  Kembali
                </button>
                <button onClick={() => navigate("/owner/proposal")} className="px-6 py-3 bg-[#EC5B13] text-white rounded-xl font-bold hover:bg-[#d44e0f] transition-colors">
                  Ke Daftar Proposal
                </button>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {!loading && !error && property && (
            <>
              {/* Header */}
              <section className="space-y-6">
                <div className="flex justify-between items-end flex-wrap gap-4">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {property.title}
                    </h1>
                    <p className="flex items-center gap-1 text-slate-500 mt-1">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      {property.location}
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 ${badge.bg}`}>
                      <span className="material-symbols-outlined text-base">{badge.icon}</span>
                      {badge.label}
                    </span>
                    <span className="px-4 py-2 bg-[#EC5B13]/10 text-[#EC5B13] rounded-full text-sm font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">toll</span>
                      {property.category ?? "RWA"}
                    </span>
                    {/* ── EDIT BUTTON ── */}
                    {canEdit ? (
                      <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#EC5B13] text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit Properti
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-sm font-bold cursor-not-allowed" title="Properti yang sudah FUNDED atau CLOSED tidak dapat diedit">
                        <span className="material-symbols-outlined text-base">lock</span>
                        Edit Dikunci
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Image */}
                <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {thumbnail ? (
                    <img src={thumbnail} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-slate-400">image_not_supported</span>
                    </div>
                  )}
                  <div className="absolute bottom-8 left-8 z-20 text-white">
                    <p className="text-sm uppercase tracking-widest font-bold opacity-80">{property.category ?? "Property"}</p>
                    <h2 className="text-3xl font-bold">{property.title}</h2>
                  </div>
                  {/* Photo count badge */}
                  {property.images?.length > 1 && (
                    <div className="absolute bottom-8 right-8 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                      <span className="material-symbols-outlined text-[14px]">photo_library</span>
                      {property.images.length} foto
                    </div>
                  )}
                  {/* Edit overlay shortcut */}
                  {canEdit && (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 bg-black/40 hover:bg-[#EC5B13] backdrop-blur-sm text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                      Kelola Foto
                    </button>
                  )}
                </div>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#EC5B13]/5 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Funding Progress</h3>
                    <span className={`font-bold text-2xl ${fundedPct >= 100 ? "text-emerald-500" : "text-[#EC5B13]"}`}>{fundedPct}%</span>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${fundedPct >= 100 ? "bg-emerald-500" : "bg-[#EC5B13]"}`}
                        style={{ width: `${fundedPct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">Dana Terkumpul</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {property.currentFunding.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-sm">Target Funding</p>
                        <p className="text-2xl font-bold text-slate-400">Rp {property.fundingTarget.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {[
                        { label: "Total Investor", value: `${totalInvestors} orang` },
                        { label: "Sisa Target", value: `Rp ${Math.max(property.fundingTarget - property.currentFunding, 0).toLocaleString("id-ID")}` },
                        { label: "Status", value: badge.label },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className="text-xs text-slate-400 font-bold uppercase">{s.label}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#EC5B13] p-8 rounded-3xl text-white shadow-lg shadow-[#EC5B13]/20">
                  <h3 className="text-xl font-bold mb-6">Asset Information</h3>
                  <div className="space-y-6">
                    {ASSET_INFO.map((a) => (
                      <div key={a.label} className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg shrink-0">
                          <span className="material-symbols-outlined">{a.icon}</span>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">{a.label}</p>
                          <p className="text-lg font-bold leading-tight">{a.value}</p>
                        </div>
                      </div>
                    ))}
                    {property.roi && (
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg shrink-0">
                          <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">ROI Proyeksi</p>
                          <p className="text-lg font-bold leading-tight">{property.roi}% / tahun</p>
                        </div>
                      </div>
                    )}
                    {property.description && (
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-white/70 text-xs mb-1">Deskripsi</p>
                        <p className="text-sm text-white/90 leading-relaxed line-clamp-3">{property.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Detailed Info */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Legal & Technical */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Legal & Technical</h3>
                    {canEdit && (
                      <button
                        onClick={() => { setEditOpen(true); }}
                        className="flex items-center gap-1 text-xs font-bold text-[#EC5B13] hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Edit Dokumen
                      </button>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                    {LEGAL_DOCS.map((doc) =>
                      doc.cid ? (
                        <a key={doc.title} href={`https://gateway.pinata.cloud/ipfs/${doc.cid}`} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-[#EC5B13]/5 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#EC5B13]">{doc.icon}</span>
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-white">{doc.title}</p>
                              <p className="text-xs text-slate-500 font-mono">IPFS: {doc.cid.slice(0, 8)}…{doc.cid.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-[#EC5B13] transition-colors">open_in_new</span>
                        </a>
                      ) : (
                        <div key={doc.title} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl opacity-50">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-400">{doc.icon}</span>
                            <div>
                              <p className="font-semibold text-sm text-slate-500">{doc.title}</p>
                              <p className="text-xs text-slate-400">Dokumen belum diupload</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300">block</span>
                        </div>
                      )
                    )}

                    <div className="pt-2">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Specifications</h4>
                      <ul className="space-y-0">
                        {[
                          { label: "Category",       value: property.category ?? "—" },
                          { label: "Location",       value: property.location  ?? "—" },
                          { label: "Total Token",    value: `${property.totalTokens.toLocaleString()} PROP` },
                          { label: "Token Price",    value: `Rp ${property.tokenPrice.toLocaleString("id-ID")}` },
                          { label: "Funding Target", value: `Rp ${property.fundingTarget.toLocaleString("id-ID")}` },
                          ...(property.roi ? [{ label: "ROI Proyeksi", value: `${property.roi}% / tahun` }] : []),
                        ].map((s, i, arr) => (
                          <li key={s.label} className={`flex justify-between text-sm py-2 ${i < arr.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
                            <span className="text-slate-500">{s.label}</span>
                            <span className="font-medium text-slate-900 dark:text-white text-right max-w-[60%] truncate">{s.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Investor Breakdown */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Investor Breakdown</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                      Recent Contributions <span className="ml-1 font-normal normal-case text-slate-300">({totalInvestors} total)</span>
                    </h4>
                    {property.investments?.length > 0 ? (
                      <div className="space-y-6">
                        {property.investments.slice(0, 5).map((inv) => {
                          const name     = inv.investor?.fullName ?? "Investor";
                          const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                          return (
                            <div key={inv.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#EC5B13]/10 text-[#EC5B13] flex items-center justify-center font-bold text-sm shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-slate-900 dark:text-white">{name}</p>
                                  <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#EC5B13]">Rp {inv.totalPaid.toLocaleString("id-ID")}</p>
                                <p className="text-xs text-slate-500">{inv.tokenAmount.toLocaleString()} Token</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-10 gap-2">
                        <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                        <p className="text-slate-400 text-sm">Belum ada investor</p>
                      </div>
                    )}
                    {totalInvestors > 5 && (
                      <button className="w-full mt-8 py-3 text-sm font-bold text-[#EC5B13] border border-[#EC5B13]/20 rounded-xl hover:bg-[#EC5B13] hover:text-white transition-all">
                        View All Investors ({totalInvestors})
                      </button>
                    )}
                  </div>

                  {/* Photo Gallery */}
                  {property.images?.length > 1 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Photo Gallery</h4>
                        {canEdit && (
                          <button onClick={() => setEditOpen(true)} className="text-xs font-bold text-[#EC5B13] hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Kelola Foto
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {property.images.slice(0, 6).map((img, i) => (
                          <div key={img.id ?? i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Footer */}
              <footer className="bg-slate-900 text-white p-8 rounded-3xl flex flex-wrap justify-between items-center gap-6">
                <div>
                  <h4 className="text-xl font-bold">Admin Status Control</h4>
                  <p className="text-slate-400 text-sm mt-1">
                    Dibuat: {new Date(property.createdAt).toLocaleString("id-ID", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </p>
                  {property.updatedAt && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      Diperbarui: {new Date(property.updatedAt).toLocaleString("id-ID", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <button onClick={() => navigate("/owner/dashboard-funding")} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                    Kembali ke Dashboard
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors border border-white/20"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit Properti
                    </button>
                  )}
                  <button onClick={() => navigate("/owner/withdrawal")} className="px-6 py-3 bg-[#EC5B13] hover:bg-[#EC5B13]/90 rounded-xl font-bold shadow-lg shadow-[#EC5B13]/20 transition-colors">
                    Manage Yield Distribution
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* ── Edit Modal ── */}
      {editOpen && property && (
        <EditPropertyModal
          property={property}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            fetchDetail(); // Refresh data setelah save
          }}
        />
      )}
    </div>
  );
}
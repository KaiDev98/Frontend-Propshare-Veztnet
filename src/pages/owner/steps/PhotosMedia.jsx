import { useState } from "react";
import api from "../../../utils/api";

// ─── Data ──────────────────────────────────────────────────────────────────────

const ADDITIONAL_SLOTS = [
  { id: "interior",  label: "Interior" },
  { id: "bathroom",  label: "Bathroom" },
  { id: "common",    label: "Common Area" },
  { id: "exterior",  label: "Exterior" },
];

const GUIDELINES = [
  { title: "High Resolution",   desc: "Minimum 1920x1080px for the best experience." },
  { title: "Clear Lighting",    desc: "Take photos during the day with natural light." },
  { title: "Show Common Areas", desc: "Investors look for well-maintained shared spaces." },
  { title: "De-clutter Spaces", desc: "Ensure the property looks professional and clean." },
];

// ─── Helper: Upload satu file ke backend → dapat URL IPFS ────────────────────
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/ipfs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data.url; // URL publik dari Pinata Gateway
};

// ─── Sub Components ────────────────────────────────────────────────────────────

function HeroUpload({ file, url, uploading, onChange, onRemove }) {
  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-100">Hero Image</h4>
        <span className="text-xs font-medium text-[#EC5B13] bg-[#EC5B13]/10 px-2 py-1 rounded">
          Required
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        This is the main photo seen by investors on the marketplace.
      </p>

      {uploading ? (
        // Loading state
        <div className="w-full h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
          <span className="material-symbols-outlined text-[#EC5B13] text-4xl animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-medium text-[#EC5B13]">Uploading to IPFS...</p>
        </div>
      ) : file ? (
        // Preview setelah upload
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={url || URL.createObjectURL(file)}
            alt="Hero preview"
            className="w-full h-56 object-cover rounded-2xl"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
            <button
              type="button"
              onClick={onRemove}
              className="bg-white text-red-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Remove
            </button>
          </div>
          <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            {url ? "Tersimpan di IPFS" : file.name}
          </span>
        </div>
      ) : (
        // Drop zone kosong
        <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center hover:border-[#EC5B13] transition-all bg-slate-50 dark:bg-slate-800/50">
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={(e) => onChange(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#EC5B13]/10 text-[#EC5B13] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-bold">
              Drag and drop or{" "}
              <span className="text-[#EC5B13]">browse</span>
            </p>
            <p className="text-slate-400 text-xs mt-1">PNG, JPG atau JPEG (Max. 10MB)</p>
          </div>
        </div>
      )}
    </section>
  );
}

function AdditionalPhotos({ files, urls, uploading, onChange, onRemove }) {
  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Additional Photos</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ADDITIONAL_SLOTS.map((slot) => (
          <div key={slot.id} className="relative aspect-square">
            {uploading[slot.id] ? (
              // Loading per slot
              <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[#EC5B13] animate-spin text-2xl">
                  progress_activity
                </span>
                <span className="text-[9px] text-[#EC5B13] mt-1 font-bold">Uploading...</span>
              </div>
            ) : files[slot.id] ? (
              // Preview
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                <img
                  src={urls[slot.id] || URL.createObjectURL(files[slot.id])}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onRemove(slot.id)}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-white bg-black/40 py-0.5">
                  {slot.label}
                </span>
              </div>
            ) : (
              // Empty slot
              <label className="relative w-full h-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-[#EC5B13] hover:text-[#EC5B13] transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                <span className="material-symbols-outlined">add</span>
                <span className="text-[10px] font-bold mt-1">{slot.label}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => onChange(slot.id, e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

// Props:
// value    → array URL gambar dari parent (form.imageUrls)
// onChange → function(urls) untuk kirim array URL ke parent
export default function PhotosMedia({ value = [], onChange }) {
  const [heroFile,        setHeroFile]       = useState(null);
  const [additionalFiles, setAdditional]     = useState({});
  const [heroUrl,         setHeroUrl]        = useState("");
  const [additionalUrls,  setAdditionalUrls] = useState({});
  const [heroUploading,   setHeroUploading]  = useState(false);
  const [slotUploading,   setSlotUploading]  = useState({});
  const [error,           setError]          = useState("");

  // ─── Helper: kirim semua URL terkumpul ke parent ───────────────────────────
  const pushToParent = (newHeroUrl, newAdditionalUrls) => {
    const all = [
      newHeroUrl,
      ...Object.values(newAdditionalUrls),
    ].filter(Boolean);
    onChange(all);
  };

  // ─── Hero Image ────────────────────────────────────────────────────────────
  const handleHeroChange = async (file) => {
    if (!file) return;
    setError("");
    setHeroFile(file);
    setHeroUploading(true);

    try {
      const url = await uploadImage(file);
      setHeroUrl(url);
      pushToParent(url, additionalUrls);
    } catch (err) {
      console.error("Hero upload gagal:", err);
      setError("Gagal upload hero image. Pastikan backend berjalan.");
      setHeroFile(null);
    } finally {
      setHeroUploading(false);
    }
  };

  const handleHeroRemove = () => {
    setHeroFile(null);
    setHeroUrl("");
    pushToParent("", additionalUrls);
  };

  // ─── Additional Photos ─────────────────────────────────────────────────────
  const handleAdditionalChange = async (id, file) => {
    if (!file) return;
    setError("");
    setAdditional((prev) => ({ ...prev, [id]: file }));
    setSlotUploading((prev) => ({ ...prev, [id]: true }));

    try {
      const url = await uploadImage(file);
      const newUrls = { ...additionalUrls, [id]: url };
      setAdditionalUrls(newUrls);
      pushToParent(heroUrl, newUrls);
    } catch (err) {
      console.error(`Upload ${id} gagal:`, err);
      setError(`Gagal upload foto ${id}.`);
      setAdditional((prev) => { const n = {...prev}; delete n[id]; return n; });
    } finally {
      setSlotUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAdditionalRemove = (id) => {
    setAdditional((prev) => { const n = {...prev}; delete n[id]; return n; });
    const newUrls = { ...additionalUrls };
    delete newUrls[id];
    setAdditionalUrls(newUrls);
    pushToParent(heroUrl, newUrls);
  };

  const totalUploaded = (heroUrl ? 1 : 0) + Object.values(additionalUrls).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Left: Upload Areas */}
      <div className="lg:col-span-2 space-y-6">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          </div>
        )}

        <HeroUpload
          file={heroFile}
          url={heroUrl}
          uploading={heroUploading}
          onChange={handleHeroChange}
          onRemove={handleHeroRemove}
        />

        <AdditionalPhotos
          files={additionalFiles}
          urls={additionalUrls}
          uploading={slotUploading}
          onChange={handleAdditionalChange}
          onRemove={handleAdditionalRemove}
        />

        {/* Total uploaded info */}
        {totalUploaded > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 rounded-xl">
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">
              check_circle
            </span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {totalUploaded} foto berhasil disimpan di IPFS
            </p>
          </div>
        )}
      </div>

      {/* Right: Guidelines */}
      <div className="space-y-6">

        {/* Media Guidelines */}
        <div className="bg-[#EC5B13]/5 dark:bg-[#EC5B13]/10 p-6 rounded-2xl border border-[#EC5B13]/20">
          <div className="flex items-center gap-2 mb-4 text-[#EC5B13]">
            <span className="material-symbols-outlined">lightbulb</span>
            <h4 className="font-bold">Media Guidelines</h4>
          </div>
          <ul className="space-y-4">
            {GUIDELINES.map((g) => (
              <li key={g.title} className="flex gap-3">
                <span className="material-symbols-outlined text-[#EC5B13] text-sm mt-1 shrink-0">
                  check_circle
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{g.title}</p>
                  <p className="text-xs text-slate-500">{g.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Photographer CTA */}
        <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl text-white">
          <div className="w-10 h-10 rounded-xl bg-[#EC5B13]/20 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[#EC5B13]">camera_alt</span>
          </div>
          <h4 className="font-bold mb-2">Need a Pro?</h4>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            PropShare offers professional photography services to help your property sell faster.
          </p>
          <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
            Book Photographer
          </button>
        </div>

        {/* Upload Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm">
            Upload Summary
          </h4>
          <ul className="space-y-2">
            <li className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Hero Image</span>
              <span className={`font-bold ${heroUrl ? "text-emerald-500" : heroUploading ? "text-[#EC5B13]" : "text-slate-300"}`}>
                {heroUploading ? "Uploading..." : heroUrl ? "✓ Uploaded" : "Pending"}
              </span>
            </li>
            {ADDITIONAL_SLOTS.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{slot.label}</span>
                <span className={`font-bold ${
                  additionalUrls[slot.id]  ? "text-emerald-500" :
                  slotUploading[slot.id]   ? "text-[#EC5B13]"   : "text-slate-300"
                }`}>
                  {slotUploading[slot.id] ? "Uploading..." : additionalUrls[slot.id] ? "✓ Uploaded" : "Optional"}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
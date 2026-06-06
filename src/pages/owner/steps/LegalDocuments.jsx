import { useState } from "react";
import axios from "axios";
import api from "../../../utils/api";

// ─── Data ──────────────────────────────────────────────────────────────────────

const DOCUMENT_FIELDS = [
  {
    id: "shm",
    label: "Sertifikat Properti (SHM/SHGB)",
    icon: "cloud_upload",
    placeholder: "Klik untuk unggah atau seret file",
  },
  {
    id: "imb",
    label: "IMB (Izin Mendirikan Bangunan)",
    icon: "upload_file",
    placeholder: "Klik untuk unggah dokumen IMB",
  },
];

// ─── Upload ke Pinata ─────────────────────────────────────────────────────────
// Ganti dengan fungsi ini:
const uploadToBackend = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/ipfs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data.cid; // CID dari Pinata
};

// ─── Sub Component ─────────────────────────────────────────────────────────────

function UploadBox({ field, file, uploading, cid, onChange, onRemove }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
        {field.label}
      </label>

      {/* Drop Zone */}
      <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#EC5B13] transition-colors rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/20">
        {uploading ? (
          // Loading state saat upload ke Pinata
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[#EC5B13] text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-medium text-[#EC5B13]">
              Mengupload ke IPFS...
            </p>
          </div>
        ) : (
          <>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-[#EC5B13] text-4xl transition-colors">
              {field.icon}
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {field.placeholder}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                PDF, JPG (Max. 10MB)
              </p>
            </div>
          </>
        )}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg"
          disabled={uploading}
          onChange={(e) => onChange(field.id, e.target.files[0])}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* File Preview */}
      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="w-10 h-10 rounded bg-[#EC5B13]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#EC5B13]">
              picture_as_pdf
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
              {file.name}
            </p>
            {cid ? (
              // Tampil CID kalau sudah berhasil upload
              <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-0.5 font-mono">
                <span className="material-symbols-outlined text-[10px]">verified</span>
                CID: {cid.slice(0, 20)}...
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Sedang diproses...
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(field.id)}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 italic text-xs h-16">
          Belum ada file yang diunggah
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

// Props:
// value    → string CID dari parent (form.ipfsLegalDoc)
// onChange → function(cid) untuk kirim CID ke parent
export default function LegalDocuments({ value, onChange }) {
  const [files, setFiles]       = useState({ shm: null, imb: null });
  const [uploading, setUploading] = useState({ shm: false, imb: false });
  const [cids, setCids]         = useState({ shm: "", imb: "" });
  const [error, setError]       = useState("");

  const handleFileChange = async (id, file) => {
  if (!file) return;
  setError("");
  setFiles((prev) => ({ ...prev, [id]: file }));
  setUploading((prev) => ({ ...prev, [id]: true }));

  try {
    const cid = await uploadToBackend(file); // ← ganti ini

    const newCids = { ...cids, [id]: cid };
    setCids(newCids);
    const combined = Object.values(newCids).filter(Boolean).join("|");
    onChange(combined);

  } catch (err) {
    console.error("Upload gagal:", err);
    setError("Gagal upload ke IPFS. Pastikan backend berjalan.");
    setFiles((prev) => ({ ...prev, [id]: null }));
  } finally {
    setUploading((prev) => ({ ...prev, [id]: false }));
  }
};

  const handleRemove = (id) => {
    const newFiles = { ...files, [id]: null };
    const newCids  = { ...cids,  [id]: "" };
    setFiles(newFiles);
    setCids(newCids);

    // Update parent — kalau semua dihapus kirim string kosong
    const combined = Object.values(newCids).filter(Boolean).join("|");
    onChange(combined);
  };

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Dokumen Legalitas
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Seluruh dokumen akan dienkripsi secara otomatis dan disimpan di jaringan{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            IPFS (InterPlanetary File System)
          </strong>{" "}
          untuk menjamin transparansi dan keamanan tingkat tinggi bagi investor Anda.
        </p>
      </div>

      {/* Status upload keseluruhan */}
      {value && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl">
          <span className="material-symbols-outlined text-emerald-500 text-[18px]">
            check_circle
          </span>
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Dokumen tersimpan di IPFS
            </p>
            <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
              {value.slice(0, 40)}...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {/* Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DOCUMENT_FIELDS.map((field) => (
          <UploadBox
            key={field.id}
            field={field}
            file={files[field.id]}
            uploading={uploading[field.id]}
            cid={cids[field.id]}
            onChange={handleFileChange}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Security Alert */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex gap-4">
        <span className="material-symbols-outlined text-blue-500 shrink-0 mt-0.5">lock</span>
        <div>
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
            Protokol Keamanan RWA
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            Dokumen Anda akan diproses melalui pipeline enkripsi AES-256 sebelum diunggah ke
            jaringan terdistribusi. Hanya pihak otoritas dan smart contract validasi yang dapat
            mengakses dokumen asli.
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold text-center mt-2">
        Didukung oleh Jaringan Web 3.0 Terenkripsi
      </p>
    </div>
  );
}
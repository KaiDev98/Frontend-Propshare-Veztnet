import { useState, useRef, useEffect } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── StarInput ────────────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className="transition-transform hover:scale-110 focus:outline-none disabled:cursor-default"
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => !disabled && onChange(star)}
            aria-label={`${star} bintang`}
          >
            <span
              className={`material-symbols-outlined text-3xl select-none transition-colors ${
                active ? "text-orange-500" : "text-slate-300 dark:text-slate-600"
              }`}
              style={{ fontVariationSettings: active ? "'FILL' 1,'wght' 500" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        );
      })}
      <span className={`ml-3 font-extrabold text-xl w-10 ${value > 0 ? "text-orange-500" : "text-slate-300"}`}>
        {value > 0 ? `${value}.0` : "—"}
      </span>
    </div>
  );
}

// ─── PhotoThumb ───────────────────────────────────────────────────────────────
function PhotoThumb({ src, onRemove, disabled }) {
  return (
    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
      <img src={src} alt="preview" className="w-full h-full object-cover" />
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-colors"
          aria-label="Hapus foto"
        >
          <span className="material-symbols-outlined leading-none" style={{ fontSize: 12 }}>close</span>
        </button>
      )}
    </div>
  );
}

// ─── FormReview ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   propertyId    {string|number}   – dari useParams di parent
 *   propertyTitle {string}          – judul properti untuk display
 *   onClose       {() => void}      – tutup modal
 *   onReviewAdded {(review) => void} – inject review baru ke reviews[] di parent
 *
 * Review object yang di-emit (kompatibel dengan ReviewCard di InvestorPropertyDetail):
 *   { id, rating, name, comment, date, quality, communication, photos, verified }
 */
export default function FormReview({
  propertyId,
  propertyTitle = "Properti",
  onClose,
  onReviewAdded,
}) {
  const [quality,       setQuality]       = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment,       setComment]       = useState("");
  const [photos,        setPhotos]        = useState([]);   // [{ id, url, file }]
  const [submitting,    setSubmitting]    = useState(false);
  const [fieldError,    setFieldError]    = useState("");
  const fileRef = useRef();

  // ── Tutup dengan ESC ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Cegah scroll body saat modal terbuka ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Handle file input ─────────────────────────────────────────────────────
  const handleFiles = (e) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPhotos((prev) => [
          ...prev,
          { id: crypto.randomUUID(), url: ev.target.result, file },
        ]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (quality === 0 || communication === 0) {
      setFieldError("Harap berikan rating untuk semua kategori.");
      return;
    }
    if (comment.trim().length < 10) {
      setFieldError("Testimoni minimal 10 karakter.");
      return;
    }
    setFieldError("");
    setSubmitting(true);

    const avgRating = parseFloat(((quality + communication) / 2).toFixed(1));

    try {
      let res;

      if (photos.length > 0) {
        // ── Kirim sebagai multipart/form-data jika ada foto ─────────────────
        // Base64 TIDAK dikirim ke backend — hanya file asli via FormData
        const form = new FormData();
        form.append("rating",        avgRating);
        form.append("quality",       quality);
        form.append("communication", communication);
        form.append("comment",       comment.trim());
        photos.forEach((p) => form.append("photos", p.file));

        res = await api.post(`/properties/${propertyId}/reviews`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // ── Kirim sebagai JSON biasa jika tidak ada foto ─────────────────────
        res = await api.post(`/properties/${propertyId}/reviews`, {
          rating:        avgRating,
          quality,
          communication,
          comment:       comment.trim(),
        });
      }

      const saved = res.data?.data ?? res.data;

      // ── Bentuk object yang langsung bisa dipakai ReviewCard ──────────────
      const newReview = {
        id:            saved?.id            ?? crypto.randomUUID(),
        rating:        saved?.rating        ?? avgRating,
        name:          saved?.name          ?? saved?.author ?? "Kamu",
        comment:       saved?.comment       ?? comment.trim(),
        date:          saved?.created_at    ?? saved?.date ?? new Date().toISOString(),
        quality:       saved?.quality       ?? quality,
        communication: saved?.communication ?? communication,
        // Preview foto dari state lokal supaya langsung tampil tanpa reload
        photos:        saved?.photos?.length
                         ? saved.photos
                         : photos.map((p) => p.url),
        verified:      saved?.verified ?? false,
      };

      onReviewAdded?.(newReview);
      onClose?.();

      Swal.fire({
        icon:              "success",
        title:             "Ulasan Terkirim! 🎉",
        text:              `Terima kasih telah mengulas ${propertyTitle}.`,
        confirmButtonColor: "#ea580c",
        timer:             2500,
        showConfirmButton: false,
      });
    } catch (err) {
      // Tampilkan pesan dari backend jika ada, fallback ke status code
      const serverMsg =
        err?.response?.data?.message ??
        err?.response?.data?.error   ??
        (err?.response?.status
          ? `Error ${err.response.status}: ${err.response.statusText}`
          : null) ??
        "Gagal mengirim ulasan, coba lagi.";

      console.error("[FormReview] POST error:", err?.response?.data ?? err);
      setFieldError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    /* ── Backdrop — klik di luar untuk tutup ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* ── Modal Panel ── */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto
                      bg-slate-50 dark:bg-[#1a1c23] rounded-3xl shadow-2xl shadow-black/40
                      flex flex-col">

        {/* ── Header ── */}
        <header className="sticky top-0 z-10 bg-slate-50 dark:bg-[#1a1c23]
                           flex items-center justify-between
                           border-b border-orange-500/10 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-md shadow-orange-500/30">
              <span className="material-symbols-outlined block" style={{ fontSize: 20 }}>rate_review</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                Tulis Ulasan
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                {propertyTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full w-9 h-9
                       bg-slate-200 dark:bg-slate-800
                       hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300"
                  style={{ fontSize: 18 }}>close</span>
          </button>
        </header>

        {/* ── Body ── */}
        <main className="px-6 py-6">

          {/* Intro */}
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
              Bagaimana properti ini?
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ulasan Anda membantu calon investor dan penghuni lainnya membuat keputusan lebih baik.
            </p>
          </div>

          {/* Grid dua kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Kolom Kiri: Rating + Foto ── */}
            <div className="space-y-5">

              {/* Kualitas Properti */}
              <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl
                              border border-orange-500/10 shadow-sm">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2
                               text-slate-800 dark:text-slate-100">
                  <span className="material-symbols-outlined text-orange-600" style={{ fontSize: 18 }}>
                    apartment
                  </span>
                  Kualitas Properti
                </h3>
                <StarInput value={quality} onChange={setQuality} disabled={submitting} />
              </div>

              {/* Fasilitas & Layanan */}
              <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl
                              border border-orange-500/10 shadow-sm">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2
                               text-slate-800 dark:text-slate-100">
                  <span className="material-symbols-outlined text-orange-600" style={{ fontSize: 18 }}>
                    support_agent
                  </span>
                  Fasilitas & Layanan
                </h3>
                <StarInput value={communication} onChange={setCommunication} disabled={submitting} />
              </div>

              {/* Upload Foto */}
              <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl
                              border-2 border-dashed border-orange-500/20 shadow-sm">
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2
                               text-slate-800 dark:text-slate-100">
                  <span className="material-symbols-outlined text-orange-600" style={{ fontSize: 18 }}>
                    add_a_photo
                  </span>
                  Foto Pendukung
                  <span className="text-[10px] font-normal text-slate-400">(opsional)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Upload foto properti sebagai bukti pendukung ulasan Anda.
                </p>
                <div className="flex flex-wrap gap-3">
                  {photos.map((p) => (
                    <PhotoThumb
                      key={p.id}
                      src={p.url}
                      disabled={submitting}
                      onRemove={() =>
                        setPhotos((prev) => prev.filter((x) => x.id !== p.id))
                      }
                    />
                  ))}
                  {!submitting && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600
                                 flex flex-col items-center justify-center text-slate-400
                                 hover:border-orange-500 hover:text-orange-500 transition-colors"
                      aria-label="Tambah foto"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>upload_file</span>
                      <span className="text-[10px] mt-1 font-bold">Tambah</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                  />
                </div>
              </div>
            </div>

            {/* ── Kolom Kanan: Testimoni ── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold flex items-center gap-2
                                text-slate-800 dark:text-slate-100">
                <span className="material-symbols-outlined text-orange-600" style={{ fontSize: 18 }}>
                  edit_note
                </span>
                Testimoni Lengkap
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
                placeholder="Ceritakan pengalaman Anda. Apakah properti sesuai ekspektasi? Bagaimana kondisi bangunan, keamanan, dan akses lokasi?"
                className="flex-grow w-full rounded-2xl
                           border border-orange-500/20
                           bg-white dark:bg-slate-800/60
                           focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30
                           p-4 text-sm resize-none min-h-[200px]
                           text-slate-700 dark:text-slate-200
                           placeholder:text-slate-400 outline-none transition-colors
                           disabled:opacity-60"
              />
              <p className={`text-xs text-right ${
                comment.length > 0 && comment.length < 10
                  ? "text-red-400"
                  : "text-slate-400"
              }`}>
                {comment.length} karakter
                {comment.length < 10 && comment.length > 0 && " · min. 10"}
              </p>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {fieldError && (
            <div className="mt-5 flex items-center gap-2 text-sm font-medium
                            text-red-600 dark:text-red-400
                            bg-red-50 dark:bg-red-900/20
                            border border-red-200 dark:border-red-800
                            rounded-xl px-4 py-3">
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16 }}>error</span>
              {fieldError}
            </div>
          )}

          {/* ── Footer Actions ── */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4
                          border-t border-orange-500/10 pt-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 15 }}>
                verified_user
              </span>
              Ulasan akan ditampilkan di halaman properti ini.
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none px-7 py-3 rounded-xl font-bold text-sm
                           border border-slate-200 dark:border-slate-700
                           hover:bg-slate-100 dark:hover:bg-slate-800
                           transition-colors disabled:opacity-50
                           text-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white
                           px-8 py-3 rounded-xl font-bold text-sm
                           shadow-lg shadow-orange-500/20
                           hover:opacity-95 active:scale-[0.98] transition-all
                           flex items-center justify-center gap-2
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span
                  className={`material-symbols-outlined ${submitting ? "animate-spin" : ""}`}
                  style={{ fontSize: 16 }}
                >
                  {submitting ? "autorenew" : "send"}
                </span>
                {submitting ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </div>
        </main>

        {/* ── Info Footer ── */}
        <div className="px-6 pb-6">
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-orange-500 mt-0.5 shrink-0"
                  style={{ fontSize: 15 }}>info</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Dengan mengirimkan ulasan ini, Anda mengonfirmasi bahwa pengalaman yang dibagikan adalah
              nyata dan sesuai fakta. Feedback digunakan untuk peningkatan layanan dan transparansi
              platform PropShare Campus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
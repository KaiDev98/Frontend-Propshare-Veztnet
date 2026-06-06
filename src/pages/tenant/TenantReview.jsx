import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Opsional: Tambahkan framer-motion untuk animasi smooth
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── Komponen Bintang (Refined) ──────────────────────────────────────────────
function StarRating({ value, onChange, label, sublabel, required }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-3">
        <div>
          <label className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-slate-400 font-medium leading-tight">{sublabel}</p>}
        </div>
        {required && (
          <span className="text-[9px] font-black text-orange-600 bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 rounded-full tracking-wider uppercase">
            Wajib
          </span>
        )}
      </div>
      <div className="flex gap-2 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5 transition-all group-hover:border-orange-200">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="relative transition-all duration-200 hover:scale-125 active:scale-90 focus:outline-none"
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{
                fontVariationSettings: (hovered || value) >= star ? "'FILL' 1" : "'FILL' 0",
                color: (hovered || value) >= star ? "#EC5B13" : "#D1D5DB",
              }}
            >
              star
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantReview() {
  const [myRentals, setMyRentals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [review, setReview] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [ratings, setRatings] = useState({
    maintenance: 0,
    communication: 0,
    cleanliness: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get("/rentals/my-rentals");
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        setMyRentals(raw);
        if (raw.length > 0) setSelectedId(raw[0].id);
      } catch {
        setMyRentals([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const selectedRental = myRentals.find((r) => r.id === selectedId);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedId) {
        return Swal.fire({ icon: "warning", title: "Pilih properti dulu", confirmButtonColor: "#EC5B13" });
    }
    if (!ratings.maintenance || !ratings.communication || !ratings.cleanliness) {
        return Swal.fire({ icon: "warning", title: "Bintang harus diisi semua", confirmButtonColor: "#EC5B13" });
    }
    if (!review.trim()) {
        return Swal.fire({ icon: "warning", title: "Ceritakan pengalamanmu", confirmButtonColor: "#EC5B13" });
    }

    const ok = await Swal.fire({
      title: "Kirim Ulasan?",
      text: "Ulasan yang sudah dikirim tidak dapat diubah.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim Sekarang",
      cancelButtonText: "Cek Lagi",
      confirmButtonColor: "#EC5B13",
      borderRadius: "15px",
    });

    if (!ok.isConfirmed) return;

    try {
      setSubmitting(true);
      Swal.fire({ title: "Sedang Memproses...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const formData = new FormData();
      formData.append("rentalId", selectedId);
      formData.append("maintenance", ratings.maintenance);
      formData.append("communication", ratings.communication);
      formData.append("cleanliness", ratings.cleanliness);
      formData.append("comment", review);
      if (photo) formData.append("photo", photo);

      await api.post("/reviews", formData, { headers: { "Content-Type": "multipart/form-data" } });

      Swal.fire({ icon: "success", title: "Ulasan Terkirim!", text: "Terima kasih atas kontribusimu.", confirmButtonColor: "#EC5B13" });
      
      setReview("");
      setPhoto(null);
      setPhotoPreview(null);
      setRatings({ maintenance: 0, communication: 0, cleanliness: 0 });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal Mengirim", text: err.response?.data?.message || "Coba lagi nanti.", confirmButtonColor: "#EF4444" });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = ratings.maintenance && ratings.communication && ratings.cleanliness
    ? ((ratings.maintenance + ratings.communication + ratings.cleanliness) / 3).toFixed(1)
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#1a0f0a]">
      <TenantSidebar activeLabel="Review" />

      <main className="flex-1 overflow-y-auto">
        <TenantHeader />

        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-8 max-w-7xl">
          {/* Header Section */}
          <header className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">rate_review</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Feedback Center</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Bagikan Pengalamanmu <span className="text-orange-500">.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Pendapatmu sangat berarti bagi perkembangan layanan kami dan membantu calon penghuni lainnya menemukan hunian impian mereka.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Input Section */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Step 1: Select Property */}
              <section className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">1</div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pilih Hunian</h2>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />)}
                  </div>
                ) : myRentals.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl text-slate-300">nest_remote_comfort</span>
                    </div>
                    <p className="font-bold text-slate-400">Belum ada riwayat sewa</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myRentals.map((rental) => {
                      const prop = rental.room?.property ?? {};
                      const isSelected = selectedId === rental.id;
                      return (
                        <div
                          key={rental.id}
                          onClick={() => setSelectedId(rental.id)}
                          className={`group flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 ${
                            isSelected 
                              ? "bg-orange-50 dark:bg-orange-500/5 border-orange-500 shadow-lg shadow-orange-500/10" 
                              : "bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                          }`}
                        >
                          <div className="relative">
                            <img 
                              src={prop.images?.[0]?.url || "https://placehold.co/100"} 
                              className={`w-16 h-16 rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105 ${!isSelected && "grayscale"}`}
                              alt={prop.title}
                            />
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 border-4 border-white dark:border-[#1a0f0a] rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                              {prop.title}
                            </h3>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-black tracking-tighter">
                              <span className="material-symbols-outlined text-xs">room</span>
                              {prop.location || "Lokasi tidak tersedia"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Step 2: Comment & Photo */}
              <section className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/5 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none text-slate-900 dark:text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">2</div>
                  <h2 className="text-xl font-bold">Tulis Ulasan</h2>
                </div>

                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all min-h-[180px] text-sm leading-relaxed"
                  placeholder="Bagaimana lingkungan di sana? Apakah pemiliknya ramah? Ceritakan detailnya..."
                />

                <div className="mt-6 flex flex-wrap gap-4">
                  <label className="relative flex items-center justify-center w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all cursor-pointer overflow-hidden group">
                    {photoPreview ? (
                      <>
                        <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">sync</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-500">add_a_photo</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Lampirkan Foto</p>
                    <p className="text-xs text-slate-400">Bukti visual meningkatkan kepercayaan ulasanmu.</p>
                    {photoPreview && (
                        <button 
                            onClick={() => {setPhoto(null); setPhotoPreview(null);}} 
                            className="text-[10px] font-bold text-red-500 uppercase mt-2 self-start hover:underline"
                        >
                            Hapus Foto
                        </button>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Rating Summary */}
            <div className="lg:col-span-5 sticky top-8">
              <aside className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white">
                    Skor Kepuasan
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                </h2>

                <div className="space-y-6">
                  <StarRating 
                    label="Perawatan Unit" 
                    sublabel="Kualitas perbaikan & respon teknisi"
                    value={ratings.maintenance}
                    onChange={(v) => setRatings(p => ({...p, maintenance: v}))}
                    required
                  />
                  <StarRating 
                    label="Komunikasi" 
                    sublabel="Kemudahan menghubungi pemilik"
                    value={ratings.communication}
                    onChange={(v) => setRatings(p => ({...p, communication: v}))}
                    required
                  />
                  <StarRating 
                    label="Kebersihan" 
                    sublabel="Kondisi awal & area publik"
                    value={ratings.cleanliness}
                    onChange={(v) => setRatings(p => ({...p, cleanliness: v}))}
                    required
                  />
                </div>

                <AnimatePresence>
                    {avgRating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 p-6 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                            <span className="material-symbols-outlined text-9xl">verified</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Rata-rata Skor</p>
                        <div className="flex items-end gap-2">
                            <span className="text-6xl font-black leading-none">{avgRating}</span>
                            <span className="text-xl font-bold opacity-80 mb-1">/ 5.0</span>
                        </div>
                        <div className="flex gap-1 mt-4">
                            {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} className="material-symbols-outlined text-sm" 
                                    style={{ fontVariationSettings: "'FILL' " + (parseFloat(avgRating) >= s ? 1 : 0) }}>
                                    star
                                </span>
                            ))}
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full mt-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
                    submitting 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-slate-900 dark:bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-95 shadow-orange-500/20"
                  }`}
                >
                  {submitting ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <>
                      <span>Kirim Ulasan</span>
                      <span className="material-symbols-outlined text-base">arrow_forward_ios</span>
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
                  Ulasanmu akan diproses secara anonim untuk melindungi privasimu sesuai kebijakan kami.
                </p>
              </aside>
            </div>
          </div>

          <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-medium">
            <p>© 2026 PropShare Campus. Made with passion for students.</p>
            <div className="flex gap-6 uppercase tracking-widest">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── Helper: Render Bintang ───────────────────────────────────────────────────
function Stars({ value, size = "text-base" }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`material-symbols-outlined ${size}`}
          style={{
            fontVariationSettings: value >= s ? "'FILL' 1" : "'FILL' 0",
            color: value >= s ? "#f97316" : "#cbd5e1", // orange-500
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ─── Chip Rating Detail ───────────────────────────────────────────────────────
function RatingChip({ label, value }) {
  const color =
    value >= 4 ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" 
    : value >= 3 ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" 
    : "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20";
    
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border ${color} transition-all`}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
      <span className="text-xs font-black">{value}.0</span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900/50 rounded-[2rem] p-6 lg:p-8 border border-white dark:border-white/5 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-4/5" />
          <div className="flex gap-2 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const property = review.property ?? {};
  const roomNum  = review.rental?.room?.roomNumber;
  const hasReply = !!review.ownerReply;

  const thumbnail = property.images?.find(img => img?.url)?.url ?? null;
  const dateStr = new Date(review.createdAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={`group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 border-2 transition-all duration-300 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 ${
      hasReply
        ? "border-emerald-50 dark:border-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30"
        : "border-white dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30"
    }`}>

      <button
        onClick={() => onDelete(review.id)}
        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        title="Hapus ulasan"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>

      <div className="flex flex-col sm:flex-row gap-6">
        
        {/* ── Kiri: Thumbnail & Tanggal ── */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={property.title}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[1.5rem] shadow-sm"
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">apartment</span>
            </div>
          )}
          <div className="text-center sm:w-full">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{dateStr}</p>
          </div>
        </div>

        {/* ── Kanan: Konten Ulasan ── */}
        <div className="flex-1 min-w-0 pr-8 sm:pr-0">
          <div className="mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">
              {property.title ?? "Properti"}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {property.location ?? "—"}
              </span>
              {roomNum && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  Unit {roomNum}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Stars value={Math.round(review.avgRating)} />
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {review.avgRating.toFixed(1)} <span className="text-slate-400 font-medium text-xs">/ 5.0</span>
            </span>
          </div>

          <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3 ${!expanded && "line-clamp-2"}`}>
            "{review.comment}"
          </p>
          
          {review.comment?.length > 120 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-orange-500 text-[11px] font-black uppercase tracking-wide mb-4 hover:underline"
            >
              {expanded ? "Tutup" : "Baca Selengkapnya"}
            </button>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            <RatingChip label="Perawatan"  value={review.maintenance} />
            <RatingChip label="Komunikasi" value={review.communication} />
            <RatingChip label="Kebersihan" value={review.cleanliness} />
          </div>

          {review.photoUrl && (
            <a href={review.photoUrl} target="_blank" rel="noreferrer" className="inline-block mb-6 relative group/img">
              <img
                src={review.photoUrl}
                alt="Foto ulasan"
                className="w-32 h-24 object-cover rounded-[1.2rem] shadow-sm transition-all group-hover/img:brightness-75"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
              </div>
            </a>
          )}

          {/* ── Balasan Owner ── */}
          {hasReply ? (
            <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/5 relative">
              <div className="absolute -left-3 top-6 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-emerald-600 dark:text-emerald-400">reply</span>
              </div>
              <div className="flex justify-between items-start mb-2 pl-2">
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5">Balasan Pemilik</p>
                  {review.repliedAt && (
                    <p className="text-[10px] text-slate-400">
                      {new Date(review.repliedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                {review.ownerReply}
              </p>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-full border border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
              Menunggu balasan pemilik
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantFeedback() {
  const navigate  = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [filter,  setFilter]  = useState("all"); 
  const [page,    setPage]    = useState(1);
  const [stats,   setStats]   = useState({ totalReviews: 0, repliedCount: 0, avgRating: 0 });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page, limit: 6,
        ...(filter === "replied" && { hasReply: "true"  }),
        ...(filter === "pending" && { hasReply: "false" }),
      };
      const res  = await api.get("/reviews/my-reviews", { params });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setReviews(data);
      setMeta(res.data?.meta ?? { total: 0, page: 1, totalPages: 1 });

      if (res.data?.stats) {
        setStats(res.data.stats);
      } else {
        const replied = data.filter(r => r.ownerReply).length;
        const avg     = data.length
          ? parseFloat((data.reduce((s, r) => s + r.avgRating, 0) / data.length).toFixed(1))
          : 0;
        setStats({ totalReviews: res.data?.meta?.total ?? data.length, repliedCount: replied, avgRating: avg });
      }
    } catch (err) {
      console.error("[TenantFeedback]", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = async (reviewId) => {
    const ok = await Swal.fire({
      icon: "warning", 
      title: "Hapus Ulasan?",
      text: "Ulasan yang dihapus tidak bisa dikembalikan.",
      showCancelButton: true, 
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#94a3b8", 
      confirmButtonText: "Ya, Hapus", 
      cancelButtonText: "Batal",
      borderRadius: "15px"
    });
    if (!ok.isConfirmed) return;
    
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, totalReviews: Math.max(0, prev.totalReviews - 1) }));
      Swal.fire({ icon: "success", title: "Dihapus!", showConfirmButton: false, timer: 1500 });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: "Coba lagi nanti.", confirmButtonColor: "#f97316" });
    }
  };

  const replyPercent  = stats.totalReviews > 0 ? Math.round((stats.repliedCount / stats.totalReviews) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#1a0f0a]">
      <TenantSidebar activeLabel="Ulasan Saya" />

      <main className="flex-1 overflow-y-auto">
        <TenantHeader />

        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-8 max-w-7xl">
          
          {/* ── Header ── */}
          <header className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">history</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Riwayat Feedback</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Ulasan Saya <span className="text-orange-500">.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Pantau semua ulasan yang pernah kamu berikan dan lihat balasan atau tanggapan langsung dari pemilik properti.
            </p>
          </header>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 bg-orange-50 dark:bg-orange-500/10 w-32 h-32 rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-orange-500">reviews</span>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Total Ulasan</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white">{stats.totalReviews}</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 bg-amber-50 dark:bg-amber-500/10 w-32 h-32 rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-amber-500">star</span>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Rata-rata Skor</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-slate-400 font-bold">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Card 3 (Gradient) */}
            <div className="p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white group">
              <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 opacity-80">
                  <span className="material-symbols-outlined">mark_email_read</span>
                  <span className="text-[10px] font-black tracking-widest uppercase">Dibalas Owner</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black">{stats.repliedCount}</span>
                  <span className="font-bold opacity-80 text-sm">/ {stats.totalReviews}</span>
                </div>
                <div className="mt-6 h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${replyPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Filters & Action ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex p-1.5 bg-slate-200/50 dark:bg-white/5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {[
                { key: "all",     label: "Semua" },
                { key: "replied", label: "Dibalas" },
                { key: "pending", label: "Menunggu" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); setPage(1); }}
                  className={`px-6 py-2.5 rounded-[1rem] text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    filter === f.key
                      ? "bg-white dark:bg-slate-800 text-orange-500 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate("/tenant/review")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-orange-500 text-white font-bold text-sm rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_comment</span>
              Tulis Ulasan Baru
            </button>
          </div>

          {/* ── Reviews List ── */}
          <div className="space-y-6">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">forum</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-white text-lg">
                  {filter === "replied" ? "Belum ada balasan dari pemilik"
                   : filter === "pending" ? "Semua ulasanmu sudah dibalas! 🎉"
                   : "Kamu belum pernah menulis ulasan"}
                </p>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Mari bantu komunitas PropShare dengan membagikan pengalamanmu tinggal di properti ini.
                </p>
              </div>
            ) : (
              reviews.map(review => (
                <ReviewCard key={review.id} review={review} onDelete={handleDelete} />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {meta.totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-orange-500 disabled:opacity-40 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex gap-2">
                {[...Array(meta.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${
                      page === i + 1
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-500 hover:border-orange-200 dark:hover:border-orange-500/30"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-orange-500 disabled:opacity-40 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}

          <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-medium">
            <p>© 2026 PropShare Campus. Menampilkan {reviews.length} dari {meta.total} ulasan.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
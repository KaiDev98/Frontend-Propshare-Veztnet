import { useState, useEffect, useCallback } from "react";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── Helper: render bintang ───────────────────────────────────────────────────
function Stars({ value, size = "text-sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`material-symbols-outlined ${size} transition-colors`}
          style={{
            fontVariationSettings: value >= s ? "'FILL' 1" : "'FILL' 0",
            color: value >= s ? "#EC5B13" : "#cbd5e1",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ─── Chip rating detail ───────────────────────────────────────────────────────
function RatingChip({ label, value }) {
  const color =
    value >= 4 ? "text-emerald-600" : value >= 3 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">{label}</span>
      <span className={`text-xs font-extrabold ${color}`}>{value}.0</span>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
      <div className="flex gap-8">
        <div className="w-1/4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Modal Reply ──────────────────────────────────────────────────────────────
function ReplyModal({ review, onClose, onSuccess }) {
  const [text, setText] = useState(review.ownerReply || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    try {
      setSaving(true);
      await api.patch(`/reviews/${review.id}/reply`, { reply: text });
      onSuccess(review.id, text);
      Swal.fire({
        icon: "success",
        title: "Balasan Tersimpan!",
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: "#EC5B13",
      });
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: err.response?.data?.message || "Coba lagi",
        confirmButtonColor: "#EC5B13",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Balas Ulasan</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Membalas ulasan dari{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {review.tenant?.fullName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Kutipan ulasan */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5 border-l-4 border-[#EC5B13]">
          <Stars value={review.avgRating} />
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 italic">
            "{review.comment}"
          </p>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Tulis balasan profesional Anda di sini..."
          className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-[#EC5B13]/30 outline-none resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="flex-1 py-3 rounded-xl bg-[#EC5B13] hover:bg-[#d44e0f] text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                Kirim Balasan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const tenant    = review.tenant ?? {};
  const property  = review.property ?? {};
  const roomNum   = review.rental?.room?.roomNumber;
  const hasReply  = !!review.ownerReply;

  const avatarUrl =
    tenant.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.fullName || "T")}&background=EC5B13&color=fff`;

  const dateStr = new Date(review.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-transparent hover:border-orange-100 dark:hover:border-orange-900/40 transition-all shadow-sm group p-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Kiri: Info Tenant ── */}
        <div className="w-full lg:w-1/4 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={avatarUrl}
              alt={tenant.fullName}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-100"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  tenant.fullName || "T"
                )}&background=EC5B13&color=fff`;
              }}
            />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {tenant.fullName || "Tenant"}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {roomNum ? `Unit ${roomNum}, ` : ""}
                {property.title || "—"}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
            {dateStr}
          </p>
          <span className="inline-flex px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-tighter rounded-full border border-emerald-100 dark:border-emerald-800">
            Verified Tenant
          </span>
        </div>

        {/* ── Tengah: Konten Ulasan ── */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Stars value={Math.round(review.avgRating)} />
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {review.avgRating.toFixed(1)}
            </span>
          </div>

          <p className={`text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-5 font-medium ${!expanded && "line-clamp-3"}`}>
            "{review.comment}"
          </p>
          {review.comment?.length > 200 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[#EC5B13] text-xs font-bold mb-4 hover:underline"
            >
              {expanded ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
            </button>
          )}

          {/* Rating chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            <RatingChip label="Perawatan"   value={review.maintenance} />
            <RatingChip label="Komunikasi"  value={review.communication} />
            <RatingChip label="Kebersihan"  value={review.cleanliness} />
          </div>

          {/* Foto IPFS jika ada */}
          {review.photoUrl && (
            <a href={review.photoUrl} target="_blank" rel="noreferrer" className="inline-block mb-5">
              <img
                src={review.photoUrl}
                alt="Foto ulasan"
                className="w-28 h-20 object-cover rounded-xl border border-slate-100 dark:border-slate-700 hover:opacity-80 transition-opacity"
              />
            </a>
          )}

          {/* Balasan owner (jika sudah ada) */}
          {hasReply && (
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border-l-4 border-[#EC5B13] mt-2">
              <p className="text-[10px] font-bold text-[#EC5B13] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">reply</span>
                Balasan Pemilik
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {review.ownerReply}
              </p>
              {review.repliedAt && (
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(review.repliedAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Kanan: Aksi ── */}
        <div className="w-full lg:w-auto flex flex-col justify-between items-end gap-4">
          <div className="flex gap-1">
            <button className="p-2 text-slate-300 hover:text-[#EC5B13] transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10">
              <span className="material-symbols-outlined text-lg">share</span>
            </button>
          </div>

          {hasReply ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Sudah Dibalas
              </div>
              <button
                onClick={() => onReply(review)}
                className="text-xs text-slate-400 hover:text-[#EC5B13] font-semibold transition-colors"
              >
                Edit balasan
              </button>
            </div>
          ) : (
            <button
              onClick={() => onReply(review)}
              className="group/btn relative px-7 py-2.5 bg-white dark:bg-slate-800 border-2 border-[#EC5B13] text-[#EC5B13] font-bold rounded-xl overflow-hidden text-sm active:scale-95 transition-all"
            >
              <span className="relative z-10 group-hover/btn:text-white transition-colors">Balas</span>
              <div className="absolute inset-0 bg-[#EC5B13] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerReviews() {
  const [reviews,     setReviews]     = useState([]);
  const [stats,       setStats]       = useState({ portfolioRating: 0, totalReviews: 0, unansweredCount: 0 });
  const [properties,  setProperties]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [meta,        setMeta]        = useState({ total: 0, page: 1, totalPages: 1 });
  const [replyTarget, setReplyTarget] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    propertyId: "",
    minRating:  "",
    unanswered: false,
    page:       1,
  });

  // ── Fetch reviews ──────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page:       filters.page,
        limit:      8,
        ...(filters.propertyId && { propertyId: filters.propertyId }),
        ...(filters.minRating  && { minRating:  filters.minRating  }),
        ...(filters.unanswered && { unanswered: "true"              }),
      };
      const res = await api.get("/reviews/owner", { params });
      setReviews(res.data.data   || []);
      setMeta(res.data.meta      || { total: 0, page: 1, totalPages: 1 });
      setStats(res.data.stats    || { portfolioRating: 0, totalReviews: 0, unansweredCount: 0 });
    } catch (err) {
      console.error("[OwnerReviews]", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Fetch daftar properti owner untuk filter ───────────────────────────────
  useEffect(() => {
    api.get("/properties/my-properties")
      .then(res => setProperties(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setProperties([]));
  }, []);

  // ── Callback setelah reply berhasil ───────────────────────────────────────
  const handleReplySuccess = (reviewId, replyText) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, ownerReply: replyText, repliedAt: new Date().toISOString() }
          : r
      )
    );
    setStats(prev => ({ ...prev, unansweredCount: Math.max(0, prev.unansweredCount - 1) }));
  };

  const setFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  const ratingPercent = Math.round((stats.portfolioRating / 5) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#0f1117]">
      <OwnerSidebar activeLabel="Ulasan Properti" />

      <main className="flex-1 overflow-y-auto">
        {/* ── Top Header ── */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#EC5B13]/30 outline-none dark:text-white placeholder:text-slate-400"
                placeholder="Cari ulasan atau nama tenant..."
                type="text"
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.unansweredCount > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-[#EC5B13] font-bold text-xs px-4 py-2 rounded-full border border-orange-100 dark:border-orange-800">
                <span className="w-2 h-2 bg-[#EC5B13] rounded-full animate-pulse" />
                {stats.unansweredCount} belum dibalas
              </div>
            )}
          </div>
        </header>

        <div className="px-10 py-10 max-w-7xl mx-auto">

          {/* ── Page Title ── */}
          <div className="mb-10">
            <span className="text-[10px] font-black text-[#EC5B13] tracking-[0.2em] uppercase mb-2 block">
              Tenant Feedback
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ulasan Properti
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl text-sm leading-relaxed">
              Pantau kepuasan tenant di seluruh portofolio propertimu. Respons cepat meningkatkan tingkat hunian.
            </p>
          </div>

          {/* ── Stats Bento ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

            {/* Rating Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-orange-50 dark:border-orange-900/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-orange-50/60 dark:text-orange-900/20 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-9xl">star</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#EC5B13] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Portfolio Rating</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                    {stats.portfolioRating.toFixed(1)}
                  </span>
                  <span className="text-slate-400 font-bold">/ 5.0</span>
                </div>
                <div className="mt-4">
                  <Stars value={Math.round(stats.portfolioRating)} size="text-base" />
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#EC5B13] to-orange-400 rounded-full transition-all duration-1000"
                    style={{ width: `${ratingPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total Reviews */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-slate-50 dark:text-slate-800 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-9xl">chat_bubble</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-slate-500 text-base">forum</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Total Ulasan</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                    {stats.totalReviews}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-4 font-medium">
                  Dari seluruh properti aktifmu
                </p>
              </div>
            </div>

            {/* Unanswered */}
            <div className={`p-8 rounded-2xl shadow-xl relative overflow-hidden ${
              stats.unansweredCount > 0 ? "bg-slate-900" : "bg-emerald-600"
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent opacity-50" />
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-orange-400 text-base">pending_actions</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Belum Dibalas</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold">{stats.unansweredCount}</span>
                  <span className="text-orange-400 font-bold uppercase text-sm">ulasan</span>
                </div>
                <p className={`text-[10px] mt-4 font-bold uppercase tracking-tighter ${
                  stats.unansweredCount > 0 ? "text-orange-400" : "text-emerald-200"
                }`}>
                  {stats.unansweredCount > 0 ? "Segera respons untuk menjaga reputasi" : "Semua ulasan sudah dibalas ✓"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-end">
            <div className="flex flex-wrap gap-4">

              {/* Filter Properti */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Properti</label>
                <select
                  value={filters.propertyId}
                  onChange={(e) => setFilter("propertyId", e.target.value)}
                  className="block w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-[#EC5B13] dark:text-white px-3 py-2"
                >
                  <option value="">Semua Properti</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Filter Rating */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rating Minimum</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilter("minRating", e.target.value)}
                  className="block w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-[#EC5B13] dark:text-white px-3 py-2"
                >
                  <option value="">Semua Rating</option>
                  <option value="4">4+ Bintang</option>
                  <option value="3">3+ Bintang</option>
                  <option value="1">1+ Bintang</option>
                </select>
              </div>

              {/* Toggle Belum Dibalas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Status</label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setFilter("unanswered", false)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      !filters.unanswered
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilter("unanswered", true)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      filters.unanswered
                        ? "bg-white dark:bg-slate-700 shadow-sm text-[#EC5B13]"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Belum Dibalas
                  </button>
                </div>
              </div>
            </div>

            {/* Export */}
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-lg">download</span>
              Export
            </button>
          </div>

          {/* ── Review List ── */}
          <div className="space-y-5">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">rate_review</span>
                <p className="font-bold text-slate-400 text-lg">Belum ada ulasan</p>
                <p className="text-sm text-slate-400 mt-1">
                  {filters.unanswered ? "Semua ulasan sudah dibalas 🎉" : "Tenant belum memberikan ulasan untuk propertimu"}
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReply={(r) => setReplyTarget(r)}
                />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-3">
              <button
                onClick={() => setFilter("page", Math.max(1, filters.page - 1))}
                disabled={filters.page <= 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#EC5B13] disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <div className="flex gap-2">
                {[...Array(meta.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilter("page", i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${
                      filters.page === i + 1
                        ? "bg-[#EC5B13] text-white shadow-lg shadow-[#EC5B13]/30"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EC5B13]/40"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setFilter("page", Math.min(meta.totalPages, filters.page + 1))}
                disabled={filters.page >= meta.totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#EC5B13] disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3 mt-12">
            <p>© 2026 PropShare Campus Housing. Seluruh hak cipta dilindungi.</p>
            <p>Menampilkan {reviews.length} dari {meta.total} ulasan</p>
          </footer>
        </div>
      </main>

      {/* ── Reply Modal ── */}
      {replyTarget && (
        <ReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSuccess={handleReplySuccess}
        />
      )}
    </div>
  );
}
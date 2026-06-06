import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Konfigurasi API ──────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// ─── Helper: Hitung % pendanaan ───────────────────────────────────────────────
const hitungFundedPersen = (investments = [], fundingTarget = 0) => {
  if (!fundingTarget || fundingTarget === 0) return 0;
  const totalTerkumpul = investments.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
  return Math.min(Math.round((totalTerkumpul / fundingTarget) * 100), 100);
};

// ─── Framer Motion Variants ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 48, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

const CATEGORIES = ["Semua Properti", "Baru Ditambahkan", "ROI Tinggi", "Dekat Kampus"];

// ─── Property Card Component ───────────────────────────────────────────────────
function PropertyCard({ property }) {
  const formatRupiah = (angka) => `Rp ${Number(angka).toLocaleString("id-ID")}`;
  
  // Mapping data dari backend Prisma
  const nama = property.title || "Properti Tanpa Nama";
  const desc = property.description || "Tidak ada deskripsi tersedia.";
  const lokasi = property.location || "Lokasi tidak diketahui";
  const gambar = property.images?.[0]?.url || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"; // Fallback gambar
  const hargaToken = property.tokenPrice || 0;
  const totalTokens = property.totalTokens || 0;
  
  // Kalkulasi persentase pendanaan
  const persenTerdanai = hitungFundedPersen(property.investments, property.fundingTarget);

  // Menentukan badge berdasarkan kondisi
  let badge = { label: "Tersedia", color: "bg-[#EC5B13]" };
  if (persenTerdanai >= 100) badge = { label: "Terdanai Penuh", color: "bg-green-600" };
  else if (persenTerdanai > 75) badge = { label: "Hampir Habis", color: "bg-orange-500" };

  // Menentukan apakah ini listing baru (misal: kurang dari 7 hari)
  const isBaru = property.createdAt && (Date.now() - new Date(property.createdAt)) / (1000 * 60 * 60 * 24) <= 7;
  if (isBaru && persenTerdanai < 100) badge = { label: "Listing Baru", color: "bg-slate-900" };

  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className="group bg-white dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-[#EC5B13]/5 hover:border-[#EC5B13]/30 transition-colors duration-300 hover:shadow-[0_20px_50px_-12px_rgba(236,91,19,0.18)] flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${gambar}')` }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          className={`absolute top-4 left-4 ${badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg`}
        >
          {badge.label}
        </motion.div>

        {/* Location chip */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#EC5B13]">location_on</span>
            <p className="font-bold text-xs truncate max-w-[200px]">{lokasi}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#EC5B13] transition-colors duration-300 line-clamp-1">
          {nama}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {desc}
        </p>

        <div className="flex justify-between items-center py-4 border-y border-[#EC5B13]/5 mb-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Harga Token</p>
            <p className="text-lg font-black text-[#EC5B13]">{formatRupiah(hargaToken)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status Dana</p>
            <p className="text-lg font-black text-green-500">{persenTerdanai}%</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 mt-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span className="material-symbols-outlined text-sm text-[#EC5B13]">toll</span>
            {totalTokens.toLocaleString('id-ID')} Total Token
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span className="material-symbols-outlined text-sm text-[#EC5B13]">category</span>
            {property.category || "Umum"}
          </div>
        </div>

        {/* Button with hover shimmer */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl relative overflow-hidden font-bold text-sm group/btn mt-auto"
        >
          <span className="absolute inset-0 rounded-xl bg-[#EC5B13]/10 group-hover/btn:bg-[#EC5B13] transition-colors duration-300" />
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmerBtn 0.6s ease forwards",
            }}
          />
          <span className="relative z-10 text-[#EC5B13] group-hover/btn:text-white transition-colors duration-300 flex items-center justify-center gap-2">
            Lihat Detail
            <motion.span
              className="material-symbols-outlined text-sm"
              animate={{ x: 0 }}
              whileHover={{ x: 4 }}
            >
              arrow_forward
            </motion.span>
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Semua Properti");
  const [search, setSearch] = useState("");
  
  // State API
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dari database
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/properties?status=ACTIVE&limit=50`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        if (json.status === "success") {
          setProperties(json.data || []);
        } else {
          throw new Error(json.message);
        }
      } catch (err) {
        console.error("Gagal mengambil data marketplace:", err);
        setError("Gagal memuat daftar properti. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properti di sisi client agar animasi tetap mulus
  const filtered = properties.filter((p) => {
    // Logika kategori (sesuaikan dengan isi database, ini contoh mapping sederhana)
    let matchCat = true;
    if (activeCategory === "Baru Ditambahkan") {
      const selisihHari = (Date.now() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
      matchCat = selisihHari <= 14;
    } else if (activeCategory === "ROI Tinggi") {
      matchCat = p.category?.toLowerCase().includes("roi") || true; // Bisa disesuaikan
    } else if (activeCategory === "Dekat Kampus") {
      matchCat = p.category?.toLowerCase().includes("kampus") || true; // Bisa disesuaikan
    }

    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());

    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8">

      {/* ── Hero Search ── */}
      <section className="mb-12">
        <motion.div
          className="flex flex-col gap-4 text-center max-w-3xl mx-auto mb-10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.h1
            variants={fadeUp}
            custom={0}
            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Temukan Investasi Anda Selanjutnya
          </motion.h1>
          <motion.p
            variants={fadeUp}
            custom={0.1}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            Jelajahi aset hunian mahasiswa premium yang telah diverifikasi di berbagai pusat pendidikan.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-[#EC5B13]/10 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 flex items-center bg-[#f8f6f6] dark:bg-slate-900 rounded-xl px-4 border border-transparent focus-within:border-[#EC5B13] transition-colors duration-300">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama properti atau lokasi..."
              className="bg-transparent border-none focus:ring-0 w-full text-slate-900 dark:text-slate-100 py-3 placeholder:text-slate-500 outline-none text-sm"
            />
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-[#EC5B13] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </motion.button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {["Lokasi", "Rentang Harga", "Kategori"].map((filter, i) => (
              <motion.button
                key={filter}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#f8f6f6] dark:bg-slate-900 rounded-xl text-sm font-semibold border border-[#EC5B13]/5 whitespace-nowrap text-slate-700 dark:text-slate-300 hover:border-[#EC5B13]/30 transition-colors duration-200"
              >
                {filter}
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.58, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(236,91,19,0.35)" }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#EC5B13] text-white rounded-xl text-sm font-bold whitespace-nowrap"
            >
              Terapkan Filter
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Category Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex border-b border-[#EC5B13]/10 mb-8 gap-8 overflow-x-auto hide-scrollbar"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="relative pb-3 px-2 text-sm font-bold whitespace-nowrap transition-colors duration-200"
            style={{ color: activeCategory === cat ? "#EC5B13" : undefined }}
          >
            <span className={activeCategory === cat ? "text-[#EC5B13]" : "text-slate-500 dark:text-slate-400 hover:text-[#EC5B13]"}>
              {cat}
            </span>
            {activeCategory === cat && (
              <motion.span
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EC5B13] rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Property Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-[400px] animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 text-red-500 font-medium">
          <span className="material-symbols-outlined text-5xl mb-2">error</span>
          <p>{error}</p>
        </div>
      ) : (
        <motion.div
          key={activeCategory + search} 
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.05 }} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-24 gap-4 text-slate-400"
              >
                <span className="material-symbols-outlined text-5xl">search_off</span>
                <p className="font-bold text-lg">Properti tidak ditemukan</p>
                <p className="text-sm">Coba sesuaikan pencarian atau filter Anda</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {!loading && !error && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 flex justify-center items-center gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#EC5B13", color: "#fff" }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg border border-[#EC5B13]/10 text-slate-500 transition-colors duration-200"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-lg font-bold transition-colors duration-200 bg-[#EC5B13] text-white shadow-[0_4px_16px_rgba(236,91,19,0.4)]"
          >
            1
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#EC5B13", color: "#fff" }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg border border-[#EC5B13]/10 text-slate-500 transition-colors duration-200"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </motion.button>
        </motion.div>
      )}

      <style>{`
        @keyframes shimmerBtn {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
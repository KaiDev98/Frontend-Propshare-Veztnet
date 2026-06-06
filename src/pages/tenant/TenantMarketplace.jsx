import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import api from "../../utils/api";
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";

// ── Fix ikon default Leaflet (Vite/webpack) ──────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Ikon harga kustom untuk mini-map ────────────────────────────────────────
const makeMiniPriceIcon = (price) =>
  L.divIcon({
    className: "",
    iconAnchor: [0, 30],
    html: `
      <div style="
        background:#EC5B13;color:#fff;
        border:2px solid #fff;
        padding:3px 8px;border-radius:999px;
        font-weight:800;font-size:10px;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(236,91,19,0.35);
        font-family:'Manrope',sans-serif;
      ">Rp ${formatPrice(price)}</div>
      <div style="width:2px;height:6px;background:#EC5B13;margin:0 auto;"></div>
    `,
  });

function formatPrice(n) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + "jt";
  return n.toLocaleString("id-ID");
}

// ────────────────────────────────────────────────────────────────────────────
const ROOM_TYPES = ["Semua", "Studio", "1 Bedroom", "2 Bedroom", "Shared Loft"];

const BUDGETS = [
  { label: "Semua Harga",     min: 0,         max: Infinity },
  { label: "< Rp 1.000.000", min: 0,         max: 1_000_000 },
  { label: "Rp 1 – 2 Juta",  min: 1_000_000, max: 2_000_000 },
  { label: "Rp 2 Juta+",     min: 2_000_000, max: Infinity },
];

const FACILITY_MAP = {
  "AC":                 { icon: "ac_unit",              short: "AC"       },
  "WiFi":               { icon: "wifi",                  short: "WiFi"     },
  "Kasur":              { icon: "bed",                   short: "Kasur"    },
  "Lemari":             { icon: "shelves",               short: "Lemari"   },
  "Kamar Mandi Dalam":  { icon: "shower",                short: "K. Mandi" },
  "Dapur Bersama":      { icon: "kitchen",               short: "Dapur"    },
  "Parkir Motor":       { icon: "two_wheeler",           short: "Mtr"      },
  "Parkir Mobil":       { icon: "directions_car",        short: "Mobil"    },
  "CCTV":               { icon: "videocam",              short: "CCTV"     },
  "Laundry":            { icon: "local_laundry_service", short: "Laundry"  },
};

const AMENITY_FILTERS = Object.entries(FACILITY_MAP).map(([label, v]) => ({
  label,
  icon: v.icon,
}));

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="flex gap-2 pt-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-14" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

// ── Chip Fasilitas ────────────────────────────────────────────────────────────
function FacilityChips({ facilities }) {
  if (!facilities || facilities.length === 0) return null;
  const visible = facilities.slice(0, 4);
  const rest    = facilities.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {visible.map((fac) => {
        const cfg   = FACILITY_MAP[fac];
        const icon  = cfg?.icon  ?? "check_circle";
        const short = cfg?.short ?? fac;
        return (
          <div key={fac} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[13px] text-[#EC5B13]">{icon}</span>
            {short}
          </div>
        );
      })}
      {rest > 0 && (
        <div className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          +{rest}
        </div>
      )}
    </div>
  );
}

// ── Rating Badge ──────────────────────────────────────────────────────────────
// Posisi: pojok KIRI bawah gambar
function RatingBadge({ rating, count, isLoading }) {
  if (isLoading) {
    return (
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 animate-pulse">
        <span
          className="material-symbols-outlined text-white/60"
          style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
        >star</span>
        <span className="text-white/50 font-bold" style={{ fontSize: "16px" }}>—</span>
      </div>
    );
  }

  if (!rating || rating === 0 || !count || count === 0) return null;

  return (
    <div
      className="absolute bottom-3 left-3 flex items-center gap-1.5"
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))" }}
    >
      <span
        className="material-symbols-outlined text-white"
        style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
      >star</span>
      <span className="text-white font-bold leading-none" style={{ fontSize: "17px" }}>
        {Number(rating).toFixed(1)}
      </span>
      <span className="text-white/75 font-normal leading-none" style={{ fontSize: "13px" }}>
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onViewDetail, rentalStatus, isFav, onToggleFav, ratingData, isLoadingRating }) {
  const thumbnail = property.images?.find(img => img?.url)?.url ?? null;

  const availableRoom = (property.rooms ?? []).find(
    r => r.isAvailable !== false && r.status === "AVAILABLE"
  );
  const price =
    availableRoom?.pricePerMonth ??
    (property.rooms ?? [])[0]?.pricePerMonth ??
    property.tokenPrice ??
    property.rentPrice ??
    0;

  const allFacilities = useMemo(() => [
    ...new Set((property.rooms ?? []).flatMap(r => r.facilities ?? [])),
  ], [property]);

  const availableCount = (property.rooms ?? []).filter(
    r => r.isAvailable !== false && r.status === "AVAILABLE"
  ).length;

  const hasActive  = rentalStatus === "ACTIVE";
  const hasPending = rentalStatus === "PENDING";
  const hasRental  = hasActive || hasPending;

  const badge      = hasActive ? "Aktif" : hasPending ? "Menunggu" : "Tersedia";
  const badgeStyle = hasActive
    ? "bg-green-500 text-white"
    : hasPending
    ? "bg-amber-500 text-white"
    : "bg-white/90 text-slate-800";

  // Apakah ada rating yang akan ditampilkan di kiri bawah?
  const hasRatingBadge = ratingData && ratingData.count > 0;

  return (
    <div
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => onViewDetail(property)}
    >
      {/* ── Gambar ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
            <span className="material-symbols-outlined text-6xl text-slate-400">apartment</span>
          </div>
        )}

        {/* Gradient overlay bawah agar teks mudah dibaca */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Badge status — kiri atas */}
        <div className="absolute top-3 left-3">
          <span className={`text-[0.6rem] font-extrabold px-2.5 py-1 rounded-full tracking-widest uppercase shadow ${badgeStyle}`}>
            {badge}
          </span>
        </div>

        {/* Tombol favorit — kanan atas */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(property.id); }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow
            ${isFav
              ? "bg-red-500 text-white scale-110"
              : "bg-white/30 text-white hover:bg-white hover:text-red-500"}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
          >favorite</span>
        </button>

        {/* Overlay rental aktif/pending */}
        {hasRental && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className={`px-4 py-2 rounded-xl font-bold text-sm shadow ${
              hasActive ? "bg-green-500 text-white" : "bg-amber-500 text-white"
            }`}>
              {hasActive ? "✅ Kamar Aktif" : "⏳ Menunggu Persetujuan"}
            </span>
          </div>
        )}

        {/*
          ── Baris bawah gambar: kiri = Rating, kanan = Kamar tersedia ──
          Keduanya sejajar di bottom-3, sisi berbeda → tidak pernah overlap.
        */}

        {/* Rating Badge — kiri bawah */}
        <RatingBadge
          rating={ratingData?.avg}
          count={ratingData?.count}
          isLoading={isLoadingRating}
        />

        {/* Kamar tersedia — KANAN bawah (dipindah dari kiri agar tidak tumpang tindih) */}
        {!hasRental && availableCount > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">door_open</span>
            {availableCount} kamar
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight line-clamp-1">
            {property.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-[#EC5B13] font-extrabold text-base">
              Rp {price.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">/bln</span>
          </div>
        </div>

        <p className="text-slate-400 dark:text-slate-500 flex items-center gap-1 text-xs">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span className="truncate">{property.location ?? "—"}</span>
        </p>

        {allFacilities.length > 0
          ? <FacilityChips facilities={allFacilities} />
          : (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Fasilitas belum didaftarkan
            </div>
          )
        }

        <div className="mt-auto pt-2">
          {hasActive ? (
            <div className="w-full py-2.5 bg-green-100 text-green-700 font-bold rounded-xl text-center text-[11px] uppercase tracking-widest">
              ✅ Sudah Disewa
            </div>
          ) : hasPending ? (
            <div className="w-full py-2.5 bg-amber-100 text-amber-700 font-bold rounded-xl text-center text-[11px] uppercase tracking-widest">
              ⏳ Menunggu Persetujuan
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onViewDetail(property); }}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#EC5B13] hover:text-white text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-[11px] uppercase tracking-widest"
            >
              Lihat Detail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TenantMarketplace() {
  const navigate = useNavigate();

  const [properties,      setProperties]      = useState([]);
  const [myRentals,       setMyRentals]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingRooms,    setLoadingRooms]    = useState(false);
  const [loadingRatings,  setLoadingRatings]  = useState(false);
  const [propertyRatings, setPropertyRatings] = useState({});
  const [error,           setError]           = useState(null);
  const [search,          setSearch]          = useState("");
  const [roomType,        setRoomType]        = useState("Semua");
  const [budgetIdx,       setBudgetIdx]       = useState(0);
  const [activeAmenities, setActiveAmenities] = useState([]);

  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tenant_fav_properties") ?? "[]"); }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("tenant_fav_properties", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFav = (propertyId) =>
    setFavorites(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [propertyId, ...prev]
    );

  // ── Fetch properties + rentals ────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [propRes, rentalRes] = await Promise.allSettled([
        api.get("/properties/marketplace/tenant"),  // ✅ route yang benar
        api.get("/rentals/my-rentals"),
      ]);

        let uniqueProps = [];
        if (propRes.status === "fulfilled") {
          const data = propRes.value.data?.data ?? [];
          const seen = new Set();
          uniqueProps = (Array.isArray(data) ? data : []).filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return ["FUNDED", "READY_TO_RENT", "FULLY_OCCUPIED"].includes(p.status);
      });
          setProperties(uniqueProps);
        } else {
          setError("Gagal memuat properti.");
        }

        if (rentalRes.status === "fulfilled") {
          const raw = rentalRes.value.data?.data;
          setMyRentals(Array.isArray(raw) ? raw : []);
        }

        if (uniqueProps.length > 0) {
          setLoadingRooms(true);
          try {
            const roomResults = await Promise.allSettled(
              uniqueProps.map(p => api.get(`/rooms/${p.id}`))
            );
            setProperties(prev =>
              prev.map((p, idx) => {
                const res = roomResults[idx];
                if (res?.status === "fulfilled") {
                  const rooms = res.value.data?.data;
                  return { ...p, rooms: Array.isArray(rooms) ? rooms : (p.rooms ?? []) };
                }
                return p;
              })
            );
          } catch (err) {
            console.warn("Gagal fetch rooms:", err);
          } finally {
            setLoadingRooms(false);
          }

          fetchRatings(uniqueProps);
        }
      } catch {
        setError("Gagal memuat properti. Pastikan koneksi aktif.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Fetch ratings ─────────────────────────────────────────────────────────
  const fetchRatings = async (props) => {
    if (!props || props.length === 0) return;
    setLoadingRatings(true);
    try {
      const ratingResults = await Promise.allSettled(
        props.map(p =>
          api.get(`/reviews/property/${p.id}`)
            .then(res => ({ propertyId: p.id, reviews: res.data?.data ?? [] }))
            .catch(err => {
              console.error(`Rating fetch error untuk ${p.id}:`, err);
              return { propertyId: p.id, reviews: [] };
            })
        )
      );

      const ratingsMap = {};
      ratingResults.forEach(result => {
        if (result.status !== "fulfilled") return;
        const { propertyId, reviews } = result.value;

        if (!Array.isArray(reviews) || reviews.length === 0) {
          ratingsMap[propertyId] = { avg: 0, count: 0 };
          return;
        }

        const validReviews = reviews.filter(r => typeof r.avgRating === "number");
        if (validReviews.length === 0) {
          ratingsMap[propertyId] = { avg: 0, count: 0 };
          return;
        }

        const total = validReviews.reduce((sum, r) => sum + r.avgRating, 0);
        ratingsMap[propertyId] = {
          avg:   Math.round((total / validReviews.length) * 10) / 10,
          count: validReviews.length,
        };
      });

      setPropertyRatings(ratingsMap);
    } catch (err) {
      console.warn("Gagal fetch ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getRentalStatus = (propertyId) => {
    const rental = myRentals.find(r =>
      r.room?.propertyId === propertyId ||
      r.propertyId === propertyId ||
      r.room?.property?.id === propertyId
    );
    return rental?.status ?? null;
  };

  const toggleAmenity = (label) =>
    setActiveAmenities(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );

  const resetFilter = () => {
    setSearch(""); setRoomType("Semua"); setBudgetIdx(0); setActiveAmenities([]);
  };

  const hasActiveFilter =
    search || roomType !== "Semua" || budgetIdx !== 0 || activeAmenities.length > 0;

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const budget = BUDGETS[budgetIdx];
    const result = properties.filter(p => {
      const matchSearch =
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase());

      const matchType = roomType === "Semua" || p.category === roomType;

      const roomPrices = (p.rooms ?? [])
        .filter(r => r.isAvailable !== false && r.status === "AVAILABLE")
        .map(r => r.pricePerMonth)
        .filter(Boolean);
      const priceCheck =
        roomPrices.length > 0
          ? Math.min(...roomPrices)
          : p.tokenPrice ?? p.rentPrice ?? 0;
      const matchBudget = priceCheck >= budget.min && priceCheck <= budget.max;

      const roomFacSet = new Set(
        (p.rooms ?? []).flatMap(r => r.facilities ?? [])
      );
      const matchAmenities =
        activeAmenities.length === 0 ||
        activeAmenities.every(fac => roomFacSet.has(fac));

      return matchSearch && matchType && matchBudget && matchAmenities;
    });

    return [
      ...result.filter(p => favorites.includes(p.id)),
      ...result.filter(p => !favorites.includes(p.id)),
    ];
  }, [properties, search, roomType, budgetIdx, activeAmenities, favorites]);

  const handleViewDetail = (property) => {
    const status = getRentalStatus(property.id);
    if (status === "ACTIVE")  { navigate("/tenant/room");      return; }
    if (status === "PENDING") { navigate("/tenant/dashboard"); return; }
    navigate(`/tenant/apply/${property.id}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Marketplace" />

      <main className="flex-1 overflow-y-auto">
        <TenantHeader />
        <div className="px-8 md:px-12 py-6 max-w-[1100px]">

          {/* ── Panel Filter ── */}
          <section className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-end border border-slate-200 dark:border-slate-800">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-slate-400">
                Lokasi / Nama Properti
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">location_on</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari kota, kampus, atau nama properti..."
                  className="w-full pl-10 pr-9 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#EC5B13]/30 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="w-full lg:w-44 space-y-1.5">
              <label className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-slate-400">Tipe Kamar</label>
              <select
                value={roomType} onChange={e => setRoomType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#EC5B13]/30 outline-none text-slate-900 dark:text-white text-sm"
              >
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="w-full lg:w-44 space-y-1.5">
              <label className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-slate-400">Anggaran</label>
              <select
                value={budgetIdx} onChange={e => setBudgetIdx(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-[#EC5B13]/30 outline-none text-slate-900 dark:text-white text-sm"
              >
                {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
              </select>
            </div>

            {hasActiveFilter ? (
              <button onClick={resetFilter}
                className="bg-red-50 border border-red-200 text-red-500 p-3 rounded-xl flex items-center justify-center min-w-[48px] hover:bg-red-100 transition-colors shrink-0"
                title="Reset semua filter"
              >
                <span className="material-symbols-outlined">filter_alt_off</span>
              </button>
            ) : (
              <div className="bg-[#EC5B13]/10 text-[#EC5B13] p-3 rounded-xl flex items-center justify-center min-w-[48px] shrink-0">
                <span className="material-symbols-outlined">tune</span>
              </div>
            )}
          </section>

          {/* ── Chip Fasilitas ── */}
          <div className="flex flex-wrap gap-2 mb-5">
            {AMENITY_FILTERS.map(a => {
              const active = activeAmenities.includes(a.label);
              return (
                <button key={a.label} onClick={() => toggleAmenity(a.label)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#EC5B13] text-white shadow-lg shadow-[#EC5B13]/20"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[#EC5B13]/40 hover:text-[#EC5B13]"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{a.icon}</span>
                  {a.label}
                </button>
              );
            })}
          </div>

          {/* ── Info hasil ── */}
          <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              {loading ? "Memuat properti..." : (
                <>
                  Menampilkan{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>
                  {" "}dari{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{properties.length}</span>
                  {" "}properti
                  {favorites.length > 0 && (
                    <span className="text-red-400 font-semibold">
                      · ❤️ {favorites.length} favorit ditampilkan pertama
                    </span>
                  )}
                  {loadingRooms && (
                    <span className="flex items-center gap-1 text-[#EC5B13] text-xs">
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Memuat fasilitas...
                    </span>
                  )}
                  {loadingRatings && !loadingRooms && (
                    <span className="flex items-center gap-1 text-amber-500 text-xs">
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Memuat rating...
                    </span>
                  )}
                </>
              )}
            </p>
            {hasActiveFilter && (
              <button onClick={resetFilter} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">close</span>
                Reset Filter
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && !loading && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-5xl text-red-300">wifi_off</span>
              <p className="font-bold text-slate-500">{error}</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl">
                Coba Lagi
              </button>
            </div>
          )}

          {/* ── Grid Properti ── */}
          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading
                ? [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
                : filtered.length > 0
                ? filtered.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onViewDetail={handleViewDetail}
                      rentalStatus={getRentalStatus(p.id)}
                      isFav={favorites.includes(p.id)}
                      onToggleFav={toggleFav}
                      ratingData={propertyRatings[p.id] ?? null}
                      isLoadingRating={loadingRatings}
                    />
                  ))
                : (
                  <div className="col-span-3 py-20 flex flex-col items-center gap-3 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-300">search_off</span>
                    <p className="text-xl font-bold text-slate-400">Properti tidak ditemukan</p>
                    <p className="text-sm text-slate-400">Coba ubah filter atau kata kunci pencarian</p>
                    <button onClick={resetFilter} className="mt-2 px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl">
                      Reset Filter
                    </button>
                  </div>
                )
              }
            </div>
          )}

          {/* ── Footer ── */}
          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3 mt-6">
            <p>© 2026 PropShare Campus Housing. Seluruh hak cipta dilindungi.</p>
            <div className="flex gap-5">
              <button className="hover:text-[#EC5B13]">Kebijakan Privasi</button>
              <button className="hover:text-[#EC5B13]">Syarat & Ketentuan</button>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
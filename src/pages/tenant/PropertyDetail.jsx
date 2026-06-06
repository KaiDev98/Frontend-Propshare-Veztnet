import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import TenantSidebar from "../../components/TenantSidebar";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />;
}

// ─── Amenity Item ───────────────────────────────────────────────────────────────

function AmenityItem({ icon, label }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#EC5B13]">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{label}</span>
    </div>
  );
}

// ─── Amenity icon mapper ────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  wifi: "wifi", ac: "ac_unit", "air conditioning": "ac_unit",
  laundry: "local_laundry_service", gym: "fitness_center",
  pool: "pool", parking: "local_parking", kitchen: "kitchen",
  desk: "desk", shower: "shower", security: "security",
  elevator: "elevator", garden: "yard", balcony: "balcony",
};

function getAmenityIcon(name = "") {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "check_circle";
}

// ─── Image Gallery ──────────────────────────────────────────────────────────────

function ImageGallery({ images, title }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="grid grid-cols-12 gap-4 mb-12 h-[480px]">
        <div className="col-span-12 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-8xl text-slate-400">apartment</span>
        </div>
      </div>
    );
  }

  const main  = images[activeIdx] ?? images[0];
  const thumbs = images.filter((_, i) => i !== activeIdx).slice(0, 2);

  return (
    <div className="grid grid-cols-12 gap-4 mb-12 h-[480px]">
      {/* Main Image */}
      <div className="col-span-12 md:col-span-8 h-full rounded-2xl overflow-hidden relative group cursor-pointer">
        <img
          src={main.url ?? main}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={e => { e.target.src = ""; e.target.style.display = "none"; }}
        />
        <div className="absolute top-5 left-5 flex gap-2">
          <span className="bg-[#EC5B13] text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
            Available Now
          </span>
          <span className="bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-slate-700">
            Premium Unit
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="hidden md:grid col-span-4 grid-rows-2 gap-4 h-full">
        {thumbs.map((img, i) => (
          <div
            key={i}
            onClick={() => setActiveIdx(images.indexOf(img))}
            className="rounded-2xl overflow-hidden relative group cursor-pointer"
          >
            <img
              src={img.url ?? img}
              alt={`${title} ${i + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={e => { e.target.style.display = "none"; }}
            />
            {i === 1 && images.length > 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-sm">+{images.length - 3} More</span>
              </div>
            )}
          </div>
        ))}

        {/* Fill empty slots */}
        {thumbs.length < 2 && [...Array(2 - thumbs.length)].map((_, i) => (
          <div key={`empty-${i}`} className="rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

// ─── Booking Card ───────────────────────────────────────────────────────────────

function BookingCard({ property, onApply }) {
  const [moveIn,    setMoveIn]    = useState("");
  const [leaseTerm, setLeaseTerm] = useState("12");
  const [viewing,   setViewing]   = useState(false);

  const price    = property?.rentPrice ?? property?.tokenPrice ?? property?.price ?? 0;
  const manager  = property?.owner ?? property?.manager ?? null;
  const managerName = manager?.fullName ?? manager?.name ?? "Property Manager";
  const managerAvatar = manager?.avatar ?? manager?.profilePicture ?? null;
  const managerInitials = managerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const handleBookViewing = async () => {
    setViewing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/properties/${property.id}/viewing`,
        { moveInDate: moveIn, leaseTerm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Permintaan viewing berhasil dikirim! Owner akan menghubungi kamu.");
    } catch {
      alert("Fitur ini belum tersedia. Hubungi admin langsung.");
    } finally {
      setViewing(false);
    }
  };

  return (
    <div className="sticky top-24">
      <div className="bg-white dark:bg-slate-900 p-7 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">

        {/* Price */}
        <div className="mb-7">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              Rp {price.toLocaleString("id-ID")}
            </span>
            <span className="text-slate-500 font-medium">/ bulan</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">verified</span>
            No Broker Fee
          </div>
        </div>

        {/* Move-in & Lease */}
        <div className="space-y-3 mb-7">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Move-in Date
            </label>
            <div className="flex justify-between items-center">
              <input
                type="date"
                value={moveIn}
                onChange={e => setMoveIn(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white text-sm w-full"
              />
              <span className="material-symbols-outlined text-[#EC5B13] text-sm shrink-0">calendar_today</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Lease Term
            </label>
            <div className="flex justify-between items-center">
              <select
                value={leaseTerm}
                onChange={e => setLeaseTerm(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white text-sm w-full appearance-none"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
              <span className="material-symbols-outlined text-[#EC5B13] text-sm shrink-0">expand_more</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onApply}
            className="w-full py-4 bg-[#EC5B13] text-white rounded-xl font-bold text-base hover:bg-[#EC5B13]/90 hover:scale-[1.01] transition-all shadow-lg shadow-[#EC5B13]/20 active:scale-95"
          >
            Ajukan Sewa
          </button>
          <button
            onClick={handleBookViewing}
            disabled={viewing}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.01] transition-all"
          >
            {viewing ? "Mengirim..." : "Book Viewing"}
          </button>
        </div>

        {/* Manager */}
        <div className="mt-7 pt-7 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {managerAvatar ? (
              <img
                src={managerAvatar}
                alt={managerName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#EC5B13]/20 flex items-center justify-center text-[#EC5B13] font-bold">
                {managerInitials}
              </div>
            )}
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">{managerName}</p>
              <p className="text-xs text-slate-500">Property Owner</p>
            </div>
            <button className="ml-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-[#EC5B13]/10 transition-colors">
              <span className="material-symbols-outlined text-[#EC5B13] text-sm">chat</span>
            </button>
          </div>
        </div>

        {/* Viewers count */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          <span>{Math.floor(Math.random() * 20) + 5} people viewing this right now</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const navigate     = useNavigate();
  const { propertyId } = useParams();

  const [property, setProperty] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [mapTab,   setMapTab]   = useState("map");

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const res  = await axios.get(`${BASE_URL}/api/properties/${propertyId}`, { headers });
        const data = res.data?.data ?? res.data;
        setProperty(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Properti tidak ditemukan.");
        } else {
          setError("Gagal memuat detail properti.");
        }
      } finally {
        setLoading(false);
      }
    };
    if (propertyId) fetchProperty();
  }, [propertyId]);

  const images    = property?.images ?? [];
  const amenities = property?.amenities ?? [];
  const price     = property?.rentPrice ?? property?.tokenPrice ?? property?.price ?? 0;

  const specs = [
    property?.bedrooms  != null && { icon: "bed",         label: `${property.bedrooms} Bedroom`  },
    property?.bathrooms != null && { icon: "shower",      label: `${property.bathrooms} Bathroom` },
    property?.floor     != null && { icon: "apartment",   label: `${property.floor}th Floor`      },
    property?.sqft      != null && { icon: "square_foot", label: `${property.sqft} sq ft`         },
    property?.category  && { icon: "category", label: property.category },
  ].filter(Boolean);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">

      <TenantSidebar activeLabel="Marketplace" />

       <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-8 md:px-12 py-10">

          {/* ── Breadcrumb ── */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <button
              onClick={() => navigate("/tenant/marketplace")}
              className="hover:text-[#EC5B13] transition-colors"
            >
              Marketplace
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            {loading ? (
              <span className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse inline-block" />
            ) : (
              <span className="text-slate-900 dark:text-white font-semibold truncate max-w-xs">
                {property?.title ?? "Detail Properti"}
              </span>
            )}
          </nav>

          {/* ── Loading ── */}
          {loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-4 h-[480px]">
                <Skeleton className="col-span-8 h-full" />
                <div className="col-span-4 grid grid-rows-2 gap-4">
                  <Skeleton className="h-full" />
                  <Skeleton className="h-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-10">
                <div className="col-span-2 space-y-4">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-48" />
                </div>
                <Skeleton className="h-[450px]" />
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="py-24 flex flex-col items-center gap-4 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300">
                sentiment_dissatisfied
              </span>
              <p className="text-xl font-bold text-slate-500">{error}</p>
              <button
                onClick={() => navigate("/tenant/marketplace")}
                className="px-6 py-3 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#EC5B13]/90 transition-colors"
              >
                Kembali ke Marketplace
              </button>
            </div>
          )}

          {/* ── Content ── */}
          {!loading && !error && property && (
            <>
              {/* Gallery */}
              <ImageGallery images={images} title={property.title} />

              {/* Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* ── Left Column ── */}
                <div className="md:col-span-2">

                  {/* Title & Location */}
                  <div className="mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                      {property.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                        <span className="font-medium text-sm">
                          {property.location ?? property.address ?? "—"}
                        </span>
                      </div>
                      {property.sqft && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">square_foot</span>
                          <span className="font-medium text-sm">{property.sqft} sq ft</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spec Chips */}
                  {specs.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-10">
                      {specs.map((s, i) => (
                        <div
                          key={i}
                          className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm text-[#EC5B13]">{s.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">
                      Property Overview
                    </h2>
                    {property.description ? (
                      <p className="text-slate-500 dark:text-slate-400 leading-[1.9] text-base whitespace-pre-line">
                        {property.description}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic text-sm">
                        Deskripsi belum tersedia.
                      </p>
                    )}
                  </div>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-7">
                        Building Amenities
                      </h2>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-7">
                        {amenities.map((a, i) => {
                          const name  = typeof a === "string" ? a : a.name ?? "";
                          const icon  = typeof a === "string" ? getAmenityIcon(a) : (a.icon ?? getAmenityIcon(a.name));
                          const label = typeof a === "string" ? a : a.name ?? a.label ?? "";
                          return <AmenityItem key={i} icon={icon} label={label} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Map / Floor Plan */}
                  <div className="mb-12">
                    <div className="flex justify-between items-center mb-7">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Location &amp; Layout
                      </h2>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                        {["map", "floorplan"].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setMapTab(tab)}
                            className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                              mapTab === tab
                                ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {tab === "map" ? "Map View" : "Floor Plan"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-80 w-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative flex items-center justify-center">
                      <span className="material-symbols-outlined text-8xl text-slate-400">
                        {mapTab === "map" ? "map" : "grid_view"}
                      </span>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-10 h-10 bg-[#EC5B13] rounded-full border-4 border-white flex items-center justify-center shadow-lg animate-bounce">
                          <span
                            className="material-symbols-outlined text-white text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            home
                          </span>
                        </div>
                      </div>
                      {property.location && (
                        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600 dark:text-slate-400">
                          📍 {property.location}
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-xl text-xs font-bold text-slate-500">
                        {mapTab === "map" ? "🗺️ Coming Soon" : "📐 Coming Soon"}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {(property.totalUnits || property.availableUnits != null || property.leaseTerms) && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                        Informasi Tambahan
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {property.totalUnits != null && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Unit</p>
                            <p className="font-semibold text-slate-900 dark:text-white mt-1">{property.totalUnits}</p>
                          </div>
                        )}
                        {property.availableUnits != null && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Unit Tersedia</p>
                            <p className={`font-semibold mt-1 ${property.availableUnits === 0 ? "text-red-500" : "text-green-600"}`}>
                              {property.availableUnits} unit
                            </p>
                          </div>
                        )}
                        {property.leaseTerms && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ketentuan Sewa</p>
                            <p className="font-medium text-slate-600 dark:text-slate-400 mt-1 text-sm">
                              {property.leaseTerms}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── Right Column: Booking Card ── */}
                <div>
                  <BookingCard
                    property={property}
                    onApply={() => navigate(`/tenant/apply/${propertyId}`)}
                  />
                </div>

              </div>
            </>
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3 mt-10">
            <p>© 2026 PropShare Campus Housing. All rights reserved.</p>
            <div className="flex gap-5">
              <button className="hover:text-[#EC5B13] transition-colors">Privacy Policy</button>
              <button className="hover:text-[#EC5B13] transition-colors">Terms of Service</button>
              <button className="hover:text-[#EC5B13] transition-colors">House Rules</button>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
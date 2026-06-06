/**
 * LocationPicker.jsx
 *
 * Komponen input lokasi dengan 3 fitur:
 *  1. Ketik alamat → cari via Nominatim → tampil hasil dropdown
 *  2. Mini Leaflet map dengan pin yang bisa di-drag
 *  3. Simpan { location (string), latitude, longitude } ke parent form
 *
 * Props:
 *  - value    : { location: string, latitude: number|null, longitude: number|null }
 *  - onChange : (fields) => void  — dipanggil setiap kali lokasi berubah
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix leaflet default icon ─────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Geocode: alamat → [{ label, lat, lng }] */
async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];
  try {
    const q = encodeURIComponent(query + ", Indonesia");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`,
      { headers: { "Accept-Language": "id,en" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => ({
      label: d.display_name,
      lat:   parseFloat(d.lat),
      lng:   parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

/** Reverse geocode: lat/lng → alamat string */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "id,en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Sinkronkan center peta saat koordinat berubah dari luar */
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 16, { animate: true });
  }, [coords, map]);
  return null;
}

/** Klik di peta → set marker baru */
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

/** Marker yang bisa di-drag */
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);
  const handlers = {
    dragend() {
      const m = markerRef.current;
      if (m) {
        const { lat, lng } = m.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  };
  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={handlers}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocationPicker({ value, onChange }) {
  const [query,       setQuery]       = useState(value?.location ?? "");
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);
  const [mapReady,    setMapReady]    = useState(false);
  const [coords,      setCoords]      = useState(
    value?.latitude && value?.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : null
  );
  const [reverseLoading, setReverseLoading] = useState(false);

  const searchTimer = useRef(null);
  const dropRef     = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce search saat ketik
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ location: val, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null });

    clearTimeout(searchTimer.current);
    if (val.length >= 3) {
      searchTimer.current = setTimeout(async () => {
        setSearching(true);
        const res = await searchAddress(val);
        setResults(res);
        setShowDrop(res.length > 0);
        setSearching(false);
      }, 500);
    } else {
      setResults([]);
      setShowDrop(false);
    }
  };

  // Pilih hasil dropdown
  const handleSelect = (item) => {
    setQuery(item.label);
    setCoords({ lat: item.lat, lng: item.lng });
    onChange({ location: item.label, latitude: item.lat, longitude: item.lng });
    setShowDrop(false);
    setMapReady(true);
  };

  // Klik / drag marker di peta → reverse geocode
  const handleMapPoint = useCallback(async (lat, lng) => {
    setCoords({ lat, lng });
    setReverseLoading(true);
    const addr = await reverseGeocode(lat, lng);
    const label = addr ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setQuery(label);
    onChange({ location: label, latitude: lat, longitude: lng });
    setReverseLoading(false);
  }, [onChange]);

  // Tombol "Cari"
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await searchAddress(query);
    if (res.length > 0) {
      handleSelect(res[0]);
    } else {
      setResults([]);
      setShowDrop(false);
    }
    setSearching(false);
    setMapReady(true);
  };

  const hasCoords = coords?.lat && coords?.lng;

  return (
    <div className="space-y-3">

      {/* ── Search Input ─────────────────────────────────────────────────── */}
      <div className="relative" ref={dropRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              location_on
            </span>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ketik alamat properti, lalu tekan Cari..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-[#EC5B13]/20 focus:border-[#EC5B13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
            />
            {searching && (
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] animate-spin">
                progress_activity
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-5 py-3 rounded-xl bg-[#EC5B13] text-white font-bold text-sm hover:bg-[#d94e0d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Cari
          </button>
        </div>

        {/* Dropdown hasil pencarian */}
        {showDrop && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[#EC5B13] text-[16px] mt-0.5 shrink-0">
                  pin_drop
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[13px] text-[#EC5B13]">info</span>
        Ketik alamat lengkap lalu klik <b>Cari</b>, atau klik / geser pin di peta untuk akurasi lebih tinggi.
      </p>

      {/* ── Mini Map ─────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden border-2 transition-all ${
        hasCoords
          ? "border-[#EC5B13]/40 shadow-md shadow-[#EC5B13]/10"
          : "border-dashed border-slate-200 dark:border-slate-700"
      }`}>

        {!hasCoords ? (
          /* Placeholder sebelum ada koordinat */
          <div
            className="h-[220px] bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-3 cursor-pointer group"
            onClick={handleSearch}
          >
            <div className="w-14 h-14 rounded-full bg-[#EC5B13]/10 flex items-center justify-center group-hover:bg-[#EC5B13]/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-[#EC5B13]">add_location</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">Peta akan muncul setelah alamat ditemukan</p>
            <p className="text-xs text-slate-400">Ketik alamat di atas dan klik Cari</p>
          </div>
        ) : (
          /* Leaflet map */
          <div className="relative">
            <div className="h-[260px]">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={16}
                className="w-full h-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController coords={coords} />
                <ClickHandler onMapClick={handleMapPoint} />
                <DraggableMarker
                  position={[coords.lat, coords.lng]}
                  onDragEnd={handleMapPoint}
                />
              </MapContainer>
            </div>

            {/* Overlay koordinat */}
            <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                {reverseLoading ? (
                  <span className="material-symbols-outlined text-[14px] text-[#EC5B13] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px] text-[#EC5B13]">my_location</span>
                )}
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full shrink-0 ml-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">check_circle</span>
                Tersimpan
              </span>
            </div>

            {/* Hint drag */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">open_with</span>
                Geser pin atau klik peta
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Status koordinat ─────────────────────────────────────────────── */}
      {hasCoords && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          Koordinat GPS tersimpan — peta investor akan akurat
        </div>
      )}
    </div>
  );
}
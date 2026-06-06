import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import TenantSidebar from "../../components/TenantSidebar";
import Swal from "sweetalert2";
import TenantHeader from "../../components/TenantHeader";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: "Menunggu Persetujuan", color: "bg-amber-100 text-amber-700",  icon: "hourglass_top", dot: "bg-amber-500"  },
  ACTIVE:    { label: "Aktif",                color: "bg-green-100 text-green-700",  icon: "check_circle",  dot: "bg-green-500"  },
  REJECTED:  { label: "Ditolak Owner",        color: "bg-red-100 text-red-600",      icon: "cancel",        dot: "bg-red-500"    },
  CANCELLED: { label: "Dibatalkan",           color: "bg-slate-100 text-slate-500",  icon: "do_not_disturb",dot: "bg-slate-400"  }, // ← tambah
  ENDED:     { label: "Selesai",              color: "bg-slate-100 text-slate-600",  icon: "event_available",dot: "bg-slate-400" },
};

// ─── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ rental, onCancel }) {
  const cfg = STATUS_CONFIG[rental.status] ?? STATUS_CONFIG.PENDING;

  // Ambil properti dari room atau langsung dari rental
  const property  = rental.room?.property ?? rental.property ?? null;
  const thumbnail = property?.images?.find(i => i?.url)?.url ?? null;
  const roomNum   = rental.room?.roomNumber ?? null;

  const startDate = rental.startDate
    ? new Date(rental.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const endDate = rental.endDate
    ? new Date(rental.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "Open";

  const createdAt = rental.createdAt
    ? new Date(rental.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">

        {/* Thumbnail */}
        <div className="w-36 shrink-0 bg-slate-100 dark:bg-slate-800 relative">
          {thumbnail ? (
            <img src={thumbnail} alt={property?.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[130px]">
              <span className="material-symbols-outlined text-4xl text-slate-400">apartment</span>
            </div>
          )}
          <span className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot} ${
            rental.status === "PENDING" ? "animate-pulse" : ""
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {property?.title ?? "Properti"}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {property?.location ?? "—"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${cfg.color}`}>
              <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
              {cfg.label}
            </span>
          </div>

          {/* Detail */}
          <div className="flex flex-wrap gap-4 mt-3">
            {roomNum && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-[18px] text-[#EC5B13]">bed</span>
                <span className="font-semibold">Kamar #{roomNum}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-[18px] text-[#EC5B13]">calendar_today</span>
              <span className="font-semibold">{startDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-[18px] text-[#EC5B13]">event</span>
              <span className="font-semibold">{endDate}</span>
            </div>
          </div>

          {/* Notes */}
          {rental.notes && (
            <p className="text-xs text-slate-400 mt-2 italic">"{rental.notes}"</p>
          )}

          {/* Harga */}
          {(rental.room?.pricePerMonth ?? property?.tokenPrice) && (
            <p className="text-sm font-bold text-[#EC5B13] mt-2">
              Rp {(rental.room?.pricePerMonth ?? property?.tokenPrice ?? 0).toLocaleString("id-ID")}
              <span className="text-xs text-slate-400 font-normal"> / bulan</span>
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400">Dibuat: {createdAt}</p>
            <div className="flex gap-2">
              {rental.status === "ACTIVE" && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Sewa Aktif
                </div>
              )}
              {rental.status === "PENDING" && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-sm">hourglass_top</span>
                    Menunggu owner
                  </div>
                  <button
                    onClick={() => onCancel(rental.id)}
                    className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Batalkan
                  </button>
                </>
              )}
              {rental.status === "REJECTED" && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Ditolak owner
                </div>
              )}

              {rental.status === "CANCELLED" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm">do_not_disturb</span>
                  Dibatalkan oleh kamu
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onBrowse }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-slate-400">event_note</span>
      </div>
      <h3 className="text-xl font-bold text-slate-500">Belum ada pengajuan sewa</h3>
      <p className="text-sm text-slate-400 max-w-xs">Kamu belum pernah mengajukan sewa properti. Cari properti dulu!</p>
      <button
        onClick={onBrowse}
        className="px-7 py-3 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#d44e0f] shadow-lg shadow-[#EC5B13]/20"
      >
        Cari Properti
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const navigate = useNavigate();

  const [rentals,   setRentals]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rentals/my-rentals");
      const raw = res.data?.data;
      setRentals(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error("Fetch rentals error:", err);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
    // Polling tiap 30 detik
    const interval = setInterval(fetchRentals, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Cancel rental ──────────────────────────────────────────────────────────
  const handleCancel = async (rentalId) => {
    const ok = await Swal.fire({
      icon: "warning", title: "Batalkan Pengajuan?",
      text: "Pengajuan sewa ini akan dibatalkan.",
      showCancelButton: true, confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8", confirmButtonText: "Ya, Batalkan", cancelButtonText: "Tidak",
    });
    if (!ok.isConfirmed) return;

    try {
      // ✅ Pakai endpoint cancel khusus tenant
      await api.patch(`/rentals/${rentalId}/cancel`);
      setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, status: "CANCELLED" } : r));
      Swal.fire({ icon: "success", title: "Dibatalkan", confirmButtonColor: "#EC5B13", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message ?? "Coba lagi.", confirmButtonColor: "#EC5B13" });
    }
  };

  const TABS = [
    { id: "all",      label: "Semua"              },
    { id: "PENDING",  label: "Menunggu"            },
    { id: "ACTIVE",   label: "Aktif"               },
    { id: "REJECTED", label: "Ditolak / Dibatalkan"},
    { id: "ENDED",    label: "Selesai"             },
  ];

  const filtered    = activeTab === "all" ? rentals : rentals.filter(r => r.status === activeTab);
  const pendingCount = rentals.filter(r => r.status === "PENDING").length;
  const activeCount  = rentals.filter(r => r.status === "ACTIVE").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
      <TenantSidebar activeLabel="My Bookings" />

      <main className="flex-1 overflow-y-auto">
         <TenantHeader />
           <div className="px-8 md:px-12 py-6 max-w-[1100px]">

          {/* Banner Pending */}
          {pendingCount > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 shrink-0 mt-0.5">notifications_active</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">{pendingCount} pengajuan menunggu persetujuan owner</p>
                <p className="text-amber-700 text-xs mt-0.5">Owner akan menyetujui atau menolak dalam 1×24 jam.</p>
              </div>
            </div>
          )}

          {/* Banner Active */}
          {activeCount > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                <div>
                  <p className="font-bold text-green-800 text-sm">{activeCount} sewa aktif</p>
                  <p className="text-green-700 text-xs">Kamu memiliki kontrak sewa yang berjalan.</p>
                </div>
              </div>
              <button onClick={() => navigate("/tenant/room")} className="text-xs font-bold text-green-600 hover:underline">
                Lihat Kamar →
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {TABS.map(tab => {
              const count = tab.id === "all" ? rentals.length : rentals.filter(r => r.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? "bg-[#EC5B13] text-white shadow-lg shadow-[#EC5B13]/20"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-32 flex overflow-hidden">
                  <div className="w-36 bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 p-5 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map(r => (
                <BookingCard key={r.id} rental={r} onCancel={handleCancel} />
              ))}
            </div>
          ) : (
            <EmptyState onBrowse={() => navigate("/tenant/marketplace")} />
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-4 flex items-center justify-between text-xs text-slate-400 mt-10">
            <p>© 2026 PropShare Campus Housing.</p>
            <p>Status diperbarui otomatis setiap 30 detik</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";

const FILTER_TABS = ["All", "Available", "Occupied", "Maintenance"];

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
  );
}

// ─── FIX: status dari DB adalah UPPERCASE (AVAILABLE, OCCUPIED, MAINTENANCE)
// Normalize ke lowercase untuk styling, tapi bandingkan setelah normalize
function RoomCard({ room }) {
  const rawStatus = room.status ?? "AVAILABLE";
  const status    = rawStatus.toLowerCase(); // "available" | "occupied" | "maintenance"

  const styles = {
    occupied:    "border-green-500/30 bg-green-50/50 dark:bg-green-900/10",
    available:   "border-[#EC5B13]/20 bg-[#EC5B13]/5",
    maintenance: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-75",
  };
  const labelStyles = {
    occupied:    "text-green-600",
    available:   "text-[#EC5B13]",
    maintenance: "text-slate-500",
  };

  // ─── FIX: tenant diambil dari room.rentals yang di-include backend ───────────
  const activeRental = room.rentals?.find(r => r.status === "ACTIVE");
  const tenantName   = activeRental?.tenant?.fullName ?? null;

  return (
    <div
      className={`p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all
        ${styles[status] ?? styles.available}`}
    >
      <span className={`text-[10px] font-black mb-1 tracking-widest uppercase ${labelStyles[status] ?? labelStyles.available}`}>
        {status}
      </span>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{room.roomNumber}</p>

      {tenantName && (
        <p className="text-xs text-slate-500 mt-1 truncate w-full px-1" title={tenantName}>
          👤 {tenantName}
        </p>
      )}
      {status === "available" && (
        <p className="text-xs text-slate-400 mt-1 italic">Ready to Lease</p>
      )}
      {status === "maintenance" && (
        <span className="material-symbols-outlined text-sm mt-1 text-slate-500">build</span>
      )}
    </div>
  );
}

export default function ManajemenHunian() {
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [properties,   setProperties]   = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [rooms,        setRooms]        = useState([]);
  const [rentals,      setRentals]      = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search,       setSearch]       = useState("");
  const [activeTab,    setActiveTab]    = useState("rooms");

  // ─── Fetch properties ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res  = await api.get("/properties/my-listings");
        const data = res.data.data ?? [];
        setProperties(data);
        if (data.length > 0) setSelected(data[0].id);
      } catch (err) {
        console.error("Fetch properties error:", err);
      }
    };
    fetchProps();
  }, []);

  // ─── Fetch rooms + rentals ────────────────────────────────────────────────────
  const fetchRoomsAndRentals = useCallback(async (propertyId) => {
    if (!propertyId) return;
    try {
      setLoading(true);

      const [roomsRes, rentalsRes] = await Promise.all([
        api.get(`/rooms/${propertyId}`),
        api.get("/rentals/my-rentals"),
      ]);

      // ─── FIX: rooms sudah include rentals dari backend ─────────────────────
      const fetchedRooms = roomsRes.data.data ?? [];
      setRooms(fetchedRooms);

      const allRentals = rentalsRes.data.data ?? [];

      // Filter rental milik properti yang dipilih
      const filtered = allRentals.filter(r => {
        const viaRoom     = r.room?.propertyId    === propertyId;
        const viaDirect   = r.propertyId          === propertyId;
        const viaRoomProp = r.room?.property?.id  === propertyId;
        return viaRoom || viaDirect || viaRoomProp;
      });

      setRentals(filtered);
      setPayments(filtered.flatMap(r =>
      (r.payments ?? []).map(p => ({ ...p, rental: r }))
      ));
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) fetchRoomsAndRentals(selected);
  }, [selected, fetchRoomsAndRentals]);

  // ─── Stats ─────────────────────────────────────────────────────────────────────
  // FIX: compare uppercase karena status dari DB adalah uppercase
  const totalUnits     = rooms.length;
  const occupiedCount  = rooms.filter(r => r.status === "OCCUPIED").length;
  const availableCount = rooms.filter(r => r.status === "AVAILABLE").length;
  const occupiedPct    = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;
  const pendingRentals = rentals.filter(r => r.status === "PENDING");
  const activeRentals  = rentals.filter(r => r.status === "ACTIVE");

  const monthlyRevenue = payments
  .filter(p => {
    if (p.status !== "VERIFIED") return false;
    const d = new Date(p.paymentDate), now = new Date(); // ← fix di sini
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  })
  .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // ─── Filter rooms ──────────────────────────────────────────────────────────────
  // FIX: bandingkan status uppercase dengan uppercase
  const filteredRooms = rooms.filter(r => {
    const status = r.status ?? "AVAILABLE"; // sudah uppercase
    const matchFilter =
      activeFilter === "All"         ||
      (activeFilter === "Available"   && status === "AVAILABLE")   ||
      (activeFilter === "Occupied"    && status === "OCCUPIED")    ||
      (activeFilter === "Maintenance" && status === "MAINTENANCE");
    const matchSearch =
      !search || r.roomNumber?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ─── Approve / Reject Rental ───────────────────────────────────────────────────
  const handleRentalAction = async (rental, action) => {
    const isApprove  = action === "ACTIVE";
    const tenantName = rental.tenant?.fullName ?? "Tenant";
    const roomNum    = rental.room?.roomNumber ?? "—";

    const ok = await Swal.fire({
      icon:  isApprove ? "question" : "warning",
      title: isApprove ? "Setujui Pengajuan Sewa?" : "Tolak Pengajuan Sewa?",
      html: `
        <div style="text-align:left;font-size:13px;color:#64748b;line-height:2.2">
          👤 Tenant: <b>${tenantName}</b><br/>
          🚪 Kamar: <b>#${roomNum}</b><br/>
          📅 Mulai: <b>${rental.startDate ? new Date(rental.startDate).toLocaleDateString("id-ID") : "—"}</b><br/>
          ${isApprove
            ? `<div style="background:#f0fdf4;padding:10px;border-radius:8px;border:1px solid #bbf7d0;font-size:11px;color:#166534;margin-top:8px">
                ✅ Status kamar akan berubah ke <b>OCCUPIED</b> dan tersimpan di database
               </div>`
            : `<div style="background:#fef2f2;padding:10px;border-radius:8px;border:1px solid #fecaca;font-size:11px;color:#991b1b;margin-top:8px">
                ⚠️ Status kamar akan kembali ke <b>AVAILABLE</b>
               </div>`
          }
        </div>
      `,
      showCancelButton:   true,
      confirmButtonColor: isApprove ? "#EC5B13" : "#ef4444",
      cancelButtonColor:  "#94a3b8",
      confirmButtonText:  isApprove ? "Ya, Setujui!" : "Ya, Tolak!",
      cancelButtonText:   "Batal",
    });

    if (!ok.isConfirmed) return;

    Swal.fire({ title: "Memproses...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await api.patch(`/rentals/${rental.id}/status`, { status: action });

      // Refetch dari DB agar status kamar terupdate
      await fetchRoomsAndRentals(selected);

      await Swal.fire({
        icon:  "success",
        title: isApprove ? "Pengajuan Disetujui! ✅" : "Pengajuan Ditolak",
        html: `
          <div style="font-size:13px;color:#64748b;line-height:2">
            ${isApprove
              ? `Kamar <b>#${roomNum}</b> kini berstatus <b style="color:#16a34a">OCCUPIED</b><br/>
                 Disewa oleh <b>${tenantName}</b>`
              : `Pengajuan dari <b>${tenantName}</b> telah ditolak<br/>
                 Kamar <b>#${roomNum}</b> kembali <b style="color:#EC5B13">AVAILABLE</b>`
            }
          </div>
        `,
        confirmButtonColor: "#EC5B13",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon:               "error",
        title:              "Gagal",
        text:               err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    }
  };

  // ─── Verify Payment ────────────────────────────────────────────────────────────
  const handleVerify = async (paymentId, tenantName, amount) => {
    const ok = await Swal.fire({
      icon:  "question",
      title: "Verifikasi Pembayaran?",
      html: `
        <div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
          Penyewa: <b>${tenantName}</b><br/>
          Jumlah: <b style="color:#EC5B13">Rp ${amount?.toLocaleString("id-ID")}</b>
        </div>
      `,
      showCancelButton:   true,
      confirmButtonColor: "#EC5B13",
      cancelButtonColor:  "#94a3b8",
      confirmButtonText:  "Ya, Verifikasi",
    });
    if (!ok.isConfirmed) return;

    try {
      Swal.fire({ title: "Memverifikasi...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await api.patch(`/payments/${paymentId}/verify`);
      await fetchRoomsAndRentals(selected);
      Swal.fire({
        icon:              "success",
        title:             "Terverifikasi!",
        confirmButtonColor:"#EC5B13",
        timer:             2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon:               "error",
        title:              "Gagal",
        text:               err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    }
  };

  const getPaymentStyle = (status) => {
    if (status === "VERIFIED") return { border: "border-slate-100 dark:border-slate-800",  badge: "bg-green-100 text-green-700",  label: "PAID"    };
    if (status === "PENDING")  return { border: "border-[#EC5B13]/20 bg-[#EC5B13]/5",      badge: "bg-amber-100 text-amber-700",  label: "PENDING" };
    return                            { border: "border-red-200 dark:border-red-900/30",    badge: "bg-red-100 text-red-700",      label: "OVERDUE" };
  };

  const getRentalProperty = (rental) => rental.room?.property ?? rental.property ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Manajemen Hunian" />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manajemen Hunian</h2>
            <p className="text-sm text-slate-500">Kelola unit dan penyewa properti kamu</p>
          </div>
          <div className="flex items-center gap-4">
            {properties.length > 1 && (
              <select
                value={selected || ""}
                onChange={e => setSelected(e.target.value)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#EC5B13] text-slate-700 dark:text-white"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari unit..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none w-52 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => fetchRoomsAndRentals(selected)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-[#EC5B13]/10 hover:text-[#EC5B13] transition-colors"
              title="Refresh data"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label:   "Total Kamar",
                  value:   totalUnits,
                  sub:     `${availableCount} tersedia`,
                  icon:    "domain",
                  iconBg:  "bg-blue-50 text-blue-600",
                },
                {
                  label:    "Terisi",
                  value:    occupiedCount,
                  sub:      `${occupiedPct}% occupancy`,
                  icon:     "person_pin_circle",
                  iconBg:   "bg-green-50 text-green-600",
                  progress: occupiedPct,
                },
                {
                  label:  "Pending Sewa",
                  value:  pendingRentals.length,
                  sub:    "Menunggu persetujuan",
                  icon:   "hourglass_top",
                  iconBg: "bg-amber-50 text-amber-600",
                },
                {
                  label:      "Revenue Bulan",
                  value: `Rp ${monthlyRevenue.toLocaleString("id-ID")}`,
                  sub:        `${payments.filter(p => p.status === "VERIFIED").length} pembayaran`,
                  icon:       "payments",
                  iconBg:     "bg-[#EC5B13]/10 text-[#EC5B13]",
                  valueColor: "text-[#EC5B13]",
                },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <h3 className={`text-2xl font-bold ${s.valueColor ?? "text-slate-900 dark:text-white"}`}>{s.value}</h3>
                  {s.progress !== undefined && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                    </div>
                  )}
                  {s.sub && <p className="text-xs text-slate-500 mt-1">{s.sub}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
            {[
              { key: "rooms",     label: "Unit Kamar",       count: rooms.length,                                        badge: false },
              { key: "pengajuan", label: "Pengajuan Sewa",   count: pendingRentals.length,                               badge: true  },
              { key: "tenant",    label: "Tenant Aktif",     count: activeRentals.length,                                badge: false },
              { key: "payment",   label: "Verifikasi Bayar", count: payments.filter(p => p.status === "PENDING").length, badge: true  },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#EC5B13] text-[#EC5B13]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    tab.badge && tab.count > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Unit Kamar ── */}
          {activeTab === "rooms" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Room Availability ({filteredRooms.length} unit)
                  </h3>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1 text-[#EC5B13]">
                      <span className="w-2 h-2 rounded-full bg-[#EC5B13] inline-block" /> Available
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Occupied
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Maintenance
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {FILTER_TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        activeFilter === tab
                          ? "bg-[#EC5B13] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : filteredRooms.length > 0 ? (
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredRooms.map(room => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">meeting_room</span>
                  <p className="text-slate-400 text-sm">Tidak ada unit ditemukan</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Pengajuan Sewa ── */}
          {activeTab === "pengajuan" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">Pengajuan Sewa Masuk</h3>
                <p className="text-sm text-slate-500 mt-0.5">Setujui atau tolak pengajuan dari tenant</p>
              </div>

              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : pendingRentals.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingRentals.map(rental => {
                    const tenant   = rental.tenant ?? {};
                    const initials = tenant.fullName
                      ? tenant.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                      : "?";
                    const propName = getRentalProperty(rental)?.title ?? "—";
                    const roomNum  = rental.room?.roomNumber ?? "Tanpa kamar";

                    return (
                      <div key={rental.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{tenant.fullName ?? "—"}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                              <span>🏠 {propName}</span>
                              <span>🚪 Kamar #{roomNum}</span>
                              <span>📅 {rental.startDate ? new Date(rental.startDate).toLocaleDateString("id-ID") : "—"}</span>
                              {rental.endDate && <span>→ {new Date(rental.endDate).toLocaleDateString("id-ID")}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase">Pending</span>
                          <button
                            onClick={() => handleRentalAction(rental, "REJECTED")}
                            className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleRentalAction(rental, "ACTIVE")}
                            className="px-4 py-2 text-xs font-bold text-white bg-[#EC5B13] hover:bg-[#d44e0f] rounded-xl transition-colors shadow-sm"
                          >
                            Setujui ✓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-slate-300">inbox</span>
                  <p className="text-slate-400 font-medium">Tidak ada pengajuan masuk</p>
                  <p className="text-slate-400 text-xs">Pengajuan baru dari tenant akan muncul di sini</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Tenant Aktif ── */}
          {activeTab === "tenant" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Tenant Aktif</h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                  {activeRentals.length} aktif
                </span>
              </div>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : activeRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        {["Tenant", "Properti", "Kamar", "Mulai", "Selesai", "Action"].map(h => (
                          <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeRentals.map(rental => {
                        const tenant   = rental.tenant ?? {};
                        const initials = tenant.fullName
                          ? tenant.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                          : "?";
                        const propName = getRentalProperty(rental)?.title ?? "—";
                        return (
                          <tr key={rental.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#EC5B13]/10 text-[#EC5B13] flex items-center justify-center text-xs font-bold shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">{tenant.fullName ?? "—"}</p>
                                  <p className="text-xs text-slate-400">{tenant.email ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{propName}</td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {rental.room?.roomNumber ? `#${rental.room.roomNumber}` : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {rental.startDate ? new Date(rental.startDate).toLocaleDateString("id-ID") : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {rental.endDate ? new Date(rental.endDate).toLocaleDateString("id-ID") : "Open"}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleRentalAction(rental, "REJECTED")}
                                className="text-xs text-red-500 hover:underline font-bold"
                              >
                                Akhiri Kontrak
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                  <p className="text-slate-400 text-sm">Belum ada penyewa aktif</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Verifikasi Bayar ── */}
{activeTab === "payment" && (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
      <h3 className="font-bold text-slate-900 dark:text-white">Verifikasi Pembayaran</h3>
    </div>

    {/* ── Ringkasan Pembagian Sewa ── */}
    {(() => {
      const verifiedPayments = payments.filter(p => p.status === "VERIFIED");
      const totalVerified    = verifiedPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
      const investorShare    = totalVerified * 0.8;
      const ownerShare       = totalVerified * 0.2;
      if (totalVerified === 0) return null;
      return (
        <div className="mx-6 mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Ringkasan Pembagian Sewa
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Total Sewa Masuk</p>
              <p className="font-bold text-slate-900 dark:text-white">
                Rp {totalVerified.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400">{verifiedPayments.length} pembayaran</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Ke Investor (80%)</p>
              <p className="font-bold text-blue-600">
                Rp {investorShare.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400">dibagi proporsional token</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Bagian Kamu (20%)</p>
              <p className="font-bold text-[#EC5B13]">
                Rp {ownerShare.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400">setelah distribusi investor</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: "80%" }} />
            <div className="bg-[#EC5B13] h-full" style={{ width: "20%" }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>80% Investor</span>
            <span>20% Owner</span>
          </div>
        </div>
      );
    })()}

    {/* ── List Pembayaran ── */}
          <div className="p-6 space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : recentPayments.length > 0 ? (
              recentPayments.map(payment => {
                const style      = getPaymentStyle(payment.status);
                const tenantName = payment.rental?.tenant?.fullName ?? "Penyewa";
                const roomNum    = payment.rental?.room?.roomNumber ?? "—";
                const isVerified = payment.status === "VERIFIED";
                const ownerCut   = (payment.amount ?? 0) * 0.2;
                const investorCut = (payment.amount ?? 0) * 0.8;

                return (
                  <div key={payment.id} className={`p-4 rounded-xl border ${style.border}`}>
                    {/* Row 1: Unit + Badge */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Unit #{roomNum}</p>
                        <p className="text-xs text-slate-500">{tenantName}</p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>

                    {/* Row 2: Amount + Action */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Rp {payment.amount?.toLocaleString("id-ID") ?? "0"}
                      </p>
                      {isVerified ? (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                        >
                          Terverifikasi
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(payment.id, tenantName, payment.amount)}
                          className="px-4 py-1.5 bg-[#EC5B13] text-white text-xs font-bold rounded-lg hover:bg-[#d44e0f] transition-colors"
                        >
                          Verify Now
                        </button>
                      )}
                    </div>

                    {/* Row 3: Breakdown (hanya jika sudah VERIFIED) */}
                    {isVerified && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-[11px] text-slate-500">
                            Investor: <b className="text-blue-600">Rp {investorCut.toLocaleString("id-ID")}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#EC5B13] shrink-0" />
                          <span className="text-[11px] text-slate-500">
                            Kamu: <b className="text-[#EC5B13]">Rp {ownerCut.toLocaleString("id-ID")}</b>
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-green-500 text-[16px] ml-auto">
                          check_circle
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">receipt_long</span>
                <p className="text-slate-400 text-sm">Belum ada pembayaran</p>
              </div>
            )}
                </div>
              </div>
            )}

        </div>
      </main>
    </div>
  );
}
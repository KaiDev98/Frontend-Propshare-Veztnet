import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import api from "../../utils/api";
import TenantHeader from "../../components/TenantHeader";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

function RentalStatusBadge({ status }) {
  const config = {
    PENDING:  { label: "⏳ Menunggu Persetujuan", className: "bg-amber-100 text-amber-700 border border-amber-200" },
    ACTIVE:   { label: "✅ Aktif",                className: "bg-green-100 text-green-700 border border-green-200" },
    REJECTED: { label: "❌ Ditolak",              className: "bg-red-100 text-red-700 border border-red-200"      },
  };
  const conf = config[status] ?? config.PENDING;
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-xl ${conf.className}`}>
      {conf.label}
    </span>
  );
}

const FACILITY_ICON_MAP = {
  "AC":                 { icon: "ac_unit",              label: "AC",             color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20",      hover: "group-hover:bg-blue-100 group-hover:text-blue-600"      },
  "WiFi":               { icon: "wifi",                  label: "WiFi",           color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20",  hover: "group-hover:bg-indigo-100 group-hover:text-indigo-600"  },
  "Kasur":              { icon: "bed",                   label: "Kasur",          color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20",    hover: "group-hover:bg-amber-100 group-hover:text-amber-600"    },
  "Lemari":             { icon: "shelves",               label: "Lemari",         color: "text-yellow-600",  bg: "bg-yellow-50 dark:bg-yellow-900/20",  hover: "group-hover:bg-yellow-100 group-hover:text-yellow-600"  },
  "Kamar Mandi Dalam":  { icon: "shower",                label: "Kamar Mandi",   color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-900/20",      hover: "group-hover:bg-cyan-100 group-hover:text-cyan-600"      },
  "Dapur Bersama":      { icon: "kitchen",               label: "Dapur Bersama", color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-900/20",  hover: "group-hover:bg-orange-100 group-hover:text-orange-600"  },
  "Parkir Motor":       { icon: "two_wheeler",           label: "Parkir Motor",  color: "text-green-600",   bg: "bg-green-50 dark:bg-green-900/20",    hover: "group-hover:bg-green-100 group-hover:text-green-600"    },
  "Parkir Mobil":       { icon: "directions_car",        label: "Parkir Mobil",  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20",hover: "group-hover:bg-emerald-100 group-hover:text-emerald-600" },
  "CCTV":               { icon: "videocam",              label: "CCTV",           color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20",        hover: "group-hover:bg-red-100 group-hover:text-red-600"        },
  "Laundry":            { icon: "local_laundry_service", label: "Laundry",        color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20",  hover: "group-hover:bg-purple-100 group-hover:text-purple-600"  },
};

function getFacilityConfig(name) {
  return FACILITY_ICON_MAP[name] ?? {
    icon: "check_circle", label: name,
    color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800",
    hover: "group-hover:bg-slate-200 group-hover:text-slate-700",
  };
}

export default function DashboardTenant() {
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [rental,   setRental]   = useState(null);
  const [payments, setPayments] = useState([]);
  const [reports,  setReports]  = useState([]);
  const [user,     setUser]     = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [rentalRes, reportRes] = await Promise.allSettled([
          api.get("/rentals/my-rentals"),
          api.get("/reports"),
        ]);

        if (rentalRes.status === "fulfilled") {
          const raw     = rentalRes.value.data?.data;
          const rentals = Array.isArray(raw) ? raw : [];
          const active  = rentals.find((r) => r.status === "ACTIVE")
                       ?? rentals.find((r) => r.status === "PENDING")
                       ?? rentals[0] ?? null;
          setRental(active);
          if (active?.payments) setPayments(Array.isArray(active.payments) ? active.payments : []);
        }

        if (reportRes.status === "fulfilled") {
          const raw = reportRes.value.data?.data;
          setReports(Array.isArray(raw) ? raw : []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const property       = rental?.room?.property ?? null;
  const room           = rental?.room ?? null;
  const thumbnail      = property?.images?.find((img) => img?.url)?.url ?? null;
  const pendingPayment = payments.find((p) => p.status === "PENDING");
  const paidPayments   = payments.filter((p) => p.status === "VERIFIED");
  const nextDue        = new Date(); nextDue.setDate(28);
  const diffDays       = Math.ceil((nextDue - new Date()) / (1000 * 60 * 60 * 24));
  const facilities     = room?.facilities ?? [];

  // ✅ Fungsi navigate ke halaman payment dengan state berisi data rental
  const handlePayRent = () => {
    navigate("/tenant/payments", {
      state: {
        rentalId:    rental?.id,
        roomNumber:  room?.roomNumber,
        propertyTitle: property?.title,
        amount:      room?.pricePerMonth ?? property?.tokenPrice ?? 0,
        month:       new Date().getMonth() + 1,
        year:        new Date().getFullYear(),
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Dashboard" />

      <main className="flex-1 flex flex-col min-h-screen">
        <TenantHeader />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* ── Hero ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-slate-900 text-white p-8 flex flex-col justify-end min-h-[240px]">
              {thumbnail ? (
                <img src={thumbnail} alt={property?.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="relative z-10">
                {loading ? (
                  <><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-80" /></>
                ) : (
                  <>
                    <h2 className="text-3xl font-black mb-2">
                      Selamat datang, {user?.fullName?.split(" ")[0] ?? "Penyewa"}!
                    </h2>
                    <p className="text-slate-300 max-w-md">
                      {rental?.status === "PENDING"
                        ? "⏳ Pengajuan sewa sedang menunggu persetujuan owner."
                        : rental?.status === "ACTIVE"
                        ? `Masa sewa kamu di ${property?.title ?? "properti"} sudah aktif!`
                        : rental?.status === "REJECTED"
                        ? "❌ Pengajuan ditolak. Coba ajukan ke properti lain."
                        : "Belum ada kamar aktif. Temukan properti di Marketplace!"}
                    </p>
                  </>
                )}
                <div className="mt-6 flex gap-3">
                  <button onClick={() => navigate("/tenant/room")} className="bg-[#EC5B13] px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:brightness-110">
                    Lihat Detail Sewa
                  </button>
                  <button onClick={() => navigate("/tenant/marketplace")} className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20">
                    Marketplace
                  </button>
                </div>
              </div>
            </div>

            {/* Sewa Saat Ini */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" /><Skeleton className="h-8 w-48" /><Skeleton className="h-20" />
                </div>
              ) : rental ? (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#EC5B13]/10 text-[#EC5B13] text-[10px] font-bold uppercase px-2 py-1 rounded">
                      Sewa Saat Ini
                    </span>
                    <RentalStatusBadge status={rental.status} />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{property?.title ?? "Properti"}</h3>
                  <p className="text-slate-500 text-sm mb-4">Kamar #{room?.roomNumber ?? "—"}, {property?.location ?? "—"}</p>

                  {rental.status === "PENDING" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                      <p className="text-xs text-amber-700 font-medium">⏳ Menunggu persetujuan owner. Biasanya 1-24 jam.</p>
                    </div>
                  )}
                  {rental.status === "REJECTED" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                      <p className="text-xs text-red-700 font-medium">❌ Pengajuan ditolak oleh owner.</p>
                      <button onClick={() => navigate("/tenant/marketplace")} className="mt-2 text-xs text-red-600 font-bold hover:underline">
                        Cari Properti Lain →
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Tanggal Masuk</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {rental.startDate ? new Date(rental.startDate).toLocaleDateString("id-ID") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-lg">receipt</span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Sudah Dibayar</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{paidPayments.length} bulan</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300">bed</span>
                  <p className="text-slate-400 text-sm">Belum ada kamar aktif</p>
                  <button onClick={() => navigate("/tenant/marketplace")} className="px-4 py-2 bg-[#EC5B13] text-white text-xs font-bold rounded-xl">
                    Cari Properti
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Grid Utama ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* ✅ Bayar Sewa — hanya tampil kalau ACTIVE */}
              {rental?.status === "ACTIVE" && (
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-[#EC5B13]/10 flex items-center justify-center text-[#EC5B13]">
                        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pembayaran Sewa Bulanan</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-[#EC5B13] animate-pulse" />
                          <p className={`font-bold text-sm ${diffDays <= 3 ? "text-red-500" : "text-[#EC5B13]"}`}>
                            Jatuh tempo dalam {diffDays} hari
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        Rp {(room?.pricePerMonth ?? property?.tokenPrice ?? 0).toLocaleString("id-ID")}
                      </p>
                      {/* ✅ Jika ada pending payment → tampil badge, bukan tombol */}
                      {pendingPayment ? (
                        <span className="mt-2 inline-block px-6 py-2 bg-amber-100 text-amber-700 text-sm font-bold rounded-xl">
                          Menunggu Verifikasi
                        </span>
                      ) : (
                        // ✅ Tombol langsung navigate ke /tenant/payments
                        <button
                          onClick={handlePayRent}
                          className="mt-2 px-8 py-3 bg-[#EC5B13] text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">payments</span>
                          Bayar Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <p className="text-xs text-slate-500">{paidPayments.length} pembayaran terverifikasi</p>
                    <button onClick={() => navigate("/tenant/payments")} className="text-xs font-bold text-[#EC5B13] hover:underline">
                      Lihat Riwayat
                    </button>
                  </div>
                </div>
              )}

              {/* Fasilitas Properti */}
              <section>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Fasilitas Properti</h3>

                {loading && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                  </div>
                )}

                {!loading && facilities.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {facilities.map((name) => {
                      const cfg = getFacilityConfig(name);
                      return (
                        <div
                          key={name}
                          className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center hover:border-[#EC5B13]/40 cursor-pointer group shadow-sm transition-all"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${cfg.bg} ${cfg.color} ${cfg.hover}`}>
                            <span className="material-symbols-outlined text-2xl">{cfg.icon}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{cfg.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && facilities.length === 0 && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center gap-2 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300">category</span>
                    <p className="text-sm text-slate-400">Belum ada fasilitas terdaftar</p>
                  </div>
                )}
              </section>

            </div>

            {/* ── Kolom Kanan ── */}
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-[#EC5B13]">campaign</span>Pembaruan Terbaru
                </h3>
                <div className="space-y-4">
                  {loading ? (
                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)
                  ) : paidPayments.length > 0 ? (
                    paidPayments.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bukti Pembayaran</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Sewa Dikonfirmasi ✅</p>
                        <p className="text-xs text-slate-500">Rp {p.amount?.toLocaleString("id-ID")} telah terverifikasi</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-[#EC5B13]/20 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EC5B13]" />
                      <p className="text-[10px] font-bold text-[#EC5B13] uppercase mb-1">Selamat Datang</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Hai, Selamat Datang! 👋</p>
                      <p className="text-xs text-slate-500">Mulai jelajahi fitur PropShare Campus.</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/tenant/notifications")}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-[#EC5B13] flex items-center justify-center gap-2"
                  >
                    Lihat Pusat Notifikasi <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* ── Tiket Pemeliharaan ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tiket Pemeliharaan</h3>
              <button
                onClick={() => navigate("/tenant/maintenance")}
                className="flex items-center gap-2 text-[#EC5B13] font-bold text-sm"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>Tiket Baru
              </button>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-6 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
              ) : reports.length > 0 ? (
                <>
                  {reports.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                          <span className="material-symbols-outlined">build</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</p>
                          <p className="text-xs text-slate-500">#{r.id.slice(0, 8).toUpperCase()} • {r.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                        r.status === "RESOLVED"    ? "bg-green-100 text-green-700" :
                        r.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" :
                                                     "bg-blue-100 text-blue-700"
                      }`}>
                        {r.status === "IN_PROGRESS" ? "Sedang Dikerjakan"
                         : r.status === "RESOLVED"  ? "Selesai"
                         :                            "Baru"}
                      </span>
                    </div>
                  ))}
                  <div className="p-4 text-center">
                    <button
                      onClick={() => navigate("/tenant/maintenance")}
                      className="text-xs font-bold text-slate-400 hover:text-[#EC5B13]"
                    >
                      Lihat Semua
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-12 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">build_circle</span>
                  <p className="text-slate-400 text-sm">Belum ada tiket pemeliharaan</p>
                </div>
              )}
            </div>
          </section>

        </div>

        <footer className="mt-auto p-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-slate-400 text-xs gap-4">
          <p>© 2026 PropShare Campus Housing. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#EC5B13]">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#EC5B13]">Syarat & Ketentuan</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
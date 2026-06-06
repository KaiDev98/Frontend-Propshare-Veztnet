import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";
import TenantHeader from "../../components/TenantHeader";
import QRCode from "qrcode";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

// ─── Facility icon map ────────────────────────────────────────────────────────
const FACILITY_ICON_MAP = {
  "AC":                 { icon: "ac_unit",              color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20"       },
  "WiFi":               { icon: "wifi",                  color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20"   },
  "Kasur":              { icon: "bed",                   color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20"     },
  "Lemari":             { icon: "shelves",               color: "text-yellow-600",  bg: "bg-yellow-50 dark:bg-yellow-900/20"   },
  "Kamar Mandi Dalam":  { icon: "shower",                color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-900/20"       },
  "Dapur Bersama":      { icon: "kitchen",               color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-900/20"   },
  "Parkir Motor":       { icon: "two_wheeler",           color: "text-green-600",   bg: "bg-green-50 dark:bg-green-900/20"     },
  "Parkir Mobil":       { icon: "directions_car",        color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  "CCTV":               { icon: "videocam",              color: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20"         },
  "Laundry":            { icon: "local_laundry_service", color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20"   },
};

function getFacilityConfig(name) {
  return FACILITY_ICON_MAP[name] ?? {
    icon: "check_circle",
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
  };
}

const DEFAULT_AMENITIES = ["AC", "WiFi", "Kasur", "Kamar Mandi Dalam"];

// ─── Room status helpers ──────────────────────────────────────────────────────
function roomStatusBadge(status) {
  switch (status) {
    case "OCCUPIED":    return "bg-green-500";
    case "AVAILABLE":   return "bg-blue-500";
    case "MAINTENANCE": return "bg-yellow-500";
    default:            return "bg-slate-500";
  }
}

function roomStatusLabel(status) {
  switch (status) {
    case "OCCUPIED":    return "Ditempati";
    case "AVAILABLE":   return "Tersedia";
    case "MAINTENANCE": return "Perbaikan";
    default:            return status ?? "Tidak Diketahui";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RoomTenant() {
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [rental,    setRental]    = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [user,      setUser]      = useState(null);

  // ─── Load user dari localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  // ─── Fetch rental aktif ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res     = await api.get("/rentals/my-rentals");
        const raw     = res.data?.data;
        const rentals = Array.isArray(raw) ? raw : [];

        // Hanya ambil rental yang benar-benar ACTIVE
        const active  = rentals.find((r) => r.status === "ACTIVE") ?? null;
        setRental(active);

        if (active) {
          // Sync payments dari rental aktif
          setPayments(Array.isArray(active.payments) ? active.payments : []);

          // Ambil tetangga (kamar lain di properti yang sama, status OCCUPIED)
          if (active.room?.propertyId) {
            try {
              const roomsRes = await api.get(`/rooms/${active.room.propertyId}`);
              const rooms    = Array.isArray(roomsRes.data?.data) ? roomsRes.data.data : [];
              setNeighbors(
                rooms
                  .filter((r) => r.id !== active.roomId && r.status === "OCCUPIED")
                  .slice(0, 4)
              );
            } catch { /* skip jika gagal */ }
          }
        }
      } catch (err) {
        console.error("Fetch room error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────
  const property       = rental?.room?.property ?? null;
  const room           = rental?.room ?? null;
  const thumbnail      = property?.images?.find((img) => img?.url)?.url ?? null;
  const rentAmount     = room?.pricePerMonth ?? 0;
  const pendingPayment = payments.find((p)  => p.status === "PENDING");
  const paidPayments   = payments.filter((p) => p.status === "VERIFIED");

  const nextDue = new Date();
  nextDue.setMonth(nextDue.getMonth() + 1);
  nextDue.setDate(1);

  // ─── Handler: Bayar Sewa ──────────────────────────────────────────────────
  // PERUBAHAN: tidak lagi POST langsung dari sini.
  // Redirect ke /tenant/payments yang sudah punya flow lengkap
  // (manual transfer + MetaMask), sehingga logic pembayaran tidak duplikat.
  const handlePayRent = () => {
    if (!rental) {
      Swal.fire({
        icon: "warning",
        title: "Belum Ada Kamar Aktif",
        confirmButtonColor: "#EC5B13",
      });
      return;
    }

    if (pendingPayment) {
      Swal.fire({
        icon: "info",
        title: "Pembayaran Sedang Diproses",
        text: "Ada pembayaran yang sedang menunggu verifikasi owner.",
        confirmButtonColor: "#EC5B13",
      });
      return;
    }

    // Redirect ke halaman Payment yang sudah lengkap
    navigate("/tenant/payments");
  };

  // ─── Handler: Laporkan Masalah ────────────────────────────────────────────
  const handleReportIssue = () => navigate("/tenant/maintenance");

  // ─── Handler: Akses Tamu (QR Code) ───────────────────────────────────────
  const handleGuestAccess = async () => {
    if (!rental) {
      Swal.fire({
        icon: "warning",
        title: "Belum Ada Kamar Aktif",
        confirmButtonColor: "#EC5B13",
      });
      return;
    }

    const tenantName = user?.fullName ?? "Penyewa";
    const roomNo     = room?.roomNumber ?? "—";
    const propName   = property?.title  ?? "PropShare";
    const expiry     = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });

    const qrData = JSON.stringify({
      type:     "GUEST_ACCESS",
      tenant:   tenantName,
      room:     roomNo,
      property: propName,
      expires:  expiry,
      token:    btoa(`${user?.id}-${Date.now()}`).slice(0, 16),
    });

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 200, margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
    } catch (err) {
      console.error("QR error:", err);
    }

    Swal.fire({
      title: "QR Code Akses Tamu",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px">
          ${qrDataUrl
            ? `<img src="${qrDataUrl}" style="width:200px;height:200px;border-radius:12px;border:3px solid #EC5B13" />`
            : `<div style="width:200px;height:200px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#94a3b8">QR tidak tersedia</div>`
          }
          <div style="background:#f8f6f6;padding:12px 16px;border-radius:10px;font-size:12px;color:#64748b;text-align:left;width:100%;line-height:2">
            👤 Penyewa: <b>${tenantName}</b><br/>
            🏠 Kamar: <b>#${roomNo} — ${propName}</b><br/>
            ⏰ Berlaku sampai: <b>${expiry}</b>
          </div>
          <p style="font-size:11px;color:#94a3b8;margin:0">Tunjukkan QR ini ke petugas keamanan untuk akses tamu</p>
        </div>
      `,
      confirmButtonColor: "#EC5B13",
      confirmButtonText: "Tutup",
    });
  };

  // ─── Quick Actions ────────────────────────────────────────────────────────
  const QUICK_ACTIONS = [
    {
      icon: "report",
      iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
      label: "Laporkan Masalah",
      sub: "Permintaan perbaikan",
      onClick: handleReportIssue,
    },
    {
      icon: "person_add",
      iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      label: "Akses Tamu",
      sub: "Buat kode QR tamu",
      onClick: handleGuestAccess,
    },
    {
      icon: "rate_review",
      iconBg: "bg-[#EC5B13]/10 text-[#EC5B13]",
      label: "Review",
      sub: "Beri ulasan hunian",
      onClick: () => navigate("/tenant/review"),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="My Room" />

      <main className="flex-1 flex flex-col min-h-screen">
        <TenantHeader />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

          {/* ── Empty State: tidak ada rental ACTIVE ── */}
          {!loading && !rental && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">bed</span>
              </div>
              <p className="text-xl font-bold text-slate-600">Anda belum menyewa property</p>
              <p className="text-sm text-slate-400 text-center max-w-sm">
                Sepertinya ajuan sewa Anda belum ada yang aktif atau telah ditolak oleh owner.
              </p>
              <button
                onClick={() => navigate("/tenant/marketplace")}
                className="px-6 py-3 bg-[#EC5B13] text-white font-bold rounded-xl shadow-lg shadow-[#EC5B13]/20 transition-transform active:scale-95"
              >
                Cari Properti Sekarang
              </button>
            </div>
          )}

          {/* ── Hero: Foto + Kartu Keuangan ── */}
          {(loading || rental) && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {loading ? (
                <>
                  <Skeleton className="lg:col-span-2 h-[350px]" />
                  <Skeleton className="h-[350px]" />
                </>
              ) : (
                <>
                  {/* Foto Kamar */}
                  <div className="lg:col-span-2 relative h-[350px] rounded-xl overflow-hidden shadow-sm group">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={property?.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-8xl text-white/20">apartment</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`${roomStatusBadge(room?.status)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                          {roomStatusLabel(room?.status)}
                        </span>
                        <span className="bg-[#EC5B13] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                          {room?.roomType ?? property?.category ?? "Unit"}
                        </span>
                      </div>
                      <h3 className="text-white text-3xl font-bold">{property?.title ?? "—"}</h3>
                      <p className="text-slate-200">Kamar #{room?.roomNumber ?? "—"} • {property?.location ?? "—"}</p>
                    </div>
                  </div>

                  {/* Kartu Keuangan */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Status Keuangan</h4>
                        <span className="material-symbols-outlined text-[#EC5B13]">account_balance_wallet</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">Harga Sewa / Bulan</p>
                      <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                        Rp {rentAmount.toLocaleString("id-ID")}
                      </p>
                      <div className="p-3 bg-[#EC5B13]/5 rounded-lg border border-[#EC5B13]/10 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="material-symbols-outlined text-sm">event</span>
                          <span>
                            Jatuh tempo:{" "}
                            <strong>
                              {nextDue.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                          <span>Bulan Terbayar</span>
                          <span className="text-emerald-500">{paidPayments.length}x</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                          <span>Status Terakhir</span>
                          <span className={pendingPayment ? "text-amber-500" : "text-emerald-500"}>
                            {pendingPayment ? "Menunggu Verifikasi" : "Lunas"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Bayar / Status Pending */}
                    {pendingPayment ? (
                      <div className="mt-6 w-full py-4 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">pending</span>
                        Menunggu Verifikasi
                      </div>
                    ) : (
                      <button
                        onClick={handlePayRent}
                        disabled={!rental}
                        className="w-full bg-[#EC5B13] hover:bg-[#d44e0f] text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#EC5B13]/20 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined">payments</span>
                        Bayar Sewa Sekarang
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── Detail Kamar + Aksi Cepat ── */}
          {(loading || rental) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {loading ? (
                <>
                  <Skeleton className="lg:col-span-2 h-56" />
                  <Skeleton className="h-56" />
                </>
              ) : (
                <>
                  {/* Detail Kamar */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#EC5B13]">info</span>
                      Detail Kamar &amp; Fasilitas
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Nomor Kamar</p>
                          <p className="font-medium text-slate-900 dark:text-white">#{room?.roomNumber ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Mulai Sewa</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {rental?.startDate
                              ? new Date(rental.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Selesai Sewa</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {rental?.endDate
                              ? new Date(rental.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                              : "Kontrak Terbuka"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Status Kamar</p>
                          <p className={`font-bold ${
                            room?.status === "OCCUPIED"    ? "text-emerald-500" :
                            room?.status === "MAINTENANCE" ? "text-amber-500"   : "text-blue-500"
                          }`}>
                            {roomStatusLabel(room?.status)}
                          </p>
                        </div>
                      </div>

                      {/* Fasilitas */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-3">Fasilitas Tersedia</p>
                        <div className="flex flex-wrap gap-2">
                          {(room?.facilities?.length > 0 ? room.facilities : DEFAULT_AMENITIES).map((name) => {
                            const cfg = getFacilityConfig(name);
                            return (
                              <div
                                key={name}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${cfg.bg}`}
                              >
                                <span className={`material-symbols-outlined text-base ${cfg.color}`}>
                                  {cfg.icon}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">{name}</span>
                              </div>
                            );
                          })}
                        </div>

                        {property?.description && (
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                              {property.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aksi Cepat */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Aksi Cepat</h4>
                    <div className="space-y-3">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={action.onClick}
                          className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#EC5B13]/30 hover:bg-[#EC5B13]/5 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                              <span className="material-symbols-outlined">{action.icon}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{action.label}</p>
                              <p className="text-xs text-slate-500">{action.sub}</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-[#EC5B13] transition-colors">
                            chevron_right
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tetangga ── */}
          {(loading || rental) && (
            <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  Tetanggaku
                  {!loading && room && (
                    <span className="ml-2 text-sm font-normal text-slate-400">(lantai yang sama)</span>
                  )}
                </h4>
                <button className="text-[#EC5B13] text-sm font-bold hover:underline">Lihat Semua</button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : neighbors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {neighbors.map((neighbor) => {
                    const activeTenant = neighbor.rentals?.find((r) => r.status === "ACTIVE");
                    const name         = activeTenant?.tenant?.fullName ?? "Penyewa";
                    const initials     = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <div
                        key={neighbor.id}
                        className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#EC5B13]/20 flex items-center justify-center text-[#EC5B13] font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{name}</p>
                          <p className="text-xs text-slate-500">Kamar #{neighbor.roomNumber}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
                  <p className="text-slate-400 text-sm">Belum ada tetangga terdaftar</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-slate-400 text-xs font-medium gap-4">
          <p>© 2026 PropShare Campus Housing. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Syarat &amp; Ketentuan</a>
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Peraturan Hunian</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
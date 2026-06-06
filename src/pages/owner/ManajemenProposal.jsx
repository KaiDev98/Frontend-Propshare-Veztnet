import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";

// ── Summary Card ───────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, badge, badgeColor, loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#EC5B13]/5 p-6 rounded-xl border border-slate-200 dark:border-[#EC5B13]/10 shadow-sm animate-pulse">
        <div className="h-8 w-8 bg-slate-200 rounded-lg mb-4" />
        <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
        <div className="h-6 w-20 bg-slate-200 rounded" />
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-[#EC5B13]/5 p-6 rounded-xl border border-slate-200 dark:border-[#EC5B13]/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-[#EC5B13]/10 text-[#EC5B13] rounded-lg material-symbols-outlined">{icon}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
        {value}{" "}
        {sub && <span className="text-slate-400 text-sm font-normal">{sub}</span>}
      </p>
    </div>
  );
}

// ── Property Detail Modal ──────────────────────────────────────────────────────
function PropertyDetailModal({ propertyId, onClose, navigate }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("rooms"); // "rooms" | "info"

  useEffect(() => {
    if (!propertyId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/properties/${propertyId}`);
        setDetail(res.data?.data ?? res.data);
      } catch (err) {
        console.error("Gagal fetch detail properti:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [propertyId]);

  const statusColor = (s) => ({
    AVAILABLE : "bg-emerald-100 text-emerald-700",
    OCCUPIED  : "bg-blue-100 text-blue-700",
    BOOKED    : "bg-amber-100 text-amber-700",
    MAINTENANCE: "bg-red-100 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-500");

  const thumbnail = detail?.images?.[0]?.url || "https://via.placeholder.com/800x300?text=No+Image";
  const rooms     = detail?.rooms ?? [];
  const pct       = detail ? Math.min(Math.round((detail.currentFunding / detail.fundingTarget) * 100), 100) : 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">

        {/* ── Hero Image ── */}
        <div
          className="h-44 bg-cover bg-center relative shrink-0"
          style={{ backgroundImage: `url('${thumbnail}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          {!loading && detail && (
            <div className="absolute bottom-4 left-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  detail.status === "FUNDED"  ? "bg-emerald-500"  :
                  detail.status === "ACTIVE"  ? "bg-blue-500"     :
                  detail.status === "PENDING" ? "bg-amber-500"    : "bg-slate-500"
                } text-white`}>{detail.status}</span>
                <span className="text-[10px] text-white/70">{detail.category}</span>
              </div>
              <h2 className="text-xl font-bold leading-tight">{detail.title}</h2>
              <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                {detail.location}
              </p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0 px-6">
          {[
            { key: "rooms", label: "Kamar & Penghuni", icon: "meeting_room" },
            { key: "info",  label: "Info Properti",    icon: "info"          },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-[#EC5B13] text-[#EC5B13]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>

          ) : !detail ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">error_outline</span>
              <p className="text-sm">Gagal memuat data properti.</p>
            </div>

          ) : tab === "rooms" ? (
            /* ── ROOMS TAB ── */
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Total Kamar",     value: rooms.length,                                           icon: "meeting_room",  color: "text-blue-500"    },
                  { label: "Terisi",           value: rooms.filter(r => r.status === "OCCUPIED").length,      icon: "person",        color: "text-emerald-500" },
                  { label: "Tersedia",         value: rooms.filter(r => r.status === "AVAILABLE").length,    icon: "door_open",     color: "text-amber-500"   },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700">
                    <span className={`material-symbols-outlined ${s.color} text-2xl`}>{s.icon}</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl">meeting_room</span>
                  <p className="text-sm mt-2">Belum ada kamar yang terdaftar.</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const tenant = room.bookings?.[0]?.tenant ?? room.tenant ?? null;
                  return (
                    <div
                      key={room.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700"
                    >
                      {/* Room Icon */}
                      <div className="w-10 h-10 rounded-xl bg-[#EC5B13]/10 flex items-center justify-center text-[#EC5B13] shrink-0">
                        <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                      </div>

                      {/* Room Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{room.name ?? `Kamar ${room.roomNumber}`}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusColor(room.status)}`}>
                            {room.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Tipe: {room.type ?? "—"} · Harga: Rp {room.price?.toLocaleString("id-ID") ?? "—"}/bln
                        </p>

                        {/* Tenant Info */}
                        {tenant ? (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                            <img
                              src={tenant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.fullName ?? "T")}&background=EC5B13&color=fff&size=64`}
                              alt={tenant.fullName}
                              className="w-7 h-7 rounded-full object-cover border border-[#EC5B13]/20 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{tenant.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{tenant.email}</p>
                            </div>
                            <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-bold shrink-0">
                              Penghuni
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1.5 text-[10px] text-slate-400 italic">Tidak ada penghuni saat ini</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          ) : (
            /* ── INFO TAB ── */
            <div className="space-y-6">

              {/* Funding Progress */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Progress Funding</p>
                  <p className="text-sm font-bold text-[#EC5B13]">{pct}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-[#EC5B13]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Rp {detail.currentFunding?.toLocaleString("id-ID")}</span>
                  <span>Target: Rp {detail.fundingTarget?.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Kategori",     value: detail.category     ?? "—", icon: "category"           },
                  { label: "Status",       value: detail.status       ?? "—", icon: "info"               },
                  { label: "Total Kamar",  value: `${rooms.length} kamar`,    icon: "meeting_room"       },
                  { label: "Total Investor",value: `${detail._count?.investments ?? 0} investor`, icon: "groups" },
                  { label: "Harga Sewa",   value: detail.price ? `Rp ${detail.price.toLocaleString("id-ID")}` : "—", icon: "payments" },
                  { label: "Luas",         value: detail.area ? `${detail.area} m²` : "—", icon: "straighten" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[#EC5B13] text-[18px] shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {detail.description && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Deskripsi</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{detail.description}</p>
                </div>
              )}

              {/* Wallet */}
              {detail.walletAddress && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Wallet Terhubung</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{detail.walletAddress}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        {!loading && detail && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-xs text-slate-400">
              ID: <span className="font-mono">{detail.id?.slice(0, 12)}…</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
              {pct >= 100 && (
                <button
                  onClick={() => { onClose(); navigate("/owner/withdrawal"); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#EC5B13] text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  Tarik Dana
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Funding Project Card ───────────────────────────────────────────────────────
function FundingProjectCard({ project, navigate }) {
  const pct       = Math.min(Math.round((project.currentFunding / project.fundingTarget) * 100), 100);
  const completed = pct >= 100;
  const thumbnail = project.images?.[0]?.url || "https://via.placeholder.com/400x200?text=No+Image";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div
        className="w-full md:w-48 h-32 rounded-xl bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url('${thumbnail}')` }}
      />
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{project.title}</h4>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span>{project.location}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold uppercase tracking-widest ${completed ? "text-emerald-500" : "text-slate-400"}`}>
              {completed ? "100% Funded" : `${pct}% Funded`}
            </p>
            <p className={`text-sm font-bold ${completed ? "text-emerald-500" : "text-[#EC5B13]"}`}>
              Rp {project.currentFunding.toLocaleString("id-ID")}{" "}
              <span className="text-slate-400 font-normal">of Rp {project.fundingTarget.toLocaleString("id-ID")}</span>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-2 bg-slate-100 dark:bg-[#EC5B13]/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${completed ? "bg-emerald-500" : "bg-[#EC5B13]"} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Status: {project.status}</span>
            {completed ? (
              <button
                onClick={() => navigate("/owner/withdrawal")}
                className="px-4 py-1.5 bg-[#EC5B13] text-white rounded-lg text-xs font-bold hover:bg-orange-600 hover:shadow-lg transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                Withdraw Funds
              </button>
            ) : (
              <button disabled className="px-4 py-1.5 bg-slate-200 dark:bg-[#EC5B13]/20 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                Withdraw Funds
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property Row ───────────────────────────────────────────────────────────────
function PropertyRow({ prop, onView }) {
  const totalRooms     = prop._count?.rooms       ?? 0;
  const totalInvestors = prop._count?.investments ?? 0;

  return (
    <tr className="text-sm hover:bg-slate-50/50 dark:hover:bg-[#EC5B13]/5 transition-colors">
      <td className="px-6 py-4">
        <div className="font-bold text-slate-900 dark:text-white">{prop.title}</div>
        <div className="text-xs text-slate-500">{prop.category}</div>
      </td>
      <td className="px-6 py-4 font-medium">{totalRooms} kamar</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{totalInvestors} investor</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{prop.status}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`flex items-center gap-1.5 font-bold text-xs uppercase ${
          prop.status === "FUNDED" ? "text-emerald-500" :
          prop.status === "ACTIVE" ? "text-blue-500" : "text-amber-500"
        }`}>
          <span className={`size-2 rounded-full ${
            prop.status === "FUNDED" ? "bg-emerald-500" :
            prop.status === "ACTIVE" ? "bg-blue-500" : "bg-amber-500"
          }`} />
          {prop.status === "PENDING" ? "Menunggu Verifikasi" : prop.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Lihat Detail */}
          <button
            onClick={() => onView(prop.id)}
            title="Lihat Detail & Penghuni"
            className="p-1.5 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13] rounded-lg text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
          {/* Kelola Kamar (tab rooms) */}
          <button
            onClick={() => onView(prop.id, "rooms")}
            title="Kelola Kamar & Penghuni"
            className="p-1.5 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13] rounded-lg text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ManajemenProposal() {
  const navigate = useNavigate();
  const [search,         setSearch]         = useState("");
  const [loading,        setLoading]        = useState(true);
  const [properties,     setProperties]     = useState([]);
  const [summary,        setSummary]        = useState(null);
  const [user,           setUser]           = useState(null);
  const [walletAddress,  setWalletAddress]  = useState(null);

  // Modal state
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [modalOpen,          setModalOpen]          = useState(false);

  const openModal  = useCallback((id) => { setSelectedPropertyId(id); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setSelectedPropertyId(null); }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      setUser(stored);
      setWalletAddress(stored.walletAddress ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res  = await api.get("/properties/my-listings");
        const data = res.data.data;
        setProperties(data);

        const totalFunding   = data.reduce((s, p) => s + p.currentFunding, 0);
        const totalTarget    = data.reduce((s, p) => s + p.fundingTarget,  0);
        const totalRooms     = data.reduce((s, p) => s + (p._count?.rooms       ?? 0), 0);
        const totalInvestors = data.reduce((s, p) => s + (p._count?.investments ?? 0), 0);
        const pendingCount   = data.filter((p) => p.status === "PENDING").length;

        setSummary({ totalFunding, totalTarget, totalRooms, totalInvestors, pendingCount, totalProperties: data.length });
      } catch (err) {
        console.error("Gagal fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered        = properties.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );
  const fundingProjects = properties.filter(p => ["ACTIVE", "FUNDED"].includes(p.status));

  const SUMMARY_CARDS = [
    { icon:"monetization_on", label:"Total Funding Raised", value: summary ? `Rp ${(summary.totalFunding/1_000_000).toFixed(1)}jt` : "-", sub: summary ? `/ ${(summary.totalTarget/1_000_000).toFixed(1)}jt` : null, badge: summary ? `${summary.totalProperties} properti` : "-", badgeColor:"text-emerald-500 bg-emerald-500/10" },
    { icon:"home_work",       label:"Total Kamar",          value: summary ? `${summary.totalRooms}` : "-",     sub:"kamar",    badge:"Terdaftar", badgeColor:"text-blue-500 bg-blue-500/10" },
    { icon:"groups",          label:"Total Investor",        value: summary ? `${summary.totalInvestors}` : "-", sub:"investor", badge:"Aktif",     badgeColor:"text-emerald-500 bg-emerald-500/10" },
    { icon:"pending_actions", label:"Menunggu Verifikasi",   value: summary ? `${summary.pendingCount}` : "-",  sub:"proposal", badge: summary?.pendingCount > 0 ? "Perlu Aksi" : "Clear", badgeColor: summary?.pendingCount > 0 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Manajemen Proposal RWA" />

      <main className="flex-1 overflow-y-auto bg-[#f8f6f6] dark:bg-[#221610] p-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Welcome back, <span className="font-semibold text-[#EC5B13]">{user?.fullName ?? "Owner"}</span>. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {walletAddress ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                <span className="material-symbols-outlined text-green-500 text-[16px]">verified</span>
                <span className="text-xs font-mono text-green-700 dark:text-green-400">
                  {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => navigate("/owner/withdrawal")}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">link_off</span>
                Hubungkan Wallet
              </button>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-[#EC5B13]/10 border border-slate-200 dark:border-[#EC5B13]/20 rounded-xl text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none w-64"
              />
            </div>
            <button className="size-10 flex items-center justify-center bg-white dark:bg-[#EC5B13]/10 border border-slate-200 dark:border-[#EC5B13]/20 rounded-xl text-slate-600 dark:text-white hover:border-[#EC5B13] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Wallet Warning Banner */}
        {!walletAddress && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500">warning</span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Wallet MetaMask Belum Terhubung</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Hubungkan wallet agar properti yang diapprove admin bisa langsung terdaftar di blockchain dan dana bisa dicairkan.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/owner/withdrawal")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Hubungkan Sekarang
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          <div className="lg:col-span-2 space-y-6">

            {/* Active Funding Projects */}
            <div className="bg-white dark:bg-[#EC5B13]/5 rounded-xl border border-slate-200 dark:border-[#EC5B13]/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-[#EC5B13]/10 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Active Funding Projects</h3>
                <span className="text-xs text-slate-400">{fundingProjects.length} properti</span>
              </div>
              <div className="p-6 space-y-8">
                {loading ? (
                  [1,2].map((i) => (
                    <div key={i} className="flex gap-6 animate-pulse">
                      <div className="w-48 h-32 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-40 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                        <div className="h-2 w-full bg-slate-200 rounded-full mt-4" />
                      </div>
                    </div>
                  ))
                ) : fundingProjects.length > 0 ? (
                  fundingProjects.map((project) => (
                    <FundingProjectCard key={project.id} project={project} navigate={navigate} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-300">home_work</span>
                    <p className="text-slate-400 text-sm mt-2">Belum ada properti yang aktif funding</p>
                    <button
                      onClick={() => navigate("/owner/new-property")}
                      className="mt-4 px-4 py-2 bg-[#EC5B13] text-white text-xs font-bold rounded-lg"
                    >
                      + Ajukan Properti Baru
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Property Management Table */}
            <div className="bg-white dark:bg-[#EC5B13]/5 rounded-xl border border-slate-200 dark:border-[#EC5B13]/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-[#EC5B13]/10 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Property Management</h3>
                <span className="text-xs text-slate-400">{filtered.length} properti</span>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 space-y-4 animate-pulse">
                    {[1,2,3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
                  </div>
                ) : filtered.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#EC5B13]/10 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Nama Properti</th>
                        <th className="px-6 py-4">Kamar</th>
                        <th className="px-6 py-4">Investor</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#EC5B13]/10">
                      {filtered.map((prop) => (
                        <PropertyRow key={prop.id} prop={prop} onView={openModal} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">{search ? "Properti tidak ditemukan" : "Belum ada properti"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Status Panel */}
          <div className="bg-white dark:bg-[#EC5B13]/5 rounded-xl border border-slate-200 dark:border-[#EC5B13]/10 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#EC5B13]/10 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Status Properti</h3>
              <span className="bg-[#EC5B13] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {properties.length} TOTAL
              </span>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {loading ? (
                [1,2,3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)
              ) : properties.length > 0 ? (
                properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => openModal(prop.id)}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-[#EC5B13]/10 border border-slate-100 dark:border-[#EC5B13]/5 rounded-xl hover:border-[#EC5B13]/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-bold leading-none text-slate-800 dark:text-white">{prop.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        prop.status === "ACTIVE"  ? "bg-blue-100 text-blue-700"       :
                        prop.status === "FUNDED"  ? "bg-emerald-100 text-emerald-700" :
                        prop.status === "PENDING" ? "bg-amber-100 text-amber-700"     :
                        "bg-red-100 text-red-700"
                      }`}>{prop.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{prop.location}</p>
                    <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#EC5B13] rounded-full"
                        style={{ width: `${Math.min((prop.currentFunding / prop.fundingTarget) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Rp {prop.currentFunding.toLocaleString("id-ID")} / Rp {prop.fundingTarget.toLocaleString("id-ID")}
                    </p>
                  </button>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300">home_work</span>
                  <p className="text-slate-400 text-sm mt-2 text-center">Belum ada properti terdaftar</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-[#EC5B13]/10">
              <button
                onClick={() => navigate("/owner/new-property")}
                className="w-full py-2 bg-slate-100 dark:bg-[#EC5B13]/10 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-[#EC5B13] hover:text-white transition-all"
              >
                + Ajukan Properti Baru
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <div className="relative overflow-hidden bg-[#EC5B13] p-8 rounded-2xl text-white group cursor-pointer">
            <div className="absolute -right-12 -top-12 size-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Want to list a new property?</h3>
              <p className="text-white/80 text-sm max-w-xs mb-6">Our verification process takes less than 48 hours.</p>
              <button
                onClick={() => navigate("/owner/new-property")}
                className="flex items-center gap-2 bg-white text-[#EC5B13] px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-black/10"
              >
                List Now
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900 dark:bg-[#EC5B13]/20 p-8 rounded-2xl text-white group cursor-pointer border border-transparent dark:border-[#EC5B13]/30">
            <div className="absolute -right-12 -top-12 size-48 bg-[#EC5B13]/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Market Insights 2026</h3>
              <p className="text-white/80 text-sm max-w-xs mb-6">Explore regional trends in student housing.</p>
              <button className="flex items-center gap-2 bg-[#EC5B13] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-[#EC5B13]/20">
                Download Report
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Property Detail Modal ── */}
      {modalOpen && selectedPropertyId && (
        <PropertyDetailModal
          propertyId={selectedPropertyId}
          onClose={closeModal}
          navigate={navigate}
        />
      )}
    </div>
  );
}
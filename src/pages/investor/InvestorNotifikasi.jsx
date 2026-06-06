import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader  from "../../components/InvestorHeader";
import api from "../../utils/api";

const CATEGORIES = [
  { key:"ALL",      label:"All",      color:"bg-orange-500" },
  { key:"KYC",      label:"KYC",      color:"bg-blue-500"   },
  { key:"DIVIDEND", label:"Dividend", color:"bg-green-500"  },
  { key:"MARKET",   label:"Market",   color:"bg-indigo-500" },
  { key:"SYSTEM",   label:"System",   color:"bg-purple-500" },
  { key:"PAYMENT",  label:"Payment",  color:"bg-amber-500"  },
  { key:"RENTAL",   label:"Rental",   color:"bg-rose-500"   },
];

const TYPE_CONFIG = {
  KYC:     { icon:"verified_user", iconBg:"bg-orange-50 dark:bg-orange-900/20 text-orange-600",  border:"border-l-orange-500", badgeBg:"bg-orange-100 dark:bg-orange-900/30 text-orange-700",  label:"Identity Verification" },
  DIVIDEND:{ icon:"payments",      iconBg:"bg-green-50 dark:bg-green-900/20 text-green-600",     border:"border-l-green-500",  badgeBg:"bg-green-100 dark:bg-green-900/30 text-green-700",     label:"Dividend"              },
  MARKET:  { icon:"trending_up",   iconBg:"bg-blue-50 dark:bg-blue-900/20 text-blue-600",        border:"border-l-blue-500",   badgeBg:"bg-blue-100 dark:bg-blue-900/30 text-blue-700",        label:"Market"                },
  SYSTEM:  { icon:"security",      iconBg:"bg-slate-100 dark:bg-slate-800 text-slate-500",       border:"border-l-slate-400",  badgeBg:"bg-slate-200 dark:bg-slate-700 text-slate-600",        label:"System"                },
  PAYMENT: { icon:"receipt",       iconBg:"bg-amber-50 dark:bg-amber-900/20 text-amber-600",     border:"border-l-amber-500",  badgeBg:"bg-amber-100 dark:bg-amber-900/30 text-amber-700",     label:"Payment"               },
  RENTAL:  { icon:"home_work",     iconBg:"bg-rose-50 dark:bg-rose-900/20 text-rose-600",        border:"border-l-rose-500",   badgeBg:"bg-rose-100 dark:bg-rose-900/30 text-rose-700",        label:"Rental"                },
};

const getConfig = (type) => TYPE_CONFIG[type?.toUpperCase()] ?? TYPE_CONFIG.SYSTEM;

function timeAgo(iso) {
  if (!iso) return "";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins}m yang lalu`;
  if (hours < 24) return `${hours}j yang lalu`;
  if (days  < 7)  return `${days}h yang lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function NotifSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 border-l-slate-200 dark:border-l-slate-700 border border-slate-100 dark:border-slate-800 animate-pulse">
      <div className="flex gap-5 items-start">
        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-5 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({ notif, onMarkRead, onDelete }) {
  const cfg    = getConfig(notif.type);
  const isRead = notif.isRead;

  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 border-l-4 ${cfg.border} hover:shadow-lg transition-all duration-300 ${isRead ? "opacity-60 dark:opacity-40" : ""}`}>

      {/* Unread dot */}
      {!isRead && (
        <span className="absolute top-5 right-5 w-2.5 h-2.5 bg-[#EC5B13] rounded-full ring-2 ring-white dark:ring-slate-900" />
      )}

      {/* Delete button — show on hover */}
      <button
        onClick={() => onDelete(notif.id)}
        className="absolute top-4 right-10 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all"
        title="Hapus"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>

      <div className="flex gap-5 items-start">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings:"'FILL' 1" }}>
            {cfg.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2 gap-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${cfg.badgeBg}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">
              {timeAgo(notif.createdAt)}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
            {notif.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {notif.message}
          </p>

          {!isRead && (
            <div className="mt-4">
              <button
                onClick={() => onMarkRead(notif.id)}
                className="text-[#EC5B13] text-xs font-bold hover:underline underline-offset-4 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">done</span>
                Tandai sudah dibaca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InvestorNotifikasi() {
  const navigate = useNavigate();

  const [notifications,   setNotifications]   = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [activeCategory,   setActiveCategory]   = useState("ALL");
  const [markingAll,       setMarkingAll]        = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data ?? []);
    } catch (err) {
      // Fallback: generate dari data lokal jika endpoint belum ada
      try {
        const [portfolioRes, rentalRes] = await Promise.allSettled([
          api.get("/investments/my-portfolio"),
          api.get("/rentals/my-rentals"),
        ]);

        const fakeNotifs = [];
        const user = JSON.parse(localStorage.getItem("user") ?? "{}");

        // KYC status
        if (user.kycStatus === "VERIFIED") {
          fakeNotifs.push({ id:"kyc-1", type:"KYC", title:"KYC Approved! ✅",
            message:"Identitas kamu telah diverifikasi. Kamu bisa berinvestasi di semua properti.", isRead:true, createdAt: user.createdAt });
        } else if (user.kycStatus === "PENDING") {
          fakeNotifs.push({ id:"kyc-2", type:"KYC", title:"KYC Sedang Diproses",
            message:"Dokumen identitas kamu sedang diverifikasi oleh tim PropShare.", isRead:false, createdAt: new Date().toISOString() });
        }

        // Investment notifications
        if (portfolioRes.status === "fulfilled") {
          const investments = portfolioRes.value.data?.data ?? [];
          investments.slice(0,3).forEach((inv, i) => {
            fakeNotifs.push({
              id: `inv-${inv.id}`, type:"MARKET",
              title:`Investasi di ${inv.property?.title ?? "Properti"}`,
              message:`${(inv.tokenAmount??0).toLocaleString()} token PROP senilai Rp ${(inv.totalPaid??0).toLocaleString("id-ID")} berhasil dibeli.`,
              isRead: i > 0, createdAt: inv.createdAt,
            });
          });
        }

        // Rental notifications
        if (rentalRes.status === "fulfilled") {
          const rentals = rentalRes.value.data?.data ?? [];
          rentals.slice(0,2).forEach((r, i) => {
            if (r.status === "ACTIVE") {
              fakeNotifs.push({
                id: `rental-${r.id}`, type:"RENTAL",
                title:"Pengajuan Sewa Disetujui! 🏠",
                message:`Sewa kamar di "${r.room?.property?.title ?? "properti"}" telah disetujui.`,
                isRead: true, createdAt: r.createdAt,
              });
            }
          });
        }

        // Sort terbaru dulu
        fakeNotifs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(fakeNotifs);
      } catch {
        setError("Gagal memuat notifikasi. Pastikan sudah login.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // ─── Mark read ──────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id===id ? {...n, isRead:true} : n));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Rollback
      setNotifications(prev => prev.map(n => n.id===id ? {...n, isRead:false} : n));
    }
  };

  // ─── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = async () => {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({...n, isRead:true})));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      await fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const deleteNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      await fetchNotifications();
    }
  };

  // ─── Filter ─────────────────────────────────────────────────────────────────
  const filtered = notifications.filter(n =>
    activeCategory === "ALL" || n.type?.toUpperCase() === activeCategory
  );

  const unreadCount    = notifications.filter(n => !n.isRead).length;
  const countByCategory = (key) => key === "ALL"
    ? notifications.length
    : notifications.filter(n => n.type?.toUpperCase() === key).length;

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <InvestorSidebar activeLabel="Notifications" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <InvestorHeader search="" onSearch={() => {}} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-6xl mx-auto w-full">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifikasi</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua sudah dibaca"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchNotifications}
                  className="p-2 text-slate-400 hover:text-[#EC5B13] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Refresh"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} disabled={markingAll}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#EC5B13] transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    {markingAll
                      ? <div className="w-4 h-4 border-2 border-[#EC5B13] border-t-transparent rounded-full animate-spin" />
                      : <span className="material-symbols-outlined text-[18px]">done_all</span>}
                    Tandai semua dibaca
                  </button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Filter Sidebar */}
              <aside className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 sticky top-24">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Categories</h3>
                  <div className="space-y-1.5">
                    {CATEGORIES.map(cat => {
                      const count  = countByCategory(cat.key);
                      const active = activeCategory === cat.key;
                      return (
                        <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${
                            active ? "bg-[#EC5B13]/10 text-[#EC5B13]" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                            {cat.label}
                          </span>
                          {count > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? "bg-[#EC5B13]/20 text-[#EC5B13]" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Unread summary */}
                  {unreadCount > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                      <div className="p-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl text-center">
                        <p className="text-2xl font-black text-[#EC5B13]">{unreadCount}</p>
                        <p className="text-xs text-slate-500 font-medium">Belum dibaca</p>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Feed */}
              <div className="lg:col-span-9 space-y-4">

                {loading && [...Array(4)].map((_,i) => <NotifSkeleton key={i} />)}

                {!loading && error && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                    <p className="text-slate-600 dark:text-slate-400 font-semibold">{error}</p>
                    <button onClick={fetchNotifications}
                      className="px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-slate-400">notifications_off</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">Tidak ada notifikasi</p>
                    <p className="text-slate-400 text-sm">
                      {activeCategory === "ALL"
                        ? "Aktivitas investasi kamu akan muncul di sini."
                        : `Belum ada notifikasi untuk kategori "${activeCategory}".`}
                    </p>
                  </div>
                )}

                {!loading && !error && filtered.map(notif => (
                  <NotifCard key={notif.id} notif={notif} onMarkRead={markRead} onDelete={deleteNotif} />
                ))}
              </div>
            </div>
          </div>
          <div className="h-12" />
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader  from "../../components/AdminHeader";
import api from "../../utils/api";

const READ_KEY = "propshare_admin_read_notifs";

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]")); }
  catch { return new Set(); }
}
// Ganti fungsi saveReadIds yang lama dengan ini
function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  // ← Dispatch custom event agar AdminHeader di halaman sama ikut update
  window.dispatchEvent(new Event("notif_read_updated"));
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days  < 7)  return `${days} hari yang lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day:"numeric", month:"short" });
}

// Build notifications dari berbagai sumber API
function buildNotifications(users, properties, rentals) {
  const notifs = [];

  // Pending KYC users
  users.filter(u => !u.kycStatus || u.kycStatus === "PENDING").forEach(u => {
    notifs.push({
      id:        `kyc-${u.id}`,
      icon:      "person_add",
      iconBg:    "bg-blue-50 text-blue-600",
      title:     "New KYC Submission",
      desc:      `User ${u.fullName ?? u.email} menunggu verifikasi identitas.`,
      meta:      `${timeAgo(u.createdAt)} • KYC Module`,
      createdAt: u.createdAt,
      highlight: false,
      priority:  false,
      action:    { label:"Review", path:"/admin/users" },
    });
  });

  // Pending properties
  properties.filter(p => !p.status || p.status === "PENDING").forEach(p => {
    notifs.push({
      id:        `prop-${p.id}`,
      icon:      "home_work",
      iconBg:    "bg-[#fd9914] text-white",
      title:     "Properti Menunggu Review",
      desc:      `"${p.title}" oleh ${p.owner?.fullName ?? "Owner"} perlu diverifikasi.`,
      meta:      `${timeAgo(p.createdAt)} • KYC Module`,
      createdAt: p.createdAt,
      highlight: true,
      priority:  true,
      action:    { label:"Review", path:"/admin/kyc" },
    });
  });

  // Active rentals baru
  rentals.filter(r => r.status === "PENDING").forEach(r => {
    notifs.push({
      id:        `rental-${r.id}`,
      icon:      "assignment",
      iconBg:    "bg-amber-50 text-amber-600",
      title:     "Pengajuan Sewa Baru",
      desc:      `${r.tenant?.fullName ?? "Tenant"} mengajukan sewa di ${r.room?.property?.title ?? r.property?.title ?? "properti"}.`,
      meta:      `${timeAgo(r.createdAt)} • Rental Module`,
      createdAt: r.createdAt,
      highlight: false,
      priority:  false,
      action:    { label:"Lihat", path:"/admin/moderasi" },
    });
  });

  // Pending payments
  const allPayments = rentals.flatMap(r => (r.payments ?? []).map(p => ({ ...p, rental: r })));
  allPayments.filter(p => p.status === "PENDING").forEach(p => {
    notifs.push({
      id:        `pay-${p.id}`,
      icon:      "payments",
      iconBg:    "bg-green-50 text-green-600",
      title:     "Pembayaran Menunggu Verifikasi",
      desc:      `Rp ${p.amount?.toLocaleString("id-ID")} dari ${p.rental?.tenant?.fullName ?? "Tenant"} perlu dikonfirmasi.`,
      meta:      `${timeAgo(p.paymentDate ?? p.createdAt)} • Escrow Module`,
      createdAt: p.paymentDate ?? p.createdAt,
      highlight: false,
      priority:  false,
      action:    { label:"Verifikasi", path:"/admin/escrow" },
    });
  });

  // Suspended/rejected users
  users.filter(u => u.kycStatus === "REJECTED").forEach(u => {
    notifs.push({
      id:        `rejected-${u.id}`,
      icon:      "person_off",
      iconBg:    "bg-red-50 text-red-500",
      title:     "KYC Ditolak",
      desc:      `KYC ${u.fullName ?? u.email} telah ditolak.`,
      meta:      `${timeAgo(u.updatedAt ?? u.createdAt)} • KYC Module`,
      createdAt: u.updatedAt ?? u.createdAt,
      highlight: false,
      priority:  false,
      action:    null,
      archived:  true,
    });
  });

  // Sort terbaru dulu
  return notifs.sort((a,b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({ notif, isRead, onMarkRead }) {
  const navigate = useNavigate();
  const isArchived = notif.archived ?? false;

  return (
    <div className={`rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm transition-all ${
      isArchived
        ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-60"
        : notif.highlight
        ? "bg-[#fd9914]/5 border border-[#fd9914]/20"
        : isRead
        ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        : "bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 hover:border-[#fd9914]/50"
    }`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${notif.iconBg}`}>
          <span className="material-symbols-outlined">{notif.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm leading-tight">{notif.title}</h3>
            {notif.priority && <span className="h-2 w-2 rounded-full bg-[#fd9914] animate-pulse shrink-0" />}
            {!notif.priority && !isRead && !isArchived && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 line-clamp-2">{notif.desc}</p>
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1 block">{notif.meta}</span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        {isArchived ? (
          <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">Archived</span>
        ) : (
          <>
            {notif.action && (
              <button
                onClick={() => { onMarkRead(notif.id); navigate(notif.action.path); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  notif.highlight
                    ? "bg-[#fd9914] text-white hover:bg-[#fd9914]/90"
                    : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {notif.action.label}
              </button>
            )}
            {!isRead && (
              <button
                onClick={() => onMarkRead(notif.id)}
                className={`h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#fd9914] transition-colors ${
                  notif.highlight ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" : "bg-slate-50 dark:bg-slate-800"
                }`}
                title="Tandai sudah dibaca"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminNotifikasi() {
  const navigate = useNavigate();

  const [notifs,       setNotifs]       = useState([]);
  const [readIds,      setReadIds]       = useState(getReadIds);
  const [loading,      setLoading]       = useState(true);
  const [activeFilter, setActiveFilter]  = useState("all");
  const [search,       setSearch]        = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, propsRes, rentalsRes] = await Promise.allSettled([
        api.get("/auth/users"),
        api.get("/properties"),
        api.get("/rentals/my-rentals").catch(() => ({ data:{ data:[] } })),
      ]);

      const users    = usersRes.status    === "fulfilled" ? (usersRes.value.data?.data    ?? []) : [];
      const props    = propsRes.status    === "fulfilled" ? (propsRes.value.data?.data    ?? []) : [];
      const rentals  = rentalsRes.status  === "fulfilled" ? (rentalsRes.value.data?.data  ?? []) : [];

      setNotifs(buildNotifications(users, props, rentals));
    } catch (err) {
      console.error("Fetch notif error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifs.forEach(n => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  };

  const unreadCount = notifs.filter(n => !readIds.has(n.id) && !n.archived).length;

  const FILTER_TABS = [
    { id:"all",      label:"Semua"           },
    { id:"unread",   label:`Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { id:"priority", label:"Priority Alerts" },
    { id:"archived", label:"Archived"        },
  ];

  const filtered = notifs.filter(n => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.desc.toLowerCase().includes(search.toLowerCase()) ||
      n.meta.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === "unread")   return !readIds.has(n.id) && !n.archived;
    if (activeFilter === "priority") return n.priority;
    if (activeFilter === "archived") return n.archived;
    return true; // all
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5] dark:bg-[#231a0f]">
      <AdminSidebar activeLabel="" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#fd9914] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-[#fd9914]">notifications</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">System Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search alerts..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#fd9914]/30 outline-none w-56 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <button onClick={fetchAll} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Refresh">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto p-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Activity</h1>
                <p className="text-slate-500 mt-1">Real-time updates dari semua modul PropShare</p>
              </div>
              <button onClick={markAllRead} disabled={unreadCount === 0}
                className="px-5 py-2.5 bg-[#fd9914] text-white text-sm font-bold rounded-xl hover:bg-[#fd9914]/90 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Tandai Semua Dibaca
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto whitespace-nowrap">
              {FILTER_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
                  className={`px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
                    activeFilter === tab.id
                      ? "border-[#fd9914] text-[#fd9914]"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_,i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map(n => (
                  <NotifItem key={n.id} notif={n} isRead={readIds.has(n.id)} onMarkRead={markRead} />
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3">notifications_off</span>
                <p className="font-bold text-base">Tidak ada notifikasi</p>
                <p className="text-sm mt-1">
                  {search ? `Tidak ada hasil untuk "${search}"` : "Semua sudah terbaca"}
                </p>
                <button onClick={fetchAll} className="mt-4 px-5 py-2 bg-[#fd9914] text-white text-sm font-bold rounded-xl hover:bg-[#fd9914]/90">
                  Refresh
                </button>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button onClick={fetchAll}
                  className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Muat Ulang Data
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
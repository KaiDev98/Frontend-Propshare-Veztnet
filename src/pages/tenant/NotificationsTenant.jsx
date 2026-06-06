import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";
import { useNotifications } from "../../hooks/useNotifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins}m yang lalu`;
  if (hours < 24) return `${hours}j yang lalu`;
  if (days  < 7)  return `${days}h yang lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day:"numeric", month:"short" });
}

function groupByDate(items) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups    = {};
  items.forEach(n => {
    const d = new Date(n.createdAt ?? Date.now()); d.setHours(0,0,0,0);
    let label;
    if      (d.getTime() === today.getTime())     label = "Hari Ini";
    else if (d.getTime() === yesterday.getTime()) label = "Kemarin";
    else label = d.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

const TYPE_CONFIG = {
  payment:      { icon: "payments",   bg: "bg-[#EC5B13]",   text: "text-white" },
  rental:       { icon: "home_work",  bg: "bg-green-500",   text: "text-white" },
  maintenance:  { icon: "build",      bg: "bg-indigo-500",  text: "text-white" },
  system:       { icon: "info",       bg: "bg-amber-400",   text: "text-white" },
  announcement: { icon: "campaign",   bg: "bg-emerald-500", text: "text-white" },
};

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({ notif, onMarkRead }) {
  const navigate = useNavigate();
  const cfg      = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  const isUnread = !notif.isRead;

  const handleClick = () => {
    onMarkRead(notif.id);
    if (notif.actionPath) navigate(notif.actionPath);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
        isUnread
          ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      }`}
    >
      {isUnread && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500" />
      )}

      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ml-2 ${cfg.bg} ${cfg.text}`}>
        <span className="material-symbols-outlined">{cfg.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className={`font-bold text-sm leading-tight ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            {notif.title}
          </h3>
          <span className={`text-xs font-medium shrink-0 ${isUnread ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {notif.message}
        </p>
        {notif.actionLabel && (
          <span className="mt-2 inline-block text-xs font-bold text-[#EC5B13] group-hover:underline">
            {notif.actionLabel} →
          </span>
        )}
      </div>

      {/* Tombol mark read */}
      {isUnread && (
        <button
          onClick={e => { e.stopPropagation(); onMarkRead(notif.id); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
          title="Tandai sudah dibaca"
        >
          <span className="material-symbols-outlined text-[18px]">done</span>
        </button>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { id: "all",          label: "Semua"       },
  { id: "payment",      label: "Pembayaran"  },
  { id: "rental",       label: "Sewa"        },
  { id: "maintenance",  label: "Maintenance" },
  { id: "system",       label: "Sistem"      },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsTenant() {
  const [tab, setTab] = useState("all");

  // Hook yang sama dipakai TenantHeader → badge & count sinkron realtime
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications(30000);

  // Auto mark all read setelah 2 detik user buka halaman ini
  useEffect(() => {
    const timer = setTimeout(() => {
      markAllRead();
    }, 2000);
    return () => clearTimeout(timer);
  }, [markAllRead]);

  const filtered = tab === "all" ? notifications : notifications.filter(n => n.type === tab);
  const grouped  = groupByDate(filtered);

  const countByType = (type) => notifications.filter(n => n.type === type && !n.isRead).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Notifications" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <TenantHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">

            {/* Header */}
            <header className="flex items-start justify-between gap-4 mb-8 flex-wrap">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Notifikasi</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {unreadCount > 0
                    ? <span className="text-[#EC5B13] font-bold">{unreadCount} notifikasi belum dibaca</span>
                    : <span className="text-green-600 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span>Semua sudah dibaca</span>
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Tandai Semua Dibaca
                </button>
                <button
                  onClick={refresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#EC5B13] rounded-xl hover:bg-[#d44e0f] shadow-lg shadow-[#EC5B13]/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Refresh
                </button>
              </div>
            </header>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
              {FILTER_TABS.map(f => {
                const count = f.id === "all" ? unreadCount : countByType(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => setTab(f.id)}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      tab === f.id
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EC5B13]/50"
                    }`}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        tab === f.id ? "bg-[#EC5B13] text-white" : "bg-[#EC5B13]/10 text-[#EC5B13]"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">{date}</p>
                    <div className="space-y-3">
                      {items.map(n => (
                        <NotifItem key={n.id} notif={n} onMarkRead={markRead} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-slate-400">notifications_off</span>
                </div>
                <h3 className="text-xl font-bold text-slate-500 mb-2">Semua sudah dibaca!</h3>
                <p className="text-sm text-slate-400 max-w-xs">Tidak ada notifikasi baru. Kamu akan diberitahu jika ada yang penting.</p>
                <button onClick={refresh} className="mt-6 px-6 py-2.5 bg-[#EC5B13] text-white rounded-xl font-bold text-sm hover:bg-[#d44e0f]">
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
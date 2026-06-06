import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const READ_KEY = "propshare_admin_read_notifs";

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]")); }
  catch { return new Set(); }
}

// Build notif IDs dari data API
// ✅ Rentals dihapus dari sini karena /rentals/my-rentals adalah endpoint TENANT
// Admin notif cukup dari KYC pending + property pending
function buildNotifIds(users, properties, rentals) {
  const ids = [];

  users.filter(u => !u.kycStatus || u.kycStatus === "PENDING")
    .forEach(u => ids.push(`kyc-${u.id}`));

  properties.filter(p => !p.status || p.status === "PENDING")
    .forEach(p => ids.push(`prop-${p.id}`));

  // ✅ Rental & payment notif (dari endpoint admin, bukan my-rentals)
  rentals.filter(r => r.status === "PENDING")
    .forEach(r => ids.push(`rental-${r.id}`));

  const allPayments = rentals.flatMap(r => (r.payments ?? []).map(p => ({ ...p, rental: r })));
  allPayments.filter(p => p.status === "PENDING")
    .forEach(p => ids.push(`pay-${p.id}`));

  return ids;
}

export default function AdminHeader({
  title,
  icon              = "admin_panel_settings",
  search            = "",
  onSearch,
  searchPlaceholder = "Search...",
  onRefresh,
}) {
  const navigate = useNavigate();
  const [allNotifIds, setAllNotifIds] = useState([]);
  const [readIds,     setReadIds]     = useState(getReadIds);

  const fetchNotifIds = useCallback(async () => {
    try {
      const [usersRes, propsRes, rentalsRes] = await Promise.allSettled([
        api.get("/auth/users"),
        api.get("/properties"),
        // ✅ Ganti dari /rentals/my-rentals (TENANT only) → /rentals (ADMIN)
        // Kalau endpoint admin belum ada, fallback ke array kosong agar tidak 403
        api.get("/rentals").catch(() => ({ data: { data: [] } })),
      ]);

      const users   = usersRes.status   === "fulfilled" ? (usersRes.value.data?.data   ?? []) : [];
      const props   = propsRes.status   === "fulfilled" ? (propsRes.value.data?.data   ?? []) : [];
      const rentals = rentalsRes.status === "fulfilled" ? (rentalsRes.value.data?.data ?? []) : [];

      setAllNotifIds(buildNotifIds(users, props, rentals));
    } catch (err) {
      console.error("AdminHeader fetchNotifIds error:", err);
    }
  }, []);

  useEffect(() => { fetchNotifIds(); }, [fetchNotifIds]);

  // Dengarkan perubahan localStorage dari tab/halaman lain
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === READ_KEY) setReadIds(getReadIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Dengarkan custom event dari halaman yang sama (AdminNotifikasi di tab sama)
  useEffect(() => {
    const onReadUpdate = () => setReadIds(getReadIds());
    window.addEventListener("notif_read_updated", onReadUpdate);
    return () => window.removeEventListener("notif_read_updated", onReadUpdate);
  }, []);

  const unreadCount = allNotifIds.filter(id => !readIds.has(id)).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">

      {/* Left: Icon + Title */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#fd9914]">{icon}</span>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
      </div>

      {/* Right: Search + Refresh + Notifications */}
      <div className="flex items-center gap-3">

        {onSearch && (
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#fd9914]/50 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        )}

        {/* Notifications badge */}
        <button
          onClick={() => navigate("/admin/notifikasi")}
          className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Notifikasi"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
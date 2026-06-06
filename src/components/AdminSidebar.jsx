import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── MENU DISESUAIKAN DENGAN ENTITAS BARU ───
const NAV_ITEMS = [
  { label: "User Management",      icon: "manage_accounts", path: "/admin/users"      },
  { label: "Property Management",  icon: "apartment",       path: "/admin/properties" },
  { label: "Manajemen Escrow",     icon: "contract",        path: "/admin/escrow"     },
  { label: "Monitoring Aktivitas", icon: "analytics",       path: "/admin/monitoring" },
];

export default function AdminSidebar({ activeLabel }) {
  const navigate    = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [user,      setUser]      = useState(null);

  // Load user + listen userUpdated event
  useEffect(() => {
    const loadUser = () => {
      try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
    };
    loadUser();
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <aside
      style={{ transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      className={`${
        collapsed ? "w-[72px]" : "w-72"
      } shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden`}
    >

      {/* ── Logo + Toggle ── */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 dark:border-slate-800 min-w-0">
        <div
          style={{ transition: "opacity 200ms ease, width 200ms ease" }}
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          }`}
        >
          <div className="size-10 rounded-full bg-[#fd9914] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-slate-900 dark:text-white font-bold text-base leading-none">PropShare Campus</h1>
            <p className="text-[#fd9914] text-[10px] font-semibold uppercase tracking-wider mt-0.5">Admin Panel</p>
          </div>
        </div>

        {collapsed && (
          <div className="size-10 rounded-full bg-[#fd9914] flex items-center justify-center text-white mx-auto">
            <span className="material-symbols-outlined">domain</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          className={`shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#fd9914]/10 hover:text-[#fd9914] text-slate-400 flex items-center justify-center transition-colors ${
            collapsed ? "mx-auto" : "ml-2"
          }`}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span
            style={{ transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
            className={`material-symbols-outlined text-[18px] ${collapsed ? "rotate-180" : ""}`}
          >
            left_panel_close
          </span>
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => {
          const isActive = activeLabel === item.label;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group relative ${
                isActive
                  ? "bg-[#fd9914]/10 text-[#fd9914] border border-[#fd9914]/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#fd9914] rounded-r-full" />
              )}

              <span className={`material-symbols-outlined shrink-0 text-[22px] ${
                isActive ? "text-[#fd9914]" : "text-slate-400 group-hover:text-[#fd9914] transition-colors"
              }`}>
                {item.icon}
              </span>

              <span
                style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
                className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                  collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                }`}
              >
                {item.label}
              </span>

              {/* Tooltip saat collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity duration-150">
                  {item.label}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-white" />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => navigate("/admin/profile")}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
          title={collapsed ? (user?.fullName ?? "Admin") : undefined}
        >
          {/* Avatar */}
          <div className="size-10 rounded-full overflow-hidden shrink-0 border-2 border-[#fd9914]/30">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full bg-[#fd9914]/10 flex items-center justify-center text-[#fd9914] font-bold text-sm">
                {initials}
              </div>
            )}
          </div>

          {/* Name + role */}
          <div
            style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
            className={`flex-1 overflow-hidden ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[150px]"}`}
          >
            <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
              {user?.fullName ?? "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">Super Admin</p>
          </div>

          {!collapsed && (
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-[#fd9914] transition-colors shrink-0">
              chevron_right
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
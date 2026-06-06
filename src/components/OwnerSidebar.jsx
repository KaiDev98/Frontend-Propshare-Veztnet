import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Manajemen Proposal RWA",     icon: "description",            path: "/owner/proposal"          },
  { label: "Dashboard Funding Real-time", icon: "dashboard",             path: "/owner/dashboard-funding" },
  { label: "Sistem Penarikan Modal",     icon: "account_balance_wallet",  path: "/owner/withdrawal"        },
  { label: "Manajemen Hunian",           icon: "home_work",              path: "/owner/hunian"            },
  { label: "Pusat Laporan Kerusakan",    icon: "report_problem",         path: "/owner/laporan"           },
  { label: "Ulasan Properti",            icon: "rate_review",            path: "/owner/reviews" },
];

export default function OwnerSidebar({ activeLabel }) {
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "Loading...",
    avatar: "https://ui-avatars.com/api/?name=Loading",
    role: "Owner"
  });

  // Ambil data user dari localStorage saat komponen dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          fullName: parsedUser.fullName || "Owner Name",
          avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.fullName}`,
          role: parsedUser.role || "Premium Owner"
        });
      } catch (error) {
        console.error("Gagal membaca data user dari localStorage", error);
      }
    }
  }, []);

  // Event Listener agar sidebar terupdate otomatis jika ada perubahan profil di halaman lain
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          fullName: parsedUser.fullName || "Owner Name",
          avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.fullName}`,
          role: parsedUser.role || "Premium Owner"
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event karena localStorage event tidak ngetrigger di tab yang sama
    window.addEventListener("userProfileUpdated", handleStorageChange); 

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userProfileUpdated", handleStorageChange);
    };
  }, []);

  return (
    <aside
      style={{ transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      className={`${
        collapsed ? "w-[72px]" : "w-72"
      } shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 overflow-hidden`}
    >

      {/* ── Logo + Toggle ── */}
      <div className="flex items-center justify-between px-4 py-5 min-w-0">

        {/* Logo — fade out ketika collapsed */}
        <div
          style={{ transition: "opacity 200ms ease, width 200ms ease" }}
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-[#EC5B13] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[20px]">apartment</span>
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-slate-900 dark:text-white font-bold text-base leading-none">
              PropShare
            </h1>
            <p className="text-[#EC5B13] text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Campus Panel
            </p>
          </div>
        </div>

        {/* Icon saat collapsed */}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-[#EC5B13] flex items-center justify-center text-white mx-auto">
            <span className="material-symbols-outlined text-[20px]">apartment</span>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{ transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          className={`shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13] text-slate-400 flex items-center justify-center transition-colors ${
            collapsed ? "mx-auto mt-0" : "ml-2"
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            style={{ transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
            className={`material-symbols-outlined text-[18px] ${collapsed ? "rotate-180" : "rotate-0"}`}
          >
            left_panel_close
          </span>
        </button>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-2 mt-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = activeLabel === item.label;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group relative ${
                isActive
                  ? "bg-[#EC5B13]/10 text-[#EC5B13]"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#EC5B13] rounded-r-full" />
              )}

              <span
                className={`material-symbols-outlined shrink-0 text-[22px] ${
                  isActive ? "text-[#EC5B13]" : "group-hover:text-[#EC5B13] transition-colors"
                }`}
              >
                {item.icon}
              </span>

              {/* Label — slide + fade */}
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
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate("/owner/profile")}
          title={collapsed ? userData.fullName : undefined}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#EC5B13]/10 transition-colors text-left group relative"
        >
          <img
            src={userData.avatar}
            alt="Owner Profile"
            className="size-9 rounded-full border-2 border-[#EC5B13]/20 shrink-0 object-cover"
          />

          <div
            style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
            className={`flex-1 overflow-hidden ${
              collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[150px]"
            }`}
          >
            <p className="text-sm font-bold truncate text-slate-900 dark:text-white">
              {userData.fullName}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
              Premium Owner
            </p>
          </div>

          {!collapsed && (
            <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 group-hover:text-[#EC5B13] transition-colors">
              chevron_right
            </span>
          )}

          {/* Tooltip saat collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity duration-150">
              {userData.fullName}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-white" />
            </div>
          )}
        </button>
      </div>

    </aside>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const NAV_ITEMS = [
  { label: "Dashboard",   icon: "dashboard",   path: "/tenant/dashboard"    },
  { label: "My Room",     icon: "bed",         path: "/tenant/room"         },
  { label: "Marketplace", icon: "apartment",   path: "/tenant/marketplace"  },
  { label: "My Bookings", icon: "event_note",  path: "/tenant/bookings"     },
  { label: "Payments",    icon: "payments",    path: "/tenant/payments"     },
  { label: "Maintenance", icon: "build",       path: "/tenant/maintenance"  },
  { label: "Ulasan Saya", icon: "rate_review", path: "/tenant/feedback"     },
];

export default function TenantSidebar({ activeLabel }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user,      setUser]      = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    };
    loadUser();
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "TN";

  // ── Logout dengan konfirmasi SweetAlert2 ──
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin ingin keluar?",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
          <p style="margin:0; color:#64748b; font-size:14px; line-height:1.6;">
            Sesi kamu akan berakhir dan kamu perlu<br/>
            <strong style="color:#EC5B13;">masuk kembali</strong> untuk mengakses panel ini.
          </p>
        </div>
      `,
      icon: "warning",
      iconColor: "#EC5B13",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EC5B13",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup:          "swal-propshare-popup",
        title:          "swal-propshare-title",
        confirmButton:  "swal-propshare-confirm",
        cancelButton:   "swal-propshare-cancel",
      },
    });

    if (!result.isConfirmed) return;

    // Hapus data sesi
    const userName = user?.fullName ?? "Tenant";
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Notifikasi sesi berakhir
    await Swal.fire({
      title: "Sesi Berakhir",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <p style="margin:0; color:#64748b; font-size:14px; line-height:1.6;">
            Sampai jumpa, <strong style="color:#EC5B13;">${userName}</strong>! 👋<br/>
            Kamu telah berhasil keluar dari <strong>PropShare</strong>.<br/>
            Silakan <strong style="color:#EC5B13;">sign in kembali</strong> untuk melanjutkan.
          </p>
        </div>
      `,
      icon: "success",
      iconColor: "#22c55e",
      confirmButtonText: "Sign In Kembali",
      confirmButtonColor: "#EC5B13",
      timer: 4000,
      timerProgressBar: true,
      customClass: {
        popup:         "swal-propshare-popup",
        title:         "swal-propshare-title",
        confirmButton: "swal-propshare-confirm",
        timerProgressBar: "swal-propshare-timer",
      },
    });

    navigate("/signin");
  };

  return (
    <>
      {/* ── SweetAlert Custom Styles ── */}
      <style>{`
        .swal-propshare-popup {
          border-radius: 16px !important;
          font-family: inherit !important;
          box-shadow: 0 20px 60px rgba(236, 91, 19, 0.15), 0 8px 24px rgba(0,0,0,0.12) !important;
          border: 1px solid rgba(236, 91, 19, 0.12) !important;
          padding: 28px 24px !important;
        }
        .swal-propshare-title {
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #0f172a !important;
        }
        .swal2-icon.swal2-warning {
          border-color: #EC5B13 !important;
          color: #EC5B13 !important;
        }
        .swal-propshare-confirm {
          border-radius: 10px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 10px 20px !important;
          transition: all 0.2s ease !important;
        }
        .swal-propshare-confirm:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 14px rgba(236, 91, 19, 0.4) !important;
        }
        .swal-propshare-cancel {
          border-radius: 10px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 10px 20px !important;
        }
        .swal2-timer-progress-bar {
          background: #EC5B13 !important;
        }
      `}</style>

      <aside
        style={{ transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        className={`${
          collapsed ? "w-[72px]" : "w-64"
        } shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#221610] flex flex-col h-screen sticky top-0 overflow-hidden z-20`}
      >

        {/* ── Logo + Toggle ── */}
        <div className="flex items-center justify-between px-4 py-5 min-w-0">
          <div
            style={{ transition: "opacity 200ms ease, width 200ms ease" }}
            className={`flex items-center gap-2 overflow-hidden ${
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            }`}
          >
            <div className="bg-[#EC5B13] rounded-lg p-2 text-white shrink-0">
              <span className="material-symbols-outlined block text-[20px]">domain</span>
            </div>
            <div className="whitespace-nowrap">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                PropShare
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Tenant Panel
              </p>
            </div>
          </div>

          {collapsed && (
            <div className="bg-[#EC5B13] rounded-lg p-2 text-white mx-auto">
              <span className="material-symbols-outlined block text-[20px]">domain</span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            className={`shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13] text-slate-400 flex items-center justify-center transition-colors ${
              collapsed ? "mx-auto mt-0" : "ml-2"
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
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => {
            const isActive =
              activeLabel === item.label ||
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative group ${
                  isActive
                    ? "bg-[#EC5B13] text-white shadow-lg shadow-[#EC5B13]/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined shrink-0 text-[22px]">
                  {item.icon}
                </span>

                <span
                  style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
                  className={`whitespace-nowrap overflow-hidden ${
                    collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
                  }`}
                >
                  {item.label}
                </span>

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

        {/* ── Support Card ── */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <div className="bg-[#EC5B13]/10 dark:bg-[#EC5B13]/20 p-4 rounded-xl border border-[#EC5B13]/20">
              <p className="text-xs font-bold text-[#EC5B13] uppercase tracking-wider mb-1">
                Support Available
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Need help with your lease?
              </p>
              <button
                onClick={() => navigate("/tenant/support")}
                className="w-full py-2 bg-[#EC5B13] text-white text-xs font-bold rounded-lg hover:bg-[#EC5B13]/90 transition-all"
              >
                Contact Admin
              </button>
            </div>
          </div>
        )}

        {/* ── User Info ── */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div
            onClick={() => !collapsed && navigate("/tenant/profile")}
            className={`flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl ${
              !collapsed ? "cursor-pointer hover:bg-[#EC5B13]/5 dark:hover:bg-[#EC5B13]/10 transition-colors" : ""
            }`}
            title={collapsed ? user?.fullName ?? "Tenant" : "Edit Profil"}
          >
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.fullName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#EC5B13]/30"
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#EC5B13]/20 flex items-center justify-center text-[#EC5B13] font-bold text-sm">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            </div>

            <div
              style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
              className={`flex-1 overflow-hidden ${
                collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[120px]"
              }`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user?.fullName ?? "Tenant"}
              </p>
              <p className="text-xs text-[#EC5B13] font-medium truncate">
                Student Resident
              </p>
            </div>

            {!collapsed && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); navigate("/tenant/profile"); }}
                  className="text-slate-400 hover:text-[#EC5B13] transition-colors p-1 rounded-lg hover:bg-[#EC5B13]/10"
                  title="Edit Profil"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleLogout(); }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
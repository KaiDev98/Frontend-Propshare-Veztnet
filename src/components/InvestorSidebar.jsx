import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const NAV_ITEMS = [
  { label: "Dashboard",    icon: "dashboard",              path: "/investor/dashboard"    },
  { label: "Marketplace",  icon: "analytics",              path: "/investor/marketplace"  },
  { label: "Portfolio",    icon: "account_balance_wallet", path: "/investor/portfolio"    },
  { label: "Transactions", icon: "receipt_long",           path: "/investor/transactions" },
  // { label: "Feedback",     icon: "rate_review",            path: "/investor/feedback"     },
];

export default function InvestorSidebar({ activeLabel }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user,      setUser]      = useState(null);
  const [imgError,  setImgError]  = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem("user"));
        setUser(parsed);
        setImgError(false);
      } catch {}
    };
    loadUser();
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "IN";

  const shortWallet = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : "No Wallet";

  const showAvatar = user?.avatar && !imgError;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Akhiri Sesi?",
      text: "Anda akan keluar dari akun PropShare.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EC5B13",
      cancelButtonColor: "#64748b",
      background: document.documentElement.classList.contains("dark")
        ? "#1e1210"
        : "#ffffff",
      color: document.documentElement.classList.contains("dark")
        ? "#f1f5f9"
        : "#0f172a",
      customClass: {
        popup:         "rounded-2xl shadow-2xl",
        title:         "font-bold text-lg",
        confirmButton: "rounded-xl font-bold px-6",
        cancelButton:  "rounded-xl font-bold px-6",
      },
      buttonsStyling: true,
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    await Swal.fire({
      title: "Sampai jumpa! 👋",
      text: `Sesi ${user?.fullName ?? "Investor"} telah diakhiri.`,
      icon: "success",
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
      background: document.documentElement.classList.contains("dark")
        ? "#1e1210"
        : "#ffffff",
      color: document.documentElement.classList.contains("dark")
        ? "#f1f5f9"
        : "#0f172a",
      customClass: {
        popup:            "rounded-2xl shadow-2xl",
        title:            "font-bold text-lg",
        timerProgressBar: "bg-[#EC5B13]",
      },
    });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <aside
      style={{ transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#221610] h-screen sticky top-0 overflow-hidden z-20`}
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
              Investor Panel
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
        {NAV_ITEMS.map((item) => {
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

      {/* ── User Card ── */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div
          onClick={() => !collapsed && navigate("/investor/profile")}
          className={`flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl ${
            !collapsed
              ? "cursor-pointer hover:bg-[#EC5B13]/5 dark:hover:bg-[#EC5B13]/10 transition-colors"
              : ""
          }`}
          title={collapsed ? user?.fullName ?? "Investor" : "Edit Profil"}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#EC5B13]/20 ring-2 ring-[#EC5B13]/30 flex items-center justify-center text-[#EC5B13] font-bold text-sm overflow-hidden">
              {showAvatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                initials
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>

          {/* Info */}
          <div
            style={{ transition: "opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)" }}
            className={`flex-1 overflow-hidden ${
              collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[120px]"
            }`}
          >
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                {user?.fullName ?? "Investor"}
              </p>
              {user?.kycStatus === "VERIFIED" && (
                <span
                  className="material-symbols-outlined text-blue-500 text-[13px] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="KYC Verified"
                >
                  verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate font-mono">
              {shortWallet}
            </p>
          </div>

          {/* Action buttons */}
          {!collapsed && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/investor/profile"); }}
                className="text-slate-400 hover:text-[#EC5B13] transition-colors p-1 rounded-lg hover:bg-[#EC5B13]/10"
                title="Edit Profil"
              >
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
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
  );
}
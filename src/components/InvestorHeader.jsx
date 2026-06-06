import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import api from "../utils/api";
import Swal from "sweetalert2";

// --- IMPORT UNTUK WEB3 ---
import { getSigner } from "../utils/contracts";

const syncLocalStorage = (updatedUser) => {
  try {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    const merged   = { ...existing, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    window.dispatchEvent(new Event("userUpdated"));
  } catch {}
};

export default function InvestorHeader({ search = "", onSearch }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Sync data profile (termasuk wallet) di background saat pertama kali load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        if (data) {
          syncLocalStorage({
            avatar: data.avatar,
            fullName: data.fullName,
            kycStatus: data.kycStatus,
            role: data.role,
            walletAddress: data.walletAddress, // Ambil wallet dari DB jika sudah ada
          });
        }
      } catch (err) {
        console.error("Background profile sync failed:", err);
      }
    };

    fetchProfile();
  }, []);

  // ─── LOGIKA CONNECT WALLET (FIXED ENDPOINT) ───
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // 1. Ambil Signer & Address dari MetaMask
      const signer = await getSigner();
      const address = await signer.getAddress();

      // 2. Simpan ke Backend menggunakan rute yang benar: /auth/users/wallet
      await api.patch("/auth/users/wallet", { walletAddress: address });

      // 3. Update Local Storage agar UI berubah seketika
      syncLocalStorage({ walletAddress: address });

      Swal.fire({
        icon: "success",
        title: "Wallet Terhubung",
        text: `Wallet berhasil ditautkan ke akun Anda!`,
        confirmButtonColor: "#EC5B13",
      });
    } catch (err) {
      console.error("Gagal connect wallet:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Terhubung",
        text: err.response?.data?.message || err.message || "Pastikan MetaMask terinstall.",
        confirmButtonColor: "#EC5B13",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const { unreadCount } = useNotifications(30000);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "IN";

  const isKYCApproved = user?.kycStatus === "VERIFIED";
  const showAvatar    = Boolean(user?.avatar) && !imgError;
  
  // Format tampilan wallet: 0x1234...abcd
  const displayWallet = user?.walletAddress 
    ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`
    : null;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between gap-4 shrink-0">

      {/* Search Section */}
      {onSearch !== undefined ? (
        <div className="relative max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#EC5B13]/50 text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
            placeholder="Search assets, locations..."
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Action Section */}
      <div className="flex items-center gap-4 shrink-0">

        {/* --- TOMBOL CONNECT WALLET --- */}
        {displayWallet ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {displayWallet}
            </span>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#EC5B13] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isConnecting ? "progress_activity" : "account_balance_wallet"}
            </span>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => navigate("/investor/notifications")}
          className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Notifikasi"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#EC5B13] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#221610] px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User Info & Avatar */}
        <button
          onClick={() => navigate("/investor/profile")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-1">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {user?.fullName ?? "Investor"}
              </span>
              {isKYCApproved && (
                <span className="material-symbols-outlined text-blue-500 text-[14px]" title="Verified">
                  verified
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider text-right">
              {user?.role ?? "Investor"}
            </p>
          </div>

          <div className="size-9 rounded-full bg-[#EC5B13]/10 ring-2 ring-[#EC5B13]/30 flex items-center justify-center text-[#EC5B13] font-bold text-sm shrink-0 overflow-hidden">
            {showAvatar ? (
              <img
                key={user.avatar}
                src={user.avatar}
                alt={user?.fullName ?? "Avatar"}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              initials
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
import { useState, useEffect, useCallback } from "react";
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

export default function TenantHeader() {
  const navigate    = useNavigate();
  const [user, setUser] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setImgError(false);
    } catch {}
  }, []);

  useEffect(() => {
    loadUser();
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, [loadUser]);

  // ✅ Sinkronisasi profil di background (termasuk walletAddress)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        if (data) {
          syncLocalStorage({
            avatar:    data.avatar,
            fullName:  data.fullName,
            kycStatus: data.kycStatus,
            role:      data.role,
            walletAddress: data.walletAddress,
          });
        }
      } catch {
        // silent fail
      }
    };

    fetchProfile();
  }, []);

  // ─── LOGIKA CONNECT WALLET ───
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // 1. Ambil Alamat dari MetaMask
      const signer = await getSigner();
      const address = await signer.getAddress();

      // 2. Simpan ke Backend
      await api.patch("/auth/users/wallet", { walletAddress: address });

      // 3. Update UI secara lokal
      syncLocalStorage({ walletAddress: address });

      Swal.fire({
        icon: "success",
        title: "Wallet Terhubung",
        text: "Sekarang Anda bisa melakukan pembayaran sewa menggunakan ETH.",
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
    : "TN";

  const showAvatar = Boolean(user?.avatar) && !imgError;

  // Format tampilan wallet singkat (0x123...abcd)
  const displayWallet = user?.walletAddress 
    ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`
    : null;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-end gap-4">

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

      {/* Notification Bell */}
      <button
        onClick={() => navigate("/tenant/notifications")}
        className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        title="Notifikasi"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#EC5B13] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#221610] px-0.5 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {user?.fullName ?? "Tenant"}
          </p>
          <p className="text-xs text-slate-500 font-medium">Student Resident</p>
        </div>

        {/* Avatar */}
        <div
          onClick={() => navigate("/tenant/profile")}
          className="w-10 h-10 rounded-full border-2 border-[#EC5B13] cursor-pointer hover:scale-105 transition-transform overflow-hidden shrink-0 bg-[#EC5B13]/20 flex items-center justify-center"
        >
          {showAvatar ? (
            <img
              key={user.avatar}
              src={user.avatar}
              alt={user?.fullName ?? "Avatar"}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-[#EC5B13] font-bold text-sm select-none">
              {initials}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
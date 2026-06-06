// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Helper: decode JWT payload tanpa library ─────────────────────────────────
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// ─── Helper: cek apakah token sudah expired ───────────────────────────────────
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Init: baca dari localStorage saat app pertama kali load ──────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser  = localStorage.getItem("user");

    if (savedToken && !isTokenExpired(savedToken)) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
    } else {
      // Token expired atau tidak ada — bersihkan storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    setLoading(false);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────────
  // Backend response: { status: "success", data: { token, user } }
  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ res.data.data karena backend wrap dalam { status, data: {...} }
      const { token: newToken, user: userData } = res.data.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user",  JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message ?? "Login gagal";
      return { success: false, message };
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────────
  // Backend response: { status: "success", data: { token, user } }
  const register = useCallback(async (email, password, fullName, role = "INVESTOR") => {
    try {
      const res = await api.post("/auth/register", { email, password, fullName, role });
      const { token: newToken, user: userData } = res.data.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user",  JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message ?? "Registrasi gagal";
      return { success: false, message };
    }
  }, []);

  // ── Google Login ──────────────────────────────────────────────────────────────
  // Backend response: { status: "success", data: { token, user } }
  const googleLogin = useCallback(async (googleToken, role) => {
    try {
      const res = await api.post("/auth/google", { token: googleToken, role });
      const { token: newToken, user: userData } = res.data.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user",  JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message ?? "Google login gagal";
      return { success: false, message };
    }
  }, []);

  // ── Web3 Login ────────────────────────────────────────────────────────────────
  // Backend response: { status: "success", data: { token, user } }
  const web3Login = useCallback(async (walletAddress, fullName) => {
    try {
      const res = await api.post("/auth/web3-login", { walletAddress, fullName });
      const { token: newToken, user: userData } = res.data.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user",  JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message ?? "Web3 login gagal";
      return { success: false, message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  // ── Update user lokal (setelah edit profil, tanpa re-login) ───────────────────
  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  // ── Computed role helpers ─────────────────────────────────────────────────────
  const isAuthenticated = !!token && !!user;
  const isAdmin         = user?.role === "ADMIN";
  const isOwner         = user?.role === "OWNER";
  const isInvestor      = user?.role === "INVESTOR";
  const isTenant        = user?.role === "TENANT";

  // ─── Value yang di-expose ke seluruh app ─────────────────────────────────────
  const value = {
    user,             // { id, email, fullName, role, walletAddress }
    token,            // JWT string
    loading,          // true saat pertama kali init
    isAuthenticated,  // boolean
    isAdmin,          // boolean
    isOwner,          // boolean
    isInvestor,       // boolean
    isTenant,         // boolean
    login,            // async fn(email, password) → { success, user?, message? }
    register,         // async fn(email, password, fullName, role?) → { success, user?, message? }
    googleLogin,      // async fn(googleToken, role?) → { success, user?, message? }
    web3Login,        // async fn(walletAddress, fullName?) → { success, user?, message? }
    logout,           // fn() → redirect ke /login
    updateUser,       // fn(partialData) → update state & localStorage
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children hanya setelah init selesai agar tidak flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;
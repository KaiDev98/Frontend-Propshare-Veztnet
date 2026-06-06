// src/hooks/useNotifications.js
// Hook ini digunakan bersama oleh TenantHeader dan NotificationsTenant
// agar state notifikasi sinkron antara badge dan halaman notif

import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext"; // ← sesuaikan path auth context kamu

const READ_KEY = "propshare_read_notifs"; // localStorage key

// ─── Build notifications dari API data ────────────────────────────────────────
function buildNotifications(rentals, reports) {
  const notifs = [];

  rentals.forEach(r => {
    if (r.status === "ACTIVE") {
      notifs.push({
        id:          `rental-active-${r.id}`,
        type:        "rental",
        title:       "Pengajuan Sewa Disetujui ✅",
        message:     `Kamar #${r.room?.roomNumber ?? "—"} di ${r.room?.property?.title ?? r.property?.title ?? "properti"} sudah aktif.`,
        createdAt:   r.updatedAt ?? r.createdAt,
        actionLabel: "Lihat Kamar",
        actionPath:  "/tenant/room",
      });
    }

    if (r.status === "REJECTED" || r.status === "CANCELLED") {
      notifs.push({
        id:          `rental-rejected-${r.id}`,
        type:        "system",
        title:       r.status === "REJECTED" ? "Pengajuan Sewa Ditolak" : "Sewa Dibatalkan",
        message:     `Pengajuan di ${r.room?.property?.title ?? r.property?.title ?? "properti"} tidak disetujui.`,
        createdAt:   r.updatedAt ?? r.createdAt,
        actionLabel: "Cari Properti Lain",
        actionPath:  "/tenant/marketplace",
      });
    }

    // Payments
    (r.payments ?? []).forEach(p => {
      if (p.status === "VERIFIED") {
        notifs.push({
          id:          `payment-verified-${p.id}`,
          type:        "payment",
          title:       "Pembayaran Terverifikasi ✅",
          message:     `Pembayaran sewa Rp ${p.amount?.toLocaleString("id-ID")} dikonfirmasi owner.`,
          createdAt:   p.paymentDate ?? p.updatedAt ?? p.createdAt,
          actionLabel: "Lihat Riwayat Bayar",
          actionPath:  "/tenant/payments",
        });
      }
      if (p.status === "PENDING") {
        notifs.push({
          id:        `payment-pending-${p.id}`,
          type:      "payment",
          title:     "Menunggu Verifikasi Pembayaran",
          message:   `Pembayaran Rp ${p.amount?.toLocaleString("id-ID")} menunggu konfirmasi owner.`,
          createdAt: p.paymentDate ?? p.createdAt,
        });
      }
    });
  });

  reports.forEach(r => {
    if (r.status === "IN_PROGRESS") {
      notifs.push({
        id:          `report-progress-${r.id}`,
        type:        "maintenance",
        title:       "Laporan Sedang Dikerjakan 🔧",
        message:     `Laporan "${r.title}" sedang dalam proses perbaikan.`,
        createdAt:   r.updatedAt ?? r.createdAt,
        actionLabel: "Lihat Detail",
        actionPath:  "/tenant/maintenance",
      });
    }
    if (r.status === "RESOLVED") {
      notifs.push({
        id:          `report-resolved-${r.id}`,
        type:        "maintenance",
        title:       "Laporan Selesai Diperbaiki ✅",
        message:     `Laporan "${r.title}" telah selesai diperbaiki.`,
        createdAt:   r.updatedAt ?? r.createdAt,
        actionLabel: "Lihat Detail",
        actionPath:  "/tenant/maintenance",
      });
    }
  });

  // Sort terbaru dulu
  notifs.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  return notifs;
}

// ─── Load/save read IDs dari localStorage ─────────────────────────────────────
function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useNotifications(pollInterval = 60000) {
  const { user } = useAuth(); // ← ambil user dari auth context

  // ✅ Hanya TENANT yang boleh fetch kedua endpoint ini
  const isTenant = user?.role === "TENANT";

  const [notifications, setNotifications] = useState([]);
  const [readIds,       setReadIds]       = useState(getReadIds);
  const [loading,       setLoading]       = useState(true);

  const fetchAll = useCallback(async () => {
    // ✅ Guard: kalau bukan TENANT, langsung return tanpa fetch
    // Mencegah 403 Forbidden untuk role INVESTOR / OWNER / ADMIN
    if (!isTenant) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const [rentalRes, reportRes] = await Promise.allSettled([
        api.get("/rentals/my-rentals"),
        api.get("/reports"),
      ]);

      const rentals = rentalRes.status === "fulfilled"
        ? (rentalRes.value.data?.data ?? [])
        : [];

      const reports = reportRes.status === "fulfilled"
        ? (reportRes.value.data?.data ?? [])
        : [];

      setNotifications(buildNotifications(rentals, reports));
    } catch (err) {
      console.error("useNotifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isTenant]); // ← isTenant sebagai dependency, re-run kalau role berubah

  // Initial fetch + polling
  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, pollInterval);
    return () => clearInterval(timer);
  }, [fetchAll, pollInterval]);

  // Sync readIds dari localStorage kalau tab lain update
  useEffect(() => {
    const onStorage = () => setReadIds(getReadIds());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  // Merge isRead state
  const notificationsWithRead = notifications.map(n => ({
    ...n,
    isRead: readIds.has(n.id),
  }));

  const unreadCount = notificationsWithRead.filter(n => !n.isRead).length;

  return {
    notifications: notificationsWithRead,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchAll,
  };
}
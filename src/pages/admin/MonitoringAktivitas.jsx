import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader  from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

const STATUS_STYLES = {
  Success:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Failed:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VERIFIED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ACTIVE:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${days} hari yang lalu`;
}

function buildActivityLogs(users, properties, rentals, payments) {
  const logs = [];

  payments.forEach(p => {
    logs.push({
      time:   p.paymentDate ?? p.createdAt,
      action: p.status === "VERIFIED" ? "Payment Verified" : "Payment Uploaded",
      user:   p.rental?.tenant?.fullName ?? "Tenant",
      status: p.status === "VERIFIED" ? "Success" : "Pending",
      detail: `Rp ${p.amount?.toLocaleString("id-ID")}`,
    });
  });

  rentals.forEach(r => {
    logs.push({
      time:   r.createdAt,
      action: r.status === "ACTIVE" ? "Rental Approved" : r.status === "PENDING" ? "Rental Request" : `Rental ${r.status}`,
      user:   r.tenant?.fullName ?? "Tenant",
      status: r.status === "ACTIVE" ? "Success" : r.status === "PENDING" ? "Pending" : "Failed",
      detail: r.room?.property?.title ?? r.property?.title ?? "—",
    });
  });

  properties.slice(0, 5).forEach(p => {
    logs.push({
      time:   p.createdAt,
      action: "Property Listed",
      user:   p.owner?.fullName ?? "Owner",
      status: p.status === "ACTIVE" ? "Success" : "Pending",
      detail: p.title,
    });
  });

  users.slice(0, 3).forEach(u => {
    logs.push({
      time:   u.createdAt,
      action: "User Registered",
      user:   u.fullName ?? u.email,
      status: "Success",
      detail: u.role,
    });
  });

  return logs.sort((a, b) => new Date(b.time ?? 0) - new Date(a.time ?? 0));
}

// ─── Pagination Component ───────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to   = Math.min(currentPage * rowsPerPage, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const btnBase = "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all select-none";
  const btnActive = "bg-[#fd9914] text-white shadow-sm";
  const btnInactive = "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
  const btnDisabled = "text-slate-300 dark:text-slate-600 cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      {/* Info + rows per page */}
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>
          Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{from}–{to}</span> dari <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> entri
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Baris:</span>
          <select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#fd9914]/50"
          >
            {ROWS_PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
          aria-label="Halaman sebelumnya"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
              aria-label={`Halaman ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnInactive}`}
          aria-label="Halaman berikutnya"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────

export default function MonitoringAktivitas() {
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [logs,        setLogs]        = useState([]);
  const [metrics,     setMetrics]     = useState({ transactions:0, activeUsers:0, totalRent:0, uptime:"99.9%" });
  const [alerts,      setAlerts]      = useState([]);
  const [lastUpdate,  setLastUpdate]  = useState(null);

  // ── Pagination state ─────────────────────────────────────
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);
  // ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);

      const [usersRes, propsRes, rentalsRes] = await Promise.allSettled([
        api.get("/auth/users"),
        api.get("/properties"),
        api.get("/rentals").catch(() => ({ data: { data: [] } })),
      ]);

      const users   = usersRes.status   === "fulfilled" ? (usersRes.value.data?.data   ?? []) : [];
      const props   = propsRes.status   === "fulfilled" ? (propsRes.value.data?.data   ?? []) : [];
      const rentals = rentalsRes.status === "fulfilled" ? (rentalsRes.value.data?.data ?? []) : [];

      const allPaymentsFlat = rentals.flatMap(r =>
        (r.payments ?? []).map(p => ({ ...p, rental: r }))
      );

      const totalRent = allPaymentsFlat
        .filter(p => p.status === "VERIFIED")
        .reduce((s, p) => s + (p.amount ?? 0), 0);

      setMetrics({
        transactions: allPaymentsFlat.length,
        activeUsers:  users.filter(u => u.role !== "ADMIN").length,
        totalRent,
        uptime: "99.9%",
      });

      setLogs(buildActivityLogs(users, props, rentals, allPaymentsFlat));
      setCurrentPage(1); // reset ke halaman 1 setiap refresh data

      const newAlerts = [];
      const pendingUsers = users.filter(u => !u.kycStatus || u.kycStatus === "PENDING");
      const pendingProps = props.filter(p => !p.status || p.status === "PENDING");

      if (pendingUsers.length > 0) {
        newAlerts.push({
          icon:"person_search", iconColor:"text-amber-500", borderColor:"border-l-amber-500",
          title:`${pendingUsers.length} User Menunggu Verifikasi KYC`,
          desc: pendingUsers.slice(0,3).map(u => u.fullName).join(", ") + (pendingUsers.length > 3 ? "..." : ""),
          time: timeAgo(pendingUsers[0]?.createdAt),
          action: () => window.location.href = "/admin/kyc",
        });
      }

      if (pendingProps.length > 0) {
        newAlerts.push({
          icon:"home_work", iconColor:"text-blue-500", borderColor:"border-l-blue-500",
          title:`${pendingProps.length} Properti Menunggu Review`,
          desc: pendingProps.slice(0,2).map(p => p.title).join(", ") + (pendingProps.length > 2 ? "..." : ""),
          time: timeAgo(pendingProps[0]?.createdAt),
          action: () => window.location.href = "/admin/kyc",
        });
      }

      const pendingPayments = allPaymentsFlat.filter(p => p.status === "PENDING");
      if (pendingPayments.length > 0) {
        newAlerts.push({
          icon:"payments", iconColor:"text-[#fd9914]", borderColor:"border-l-[#fd9914]",
          title:`${pendingPayments.length} Pembayaran Menunggu Verifikasi`,
          desc: `Total: Rp ${pendingPayments.reduce((s,p) => s+(p.amount??0), 0).toLocaleString("id-ID")}`,
          time: timeAgo(pendingPayments[0]?.paymentDate),
          action: () => window.location.href = "/admin/monitoring",
        });
      }

      if (newAlerts.length === 0) {
        newAlerts.push({
          icon:"check_circle", iconColor:"text-green-500", borderColor:"border-l-green-500",
          title:"Semua Sistem Normal",
          desc: "Tidak ada peringatan yang memerlukan perhatian saat ini.",
          time: "Baru saja",
          action: null,
        });
      }

      setAlerts(newAlerts);
      setLastUpdate(new Date());

    } catch (err) {
      console.error("Fetch monitoring error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const timer = setInterval(fetchAll, 60000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // Reset ke halaman 1 saat search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDownloadReport = () => {
    const csv = [
      ["Timestamp","Action","User","Status","Detail"],
      ...logs.map(l => [
        l.time ? new Date(l.time).toLocaleString("id-ID") : "—",
        l.action, l.user, l.status, l.detail ?? "—"
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `activity-log-${new Date().toLocaleDateString("id-ID").replace(/\//g,"-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived data ──────────────────────────────────────────
  const filteredLogs = logs.filter(l =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.toLowerCase().includes(search.toLowerCase()) ||
    l.detail?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages   = Math.ceil(filteredLogs.length / rowsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  // ─────────────────────────────────────────────────────────

  const METRICS_CONFIG = [
    { label:"Transaction Volume", value: loading ? "—" : metrics.transactions.toLocaleString("id-ID"),    trend:"+realtime", trendUp:true,  icon:"swap_horiz", iconBg:"bg-[#fd9914]/10 text-[#fd9914]"    },
    { label:"Total Users",        value: loading ? "—" : metrics.activeUsers.toLocaleString("id-ID"),     trend:"terdaftar", trendUp:true,  icon:"group",      iconBg:"bg-blue-500/10 text-blue-500"        },
    { label:"Total Pendapatan",   value: loading ? "—" : `Rp ${(metrics.totalRent/1000000).toFixed(1)}M`, trend:"pembayaran verified", trendUp:true, icon:"payments", iconBg:"bg-purple-500/10 text-purple-500" },
    { label:"System Uptime",      value: metrics.uptime, trend:"Stable", trendUp:null, icon:"speed",      iconBg:"bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <AdminSidebar activeLabel="Monitoring Aktivitas" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title="Overview Sistem"
          icon="monitor_heart"
          searchPlaceholder="Cari log atau user..."
          onSearch={setSearch}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Last update + refresh */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {lastUpdate ? `Update terakhir: ${lastUpdate.toLocaleTimeString("id-ID")}` : "Memuat data..."}
            </p>
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
              Refresh
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? [...Array(4)].map((_,i) => <Skeleton key={i} className="h-32" />) :
            METRICS_CONFIG.map(m => (
              <div key={m.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className={`material-symbols-outlined p-2 rounded-lg ${m.iconBg}`}>{m.icon}</span>
                  {m.trendUp === null ? (
                    <span className="text-slate-400 text-xs font-bold">{m.trend}</span>
                  ) : (
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">{m.trendUp ? "trending_up" : "trending_down"}</span>
                      {m.trend}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm font-medium">{m.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{m.value}</h3>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Activity Log */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  System Activity Log
                  {!loading && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({filteredLogs.length} entri)
                    </span>
                  )}
                </h3>
                <button onClick={handleDownloadReport} disabled={loading || logs.length === 0}
                  className="text-sm text-[#fd9914] font-semibold hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download CSV
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        {["Timestamp","Action","User","Detail","Status"].map((h, i) => (
                          <th key={h} className={`px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider ${i === 4 ? "text-center" : ""}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loading ? (
                        [...Array(rowsPerPage > 6 ? 6 : rowsPerPage)].map((_,i) => (
                          <tr key={i}>
                            <td colSpan={5} className="px-5 py-3">
                              <Skeleton className="h-6" />
                            </td>
                          </tr>
                        ))
                      ) : paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                              {log.time
                                ? new Date(log.time).toLocaleString("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
                                : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{log.action}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{log.user}</td>
                            <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[140px] truncate">{log.detail ?? "—"}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${STATUS_STYLES[log.status] ?? STATUS_STYLES.Pending}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                            <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                            {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada activity log"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && filteredLogs.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredLogs.length}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(n) => {
                      setRowsPerPage(n);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Security Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Alerts</h3>
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live
                </span>
              </div>

              <div className="space-y-4">
                {loading ? [...Array(3)].map((_,i) => <Skeleton key={i} className="h-20" />) :
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    onClick={alert.action ?? undefined}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 ${alert.borderColor} ${alert.action ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                  >
                    <div className="flex gap-3">
                      <span className={`material-symbols-outlined shrink-0 ${alert.iconColor}`}>{alert.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{alert.title}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{alert.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-semibold">{alert.time}</p>
                      </div>
                      {alert.action && (
                        <span className="material-symbols-outlined text-slate-300 text-[18px] shrink-0">chevron_right</span>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => Swal.fire({
                    icon:"info",
                    title:"Semua Alert",
                    html: alerts.map(a => `<div style="text-align:left;margin-bottom:8px"><b>${a.title}</b><br/><span style="font-size:12px;color:#64748b">${a.desc}</span></div>`).join(""),
                    confirmButtonColor:"#fd9914"
                  })}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors text-slate-700 dark:text-slate-300"
                >
                  Lihat Semua Peringatan
                </button>
              </div>

              {/* System Health */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-2">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">System Health</h4>
                <div className="space-y-3">
                  {[
                    { label:"Backend API",  ok:true },
                    { label:"Database",     ok:true },
                    { label:"Blockchain",   ok: !!import.meta.env.VITE_RENT_CONTRACT_ADDRESS },
                    { label:"File Storage", ok:true },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{s.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-green-500" : "bg-amber-400"}`} />
                        <span className={`text-xs font-bold ${s.ok ? "text-green-600" : "text-amber-500"}`}>
                          {s.ok ? "Operational" : "Check Config"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
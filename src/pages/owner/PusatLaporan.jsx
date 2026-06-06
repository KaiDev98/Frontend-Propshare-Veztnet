import { useState, useEffect, useMemo } from "react";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  High:   { color: "text-red-600",    dot: "bg-red-500"    },
  Medium: { color: "text-orange-500", dot: "bg-orange-500" },
  Low:    { color: "text-slate-400",  dot: "bg-slate-400"  },
};

const STATUS_STYLE = {
  NEW:         "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABEL = {
  NEW:         "NEW",
  IN_PROGRESS: "IN PROGRESS",
  RESOLVED:    "RESOLVED",
};

const PRIORITY_COLOR = {
  High:   "bg-red-100 text-red-600",
  Medium: "bg-orange-100 text-orange-600",
  Low:    "bg-slate-100 text-slate-500",
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />;
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PusatLaporan() {
  const [search,      setSearch]      = useState("");
  const [selectedId,  setSelectedId]  = useState(null);
  const [showFullImg, setShowFullImg] = useState(false);
  const [reports,     setReports]     = useState([]);
  const [stats,       setStats]       = useState({ total: 0, active: 0, resolved: 0, high: 0 });
  const [loading,     setLoading]     = useState(true);
  const [properties,  setProperties]  = useState([]);
  const [selectedProp, setSelectedProp] = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [page,        setPage]        = useState(1);
  const PER_PAGE = 8;

  // ─── Fetch properties ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res  = await api.get("/properties/my-listings");
        const data = res.data.data;
        setProperties(data);
        if (data.length > 0) setSelectedProp(data[0].id);
      } catch (err) {
        console.error("Fetch props:", err);
      }
    };
    fetch();
  }, []);

  // ─── Fetch reports per properti ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedProp) return;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reports?propertyId=${selectedProp}`);
        setReports(res.data.data ?? []);
        setStats(res.data.stats ?? { total: 0, active: 0, resolved: 0, high: 0 });
        setSelectedId(res.data.data?.[0]?.id ?? null);
        setPage(1);
      } catch (err) {
        console.error("Fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [selectedProp]);

  // ─── Filter + Pagination ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.tenant?.fullName?.toLowerCase().includes(q) ||
        r.room?.roomNumber?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  // ─── Timeline dari status ─────────────────────────────────────────────────
  const getTimeline = (report) => {
    if (!report) return [];
    const steps = [
      { key: "NEW",         label: "Laporan Diterima",          time: new Date(report.createdAt).toLocaleString("id-ID") },
      { key: "IN_PROGRESS", label: "Ditangani Teknisi",         time: report.status !== "NEW" ? "Sedang diproses" : "Pending" },
      { key: "RESOLVED",    label: "Laporan Diselesaikan",      time: report.status === "RESOLVED" ? "Selesai" : "Pending" },
    ];
    const idx = ["NEW", "IN_PROGRESS", "RESOLVED"].indexOf(report.status);
    return steps.map((s, i) => ({ ...s, active: i <= idx }));
  };

  // ─── Update Status ────────────────────────────────────────────────────────
  const handleUpdateStatus = async (reportId, newStatus, reportTitle) => {
    const labels = { IN_PROGRESS: "In Progress", RESOLVED: "Selesai" };

    const confirm = await Swal.fire({
      icon:  "question",
      title: `Ubah Status ke "${labels[newStatus] ?? newStatus}"?`,
      html: `<p style="font-size:13px;color:#64748b">Laporan: <b>${reportTitle}</b></p>`,
      showCancelButton:   true,
      confirmButtonColor: "#EC5B13",
      cancelButtonColor:  "#94a3b8",
      confirmButtonText:  "Ya, Ubah",
      cancelButtonText:   "Batal",
    });

    if (!confirm.isConfirmed) return;

    setUpdatingId(reportId);
    try {
      const res = await api.patch(`/reports/${reportId}/status`, { status: newStatus });
      const updated = res.data.data;

      // Update state lokal
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: updated.status } : r))
      );

      // Update stats
      const newReports = reports.map((r) => (r.id === reportId ? { ...r, status: updated.status } : r));
      setStats({
        total:    newReports.length,
        active:   newReports.filter((r) => r.status !== "RESOLVED").length,
        resolved: newReports.filter((r) => r.status === "RESOLVED").length,
        high:     newReports.filter((r) => r.priority === "High").length,
      });

      Swal.fire({
        icon:              "success",
        title:             "Status Diperbarui!",
        timer:             1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon:               "error",
        title:              "Gagal Update Status",
        text:               err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const STATS_CARDS = [
    { label: "Total Laporan",    value: stats.total,    icon: "assignment",      bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600"      },
    { label: "Laporan Aktif",    value: stats.active,   icon: "pending_actions", bg: "bg-orange-100 dark:bg-orange-900/30 text-[#EC5B13]" },
    { label: "Laporan Selesai",  value: stats.resolved, icon: "task_alt",        bg: "bg-green-100 dark:bg-green-900/30 text-green-600"   },
    { label: "Prioritas Tinggi", value: stats.high,     icon: "priority_high",   bg: "bg-red-100 dark:bg-red-900/30 text-red-600"         },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Pusat Laporan Kerusakan" />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="h-20 flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Pusat Laporan Kerusakan
          </h2>
          <div className="flex items-center gap-4">
            {/* Property Selector */}
            {properties.length > 1 && (
              <select
                value={selectedProp || ""}
                onChange={(e) => setSelectedProp(e.target.value)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-[#EC5B13]"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari laporan..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#EC5B13] outline-none w-64 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative">
              <span className="material-symbols-outlined">notifications</span>
              {stats.active > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EC5B13] rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
              : STATS_CARDS.map((s) => (
                  <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                      <span className="material-symbols-outlined">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm font-medium">{s.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    </div>
                  </div>
                ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* ── Left: Table ── */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Daftar Laporan Terbaru
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {["Penghuni & Unit", "Kategori", "Prioritas", "Status", "Aksi"].map((h) => (
                          <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loading ? (
                        [...Array(4)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(5)].map((__, j) => (
                              <td key={j} className="px-6 py-4">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : paginated.length > 0 ? (
                        paginated.map((r) => {
                          const pStyle = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.Medium;
                          return (
                            <tr
                              key={r.id}
                              onClick={() => setSelectedId(r.id)}
                              className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${
                                selectedId === r.id ? "bg-[#EC5B13]/5" : ""
                              }`}
                            >
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {r.tenant?.fullName ?? "—"}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                  Unit {r.room?.roomNumber ?? "—"}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {r.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-1.5 ${pStyle.color}`}>
                                  <span className={`w-2 h-2 rounded-full ${pStyle.dot}`} />
                                  <span className="text-xs font-bold">{r.priority}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status] ?? ""}`}>
                                  {STATUS_LABEL[r.status] ?? r.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
                                  className="text-[#EC5B13] font-bold text-xs hover:underline"
                                >
                                  Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300">assignment_late</span>
                            <p className="text-slate-400 text-sm mt-2">Tidak ada laporan ditemukan</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Menampilkan{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{paginated.length}</span>{" "}
                    dari{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
                    laporan
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-500">chevron_left</span>
                    </button>
                    <span className="text-xs text-slate-500 self-center font-medium px-2">
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Detail ── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detail Laporan</h3>

              {!selectedReport ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-slate-300">manage_search</span>
                  <p className="text-slate-400 text-sm text-center">
                    {loading ? "Memuat laporan..." : "Pilih laporan untuk melihat detail"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Detail Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedReport.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          Dilaporkan:{" "}
                          {new Date(selectedReport.createdAt).toLocaleString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        PRIORITY_COLOR[selectedReport.priority] ?? "bg-slate-100 text-slate-500"
                      }`}>
                        {selectedReport.priority}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Kategori</p>
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {selectedReport.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Deskripsi</p>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
                        "{selectedReport.description}"
                      </p>
                    </div>

                    {/* Foto */}
                    {selectedReport.imageUrl ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Lampiran Foto</p>
                        <div className="w-full aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative group">
                          <img
                            src={selectedReport.imageUrl}
                            alt="Maintenance proof"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => setShowFullImg(true)}
                              className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold"
                            >
                              Lihat Ukuran Penuh
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-1 border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-300 text-3xl">image_not_supported</span>
                        <p className="text-xs text-slate-400">Tidak ada foto</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      {selectedReport.status !== "IN_PROGRESS" && selectedReport.status !== "RESOLVED" && (
                        <button
                          disabled={!!updatingId}
                          onClick={() => handleUpdateStatus(selectedReport.id, "IN_PROGRESS", selectedReport.title)}
                          className="w-full py-3 bg-[#EC5B13] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#EC5B13]/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-[#EC5B13]/20 disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-lg">engineering</span>
                          Proses Laporan
                        </button>
                      )}
                      {selectedReport.status !== "RESOLVED" && (
                        <button
                          disabled={!!updatingId}
                          onClick={() => handleUpdateStatus(selectedReport.id, "RESOLVED", selectedReport.title)}
                          className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
                        >
                          {updatingId === selectedReport.id ? (
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          )}
                          Tandai Selesai
                        </button>
                      )}
                      {selectedReport.status === "RESOLVED" && (
                        <div className="w-full py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-bold text-green-600 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-lg">task_alt</span>
                          Laporan Telah Diselesaikan
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aktivitas Laporan</h4>
                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      {getTimeline(selectedReport).map((t, i) => (
                        <div key={i} className="relative pl-8">
                          <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${
                            t.active ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                          }`} />
                          <p className={`text-xs font-bold ${t.active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                            {t.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{t.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Full Image Modal ── */}
      {showFullImg && selectedReport?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setShowFullImg(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFullImg(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold flex items-center gap-1 text-sm"
            >
              <span className="material-symbols-outlined">close</span>
              Tutup
            </button>
            <img
              src={selectedReport.imageUrl}
              alt="Full size"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
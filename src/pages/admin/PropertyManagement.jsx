import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

function Pagination({ total, page, onPage, perPage = 10 }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
      <p className="text-xs text-slate-500 font-medium">
        Menampilkan {Math.min((page - 1) * perPage + 1, total || 0)}–{Math.min(page * perPage, total)} dari{" "}
        <span className="font-bold text-slate-900 dark:text-white">{total.toLocaleString()}</span> properti
      </p>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}
          className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        {[...Array(Math.min(3, totalPages))].map((_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`size-8 rounded-lg text-xs font-bold transition-colors ${page === p ? "bg-[#fd9914] text-white" : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
              {p}
            </button>
          );
        })}
        <button disabled={page === totalPages || total === 0} onClick={() => onPage(page + 1)}
          className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  ACTIVE:   "bg-green-100 text-green-700 dark:bg-green-900/30",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-800",
  PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30",
};

// ─── SHARED: Lihat Dokumen (ipfsLegalDoc) ─────────────────────────────────────
function handleViewDoc(prop) {
  const GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud/ipfs";
  
  // Split CID yang digabung dengan "|"
  const cids = prop.ipfsLegalDoc
    ? prop.ipfsLegalDoc.split("|").filter(Boolean)
    : [];

  const docLabels = ["Sertifikat (SHM/SHGB)", "IMB"];

  const docButtons = cids.length > 0
    ? cids.map((cid, i) => `
        <a href="${GATEWAY}/${cid.trim()}" target="_blank"
           style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;
                  color:#334155;padding:10px 14px;border-radius:8px;text-decoration:none;
                  font-weight:bold;margin-top:10px;border:1px solid #cbd5e1;font-size:13px;width:100%">
          <span class="material-symbols-outlined" style="font-size:18px;">description</span>
          ${docLabels[i] ?? `Dokumen ${i + 1}`}
          <span class="material-symbols-outlined" style="font-size:14px;margin-left:auto;">open_in_new</span>
        </a>`).join("")
    : `<div style="margin-top:12px;padding:10px 14px;background:#fef9c3;color:#854d0e;
                   border-radius:8px;font-size:12px;border:1px solid #fde68a;
                   display:flex;align-items:center;gap:6px;">
         <span class="material-symbols-outlined" style="font-size:16px;">info</span>
         Owner belum mengupload dokumen legalitas
       </div>`;

  Swal.fire({
    title: "Dokumen Legalitas Properti",
    html: `
      <div style="text-align:left;font-size:13px;color:#64748b;line-height:2.4">
        🏠 Properti: <b style="color:#0f172a">${prop.title ?? "—"}</b><br/>
        👤 Owner: <b style="color:#0f172a">${prop.owner?.fullName ?? "—"}</b><br/>
        📊 Status: <b style="color:#0f172a">${prop.status ?? "PENDING"}</b>
        <br/>
        <div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
          ${docButtons}
        </div>
      </div>`,
    confirmButtonColor: "#fd9914",
    confirmButtonText: "Tutup",
    width: "32em",
  });
}

// ─── TAB 1: ANTRIAN LEGALITAS (PENDING SAJA) ─────────────────────────────────
function TabAntrianLegalitas({ search, onRefresh }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/properties");
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      
      const filtered = raw
        .filter(p => !p.status || p.status === "PENDING")
        .filter(p =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.owner?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.location?.toLowerCase().includes(search.toLowerCase())
        );

      setTotal(filtered.length);
      setProperties(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    } catch { 
      setProperties([]); 
    } finally { 
      setLoading(false); 
    }
  }, [search, page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleVerify = async (prop, isApprove) => {
    const statusText = isApprove ? "Setujui" : "Tolak";
    const statusApi  = isApprove ? "ACTIVE" : "REJECTED";
    const color      = isApprove ? "#22c55e" : "#ef4444";

    const ok = await Swal.fire({
      icon: "question",
      title: `${statusText} Properti?`,
      html: `<div style="font-size:13px;color:#64748b">🏠 <b>${prop.title}</b><br/>👤 Owner: ${prop.owner?.fullName ?? "—"}</div>`,
      showCancelButton: true,
      confirmButtonColor: color,
      cancelButtonColor: "#94a3b8",
      confirmButtonText: `Ya, ${statusText}`,
      cancelButtonText: "Batal",
    });

    if (!ok.isConfirmed) return;

    try {
      await api.patch(`/admin/properties/${prop.id}/verify`, { status: statusApi });
      await fetchProperties();
      if (onRefresh) onRefresh();
      Swal.fire({ icon: "success", title: `Properti di-${statusText.toLowerCase()}!`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan.", confirmButtonColor: "#fd9914" });
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {["Properti", "Owner", "Lokasi", "Dokumen", "Status", "Actions"].map((h, i) => (
                <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-6 py-3"><Skeleton className="h-8" /></td></tr>
            )) : properties.length > 0 ? properties.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Properti */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" onError={e=>{e.target.style.display="none"}} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">apartment</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.category ?? "Properti"}</p>
                    </div>
                  </div>
                </td>

                {/* Owner */}
                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{p.owner?.fullName ?? "—"}</td>

                {/* Lokasi */}
                <td className="px-6 py-4 text-sm text-slate-500 max-w-[150px] truncate">{p.location ?? "—"}</td>

                {/* Dokumen */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDoc(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      p.ipfsLegalDoc
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800"
                    }`}
                    title={p.ipfsLegalDoc ? "Lihat dokumen legalitas" : "Belum ada dokumen"}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {p.ipfsLegalDoc ? "description" : "file_present"}
                    </span>
                    {p.ipfsLegalDoc ? "Lihat" : "Kosong"}
                  </button>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES.PENDING}`}>
                    MENUNGGU REVIEW
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleVerify(p, true)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-bold transition-colors">
                      Setujui
                    </button>
                    <button onClick={() => handleVerify(p, false)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-bold transition-colors">
                      Tolak
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">fact_check</span>
                  {search ? `Tidak ada hasil untuk "${search}"` : "Tidak ada antrian properti"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} page={page} onPage={setPage} />
    </>
  );
}

// ─── TAB 2: MODERASI PROPERTI (SELAIN PENDING) ───────────────────────────────
function TabModerasiProperti({ search, onRefresh }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/properties");
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      
      const filtered = raw
        .filter(p => p.status && p.status !== "PENDING")
        .filter(p =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.owner?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.location?.toLowerCase().includes(search.toLowerCase())
        );

      setTotal(filtered.length);
      setProperties(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    } catch { 
      setProperties([]); 
    } finally { 
      setLoading(false); 
    }
  }, [search, page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleAction = async (prop, actionType) => {
    let config = {};
    if (actionType === "INACTIVE") {
      config = { icon: "warning", title: "Nonaktifkan Properti?", color: "#f59e0b", text: "Ya, Nonaktifkan", path: `/admin/properties/${prop.id}/verify`, payload: { status: "INACTIVE" } };
    } else if (actionType === "DELETE") {
      config = { icon: "error", title: "Hapus Permanen?", color: "#ef4444", text: "Ya, Hapus!", path: `/admin/properties/${prop.id}`, isDelete: true };
    } else if (actionType === "RECOVER") {
      config = { icon: "question", title: "Aktifkan Kembali?", color: "#22c55e", text: "Ya, Aktifkan", path: `/admin/properties/${prop.id}/verify`, payload: { status: "ACTIVE" } };
    }

    const ok = await Swal.fire({
      icon: config.icon,
      title: config.title,
      html: `<div style="font-size:13px;color:#64748b">🏠 <b>${prop.title}</b></div>`,
      showCancelButton: true,
      confirmButtonColor: config.color,
      cancelButtonColor: "#94a3b8",
      confirmButtonText: config.text,
      cancelButtonText: "Batal",
    });

    if (!ok.isConfirmed) return;

    try {
      if (config.isDelete) {
        await api.delete(config.path);
      } else {
        await api.patch(config.path, config.payload);
      }
      await fetchProperties();
      if (onRefresh) onRefresh();
      Swal.fire({ icon: "success", title: "Berhasil!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan.", confirmButtonColor: "#fd9914" });
    }
  };

  const handleViewDetail = (prop) => {
    Swal.fire({
      title: prop.title,
      html: `<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.5">
        👤 Owner: <b>${prop.owner?.fullName ?? "—"}</b><br/>
        📍 Lokasi: <b>${prop.location ?? "—"}</b><br/>
        💰 Harga: <b>Rp ${prop.tokenPrice?.toLocaleString("id-ID") ?? "—"}</b><br/>
        📊 Status: <b>${prop.status}</b><br/>
        ${prop.description ? `📝 Deskripsi: <i>${prop.description.slice(0, 100)}...</i>` : ""}
      </div>`,
      confirmButtonColor: "#fd9914",
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {["Properti", "Owner", "Harga/Bulan", "Dokumen", "Status", "Actions"].map((h, i) => (
                <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-6 py-3"><Skeleton className="h-8" /></td></tr>
            )) : properties.length > 0 ? properties.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Properti */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} className={`w-10 h-10 rounded-lg object-cover shrink-0 ${p.status !== "ACTIVE" ? "grayscale opacity-60" : ""}`} alt="" onError={e=>{e.target.style.display="none"}} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">apartment</span>
                      </div>
                    )}
                    <div>
                      <p className={`text-sm font-semibold line-clamp-1 ${p.status !== "ACTIVE" ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>{p.title}</p>
                      <p className="text-xs text-slate-500">{p.location?.slice(0, 30) ?? "—"}...</p>
                    </div>
                  </div>
                </td>

                {/* Owner */}
                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{p.owner?.fullName ?? "—"}</td>

                {/* Harga */}
                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                  {p.tokenPrice ? `Rp ${p.tokenPrice.toLocaleString("id-ID")}` : "—"}
                </td>

                {/* Dokumen */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDoc(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      p.ipfsLegalDoc
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800"
                    }`}
                    title={p.ipfsLegalDoc ? "Lihat dokumen legalitas" : "Belum ada dokumen"}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {p.ipfsLegalDoc ? "description" : "file_present"}
                    </span>
                    {p.ipfsLegalDoc ? "Lihat" : "Kosong"}
                  </button>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[p.status] ?? STATUS_STYLES.INACTIVE}`}>
                    {p.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button onClick={() => handleViewDetail(p)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Detail">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
                    
                    {p.status === "ACTIVE" ? (
                      <button onClick={() => handleAction(p, "INACTIVE")} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-amber-500 transition-colors" title="Takedown / Nonaktifkan">
                        <span className="material-symbols-outlined text-lg">block</span>
                      </button>
                    ) : (
                      <button onClick={() => handleAction(p, "RECOVER")} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-500 transition-colors" title="Aktifkan Kembali">
                        <span className="material-symbols-outlined text-lg">settings_backup_restore</span>
                      </button>
                    )}
                    
                    <button onClick={() => handleAction(p, "DELETE")} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors" title="Hapus Permanen">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                  {search ? `Tidak ada hasil untuk "${search}"` : "Tidak ada data properti"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} page={page} onPage={setPage} />
    </>
  );
}

// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────
export default function PropertyManagement() {
  const [activeTab, setActiveTab] = useState("queue");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ pendingProps: 0, activeProps: 0, inactiveProps: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/properties");
      const props = Array.isArray(res.data?.data) ? res.data.data : [];

      setStats({
        pendingProps:   props.filter(p => !p.status || p.status === "PENDING").length,
        activeProps:    props.filter(p => p.status === "ACTIVE").length,
        inactiveProps:  props.filter(p => p.status === "INACTIVE" || p.status === "REJECTED").length,
      });
    } catch (error) {
      console.error("Gagal mengambil statistik properti", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const STATS_CONFIG = [
    { label: "Antrian Legalitas", value: stats.pendingProps,  icon: "assignment",       color: "text-[#fd9914]",  bg: "bg-orange-100 dark:bg-orange-900/30" },
    { label: "Properti Aktif",    value: stats.activeProps,   icon: "domain_verification", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
    { label: "Nonaktif / Ditolak",value: stats.inactiveProps, icon: "domain_disabled",  color: "text-slate-500",  bg: "bg-slate-200 dark:bg-slate-800" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <AdminSidebar activeLabel="Property Management" />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          title="Property Management"
          icon="apartment"
          searchPlaceholder="Cari properti, lokasi, atau owner..."
          onSearch={setSearch}
        />
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />) : 
            STATS_CONFIG.map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className={`p-4 rounded-full ${s.bg}`}>
                  <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6">
              <div className="flex gap-8">
                <button
                  onClick={() => { setActiveTab("queue"); setSearch(""); }}
                  className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
                    activeTab === "queue" ? "border-[#fd9914] text-[#fd9914]" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">pending_actions</span>
                  Antrian Legalitas
                  {stats.pendingProps > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pendingProps}</span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("active"); setSearch(""); }}
                  className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
                    activeTab === "active" ? "border-[#fd9914] text-[#fd9914]" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">shield_with_house</span>
                  Moderasi Properti
                </button>
              </div>
            </div>
            
            {activeTab === "queue"  && <TabAntrianLegalitas  search={search} onRefresh={fetchStats} />}
            {activeTab === "active" && <TabModerasiProperti  search={search} onRefresh={fetchStats} />}
          </div>
        </div>
      </main>
    </div>
  );
}
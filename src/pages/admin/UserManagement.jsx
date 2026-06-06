import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
const checkIsSuspended = (u) => {
  if (!u) return false;
  return (
    u.isSuspended === true ||
    u.isSuspended === "true" ||
    u.isSuspended === 1 ||
    String(u.isSuspended).toLowerCase() === "true" ||
    u.status === "SUSPENDED"
  );
};

const ROLE_STYLES = {
  INVESTOR: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  OWNER:    "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
  TENANT:   "bg-green-100 dark:bg-green-900/30 text-green-600",
  ADMIN:    "bg-red-100 dark:bg-red-900/30 text-red-600",
};

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
        <span className="font-bold text-slate-900 dark:text-white">{total.toLocaleString()}</span> pengguna
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

// ─── TAB 1: ANTRIAN KYC ──────────────────────────────────────────────────────
function TabKycQueue({ search, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      
      const filtered = raw
        .filter(u => u.role !== "ADMIN")
        .filter(u => u.kycStatus === "UNDER_REVIEW") 
        .filter(u =>
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
        );

      setTotal(filtered.length);
      setUsers(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    } catch { 
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  }, [search, page]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleVerifyAction = async (user, actionStr) => {
    const isVerify = actionStr === "VERIFIED";
    const ok = await Swal.fire({
      icon: "question",
      title: isVerify ? `Verifikasi KYC ${user.fullName}?` : `Tolak KYC ${user.fullName}?`,
      html: `<div style="font-size:13px;color:#64748b">
        📧 ${user.email}<br/>🔖 Role: <b>${user.role}</b>
      </div>`,
      showCancelButton: true,
      confirmButtonColor: isVerify ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: isVerify ? "Ya, Verifikasi" : "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (!ok.isConfirmed) return;

    try {
      // Memanggil endpoint admin untuk verifikasi
      await api.patch(`/admin/users/${user.id}/verify`, { 
        status: actionStr 
      }); 
      
      await fetchQueue();
      if (onRefresh) onRefresh();
      Swal.fire({
        icon: "success",
        title: isVerify ? "User Terverifikasi!" : "KYC Ditolak",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan.", confirmButtonColor: "#fd9914" });
    }
  };
  
  const handleReview = (user) => {
    const docUrl = user.kycDocumentUrl || user.ipfsLegalDoc || null; 

    const docButton = docUrl 
      ? `<a href="${docUrl}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; color:#334155; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:12px; border:1px solid #cbd5e1; transition:0.2s;">
           <span class="material-symbols-outlined" style="font-size:18px;">description</span> Buka Dokumen KYC
         </a>`
      : `<div style="margin-top:12px; padding:10px; background:#fee2e2; color:#ef4444; border-radius:8px; font-size:12px; border:1px solid #fca5a5;">
           <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">warning</span> URL Dokumen tidak tersedia dari database
         </div>`;

    Swal.fire({
      title: "Review Dokumen KYC",
      html: `<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.2">
        👤 Nama: <b style="color:#0f172a">${user.fullName ?? "—"}</b><br/>
        📧 Email: <b style="color:#0f172a">${user.email ?? "—"}</b><br/>
        📱 Phone: <b style="color:#0f172a">${user.phone ?? "Belum diisi"}</b><br/>
        📅 Daftar: <b style="color:#0f172a">${user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", {day: "numeric", month: "long", year:"numeric"}) : "—"}</b>
        <br/>
        ${docButton}
      </div>`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      denyButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "✅ Setujui",
      denyButtonText: "❌ Tolak",
      cancelButtonText: "Tutup",
      width: '32em', 
    }).then((res) => {
      if (res.isConfirmed) handleVerifyAction(user, "VERIFIED");
      if (res.isDenied) handleVerifyAction(user, "REJECTED");
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={4} className="px-6 py-3"><Skeleton className="h-8" /></td></tr>
            )) : users.length > 0 ? users.map(u => {
              const initials = u.fullName?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() ?? "??";
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.fullName} className="size-9 rounded-full object-cover shrink-0" onError={e=>{e.target.style.display="none"}} />
                      ) : (
                        <div className="size-9 rounded-full bg-[#fd9914]/10 text-[#fd9914] flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{u.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ROLE_STYLES[u.role] ?? "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30">
                      MENUNGGU REVIEW
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleReview(u)} className="px-4 py-1.5 bg-[#fd9914] hover:bg-[#fd9914]/90 text-white rounded-md text-xs font-bold shadow-sm transition-colors">
                      Tinjau Dokumen
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">person_search</span>
                  {search ? `Tidak ada hasil untuk "${search}"` : "Antrian KYC kosong"}
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

// ─── TAB 2: USER AKTIF & MODERASI ────────────────────────────────────────────
function TabActiveUsers({ search, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      
      const filtered = raw
        .filter(u => u.role !== "ADMIN")
        .filter(u => u.kycStatus !== "UNDER_REVIEW") 
        .filter(u =>
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
        );

      setTotal(filtered.length);
      setUsers(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
    } catch { 
      setUsers([]); 
    } finally { 
      setLoading(false); 
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (user, type) => {
    let config = {};
    if (type === "SUSPEND") {
      config = { icon: "warning", title: `Suspend ${user.fullName}?`, color: "#ef4444", text: "Ya, Suspend", apiPath: `/admin/users/${user.id}/suspend`, payload: { isSuspended: true } };
    } else if (type === "RECOVERY") {
      config = { icon: "question", title: `Recovery Akun ${user.fullName}?`, color: "#22c55e", text: "Ya, Pulihkan", apiPath: `/admin/users/${user.id}/suspend`, payload: { isSuspended: false } };
    } else if (type === "DELETE") {
      config = { icon: "error", title: `Hapus Permanen ${user.fullName}?`, color: "#b91c1c", text: "Ya, Hapus Permanen", apiPath: `/admin/users/${user.id}`, payload: null, isDelete: true };
    }

    const ok = await Swal.fire({
      icon: config.icon,
      title: config.title,
      html: `<div style="font-size:13px;color:#64748b">Tindakan ini akan mempengaruhi akses <b>${user.email}</b>.</div>`,
      showCancelButton: true,
      confirmButtonColor: config.color,
      cancelButtonColor: "#94a3b8",
      confirmButtonText: config.text,
      cancelButtonText: "Batal",
    });

    if (!ok.isConfirmed) return;

    try {
      if (config.isDelete) {
        await api.delete(config.apiPath);
      } else {
        await api.patch(config.apiPath, config.payload);
      }
      await fetchUsers();
      if (onRefresh) onRefresh();
      Swal.fire({ icon: "success", title: "Berhasil!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan.", confirmButtonColor: "#fd9914" });
    }
  };

  const handleViewDetail = (user) => {
  const docUrl = user.kycDocumentUrl || user.ipfsLegalDoc || null;

  const docButton = docUrl
    ? `<a href="${docUrl}" target="_blank"
         style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;
                color:#334155;padding:10px 14px;border-radius:8px;text-decoration:none;
                font-weight:bold;margin-top:8px;border:1px solid #cbd5e1;font-size:13px;width:100%">
         <span class="material-symbols-outlined" style="font-size:18px;">description</span>
         Lihat Dokumen KYC
         <span class="material-symbols-outlined" style="font-size:14px;margin-left:auto;">open_in_new</span>
       </a>`
    : `<div style="margin-top:8px;padding:10px;background:#fef9c3;color:#854d0e;
                   border-radius:8px;font-size:12px;border:1px solid #fde68a;
                   display:flex;align-items:center;gap:6px;">
         <span class="material-symbols-outlined" style="font-size:14px;">info</span>
         Belum ada dokumen KYC
       </div>`;

  Swal.fire({
    title: "Detail User",
    html: `<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.5">
      👤 Nama: <b>${user.fullName ?? "—"}</b><br/>
      📧 Email: <b>${user.email}</b><br/>
      🔖 Role: <b>${user.role}</b><br/>
      ✅ KYC: <b>${user.kycStatus === "PENDING" ? "BELUM VERIFIKASI" : user.kycStatus}</b><br/>
      👛 Wallet: <b style="font-size:11px">${user.walletAddress ?? "—"}</b>
      <br/>${docButton}
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
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? [...Array(6)].map((_, i) => (
              <tr key={i}><td colSpan={4} className="px-6 py-3"><Skeleton className="h-8" /></td></tr>
            )) : users.length > 0 ? users.map(u => {
              const initials = u.fullName?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() ?? "??";
              const isSuspended = checkIsSuspended(u);
              return (
                <tr key={u.id} className={`transition-colors ${isSuspended ? "bg-red-50/40 dark:bg-red-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.fullName} className={`size-9 rounded-full object-cover shrink-0 ${isSuspended ? "grayscale opacity-60" : ""}`} onError={e=>{e.target.style.display="none"}} />
                      ) : (
                        <div className={`size-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isSuspended ? "bg-red-100 text-red-500" : "bg-[#fd9914]/10 text-[#fd9914]"}`}>{initials}</div>
                      )}
                      <div>
                        <p className={`text-sm font-bold ${isSuspended ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>{u.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ROLE_STYLES[u.role] ?? "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${isSuspended ? "bg-red-500 text-white" : "bg-green-100 text-green-700 dark:bg-green-900/30"}`}>
                        {isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                      <span className={`text-[11px] font-semibold ${
                        u.kycStatus === "VERIFIED" ? "text-green-500" : 
                        u.kycStatus === "REJECTED" ? "text-red-500" : 
                        "text-slate-400"
                      }`}>
                        KYC: {u.kycStatus === "PENDING" ? "BELUM VERIFIKASI" : u.kycStatus || "BELUM VERIFIKASI"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewDetail(u)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Detail">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
                      {isSuspended ? (
                        <button onClick={() => handleAction(u, "RECOVERY")} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-bold transition-colors">
                          Recovery
                        </button>
                      ) : (
                        <button onClick={() => handleAction(u, "SUSPEND")} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors" title="Suspend Akun">
                          <span className="material-symbols-outlined text-lg">block</span>
                        </button>
                      )}
                      <button onClick={() => handleAction(u, "DELETE")} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors" title="Hapus Permanen">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">person_off</span>
                  {search ? `Tidak ada hasil untuk "${search}"` : "Tidak ada data user"}
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
export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("queue");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ pendingKyc: 0, activeUsers: 0, suspendedUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      const users = Array.isArray(res.data?.data) ? res.data.data : [];
      const nonAdmin = users.filter(u => u.role !== "ADMIN");

      setStats({
        pendingKyc: nonAdmin.filter(u => u.kycStatus === "UNDER_REVIEW").length,
        activeUsers: nonAdmin.filter(u => u.kycStatus === "VERIFIED" && !checkIsSuspended(u)).length,
        suspendedUsers: nonAdmin.filter(u => checkIsSuspended(u)).length,
      });
    } catch (error) {
      console.error("Gagal mengambil statistik", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const STATS_CONFIG = [
    { label: "Antrian KYC", value: stats.pendingKyc, icon: "gavel", color: "text-[#fd9914]", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { label: "User Aktif (Verified)", value: stats.activeUsers, icon: "groups", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
    { label: "Akun Suspended", value: stats.suspendedUsers, icon: "person_off", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <AdminSidebar activeLabel="User Management" />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          title="User Management"
          icon="manage_accounts"
          searchPlaceholder="Cari nama atau email..."
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
                  Antrian KYC
                  {stats.pendingKyc > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pendingKyc}</span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("active"); setSearch(""); }}
                  className={`py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
                    activeTab === "active" ? "border-[#fd9914] text-[#fd9914]" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  User Aktif & Moderasi
                </button>
              </div>
            </div>
            
            {/* Render Active Tab */}
            {activeTab === "queue" && <TabKycQueue search={search} onRefresh={fetchStats} />}
            {activeTab === "active" && <TabActiveUsers search={search} onRefresh={fetchStats} />}
            
          </div>
        </div>
      </main>
    </div>
  );
}
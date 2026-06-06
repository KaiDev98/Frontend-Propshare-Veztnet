import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader  from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs,    setLogs]    = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));

        const res  = await api.get("/auth/users/profile");
        const data = res.data?.data ?? res.data?.user ?? res.data;
        setUser(data);
        localStorage.setItem("user", JSON.stringify({ ...JSON.parse(stored ?? "{}"), ...data }));
      } catch { /* pakai localStorage saja */ }
      finally { setLoading(false); }
    };

    const fetchLogs = async () => {
      try {
        const [usersRes, propsRes, rentalsRes] = await Promise.allSettled([
          api.get("/auth/users"),
          api.get("/properties"),
          // ✅ Ganti dari /rentals/my-rentals (TENANT) → /rentals (ADMIN)
          api.get("/rentals").catch(() => ({ data: { data: [] } })),
        ]);

        const logs = [];

        if (propsRes.status === "fulfilled") {
          const props = propsRes.value.data?.data ?? [];
          props.slice(0, 3).forEach(p => logs.push({
            icon: "home_work", iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
            title: `Properti "${p.title?.slice(0,30)}" — ${p.status ?? "PENDING"}`,
            time: p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short" }) : "—",
            link: "/admin/kyc",
          }));
        }

        if (usersRes.status === "fulfilled") {
          const users = usersRes.value.data?.data ?? [];
          const pending = users.filter(u => !u.kycStatus || u.kycStatus === "PENDING");
          if (pending.length > 0) logs.push({
            icon: "person_search", iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
            title: `${pending.length} user menunggu verifikasi KYC`,
            time: "Saat ini",
            link: "/admin/kyc",
          });
        }

        // ✅ Tambah log dari rentals (opsional — untuk info pending rentals)
        if (rentalsRes.status === "fulfilled") {
          const rentals = rentalsRes.value.data?.data ?? [];
          const pendingRentals = rentals.filter(r => r.status === "PENDING");
          if (pendingRentals.length > 0) logs.push({
            icon: "key", iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
            title: `${pendingRentals.length} pengajuan sewa menunggu persetujuan`,
            time: "Saat ini",
            link: "/admin/monitoring",
          });
        }

        setLogs(logs.slice(0, 5));
      } catch {}
    };

    fetchProfile();
    fetchLogs();
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() : "AD";

  const handleLogout = async () => {
    const ok = await Swal.fire({
      icon:"warning", title:"Logout?",
      text:"Sesi admin akan diakhiri.",
      showCancelButton:true, confirmButtonColor:"#ef4444", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Logout", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f5] dark:bg-[#231a0f]">
      <AdminSidebar activeLabel="Admin Profile" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title="Admin Profile" icon="manage_accounts" />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-6">

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="h-28 bg-[#fd9914]/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage:"radial-gradient(#fd9914 1px, transparent 1px)", backgroundSize:"20px 20px" }} />
              </div>

              <div className="px-8 pb-8">
                <div className="flex justify-between items-end -mt-12 mb-5">
                  <div className="relative">
                    {loading ? <Skeleton className="size-24 rounded-full" /> :
                    user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="size-24 rounded-full border-4 border-white dark:border-slate-900 object-cover shadow-lg" onError={e=>{e.target.style.display="none"}} />
                    ) : (
                      <div className="size-24 rounded-full border-4 border-white dark:border-slate-900 bg-[#fd9914]/20 flex items-center justify-center text-[#fd9914] font-black text-3xl shadow-lg">
                        {initials}
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 size-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                  </div>

                  <div className="flex gap-3 pb-1">
                    <button
                      onClick={() => navigate("/admin/editprofile")}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit Profile
                    </button>
                    <button onClick={handleLogout}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Logout
                    </button>
                  </div>
                </div>

                {loading ? (
                  <><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-24" /></>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.fullName ?? "Admin"}</h2>
                    <p className="text-[#fd9914] font-medium">Super Admin</p>
                  </>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-[#fd9914]">contact_page</span>
                  Contact Information
                </h3>
                {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-10" />)}</div> : (
                  <div className="space-y-4">
                    {[
                      { label:"Email",     value: user?.email    ?? "—" },
                      { label:"Phone",     value: user?.phone    ?? "Belum diisi" },
                      // { label:"User ID",   value: user?.id ? `PSC-${user.id.slice(0,8).toUpperCase()}` : "—" },
                      { label:"Bergabung", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" }) : "—" },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-[#fd9914]">security</span>
                  Administrative Access
                </h3>
                <div className="space-y-3">
                  {[
                    { icon:"shield_person", label:"System Permissions", value:"FULL ACCESS", badge:true },
                    { icon:"badge",         label:"Role",               value: user?.role ?? "ADMIN",   badge:false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">{item.icon}</span>
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                      </div>
                      {item.badge
                        ? <span className="text-xs px-2 py-1 bg-[#fd9914]/20 text-[#fd9914] font-bold rounded">{item.value}</span>
                        : <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{item.value}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-5 text-slate-900 dark:text-white">Recent Activity</h3>
              {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-14" />)}</div>
              : logs.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((act, i) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${act.iconBg}`}>
                          <span className="material-symbols-outlined">{act.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{act.title}</p>
                          <p className="text-xs text-slate-500">{act.time}</p>
                        </div>
                      </div>
                      <button onClick={() => navigate(act.link)} className="text-[#fd9914] font-bold text-sm hover:underline shrink-0 ml-4">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-6">Belum ada aktivitas</p>
              )}
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">Logout dari Akun Admin</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sesi akan diakhiri dan token dihapus.</p>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-red-600/20"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
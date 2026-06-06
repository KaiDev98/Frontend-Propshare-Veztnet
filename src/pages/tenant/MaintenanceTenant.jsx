import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = ["Listrik", "Perpipaan", "Internet / WiFi", "Furnitur", "AC & Ventilasi", "Lainnya"];

const CAT_STYLE = {
  Electrical:       { icon: "bolt",      bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600"  },
  Plumbing:         { icon: "water_drop",bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600"        },
  "Internet / WiFi":{ icon: "wifi",      bg: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"  },
  Furniture:        { icon: "chair",     bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600"  },
  HVAC:             { icon: "ac_unit",   bg: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600"        },
  Other:            { icon: "build",     bg: "bg-slate-100 dark:bg-slate-800 text-slate-500"        },
};

const PRIORITY_CONFIG = {
  High:   { label: "Prioritas Tinggi",   icon: "priority_high", color: "text-red-500"   },
  Medium: { label: "Prioritas Sedang", icon: "low_priority",  color: "text-amber-500" },
  Low:    { label: "Prioritas Renda",    icon: "low_priority",  color: "text-slate-400" },
};

const STATUS_CONFIG = {
  NEW:         { label: "Baru",         className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30"     },
  IN_PROGRESS: { label: "Diproses", className: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" },
  RESOLVED:    { label: "Selesai",    className: "bg-green-100 text-green-700 dark:bg-green-900/30"   },
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ report }) {
  const catStyle = CAT_STYLE[report.category]  ?? CAT_STYLE.Other;
  const prioConf = PRIORITY_CONFIG[report.priority] ?? PRIORITY_CONFIG.Medium;
  const statConf = STATUS_CONFIG[report.status]  ?? STATUS_CONFIG.NEW;
  const progress = report.status === "RESOLVED" ? 100 : report.status === "IN_PROGRESS" ? 65 : 10;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${catStyle.bg}`}>
            <span className="material-symbols-outlined">{catStyle.icon}</span>
          </div>
          <div>
            <h4 className="font-bold leading-tight text-slate-900 dark:text-white">{report.title}</h4>
            <p className="text-xs text-slate-500">#{report.id.slice(0,8).toUpperCase()} • {report.category}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${statConf.className}`}>
          {statConf.label}
        </span>
      </div>

      {report.description && (
        <p className="text-xs text-slate-500 mb-4 italic line-clamp-2">"{report.description}"</p>
      )}

      {/* Image bukti */}
      {report.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden h-32">
          <img src={report.imageUrl} alt="bukti" className="w-full h-full object-cover" onError={e => { e.target.style.display="none"; }} />
        </div>
      )}

      <div className="flex items-center gap-6 mb-4">
        <div className={`flex items-center gap-2 ${prioConf.color}`}>
          <span className="material-symbols-outlined text-sm">{prioConf.icon}</span>
          <span className="text-xs font-semibold uppercase">{prioConf.label}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span className="text-xs font-semibold">
            {new Date(report.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${report.status === "RESOLVED" ? "bg-green-500" : "bg-indigo-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MaintenanceTenant() {
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [reports,    setReports]    = useState([]);
  const [rental,     setRental]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile,  setImageFile]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  const [form, setForm] = useState({
    title: "", category: "", description: "", priority: "Medium", imageUrl: "",
  });

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // SESUDAH ✅
        const [reportRes, rentalRes] = await Promise.allSettled([
          api.get("/reports"),
          api.get("/rentals/my-rentals"),
        ]);

        if (reportRes.status === "fulfilled") {
          const raw = reportRes.value.data?.data;
          setReports((Array.isArray(raw) ? raw : []).sort(
            (a,b) => new Date(b.createdAt) - new Date(a.createdAt)
          ));
        }

        if (rentalRes.status === "fulfilled") {
          const raw  = rentalRes.value.data?.data;
          const list = Array.isArray(raw) ? raw : [];
          setRental(list.find(r => r.status === "ACTIVE") ?? list[0] ?? null);
        }

      } catch (err) {
        console.error("Fetch maintenance error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const activeReports   = reports.filter(r => r.status !== "RESOLVED");
  const resolvedReports = reports.filter(r => r.status === "RESOLVED");
  const room            = rental?.room ?? null;
  const property        = rental?.room?.property ?? rental?.property ?? null;
  const ownerPhone = property?.owner?.phone ?? null;
  const ownerName  = property?.owner?.fullName ?? "Owner";

  // ─── Upload image ──────────────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon:"warning", title:"File > 5MB", confirmButtonColor:"#EC5B13" });
      return;
    }
    setImageFile(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/ipfs", formData, { headers:{"Content-Type":"multipart/form-data"} });
      const url = res.data?.url ?? res.data?.data?.url ?? res.data?.ipfsUrl ?? null;
      setForm(prev => ({ ...prev, imageUrl: url ?? "" }));
    } catch {
      setForm(prev => ({ ...prev, imageUrl: "" }));
      Swal.fire({ icon:"warning", title:"Upload gagal", text:"Lanjut tanpa foto.", confirmButtonColor:"#EC5B13", timer:2000, showConfirmButton:false });
    } finally {
      setUploading(false);
    }
  };

  // ─── Submit ticket ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.category || !form.title || !form.description) {
      Swal.fire({ icon:"warning", title:"Form Belum Lengkap", text:"Isi kategori, judul, dan deskripsi.", confirmButtonColor:"#EC5B13" });
      return;
    }
    if (!rental) {
      Swal.fire({ icon:"warning", title:"Belum Ada Kamar Aktif", text:"Kamu belum memiliki kamar aktif.", confirmButtonColor:"#EC5B13" });
      return;
    }

    const ok = await Swal.fire({
      icon:"question", title:"Submit Maintenance Ticket?",
      html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
        🔧 Kategori: <b>${form.category}</b><br/>
        📝 Judul: <b>${form.title}</b><br/>
        ⚠️ Prioritas: <b>${form.priority}</b><br/>
        🏠 Kamar: <b>#${room?.roomNumber ?? "—"}</b>
      </div>`,
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Submit!", cancelButtonText:"Cek Lagi",
    });
    if (!ok.isConfirmed) return;

    Swal.fire({ title:"Mengirim Laporan...", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    setSubmitting(true);

    try {
      const res = await api.post("/reports", {
        title:       form.title,
        description: form.description,
        category:    form.category,
        priority:    form.priority,
        imageUrl:    form.imageUrl || null,
        propertyId:  property?.id,
        roomId:      room?.id,
      });

      const newReport = res.data.data;
      setReports(prev => [newReport, ...prev]);
      setForm({ title:"", category:"", description:"", priority:"Medium", imageUrl:"" });
      setImageFile(null);

      await Swal.fire({
        icon:"success", title:"Ticket Berhasil Dikirim! 🎉",
        html:`<div style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0;font-size:13px;color:#64748b">
          ✅ Ticket #${newReport.id.slice(0,8).toUpperCase()} dibuat<br/>
          ✅ Tim maintenance akan segera menindaklanjuti<br/>
          ⏳ Estimasi respon: 2-4 jam
        </div>`,
        confirmButtonColor:"#EC5B13", timer:3000, showConfirmButton:false,
      });
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal Submit", text:err.response?.data?.message ?? "Coba lagi.", confirmButtonColor:"#EC5B13" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Admin chat via WhatsApp ───────────────────────────────────────────────
  const handleChatAdmin = () => {
    const phone = ownerPhone?.replace(/\D/g, "") ?? null;
    if (phone) {
      const msg = encodeURIComponent(`Halo ${ownerName}, saya tenant di ${property?.title ?? "PropShare"}. Saya ingin melaporkan masalah maintenance.`);
      window.open(`https://wa.me/${phone.startsWith("0") ? "62"+phone.slice(1) : phone}?text=${msg}`, "_blank");
    } else {
      Swal.fire({
        icon:"info", title:"Hubungi Admin",
        html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
          Kirim laporan via ticket di form ini, atau hubungi:<br/>
          📧 <b>admin@propshare.com</b><br/>
          Tersedia: <b>Senin - Jumat, 09.00 - 18.00 WIB</b>
        </div>`,
        confirmButtonColor:"#EC5B13",
      });
    }
  };

  const handleCallManager = () => {
    const phone = ownerPhone ?? null;
    if (phone) {
      Swal.fire({
        icon:"info", title:`Hubungi ${ownerName}`,
        html:`📞 <b>${phone}</b>`,
        confirmButtonColor:"#EC5B13",
      });
    } else {
      Swal.fire({ icon:"info", title:"Nomor Manager", html:`📞 <b>+62 800-0000-0000</b>`, confirmButtonColor:"#EC5B13" });
    }
  };

  const handleSOS = () => {
    Swal.fire({
      icon:"warning", title:"🚨 Emergency SOS",
      html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
        Hubungi langsung:<br/>
        🚒 <b>Pemadam Kebakaran: 113</b><br/>
        🚑 <b>Ambulans: 119</b><br/>
        🚔 <b>Polisi: 110</b><br/>
        ${ownerPhone ? `🏠 <b>Manager: ${ownerPhone}</b>` : ""}
      </div>`,
      confirmButtonColor:"#EC5B13", confirmButtonText:"Mengerti",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Maintenance" />

      <main className="flex-1 overflow-y-auto">
        <TenantHeader />

        <div className="p-8 max-w-6xl mx-auto space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_,i) => <Skeleton key={i} className="h-24" />)
            ) : (
              <>
                {[
                  { icon:"pending_actions", bg:"bg-indigo-500/10 text-indigo-500", label:"Tiket Aktif",  value:String(activeReports.length).padStart(2,"0") },
                  { icon:"task_alt",        bg:"bg-green-500/10 text-green-500",   label:"Diselesaikan",        value:String(resolvedReports.length).padStart(2,"0") },
                  { icon:"schedule",        bg:"bg-[#EC5B13]/10 text-[#EC5B13]",  label:"Total Laporan",   value:reports.length },
                ].map(s => (
                  <div key={s.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-[#EC5B13]/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${s.bg}`}>
                      <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm font-medium">{s.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Tickets */}
            <div className="lg:col-span-2 space-y-8">

              {/* Active */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Permintaan Aktif
                    {!loading && activeReports.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-slate-400">({activeReports.length})</span>
                    )}
                  </h3>
                </div>
                {loading ? (
                  <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
                ) : activeReports.length > 0 ? (
                  <div className="space-y-4">
                    {activeReports.map(r => <TicketCard key={r.id} report={r} />)}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">build_circle</span>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Tidak ada ticket aktif</p>
                    <p className="text-slate-400 text-xs mt-1">Gunakan form di samping untuk laporan baru</p>
                  </div>
                )}
              </section>

              {/* Resolved history */}
              <section>
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Riwayat Selesai</h3>
                {loading ? <Skeleton className="h-48" />
                : resolvedReports.length > 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                          <tr>
                            {["Masalah","Kategori","Tanggal Selesai","Prioritas"].map(h => (
                              <th key={h} className="px-6 py-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {resolvedReports.map(r => {
                            const cat = CAT_STYLE[r.category] ?? CAT_STYLE.Other;
                            return (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${cat.bg}`}>
                                    <span className="material-symbols-outlined text-[12px]">{cat.icon}</span>
                                    {r.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                  {new Date(r.updatedAt ?? r.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                                </td>
                                <td className={`px-6 py-4 text-xs font-bold ${PRIORITY_CONFIG[r.priority]?.color ?? "text-slate-400"}`}>
                                  {r.priority ?? "Medium"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
                    <p className="text-slate-400 text-sm mt-2">Belum ada laporan yang diselesaikan</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right: Form + Support */}
            <div className="space-y-8">

              {/* New Request Form */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Laporan Baru</h3>
                <p className="text-sm text-slate-500 mb-5">Deskripsikan masalah dan tim kami akan segera menanganinya.</p>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Judul Masalah</label>
                    <input type="text" value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Contoh: Keran dapur bocor"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
                    <select value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-[#EC5B13] outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">Pilih Kategori</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Prioritas</label>
                    <div className="flex gap-2">
                      {["Rendah","Sedang","Tinggi"].map(p => (
                        <button key={p} type="button"
                          onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                            form.priority === p
                              ? p === "High"   ? "bg-red-500 text-white border-red-500"
                              : p === "Medium" ? "bg-amber-500 text-white border-amber-500"
                              : "bg-slate-500 text-white border-slate-500"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#EC5B13] hover:text-[#EC5B13]"
                          }`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Deskripsi</label>
                    <textarea value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Apa masalahnya? Jelaskan secara detail..." rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-[#EC5B13] focus:border-[#EC5B13] outline-none resize-none text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Upload Photo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Upload Photo (Opsional)</label>
                    <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-[#EC5B13]/50 transition-colors">
                      <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-[#EC5B13] animate-spin">progress_activity</span>
                          <p className="text-xs text-[#EC5B13] font-medium">Mengupload......</p>
                        </div>
                      ) : imageFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                          <p className="text-xs text-emerald-500 font-medium truncate max-w-full">{imageFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                          <p className="text-xs text-slate-500">Klik untuk upload atau seret gambar</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="button" onClick={handleSubmit} disabled={submitting || uploading}
                    className="w-full bg-[#EC5B13] hover:bg-[#d44e0f] text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-[#EC5B13]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                  >
                    {submitting
                      ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Mengirim...</>
                      : <><span className="material-symbols-outlined text-[18px]">send</span>Kirim Laporan</>}
                  </button>
                </div>
              </section>

              {/* Support Contacts — dinamis dari properti owner */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Butuh Bantuan?</h3>

                {/* Info owner properti */}
                {!loading && property && (
                  <div className="p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl">
                    <p className="text-xs font-bold text-[#EC5B13] uppercase tracking-wider mb-1">Properti Kamu</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{property.title}</p>
                    <p className="text-xs text-slate-500">{property.location ?? "—"}</p>
                    {ownerPhone && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        Owner: {ownerPhone}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon:"chat",    bg:"bg-green-500/10 text-green-600",
                      label:ownerPhone ? `Chat ${ownerName}` : "Chat dengan Admin",
                      sub:  ownerPhone ? "via WhatsApp" : "Live: 9 AM - 6 PM",
                      onClick: handleChatAdmin,
                    },
                    {
                      icon:"call",    bg:"bg-slate-500/10 text-slate-500",
                      label:"Building Manager",
                      sub:  ownerPhone ? ownerPhone : " Untuk pertanyaan sewa",
                      onClick: handleCallManager,
                    },
                    {
                      icon:"help",    bg:"bg-[#EC5B13]/10 text-[#EC5B13]",
                      label:"FAQ & Panduan",
                      sub:  "Sumber bantuan mandiri",
                      onClick: () => navigate("/tenant/support"),
                    },
                  ].map(item => (
                    <button key={item.label} onClick={item.onClick}
                      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left w-full"
                    >
                      <div className={`p-2 rounded-lg ${item.bg}`}>
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Emergency SOS */}
                <button onClick={handleSOS}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 mt-2"
                >
                  <span className="material-symbols-outlined text-sm">emergency</span>
                  Darurat SOS
                </button>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
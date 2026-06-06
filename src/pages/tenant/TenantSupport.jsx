import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantSidebar from "../../components/TenantSidebar";
import TenantHeader from "../../components/TenantHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

export default function TenantSupport() {
  const navigate = useNavigate();
  const [rental,  setRental]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetch = async () => {
    const res = await api.get("/rentals/my-rentals");
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    const r = list.find(r => r.status === "ACTIVE") ?? list[0] ?? null;
    console.log("owner:", r?.room?.property?.owner ?? r?.property?.owner); // ← debug
    setRental(r);
  };
  fetch();
  }, []);

  const property  = rental?.room?.property ?? rental?.property ?? null;
  const owner     = property?.owner ?? null;
  const ownerPhone = owner?.phone ?? null;
  const ownerName  = owner?.fullName ?? "Owner";

  const openWhatsApp = (phone, name, msg) => {
    const clean = phone?.replace(/\D/g,"") ?? "";
    const wa    = clean.startsWith("0") ? "62"+clean.slice(1) : clean;
    const text  = encodeURIComponent(msg);
    if (wa) window.open(`https://wa.me/${wa}?text=${text}`, "_blank");
    else Swal.fire({ icon:"warning", title:"Nomor tidak tersedia", confirmButtonColor:"#EC5B13" });
  };

  const FAQS = [
    { q: "Bagaimana cara bayar sewa?",        a: "Buka menu Payments → pilih metode Manual Transfer atau MetaMask → ikuti instruksi." },
    { q: "Bagaimana cara ajukan maintenance?", a: "Buka menu Maintenance → isi form New Request → klik Submit Ticket." },
    { q: "Bagaimana cara batalkan booking?",   a: "Buka menu My Bookings → klik tombol Batalkan pada booking yang berstatus Pending." },
    { q: "Kamar saya belum aktif?",            a: "Status PENDING artinya masih menunggu persetujuan owner. Biasanya 1-24 jam." },
    { q: "Lupa password?",                     a: "Buka halaman Login → klik 'Forgot Password' → ikuti instruksi reset via email." },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Maintenance" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <TenantHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">

            {/* Header */}
            <header className="mb-10 text-center">
              <div className="w-16 h-16 bg-[#EC5B13]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#EC5B13] text-3xl">support_agent</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">PropShare Support</h1>
              <p className="text-slate-500">Butuh bantuan? Kami siap membantu kamu.</p>
            </header>

            {/* Property info */}
            {!loading && property && (
              <div className="mb-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EC5B13]/10 rounded-xl flex items-center justify-center text-[#EC5B13] shrink-0">
                  <span className="material-symbols-outlined">apartment</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kamar Kamu</p>
                  <p className="font-bold text-slate-900 dark:text-white">{property.title}</p>
                  <p className="text-xs text-slate-500">Kamar #{rental?.room?.roomNumber ?? "—"} • {property.location ?? "—"}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Aktif</span>
              </div>
            )}

            {/* Contact channels */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Hubungi Kami</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* WhatsApp Owner */}
                <button
                  onClick={() => ownerPhone
                    ? openWhatsApp(ownerPhone, ownerName, `Halo ${ownerName}, saya tenant di ${property?.title ?? "PropShare"}. Saya butuh bantuan.`)
                    : Swal.fire({ icon:"info", title:"Nomor Owner Belum Tersedia", text:"Hubungi via email atau buat maintenance ticket.", confirmButtonColor:"#EC5B13" })
                  }
                  className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-green-400 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Chat Owner</p>
                    <p className="text-xs text-slate-500">
                      {ownerPhone ? `via WhatsApp — ${ownerPhone}` : "Nomor belum tersedia"}
                    </p>
                  </div>
                </button>

                {/* Email */}
                <button
                  onClick={() => window.open("mailto:admin@propshare.com?subject=Support Request", "_blank")}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#EC5B13]/50 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-[#EC5B13]/10 rounded-xl flex items-center justify-center text-[#EC5B13] shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">email</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Email Support</p>
                    <p className="text-xs text-slate-500">admin@propshare.com</p>
                  </div>
                </button>

                {/* Maintenance Ticket */}
                <button
                  onClick={() => navigate("/tenant/maintenance")}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">build</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Maintenance Ticket</p>
                    <p className="text-xs text-slate-500">Laporkan masalah di kamar</p>
                  </div>
                </button>

                {/* Emergency */}
                <button
                  onClick={() => Swal.fire({
                    icon:"warning", title:"🚨 Emergency SOS",
                    html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.5">
                      🚒 Pemadam: <b>113</b><br/>
                      🚑 Ambulans: <b>119</b><br/>
                      🚔 Polisi: <b>110</b>
                      ${ownerPhone ? `<br/>🏠 Owner: <b>${ownerPhone}</b>` : ""}
                    </div>`,
                    confirmButtonColor:"#EC5B13",
                  })}
                  className="flex items-center gap-4 p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 hover:border-red-400 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">emergency</span>
                  </div>
                  <div>
                    <p className="font-bold text-red-700 dark:text-red-400">Emergency SOS</p>
                    <p className="text-xs text-red-500">Polisi • Ambulans • Pemadam</p>
                  </div>
                </button>
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">FAQ — Pertanyaan Umum</h2>
              <div className="space-y-3">
                {FAQS.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{item.q}</span>
                      <span className={`material-symbols-outlined text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <div className="mt-10 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
              <p className="text-sm text-slate-500">
                Jam operasional support: <strong>Senin - Jumat, 09.00 - 18.00 WIB</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">© 2026 PropShare Campus. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
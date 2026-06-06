import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";

// ─── Dummy Data (nanti diganti props/context/state management) ─────────────────

const DUMMY = {
  property: {
    name: "Clover Student Living - Tower A",
    location: "Jl. Ringroad Utara No. 12, Sleman, Yogyakarta",
    description:
      "Hunian eksklusif khusus mahasiswa dengan fasilitas premium. Terletak hanya 5 menit dari kampus utama. Memiliki 40 kamar fully furnished dengan sistem keamanan 24 jam dan area komunal modern.",
    units: "40",
    type: "Apartment / Dormitory",
  },
  financial: {
    target: "2,500,000,000",
    pricePerToken: "10,000",
    totalTokens: "250,000",
    roi: "12.5",
    period: "30 Hari",
  },
  legal: [
    { icon: "description", title: "Sertifikat Hak Milik (SHM)", filename: "SHM_No_12345_Sleman.pdf" },
    { icon: "apartment",   title: "Izin Mendirikan Bangunan (IMB)", filename: "IMB_2023_Clover.pdf"  },
  ],
};

// ─── Section Wrapper ────────────────────────────────────────────────────────────

function ReviewSection({ icon, title, onEdit, children }) {
  return (
    <section className="bg-white dark:bg-slate-900/40 rounded-2xl border border-[#EC5B13]/10 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#EC5B13]/5 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-[#EC5B13]">{icon}</span>
          {title}
        </h3>
        <button
          onClick={onEdit}
          className="text-sm font-bold text-[#EC5B13] hover:underline"
        >
          Ubah
        </button>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ReviewPublish() {
  const navigate = useNavigate();

  const handlePublish = () => {
    // TODO: POST ke backend
    alert("Proposal berhasil dipublikasikan! Menunggu verifikasi admin.");
    navigate("/owner/proposal");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">

      <OwnerSidebar activeLabel="Manajemen Proposal RWA" />

      <main className="flex-1 overflow-y-auto">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md border-b border-[#EC5B13]/10 px-8 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate("/owner/proposal")} className="hover:text-[#EC5B13] transition-colors">
              Dashboard
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <button onClick={() => navigate("/owner/new-property")} className="hover:text-[#EC5B13] transition-colors">
              Listing Properti
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-white font-medium">Review &amp; Publish</span>
          </nav>
        </header>

        <div className="max-w-5xl mx-auto px-8 py-10">

          {/* ── Page Header ── */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Review &amp; Publish
              </h1>
              <p className="text-slate-500 mt-2">
                Langkah 5 dari 5: Finalisasi proposal listing properti Anda
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-48">
              <div className="flex justify-between w-full text-sm font-bold text-slate-700 dark:text-slate-300">
                <span>Langkah Terakhir</span>
                <span className="text-[#EC5B13]">100%</span>
              </div>
              <div className="w-full h-2 bg-[#EC5B13]/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#EC5B13] w-full rounded-full" />
              </div>
            </div>
          </div>

          {/* ── Stepper Indicator ── */}
          <div className="grid grid-cols-5 gap-4 mb-10">
            {[
              { label: "Info Dasar", done: true },
              { label: "Legalitas",  done: true },
              { label: "Media",      done: true },
              { label: "Finansial",  done: true },
              { label: "Review & Publish", done: false, active: true },
            ].map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 ${!s.done && !s.active ? "opacity-30" : ""}`}>
                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs transition-all
                  ${s.done ? "bg-[#EC5B13] text-white"
                    : s.active ? "bg-[#EC5B13] text-white ring-4 ring-[#EC5B13]/20"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                >
                  {s.done
                    ? <span className="material-symbols-outlined text-sm">check</span>
                    : i + 1
                  }
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider text-center
                  ${s.active ? "text-[#EC5B13]" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* 1. Detail Properti */}
              <ReviewSection icon="info" title="Detail Properti" onEdit={() => navigate("/owner/new-property")}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Nama Properti</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">
                      {DUMMY.property.name}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5 shrink-0">
                      location_on
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Lokasi</p>
                      <p className="text-slate-700 dark:text-slate-300">{DUMMY.property.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Deskripsi</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                      {DUMMY.property.description}
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className="bg-[#EC5B13]/10 text-[#EC5B13] text-xs px-3 py-1 rounded-full font-semibold">
                      {DUMMY.property.units} units
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-semibold">
                      {DUMMY.property.type}
                    </span>
                  </div>
                </div>
              </ReviewSection>

              {/* 2. Target Finansial */}
              <ReviewSection icon="payments" title="Target Finansial" onEdit={() => navigate("/owner/new-property")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#EC5B13]/5 border border-[#EC5B13]/10">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Target Pendanaan</p>
                    <p className="text-2xl font-black text-[#EC5B13]">
                      Rp {DUMMY.financial.target}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Harga Per Token</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      Rp {DUMMY.financial.pricePerToken}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Supply Token</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {DUMMY.financial.totalTokens} Unit
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                      Estimasi ROI (Tahunan)
                    </p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {DUMMY.financial.roi}%
                    </p>
                  </div>
                </div>
              </ReviewSection>

              {/* 3. Dokumen Legal */}
              <ReviewSection icon="verified_user" title="Dokumen Legal" onEdit={() => navigate("/owner/new-property")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DUMMY.legal.map((doc) => (
                    <div
                      key={doc.filename}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#EC5B13]">{doc.icon}</span>
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white">{doc.title}</p>
                          <p className="text-xs text-slate-500">{doc.filename}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                    </div>
                  ))}
                </div>
              </ReviewSection>

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">

              {/* Media Preview */}
              <ReviewSection icon="gallery_thumbnail" title="Media" onEdit={() => navigate("/owner/new-property")}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 block mb-2">Hero Image</p>
                    <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden group relative">
                      {/* Placeholder jika belum ada gambar */}
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <span className="material-symbols-outlined text-4xl">image</span>
                        <span className="text-xs font-medium">Belum ada foto</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 block mb-2">
                      Gallery (4 Slot)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Interior", "Bathroom", "Common Area", "Exterior"].map((label, i) => (
                        <div
                          key={label}
                          className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex flex-col items-center justify-center text-slate-400 gap-1"
                        >
                          <span className="material-symbols-outlined text-xl">image</span>
                          <span className="text-[9px] font-bold">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ReviewSection>

              {/* Disclaimer + Actions */}
              <div className="space-y-4">

                {/* Warning */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 flex gap-3">
                  <span className="material-symbols-outlined text-amber-600 shrink-0">info</span>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                    <span className="font-bold">Penting:</span> Setelah dipublikasikan, proposal akan
                    dikirim ke Tim Administrator PropShare Campus untuk proses verifikasi akhir
                    sebelum tayang di marketplace pendanaan.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePublish}
                    className="w-full bg-[#EC5B13] hover:bg-[#EC5B13]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#EC5B13]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">publish</span>
                    Publikasikan Sekarang
                  </button>
                  <button
                    onClick={() => navigate("/owner/new-property")}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl transition-all"
                  >
                    Kembali ke Form
                  </button>
                </div>

                <p className="text-[10px] text-center text-slate-400">
                  Dengan menekan tombol Publikasikan, Anda menyetujui Syarat &amp; Ketentuan
                  PropShare Campus.
                </p>
              </div>

            </div>
          </div>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
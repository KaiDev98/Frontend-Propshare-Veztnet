import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMarketplaceProperties } from '../hooks/useMarketplaceProperties';
// ─── Konfigurasi API ──────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// ─── Helper: Hitung % pendanaan ──────────────────────────
const hitungFundedPersen = (investments = [], fundingTarget = 0) => {
  if (!fundingTarget || fundingTarget === 0) return 0;
  const totalTerkumpul = investments.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
  return Math.min(Math.round((totalTerkumpul / fundingTarget) * 100), 100);
};

// ─── TextType Component ───────────────────────────────────────────────────────
function TextType({ text = "", typingSpeed = 50, pauseTime = 2000, loop = false, className = "", cursorChar = "|", cursorClassName = "" }) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing");
  const indexRef = useRef(0);

  useEffect(() => { setDisplayed(""); setPhase("typing"); indexRef.current = 0; }, [text]);

  useEffect(() => {
    if (phase === "typing") {
      if (indexRef.current >= text.length) { setPhase(loop ? "pausing" : "done"); return; }
      const t = setTimeout(() => { setDisplayed(text.slice(0, indexRef.current + 1)); indexRef.current += 1; }, typingSpeed);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") { const t = setTimeout(() => setPhase("erasing"), pauseTime); return () => clearTimeout(t); }
    if (phase === "erasing") {
      if (indexRef.current <= 0) { setPhase("typing"); return; }
      const t = setTimeout(() => { indexRef.current -= 1; setDisplayed(text.slice(0, indexRef.current)); }, typingSpeed / 2);
      return () => clearTimeout(t);
    }
  }, [phase, displayed, text, typingSpeed, pauseTime, loop]);

  return (
    <span className={className}>
      {displayed}
      <span className={`inline-block ${cursorClassName}`} style={{ animation: "textTypeCursor 0.7s step-end infinite" }}>{cursorChar}</span>
    </span>
  );
}

// ─── Animation Styles ─────────────────────────────────────────────────────────
const ANIMATION_STYLES = `
  @keyframes textTypeCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
  @keyframes float-delay { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }

  .hero-content-enter  { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
  .hero-image-enter    { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
  
  .float-anim  { animation: float 6s ease-in-out infinite; }
  .float-anim-delay  { animation: float-delay 7s ease-in-out infinite 1s; }

  .reveal {
    opacity: 0; transform: translateY(30px);
    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
    will-change: opacity, transform;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(options = {}, once = false) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); if (once) obs.unobserve(el); }
        else { if (!once) setInView(false); }
      },
      { threshold: 0.12, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useCounter(target, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

// ─── Data Dummy (Fallback agar UI tidak kolaps jika API kosong) ───────────────
const DUMMY_PROPERTI = [
  { id: 1, title: "Apartemen Mahasiswa UI", location: "Depok, Jawa Barat", tokenPrice: 100000, fundingTarget: 500000000, investments: [{ totalPaid: 350000000 }] },
  { id: 2, title: "Kost Eksklusif UGM", location: "Sleman, Yogyakarta", tokenPrice: 150000, fundingTarget: 800000000, investments: [{ totalPaid: 400000000 }] },
  { id: 3, title: "Asrama Kampus ITB", location: "Bandung, Jawa Barat", tokenPrice: 200000, fundingTarget: 1000000000, investments: [{ totalPaid: 900000000 }] }
];

const STATS = [
  { label: "Total Aset", rawNum: 42.8, prefix: "Rp", suffix: "M", isFloat: true },
  { label: "Investor Aktif", rawNum: 12500, prefix: "", suffix: "+" },
  { label: "Properti", rawNum: 245, prefix: "", suffix: "" },
  { label: "Avg. Return", rawNum: 8.6, prefix: "", suffix: "%", isFloat: true },
];

const LANGKAH = [
  { icon: "person", step: "Cari & Pilih", desc: "Telusuri hunian mahasiswa pilihan yang lolos verifikasi tim kami.", active: false },
  { icon: "account_balance_wallet", step: "Mulai Investasi", desc: "Beli token mulai Rp 100.000 saja. Langsung jadi co-owner.", active: true },
  { icon: "trending_up", step: "Terima Hasil", desc: "Hasil sewa masuk otomatis ke dompet digital kamu setiap 3 bulan.", active: false },
  { icon: "monitoring", step: "Monitor Portofolio", desc: "Pantau nilai aset dan historis keuntungan langsung dari dashboard.", active: false },
];

const PARTNERS = [
  { name: "Ethereum", icon: "currency_bitcoin" },
  { name: "MetaMask", icon: "account_balance_wallet" },
  { name: "Polygon", icon: "hexagon" },
  { name: "BNB Chain", icon: "toll" },
  { name: "Smart Contract", icon: "description" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function PropertyCard({ property, delay }) {
  const [ref, inView] = useInView();
  const namaProperti = property.title || "Properti";
  const lokasiProperti = property.location || "-";
  const gambarProperti = property.images?.[0]?.url || "";
  const minInvestasi = property.tokenPrice || 0;
  const fundedPersen = hitungFundedPersen(property.investments, property.fundingTarget);

  return (
    <div ref={ref} className={`reveal ${inView ? "visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="bg-[#F8F9FB] rounded-3xl p-5 hover:shadow-xl transition-shadow duration-300 group border border-transparent hover:border-slate-200">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{namaProperti}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 pr-4">{lokasiProperti}</p>
          </div>
          <Link to="/signin" className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#EC5B13] group-hover:bg-[#EC5B13] group-hover:text-white transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Harga Token</p>
              <p className="font-bold text-slate-900">Rp {minInvestasi.toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Terdanai</p>
              <p className="font-bold text-[#EC5B13]">{fundedPersen}%</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#EC5B13] h-2 rounded-full transition-all duration-1000" style={{ width: `${fundedPersen}%` }} />
          </div>
        </div>
        <div className="h-40 rounded-2xl overflow-hidden bg-slate-200 relative">
           {gambarProperti ? (
             <img src={gambarProperti} alt={namaProperti} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
           ) : (
             <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-slate-400">apartment</span></div>
           )}
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="material-symbols-outlined text-sm"
          style={{ color: i < Math.round(rating) ? "#FBBF24" : "#E2E8F0", fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
      ))}
      <span className="text-xs text-slate-500 ml-2 font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review, delay }) {
  const [ref, inView] = useInView();
  const namaUlasan = review.tenant?.fullName || "Pengguna";
  const avatarUlasan = review.tenant?.avatar || "";
  const komentarUlasan = review.comment || "";
  
  return (
    <div ref={ref} className={`reveal ${inView ? "visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="p-6 rounded-3xl bg-[#F8F9FB] h-full flex flex-col border border-slate-100">
        <StarRating rating={review.avgRating || 5} />
        <p className="text-slate-700 my-4 font-medium leading-relaxed flex-1 text-sm">"{komentarUlasan}"</p>
        <div className="flex items-center gap-3 mt-auto">
          {avatarUlasan ? (
            <img alt={namaUlasan} className="w-10 h-10 rounded-full object-cover" src={avatarUlasan} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#EC5B13] text-sm">person</span>
            </div>
          )}
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{namaUlasan}</h4>
            <p className="text-[11px] text-slate-500">Investor Terverifikasi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JudulSeksi({ children, sub, center = false, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`reveal ${inView ? "visible" : ""} flex flex-col ${center ? "items-center text-center max-w-3xl mx-auto" : "items-start text-left"} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
         <span className="material-symbols-outlined text-[18px] text-[#EC5B13]">bolt</span>
         <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Features</span>
      </div>
      <div className="w-full">
        {children}
      </div>
      {sub && <p className="text-slate-500 mt-2 text-base md:text-lg leading-relaxed max-w-2xl">{sub}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [statsRef, statsInView] = useInView({ threshold: 0.25 }, true);
  const { properties, loading, error } = useMarketplaceProperties(3);
  const [ulasan, setUlasan] = useState([]);
  // const [loadingProperti, setLoadingProperti] = useState(true);

  const fetchUlasan = useCallback(async (propertiList) => {
    try {
      if (!propertiList?.length) return;
      const requests = propertiList.slice(0, 3).map((p) =>
        fetch(`${API_BASE_URL}/reviews/property/${p.id}`)
          .then((r) => r.ok ? r.json() : { status: "error", data: [] })
          .then((j) => j.status === "success" ? j.data : [])
          .catch(() => [])
      );
      const hasilSemua = await Promise.all(requests);
      setUlasan(hasilSemua.flat().filter((u) => u.comment?.trim()).slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  }, []);

    useEffect(() => {
    if (properties.length > 0) fetchUlasan(properties);
  }, [properties, fetchUlasan]);


  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 overflow-x-hidden">
      <style>{ANIMATION_STYLES}</style>

      {/* ── Hero Section ── */}
      {/* Jarak diubah dari pt-8 lg:pt-12 menjadi pt-4 lg:pt-6 untuk mempersempit gap dengan navbar */}
      <section className="relative w-full pt-4 pb-12 lg:pt-6 lg:pb-16 flex items-center overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* KIRI: Teks (50% Lebar) */}
            <div className="w-full lg:w-1/2 text-center lg:text-left hero-content-enter z-10 lg:pr-8">
              <div className="hero-badge-enter inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-sm font-semibold mb-4 text-slate-700">
                <span className="material-symbols-outlined text-[#EC5B13] text-sm">verified</span>
                Dipercaya oleh 100+ Organisasi
              </div>

              {/* Ukuran Teks Presisi */}
              <h1 className="hero-h1-enter text-5xl md:text-6xl lg:text-[3.8rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 mb-4">
                Solusi Aman <br className="hidden lg:block"/> untuk <br className="hidden lg:block"/>
                <span className="text-[#EC5B13]">Sukses Finansial</span>
              </h1>

              <div className="hero-p-enter mb-6">
                <p className="text-base md:text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed min-h-[56px]">
                  <TextType
                    text="Kami memberikan solusi keuangan inovatif yang membantu individu dan bisnis menumbuhkan kekayaan dari properti kampus."
                    typingSpeed={30} pauseTime={2500} loop={true}
                    cursorChar="|" cursorClassName="text-[#EC5B13]"
                  />
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="hero-cta-enter flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                <Link to="/signin" className="bg-[#EC5B13] text-white font-semibold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 w-full sm:w-auto justify-center">
                  Mulai Investasi <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link to="/how-it-works" className="bg-white border border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-colors w-full sm:w-auto text-center">
                  Pelajari Lanjut
                </Link>
              </div>

              {/* Social Proof */}
              <div className="hero-cta-enter flex items-center justify-center lg:justify-start gap-3 mt-2">
                 <div className="flex -space-x-3">
                   <img src="https://i.pravatar.cc/100?img=1" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
                   <img src="https://i.pravatar.cc/100?img=2" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
                   <img src="https://i.pravatar.cc/100?img=3" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
                 </div>
                 <div className="flex flex-col text-left">
                   <StarRating rating={4.8} />
                   <span className="text-[11px] text-slate-500 font-medium mt-0.5">4.8 Rating dari 500K+ Review</span>
                 </div>
              </div>
            </div>

            {/* KANAN: Mockup Smartphone Virtual */}
            <div className="w-full lg:w-1/2 hero-image-enter flex justify-center mt-8 lg:mt-0 relative">
              <div className="relative float-anim w-[280px] lg:w-[290px]">
                
                {/* 1. Casing Luar (Frame Metalik) */}
                <div className="relative rounded-[3rem] p-1.5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] w-full mx-auto z-10">
                  
                  {/* Tombol Fisik Hardware */}
                  <div className="absolute top-24 -left-1.5 w-1.5 h-6 bg-slate-400 rounded-l-md"></div>
                  <div className="absolute top-36 -left-1.5 w-1.5 h-12 bg-slate-400 rounded-l-md"></div>
                  <div className="absolute top-52 -left-1.5 w-1.5 h-12 bg-slate-400 rounded-l-md"></div>
                  <div className="absolute top-40 -right-1.5 w-1.5 h-16 bg-slate-400 rounded-r-md"></div>

                  {/* 2. Bezel Kaca Hitam & Layar Dalam */}
                  <div className="border-[6px] border-slate-900 rounded-[2.6rem] bg-white overflow-hidden relative h-[560px] w-full flex flex-col z-10">
                    
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 pointer-events-none z-40"></div>

                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-[22px] bg-black rounded-full z-50 flex items-center justify-between px-2 shadow-sm">
                        <div className="w-5 h-2 bg-slate-800 rounded-full opacity-40"></div>
                        <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700/50 flex items-center justify-center">
                           <div className="w-1 h-1 bg-blue-900/50 rounded-full"></div>
                        </div>
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-50"></div>

                    <div className="bg-[#EC5B13] text-white p-4 pt-12 pb-8 relative z-10 shrink-0 shadow-sm rounded-b-[1.5rem]">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <img src="/public/foto-profile.png" className="w-9 h-9 rounded-full border-2 border-white/30" alt="Profile" />
                          <div>
                            <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold">Selamat Pagi</p>
                            <p className="text-sm font-bold leading-tight">Muhammad Rifki Rusli</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                      </div>
                      <p className="text-[11px] text-white/80 mb-0.5 font-medium">Total Saldo</p>
                      <h2 className="text-3xl font-extrabold tracking-tight">Rp 42.5M</h2>
                    </div>
                    
                    <div className="flex-1 bg-slate-50 px-4 pt-5 pb-16 -mt-4 relative z-0 overflow-hidden rounded-t-[1.5rem]">
                      <p className="font-bold text-slate-800 mb-3 text-xs">Investasi Terbaru</p>
                      <div className="space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-[#EC5B13]">
                                <span className="material-symbols-outlined text-[16px]">apartment</span>
                              </div>
                              <div>
                                <p className="font-bold text-[11px] text-slate-900 leading-tight mb-0.5">Properti Kampus {i}</p>
                                <p className="text-[9px] text-slate-400">12 Token</p>
                              </div>
                            </div>
                            <p className="font-bold text-xs text-green-600">+8.5%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Widgets */}
                <div className="absolute top-[28%] -right-6 lg:-right-10 bg-white p-3 rounded-2xl shadow-xl z-20 float-anim-delay border border-slate-100">
                  <p className="text-[9px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">Transaksi Aktif</p>
                  <div className="flex items-end gap-2">
                    <div className="flex gap-[3px] items-end h-5">
                       <div className="w-[5px] bg-[#EC5B13] h-2.5 rounded-full"></div>
                       <div className="w-[5px] bg-orange-300 h-5 rounded-full"></div>
                       <div className="w-[5px] bg-orange-200 h-3.5 rounded-full"></div>
                       <div className="w-[5px] bg-[#EC5B13] h-4 rounded-full"></div>
                    </div>
                    <span className="font-black text-lg text-slate-900 leading-none">45k+</span>
                  </div>
                </div>

                <div className="absolute bottom-[20%] -left-6 lg:-left-10 bg-white p-3 rounded-2xl shadow-xl z-20 float-anim border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">monitoring</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Return Portofolio</p>
                      <p className="font-bold text-xs text-slate-900 leading-none">+Rp 12.500.000</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Logo Partners Strip ── */}
      {/* Jarak (py-8) dirapatkan menjadi py-5 */}
      <section className="border-y border-slate-100 bg-[#F8F9FB] py-5">
        <div className="container mx-auto px-6 lg:px-12 flex flex-wrap justify-center lg:justify-between items-center gap-6 text-slate-400">
          {PARTNERS.map(partner => (
            <div key={partner.name} className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-xl">{partner.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest">{partner.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Peluang Aktif ── */}
      {/* py-16 dirapatkan menjadi py-12 lg:py-16 */}
      <section id="peluang-aktif" className="py-12 lg:py-16 bg-white scroll-mt-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex-1">
            <JudulSeksi center={false}>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                Layanan Modern dengan <span className="text-[#EC5B13]">Nilai Nyata</span>
              </h2>
            </JudulSeksi>
          </div>
          <Link
            to="/signin"
            className="shrink-0 bg-[#EC5B13] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Lihat Semua
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* State: loading */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        )}

        {/* State: error */}
        {!loading && error && (
          <p className="text-center text-slate-400 py-10">
            Gagal memuat properti. Coba refresh halaman.
          </p>
        )}

        {/* State: data kosong */}
        {!loading && !error && properties.length === 0 && (
          <p className="text-center text-slate-400 py-10">
            Belum ada properti aktif saat ini.
          </p>
        )}

        {/* State: data tersedia */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} delay={i * 100} />
            ))}
          </div>
        )}
      </div>  
    </section>

      {/* ── Cara Kerja ── */}
      <section id="cara-kerja" className="py-12 lg:py-16 bg-[#F8F9FB] border-t border-slate-100 scroll-mt-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="relative">
              <div className="rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
                <img src="" alt="Person working" className="w-full h-auto object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl z-20 border border-slate-100 hidden md:flex items-center gap-3">
                 <img src="" className="w-10 h-10 rounded-full" alt="Manager" />
                 <div>
                   <p className="font-bold text-sm text-slate-900">Sosuke Aizen</p>
                   <p className="text-[11px] text-slate-500">Investment Manager</p>
                 </div>
                 <div className="ml-3 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-[#EC5B13]">arrow_forward</span>
                 </div>
              </div>
            </div>

            <div>
              <div className="mb-8">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-3">Langkah Terpadu <br/>untuk <span className="text-[#EC5B13]">Kesuksesanmu</span></h2>
                <Link to="/signin" className="inline-block bg-[#EC5B13] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition shadow-sm">
                  Mulai Sekarang
                </Link>
              </div>

              <div className="relative">
                <div className="absolute left-[1.15rem] top-4 bottom-4 w-[2px] bg-slate-200"></div>
                <div className="space-y-6">
                  {LANGKAH.map((step, i) => (
                    <div key={i} className="flex gap-5 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${step.active ? "bg-[#EC5B13] text-white shadow-md shadow-orange-500/20" : "bg-white border border-slate-200 text-slate-400"}`}>
                        <span className="material-symbols-outlined text-lg">{step.icon}</span>
                      </div>
                      <div className="pt-1">
                        <h4 className="text-base font-bold text-slate-900 mb-0.5">{step.step}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-sm">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="container mx-auto px-6 lg:px-12">
          <div ref={statsRef} className={`flex flex-wrap justify-between gap-6 reveal ${statsInView ? "visible" : ""}`}>
            {STATS.map((stat, i) => {
              const num = useCounter(stat.isFloat ? Math.round(stat.rawNum * 10) : stat.rawNum, 1600, statsInView);
              const display = stat.isFloat ? `${stat.prefix}${(num / 10).toFixed(1)}${stat.suffix}` : `${stat.prefix}${num.toLocaleString("id-ID")}${stat.suffix}`;
              return (
                <div key={stat.label} className="text-center md:text-left" style={{ transitionDelay: `${i * 100}ms` }}>
                  <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-1">{display}</p>
                  <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Ulasan ── */}
      <section id="ulasan" className="py-12 lg:py-16 bg-[#F8F9FB] scroll-mt-20">
        <div className="container mx-auto px-6 lg:px-12">
          <JudulSeksi center={true} sub="Temukan bagaimana platform kami membantu ribuan investor sukses." className="mb-10">
             <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Fitur Inovatif untuk Layanan <br className="hidden md:block"/> Finansial <span className="text-[#EC5B13]">Modern</span></h2>
          </JudulSeksi>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <span className="material-symbols-outlined text-4xl text-[#EC5B13] mb-5">security</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transaksi Aman</h3>
              <ul className="space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2.5"><span className="material-symbols-outlined text-green-500 text-base">check_circle</span> Enkripsi tingkat lanjut untuk setiap deposit.</li>
                <li className="flex gap-2.5"><span className="material-symbols-outlined text-green-500 text-base">check_circle</span> Monitor real-time cegah aktivitas mencurigakan.</li>
                <li className="flex gap-2.5"><span className="material-symbols-outlined text-green-500 text-base">check_circle</span> Audit reguler untuk memastikan keamanan aset.</li>
              </ul>
              <Link to="/how-it-works" className="text-[#EC5B13] font-semibold text-sm mt-6 flex items-center gap-1 hover:underline">
                Pelajari Lanjut <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {ulasan.length > 0 ? (
                ulasan.map((r, i) => <ReviewCard key={r.id || i} review={r} delay={i * 100} />)
              ) : (
                <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 py-12">
                   <span className="material-symbols-outlined text-5xl mb-2 opacity-50">forum</span>
                   <p className="text-sm">Belum ada ulasan saat ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner CTA ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-6">Siap Memulai <span className="text-[#EC5B13]">Investasi Anda?</span></h2>
          <div className="flex justify-center">
             <Link to="/signin" className="bg-[#EC5B13] text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition shadow-md shadow-orange-500/20">
                Buka Akun Gratis
             </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
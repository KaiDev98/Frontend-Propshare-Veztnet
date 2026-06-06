import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader from "../../components/InvestorHeader";
import api from "../../utils/api";

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />;
}

// ─── Recommended Card ──────────────────────────────────────────────────────────
function RecommendedCard({ property, onClick }) {
  const fundedPct = property.fundingTarget > 0
    ? Math.min(Math.round((property.currentFunding / property.fundingTarget) * 100), 100)
    : 0;

  const thumbnail  = property.images?.find((img) => img?.url)?.url ?? null;
  const isTrending = fundedPct >= 60;
  const isNew      = fundedPct < 20 && !isTrending;
  const roi        = property.estimatedRoi ?? property.roi ?? property.expectedRoi ?? null;

  return (
    <div
      onClick={() => onClick(property)}
      className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      {/* Gambar */}
      <div className="h-48 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

        {isTrending && (
          <div className="absolute top-4 left-4 z-20 bg-[#EC5B13] text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
            Trending
          </div>
        )}
        {isNew && (
          <div className="absolute top-4 left-4 z-20 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
            Listing Baru
          </div>
        )}

        {thumbnail ? (
          <img
            src={thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-white/60">home_work</span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-20 text-white">
          <h4 className="font-bold leading-tight">{property.title}</h4>
          <p className="text-xs opacity-80 mt-0.5">{property.location}</p>
        </div>
      </div>

      {/* Isi */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Estimasi Imbal Hasil</span>
          <span className={`font-bold ${roi ? "text-emerald-500" : "text-slate-400"}`}>
            {roi ? `${roi}% / thn` : "Lihat Detail"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Harga Token</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Rp {property.tokenPrice.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Target Pendanaan</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
            Rp {property.fundingTarget.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#EC5B13] h-full rounded-full transition-all duration-700"
              style={{ width: `${fundedPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>{fundedPct}% TERDANAI</span>
            <span>{property.investments?.length ?? 0} INVESTOR</span>
          </div>
        </div>

        {/* Tombol */}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(property); }}
          className="w-full py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-[#d44e0f] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          Lihat Detail
        </button>
      </div>
    </div>
  );
}

// ─── KYC Banner Konfigurasi ────────────────────────────────────────────────────
const KYC_CONFIG = {
  VERIFIED: {
    wrapperCls: "bg-gradient-to-r from-indigo-900 to-indigo-700 shadow-indigo-500/10",
    badgeCls:   "bg-white/20 backdrop-blur-sm border-white/30",
    badgeIcon:  "verified_user",
    badgeLabel: "Verifikasi Selesai",
    title:      "KYC Disetujui!",
    desc:       (user, inv, val) =>
      inv > 0
        ? `Kamu memiliki ${inv} investasi aktif dengan total nilai Rp ${val.toLocaleString("id-ID")}.`
        : `Selamat datang di PropShare, ${user?.split(" ")[0] ?? "Investor"}. Kamu kini bisa berinvestasi di aset properti premium.`,
    btnLabel: "Jelajahi Marketplace",
    btnCls:   "bg-[#EC5B13] text-white shadow-[#EC5B13]/30",
    btnRoute: "/investor/marketplace",
    disabled: false,
  },
  UNDER_REVIEW: {
    wrapperCls: "bg-gradient-to-r from-yellow-700 to-yellow-600 shadow-yellow-500/10",
    badgeCls:   "bg-yellow-500/30 backdrop-blur-sm border-yellow-300/30 text-yellow-100",
    badgeIcon:  "hourglass_empty",
    badgeLabel: "Sedang Ditinjau",
    title:      "Menunggu Review Admin",
    desc:       () => "Dokumen Anda sedang ditinjau oleh tim kami. Akses investasi akan dibuka segera setelah disetujui.",
    btnLabel:   "Sedang Diproses",
    btnCls:     "bg-white/20 text-white cursor-not-allowed",
    disabled:   true,
  },
  REJECTED: {
    wrapperCls: "bg-gradient-to-r from-red-900 to-red-700 shadow-red-500/10",
    badgeCls:   "bg-red-500/30 backdrop-blur-sm border-red-300/30 text-red-100",
    badgeIcon:  "gpp_bad",
    badgeLabel: "Verifikasi Ditolak",
    title:      "KYC Ditolak!",
    desc:       () => "Mohon maaf, dokumen identitas Anda ditolak. Silakan unggah ulang dokumen yang valid.",
    btnLabel:   "Unggah Ulang KYC",
    btnCls:     "bg-white text-red-700 shadow-white/20",
    btnRoute:   "/investor/profile",
    disabled:   false,
  },
  PENDING: {
    wrapperCls: "bg-gradient-to-r from-slate-800 to-slate-700 shadow-slate-500/10",
    badgeCls:   "bg-slate-500/30 backdrop-blur-sm border-slate-300/30 text-slate-200",
    badgeIcon:  "pending_actions",
    badgeLabel: "Verifikasi Diperlukan",
    title:      (user) => `Selamat Datang, ${user?.split(" ")[0] ?? "Investor"}!`,
    desc:       () => "Selesaikan verifikasi identitas (KYC) Anda untuk membuka akses penuh ke semua fitur investasi properti.",
    btnLabel:   "Daftarkan KYC Sekarang",
    btnCls:     "bg-[#EC5B13] text-white shadow-[#EC5B13]/20",
    btnRoute:   "/investor/profile",
    disabled:   false,
  },
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardInvestor() {
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [investments,  setInvestments]  = useState([]);
  const [dividends,    setDividends]    = useState([]);
  const [recommended,  setRecommended]  = useState([]);
  const [user,         setUser]         = useState(null);
  const [search,       setSearch]       = useState("");

  // ── KYC realtime state — diambil langsung dari API, bukan localStorage ──────
  const [kycStatus,    setKycStatus]    = useState("PENDING");
  const [kycLoading,   setKycLoading]   = useState(true);
  const pollingRef = useRef(null);

  // ── Sinkronisasi user dari localStorage (untuk nama dll) ────────────────────
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    };
    loadUser();
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, []);

  // ── Fetch KYC status dari API (realtime, polling setiap 15 detik) ───────────
  const fetchKycStatus = async () => {
    try {
      const res  = await api.get("/auth/users/profile");
      const data = res.data?.data;
      if (data?.kycStatus) {
        setKycStatus(data.kycStatus);
        // Sinkronisasi ke localStorage agar komponen lain ikut update
        try {
          const existing = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...existing, ...data }));
          window.dispatchEvent(new Event("userUpdated"));
        } catch {}
      }
    } catch (err) {
      console.warn("[KYC Poll] Gagal fetch:", err.message);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus(); // langsung fetch saat mount

    // Poll setiap 15 detik
    pollingRef.current = setInterval(fetchKycStatus, 15_000);
    return () => clearInterval(pollingRef.current);
  }, []);

  // ── Fetch Data Utama ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [portfolioRes, dividendRes, propertiesRes] = await Promise.allSettled([
          api.get("/investments/my-portfolio"),
          api.get("/dividends/history"),
          api.get("/properties/marketplace/investor")
        ]);

        if (portfolioRes.status === "fulfilled") {
          const raw = portfolioRes.value.data?.data;
          setInvestments(Array.isArray(raw) ? raw : Array.isArray(raw?.investments) ? raw.investments : []);
        }

        if (dividendRes.status === "fulfilled") {
          const raw = dividendRes.value.data?.data;
          setDividends(Array.isArray(raw) ? raw : Array.isArray(raw?.dividends) ? raw.dividends : []);
        }

        if (propertiesRes.status === "fulfilled") {
          const raw    = propertiesRes.value.data?.data;
          const all    = Array.isArray(raw) ? raw : [];
          const seen   = new Set();
          const unique = all.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setRecommended(unique.filter((p) => p.status !== "FUNDED").slice(0, 3));
        }
      } catch (err) {
        console.error("Fetch dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Kalkulasi ────────────────────────────────────────────────────────────────
  const inv  = Array.isArray(investments) ? investments : [];
  const divs = Array.isArray(dividends)   ? dividends   : [];

  const totalInvested       = inv.reduce((s, i) => s + (i.totalPaid ?? 0), 0);
  const totalDividends      = divs.filter((d) => d.status === "CLAIMED").reduce((s, d) => s + (d.amount ?? 0), 0);
  const activeAssets        = inv.length;
  const totalPortfolioValue = inv.reduce((s, i) => s + (i.tokenAmount ?? 0) * (i.property?.tokenPrice ?? 0), 0);
  const roi                 = totalInvested > 0
    ? (((totalPortfolioValue - totalInvested) / totalInvested) * 100).toFixed(1)
    : "0.0";

  // ── KYC Banner config dinamis ────────────────────────────────────────────────
  const cfg       = KYC_CONFIG[kycStatus] ?? KYC_CONFIG.PENDING;
  const titleText = typeof cfg.title === "function" ? cfg.title(user?.fullName) : cfg.title;
  const descText  = cfg.desc(user?.fullName, inv.length, totalPortfolioValue);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const STATS = [
    {
      label:    "Total Investasi",
      value:    `Rp ${totalInvested.toLocaleString("id-ID")}`,
      sub:      `${parseFloat(roi) >= 0 ? "+" : ""}${roi}% ROI`,
      subColor: parseFloat(roi) >= 0 ? "text-emerald-500" : "text-red-500",
      icon:     "payments",
      iconBg:   "bg-[#EC5B13]/10 text-[#EC5B13]",
      badge:    "Nilai Saat Ini",
      subIcon:  parseFloat(roi) >= 0 ? "trending_up" : "trending_down",
    },
    {
      label:    "Total Dividen",
      value:    `Rp ${totalDividends.toLocaleString("id-ID")}`,
      sub:      divs.length > 0 ? `${divs.length} transaksi` : "Menunggu investasi pertama",
      subColor: "text-slate-400",
      icon:     "savings",
      iconBg:   "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600",
      badge:    "Total Pembayaran",
    },
    {
      label:    "Saldo Tersedia",
      value:    "Rp 0",
      subCta:   true,
      icon:     "account_balance_wallet",
      iconBg:   "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
      badge:    "Saldo Dompet",
    },
    {
      label:    "Aset Aktif",
      value:    activeAssets.toString(),
      sub:      activeAssets === 0 ? "Mulai investasi hari ini" : `Di ${activeAssets} properti`,
      subColor: "text-slate-400",
      icon:     "real_estate_agent",
      iconBg:   "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300",
      badge:    "Properti",
    },
  ];

  // ── Filter investasi ─────────────────────────────────────────────────────────
  const filteredInv = inv.filter((i) => {
    const q = search.toLowerCase();
    return !search
      || i.property?.title?.toLowerCase().includes(q)
      || i.property?.location?.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <InvestorSidebar activeLabel="Dashboard" />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <InvestorHeader search={search} onSearch={setSearch} />

        <div className="p-8 space-y-8">

          {/* ── Banner KYC (Realtime) ── */}
          <section className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-xl ${cfg.wrapperCls}`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">

                {/* Badge Status */}
                {kycLoading ? (
                  <div className="h-6 w-40 bg-white/20 rounded-full animate-pulse" />
                ) : (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${cfg.badgeCls}`}>
                    <span className="material-symbols-outlined text-xs">{cfg.badgeIcon}</span>
                    {cfg.badgeLabel}
                  </div>
                )}

                {/* Judul */}
                {kycLoading ? (
                  <div className="h-9 w-64 bg-white/20 rounded-xl animate-pulse" />
                ) : (
                  <h1 className="text-3xl font-extrabold tracking-tight">{titleText}</h1>
                )}

                {/* Deskripsi */}
                {kycLoading ? (
                  <div className="h-5 w-80 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-white/80 max-w-xl text-lg">{descText}</p>
                )}
              </div>

              {/* Tombol CTA */}
              {!kycLoading && (
                cfg.disabled ? (
                  <button
                    disabled
                    className={`font-bold py-4 px-8 rounded-xl flex items-center gap-2 shrink-0 ${cfg.btnCls}`}
                  >
                    <span className="material-symbols-outlined">hourglass_empty</span>
                    {cfg.btnLabel}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(cfg.btnRoute)}
                    className={`font-bold py-4 px-8 rounded-xl hover:scale-105 transition-transform shadow-lg flex items-center gap-2 shrink-0 ${cfg.btnCls}`}
                  >
                    {kycStatus === "VERIFIED"
                      ? <span className="material-symbols-outlined">storefront</span>
                      : <span className="material-symbols-outlined">upload_file</span>}
                    {cfg.btnLabel}
                  </button>
                )
              )}
            </div>

            {/* Efek Glow */}
            <div className="absolute -top-24 -right-24 size-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full blur-3xl pointer-events-none bg-white/10" />
          </section>

          {/* ── Stats ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)
            ) : (
              STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {stat.badge}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                    {stat.value}
                  </h3>
                  <div className="mt-4">
                    {stat.subCta ? (
                      <button
                        onClick={() => navigate("/investor/portfolio")}
                        className="text-[#EC5B13] text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        Lihat Portfolio
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    ) : (
                      <div className={`flex items-center gap-1 text-xs font-bold ${stat.subColor}`}>
                        {stat.subIcon && (
                          <span className="material-symbols-outlined text-xs">{stat.subIcon}</span>
                        )}
                        <span>{stat.sub}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ── Investasi Aktif ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Investasi Aktif
                {!loading && inv.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({inv.length} properti)
                  </span>
                )}
              </h2>
              <button
                onClick={() => navigate("/investor/transactions")}
                className="text-[#EC5B13] text-sm font-bold hover:underline"
              >
                Lihat Riwayat
              </button>
            </div>

            {loading ? (
              <Skeleton className="h-48" />
            ) : filteredInv.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-slate-400 text-4xl">inventory_2</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {search ? `Tidak ada hasil untuk "${search}"` : "Belum Ada Investasi Aktif"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                  {search
                    ? "Coba kata kunci lain atau hapus filter pencarian."
                    : "Portfolio kamu siap untuk berkembang. Temukan properti kampus dengan imbal hasil tinggi di Marketplace."}
                </p>
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="bg-[#EC5B13] text-white px-8 py-3 rounded-xl font-bold"
                  >
                    Hapus Filter
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/investor/marketplace")}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <span className="material-symbols-outlined">explore</span>
                    Jelajahi Marketplace
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {["Properti", "Token Dimiliki", "Total Investasi", "Nilai Saat Ini", "ROI", "Status"].map((h) => (
                          <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredInv.map((investment) => {
                        const currentVal = (investment.tokenAmount ?? 0) * (investment.property?.tokenPrice ?? 0);
                        const invRoi     = investment.totalPaid > 0
                          ? (((currentVal - investment.totalPaid) / investment.totalPaid) * 100).toFixed(1)
                          : "0.0";
                        const thumbnail  = investment.property?.images?.find((img) => img?.url)?.url ?? null;
                        const isPositive = parseFloat(invRoi) >= 0;

                        return (
                          <tr
                            key={investment.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/investor/property/${investment.propertyId}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                  {thumbnail ? (
                                    <img
                                      src={thumbnail}
                                      alt={investment.property?.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.target.style.display = "none"; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                      <span className="material-symbols-outlined text-slate-400 text-sm">home_work</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {investment.property?.title ?? "—"}
                                  </p>
                                  <p className="text-xs text-slate-400">{investment.property?.location ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {(investment.tokenAmount ?? 0).toLocaleString()} PROP
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              Rp {(investment.totalPaid ?? 0).toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                              Rp {currentVal.toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                                isPositive
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-600"
                              }`}>
                                {isPositive ? "+" : ""}{invRoi}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                                Aktif
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Rekomendasi ── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Rekomendasi untuk Kamu
              </h2>
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                Berdasarkan profil kamu
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96" />)}
              </div>
            ) : recommended.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl">storefront</span>
                <p className="mt-2 text-sm">Belum ada properti tersedia</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommended.map((property) => (
                  <RecommendedCard
                    key={property.id}
                    property={property}
                    onClick={(p) => navigate(`/investor/property/${p.id}`)}
                  />
                ))}

                {/* Card CTA Explore */}
                <div
                  onClick={() => navigate("/investor/marketplace")}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center group hover:border-[#EC5B13]/50 transition-colors cursor-pointer min-h-[200px]"
                >
                  <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-[#EC5B13]/10 group-hover:text-[#EC5B13] transition-colors text-slate-400">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Lihat Lebih Banyak Properti</p>
                  <p className="text-xs text-slate-500 mt-1">Temukan peluang investasi di semua distrik</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto p-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <p>© 2026 PropShare Campus. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Pengungkapan Risiko</a>
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#EC5B13] transition-colors">Syarat & Ketentuan</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
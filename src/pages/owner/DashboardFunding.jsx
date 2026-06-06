import { useState, useEffect } from "react";
import OwnerSidebar from "../../components/OwnerSidebar";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

// ─── Countdown Hook — persistent berdasarkan targetDate ───────────────────────
function useCountdown(targetDate) {
  const calcRemaining = () => {
    const diff = Math.floor((new Date(targetDate) - new Date()) / 1000);
    return Math.max(diff, 0);
  };

  const [secs, setSecs] = useState(calcRemaining);

  useEffect(() => {
    // Recalculate saat targetDate berubah
    setSecs(calcRemaining());
  }, [targetDate]);

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => {
      setSecs(Math.max(
        Math.floor((new Date(targetDate) - new Date()) / 1000),
        0
      ));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [d, h, m, s].map((n) => String(n).padStart(2, "0"));
}

// ─── Sub Components ────────────────────────────────────────────────────────────
function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 w-16 h-14 rounded-xl flex items-center justify-center text-2xl font-black backdrop-blur-sm border border-white/20">
        {value}
      </div>
      <span className="text-[10px] uppercase font-bold mt-1 opacity-70">{label}</span>
    </div>
  );
}

function SkeletonCard({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardFunding() {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [property,   setProperty]   = useState(null);
  const [properties, setProperties] = useState([]);
  const [selected,   setSelected]   = useState(null);

  // ─── Deadline: createdAt + 30 hari (persistent, dari DB) ─────────────────────
  const deadline = property
    ? new Date(new Date(property.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [days, hours, mins, secs] = useCountdown(deadline);
  const isExpired = days === "00" && hours === "00" && mins === "00" && secs === "00";

  // ─── Fetch semua properti owner ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res  = await api.get("/properties/my-listings");
        const data = res.data.data;
        setProperties(data);
        const active = data.find((p) => p.status === "ACTIVE") || data[0];
        if (active) setSelected(active.id);
      } catch (err) {
        console.error("Fetch properties error:", err);
      }
    };
    fetchProperties();
  }, []);

  // ─── Fetch detail properti yang dipilih ─────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/properties/${selected}`);
        setProperty(res.data.data);
      } catch (err) {
        console.error("Fetch detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selected]);

  // ─── Kalkulasi ───────────────────────────────────────────────────────────────
  const fundedPct    = property
    ? Math.min(Math.round((property.currentFunding / property.fundingTarget) * 100), 100)
    : 0;
  const totalInvestors = property?.investments?.length ?? 0;
  const avgTicket      = totalInvestors > 0
    ? Math.round(property.currentFunding / totalInvestors)
    : 0;

  const CIRCUMFERENCE = 552.92;
  const dashOffset    = CIRCUMFERENCE * (1 - fundedPct / 100);
  const thumbnail     = property?.images?.[0]?.url || "https://via.placeholder.com/400x200?text=No+Image";

  const METRICS = [
    {
      label:    "Total Investors",
      value:    totalInvestors.toLocaleString(),
      sub:      totalInvestors > 0 ? "Aktif berinvestasi" : "Belum ada investor",
      subColor: "text-green-600",
      icon:     "groups",
    },
    {
      label:    "Rata-rata Investasi",
      value:    `Rp ${avgTicket.toLocaleString("id-ID")}`,
      sub:      "Per investor",
      subColor: "text-[#EC5B13]",
      icon:     null,
    },
    {
      label:    "Harga Token",
      value:    property ? `Rp ${property.tokenPrice.toLocaleString("id-ID")}` : "-",
      sub:      "Per token",
      subColor: "text-slate-400",
      icon:     null,
    },
  ];

  const MARKET = [
    {
      label: "Funding Progress",
      level: fundedPct >= 75 ? "High"    : fundedPct >= 40 ? "Medium"  : "Low",
      pct:   fundedPct,
    },
    {
      label: "Investor Demand",
      level: totalInvestors >= 10 ? "High" : totalInvestors >= 5 ? "Stable" : "Growing",
      pct:   Math.min(totalInvestors * 10, 100),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Dashboard Funding Real-time" />

      <main className="flex-1 overflow-y-auto p-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
              Live Funding Monitor
            </h2>
            <p className="text-slate-500 mt-1">
              Real-time performance tracking untuk properti RWA kamu
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {properties.length > 1 && (
              <select
                value={selected || ""}
                onChange={(e) => setSelected(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-[#EC5B13]"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                property?.status === "ACTIVE"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                  : property?.status === "FUNDED"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-amber-100 text-amber-600"
              }`}>
                {property?.status === "ACTIVE" && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                {property?.status ?? "LOADING"}
              </div>
              <div className="text-xs font-medium text-slate-400">
                {property?.contractAddress
                  ? `${property.contractAddress.slice(0, 6)}...${property.contractAddress.slice(-4)}`
                  : "No Contract"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {!loading && !property && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="material-symbols-outlined text-6xl text-slate-300">home_work</span>
            <p className="text-slate-400 font-semibold text-lg">Belum ada properti aktif</p>
            <button
              onClick={() => navigate("/owner/new-property")}
              className="px-6 py-3 bg-[#EC5B13] text-white font-bold rounded-xl"
            >
              + Ajukan Properti Baru
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <SkeletonCard className="h-64" />
              <SkeletonCard className="h-28" />
              <SkeletonCard className="h-64" />
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <SkeletonCard className="h-80" />
              <SkeletonCard className="h-48" />
            </div>
          </div>
        ) : property ? (
          <div className="grid grid-cols-12 gap-6">

            {/* ── Left Column ── */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* Funding Progress */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-48 h-48 -rotate-90">
                      <circle cx="96" cy="96" r="88" fill="transparent"
                        stroke="currentColor" strokeWidth="12"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle cx="96" cy="96" r="88" fill="transparent"
                        stroke={fundedPct >= 100 ? "#10b981" : "#EC5B13"}
                        strokeWidth="12"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-4xl font-black ${fundedPct >= 100 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                        {fundedPct}%
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {fundedPct >= 100 ? "Funded! 🎉" : "Funded"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">Dana Terkumpul</p>
                        <p className="text-4xl font-black text-[#EC5B13]">
                          Rp {property.currentFunding.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-sm font-medium">Target Funding</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          Rp {property.fundingTarget.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          fundedPct >= 100 ? "bg-emerald-500" : "bg-[#EC5B13]"
                        }`}
                        style={{ width: `${fundedPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      {METRICS.map((m) => (
                        <div key={m.label}
                          className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                        >
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">{m.label}</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{m.value}</p>
                          <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${m.subColor}`}>
                            {m.icon && <span className="material-symbols-outlined text-sm">{m.icon}</span>}
                            {m.sub}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Countdown Timer ── */}
              {fundedPct < 100 ? (
                <div className={`text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg ${
                  isExpired
                    ? "bg-slate-500 shadow-slate-500/20"
                    : "bg-[#EC5B13] shadow-[#EC5B13]/20"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shrink-0">
                      <span className="material-symbols-outlined text-3xl">
                        {isExpired ? "timer_off" : "timer"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {isExpired ? "Funding Window Closed" : "Funding Window Closing"}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {isExpired
                          ? "Periode funding telah berakhir."
                          : `Deadline: ${deadline.toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}`}
                      </p>
                    </div>
                  </div>

                  {isExpired ? (
                    <div className="bg-white/20 px-6 py-3 rounded-xl text-white font-bold text-sm shrink-0">
                      Waktu Habis
                    </div>
                  ) : (
                    <div className="flex gap-3 shrink-0">
                      {[
                        { v: days,  l: "Days"  },
                        { v: hours, l: "Hours" },
                        { v: mins,  l: "Mins"  },
                        { v: secs,  l: "Secs"  },
                      ].map(({ v, l }) => (
                        <CountdownBox key={l} value={v} label={l} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Jika sudah 100% funded, tampilkan banner sukses
                <div className="bg-emerald-500 text-white rounded-2xl p-6 flex items-center gap-4 shadow-lg shadow-emerald-500/20">
                  <div className="bg-white/20 p-3 rounded-xl shrink-0">
                    <span className="material-symbols-outlined text-3xl">celebration</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Funding Selesai! 🎉</h3>
                    <p className="text-white/80 text-sm">
                      Target funding tercapai. Dana siap untuk ditarik di halaman Capital Withdrawal.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/owner/withdrawal")}
                    className="bg-white text-emerald-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors shrink-0"
                  >
                    Tarik Dana →
                  </button>
                </div>
              )}

              {/* Live Investment Feed */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#EC5B13]">sensors</span>
                    Live Investment Feed
                    <span className="bg-[#EC5B13]/10 text-[#EC5B13] text-xs font-bold px-2 py-0.5 rounded-full">
                      {property.investments?.length ?? 0} transaksi
                    </span>
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {property.investments?.length > 0 ? (
                    property.investments.slice(0, 5).map((inv) => (
                      <div key={inv.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#EC5B13]/10 text-[#EC5B13] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">person</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800 dark:text-white">
                                {inv.investor?.fullName ?? "Investor"}
                              </span>
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">verified</span>
                                VERIFIED
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {inv.tokenAmount} token •{" "}
                              {new Date(inv.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-slate-900 dark:text-white">
                            Rp {inv.totalPaid.toLocaleString("id-ID")}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 font-mono">
                            TX: {inv.txHash.slice(0, 6)}...{inv.txHash.slice(-4)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">sensors_off</span>
                      <p className="text-slate-400 text-sm">Belum ada investasi masuk</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Property Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="h-48 relative">
                  <img src={thumbnail} alt={property.title} className="w-full h-full object-cover" />
                  <div className={`absolute top-4 right-4 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    property.status === "ACTIVE"  ? "bg-[#EC5B13]"     :
                    property.status === "FUNDED"  ? "bg-emerald-500"   :
                    property.status === "PENDING" ? "bg-amber-500"     : "bg-slate-500"
                  }`}>
                    {property.status === "ACTIVE"  ? "Active Proposal" :
                     property.status === "FUNDED"  ? "Fully Funded 🎉" :
                     property.status === "PENDING" ? "Pending Review"  : property.status}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{property.title}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{property.location}</span>
                  </div>

                  {/* Deadline info */}
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#EC5B13] text-[18px]">event</span>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Funding Deadline</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {deadline.toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    {isExpired && (
                      <span className="ml-auto text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Target Funding", value: `Rp ${property.fundingTarget.toLocaleString("id-ID")}` },
                      { label: "Harga Token",    value: `Rp ${property.tokenPrice.toLocaleString("id-ID")}` },
                      { label: "Total Token",    value: `${property.totalTokens.toLocaleString()} PROP` },
                      { label: "Dibuat",         value: new Date(property.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" }) },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{s.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{s.value}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Status RWA</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                        property.status === "FUNDED"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-amber-100 text-amber-600"
                      }`}>
                        {property.status === "FUNDED" ? "Tokenized" : "In Progress"}
                      </span>
                    </div>
                  </div>

                  {property.ipfsLegalDoc && (
                    
                     <a href={`https://gateway.pinata.cloud/ipfs/${property.ipfsLegalDoc.split("|")[0]}`}
                      target="_blank" rel="noreferrer"
                      className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl border border-[#EC5B13]/30 text-[#EC5B13] text-xs font-bold hover:bg-[#EC5B13]/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      Lihat Dokumen Legal IPFS
                    </a>
                  )}

                  <button
                    onClick={() => navigate(`/owner/property/${property.id}`)}
                    className="w-full mt-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">info</span>
                    Lihat detail properti
                  </button>
                </div>
              </div>

              {/* Market Sentiment */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                  Market Sentiment
                </h3>
                <div className="space-y-4">
                  {MARKET.map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.label}</span>
                        <span className={`text-xs font-bold ${
                          m.level === "High"   ? "text-emerald-500" :
                          m.level === "Stable" ? "text-blue-500"    : "text-[#EC5B13]"
                        }`}>{m.level}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            m.level === "High"   ? "bg-emerald-500" :
                            m.level === "Stable" ? "bg-blue-500"    : "bg-[#EC5B13]"
                          }`}
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">📊 Ringkasan Funding</p>
                  <p className="text-xs text-slate-500">
                    Dana terkumpul: <b className="text-[#EC5B13]">Rp {property.currentFunding.toLocaleString("id-ID")}</b>
                  </p>
                  <p className="text-xs text-slate-500">
                    Sisa target: <b>Rp {Math.max(property.fundingTarget - property.currentFunding, 0).toLocaleString("id-ID")}</b>
                  </p>
                  <p className="text-xs text-slate-500">
                    Total investor: <b>{totalInvestors} orang</b>
                  </p>
                  <p className="text-xs text-slate-500">
                    Deadline: <b>{deadline.toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</b>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
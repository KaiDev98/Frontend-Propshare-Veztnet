import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader  from "../../components/InvestorHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

const COLORS = ["#EC5B13","#EC5B13AA","#EC5B1360","#6366f1","#10b981","#f59e0b"];

// ─── Pagination Component ──────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onItemsPerPageChange }) {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) rangeWithDots.push(1, "...");
    else rangeWithDots.push(1);

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) rangeWithDots.push("...", totalPages);
    else if (totalPages > 1) rangeWithDots.push(totalPages);

    return totalPages <= 1 ? [1] : rangeWithDots;
  }, [currentPage, totalPages]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem   = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
      {/* Info + Per Page */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{startItem}–{endItem}</span> dari{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">{totalItems}</span> item
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Per halaman:</span>
          <select
            value={itemsPerPage}
            onChange={e => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Page Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#EC5B13] hover:bg-[#EC5B13]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {pages.map((page, i) =>
            page === "..." ? (
              <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                  currentPage === page
                    ? "bg-[#EC5B13] text-white shadow-md shadow-[#EC5B13]/30 scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:bg-[#EC5B13]/10 hover:text-[#EC5B13]"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#EC5B13] hover:bg-[#EC5B13]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── UPGRADED: Donut Chart (Asset Allocation) ──────────────────────────────────
function DonutChart({ investments }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = investments.reduce((s, inv) => s + (inv.totalPaid ?? 0), 0);

  const slices = useMemo(() => {
    let cum = 0;
    return investments.slice(0, 5).map((inv, i) => {
      const pct = total > 0 ? (inv.totalPaid / total) * 100 : 0;
      const start = cum;
      cum += pct;
      return { ...inv, pct, start, color: COLORS[i % COLORS.length] };
    });
  }, [investments, total]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex justify-center items-center h-52 w-52">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {slices.map((s, i) => {
            const isHovered = activeIndex === i;
            const circumference = 2 * Math.PI * 38; // radius 38
            const offset = circumference - (s.pct * circumference) / 100;
            const rotation = (s.start * 360) / 100;

            return (
              <circle
                key={i}
                cx="50" cy="50" r="38"
                fill="transparent"
                stroke={s.color}
                strokeWidth={isHovered ? "10" : "8"}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out cursor-pointer"
                style={{ transformOrigin: 'center', transform: `rotate(${rotation}deg)` }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {investments.length}
          </span>
          <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold mt-0.5">
            Assets
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 w-full space-y-1">
        {slices.map((s, i) => (
          <div 
            key={i} 
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${activeIndex === i ? 'bg-slate-50 dark:bg-slate-800/50 scale-[1.02]' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0" style={{ background: s.color }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                {s.property?.title ?? "Property"}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
        {investments.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Belum ada investasi</p>}
      </div>
    </div>
  );
}

// ─── UPGRADED: Growth Chart (Anti-Gepeng & Interactive Tooltip) ───────────────
function GrowthChart({ investments }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = useMemo(() => {
    if (!investments.length) return [];
    const sorted = [...investments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let cum = 0;
    const maxY = sorted.reduce((sum, inv) => sum + (inv.totalPaid ?? 0), 0) || 1;
    
    return sorted.map((inv, i) => {
      cum += inv.totalPaid ?? 0;
      return { 
        id: i,
        // Kalkulasi posisi X dan Y dalam persentase (0% - 100%)
        xPercent: (i / Math.max(sorted.length - 1, 1)) * 100, 
        yPercent: (cum / maxY) * 100,
        val: cum,
        dateStr: new Date(inv.createdAt).toLocaleString("id-ID", { 
          day: "numeric", month: "long", year: "numeric" 
        })
      };
    });
  }, [investments]);

  if (!points.length) return (
    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">show_chart</span>
        <p className="text-slate-400 text-sm">Belum ada data pertumbuhan</p>
    </div>
  );

  // Sistem koordinat internal SVG (Virtual Canvas)
  const SVG_W = 1000;
  const SVG_H = 300;
  const PADDING_Y = 40; // Memberi ruang agar garis tidak terpotong di atas/bawah

  const getX = (p) => (p.xPercent / 100) * SVG_W;
  const getY = (p) => SVG_H - PADDING_Y - (p.yPercent / 100) * (SVG_H - PADDING_Y * 2);

  // Membuat Smooth Path menggunakan Bezier Curve
  const createPath = () => {
    return points.reduce((acc, p, i, str) => {
      if (i === 0) return `M ${getX(p)},${getY(p)}`;
      const prev = str[i - 1];
      const cpsX = getX(prev) + (getX(p) - getX(prev)) / 2;
      return `${acc} C ${cpsX},${getY(prev)} ${cpsX},${getY(p)} ${getX(p)},${getY(p)}`;
    }, "");
  };

  const pathD = createPath();
  const fillD = `${pathD} L ${SVG_W},${SVG_H} L 0,${SVG_H} Z`;

  return (
    <div className="relative h-64 w-full">
      {/* 1. LAYER BAWAH: SVG Garis & Gradasi */}
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#EC5B13" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EC5B13" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={fillD} fill="url(#areaGradient)" className="animate-fade-in" />
        
        {/* vectorEffect="non-scaling-stroke" mencegah garis ikut jadi gepeng */}
        <path
          d={pathD}
          fill="none"
          stroke="#EC5B13"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke" 
          style={{ strokeDasharray: 3000, strokeDashoffset: 3000 }}
          className="animate-draw-path"
        />
      </svg>

      {/* 2. LAYER ATAS: Titik Data (Dots) HTML & Tooltip Interaktif */}
      {points.map((p) => {
        // Samakan posisi Y dengan kalkulasi internal SVG
        const topPosition = (getY(p) / SVG_H) * 100;
        const isHovered = hoveredPoint?.id === p.id;

        return (
          <div
            key={p.id}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.xPercent}%`, top: `${topPosition}%` }}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Indikator Titik (Selalu bulat sempurna karena HTML) */}
            <div className="relative">
              {/* Ripple Effect saat Hover */}
              {isHovered && <div className="absolute inset-0 rounded-full bg-[#EC5B13] animate-ping opacity-30 scale-150" />}
              
              <div 
                className={`w-3.5 h-3.5 bg-white dark:bg-slate-900 border-2 border-[#EC5B13] rounded-full shadow-md cursor-pointer transition-all duration-300 relative z-10 ${isHovered ? 'scale-[1.6] border-[3px]' : 'hover:scale-125'}`}
              />
            </div>

            {/* Kotak Informasi (Tooltip) */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-3 pointer-events-none z-50 min-w-[120px] animate-fade-in">
                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-2 px-3 shadow-xl shadow-slate-900/10 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Total Value</span>
                  <span className="text-sm font-black whitespace-nowrap">Rp {p.val.toLocaleString("id-ID")}</span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600 whitespace-nowrap mt-1">{p.dateStr}</span>
                  
                  {/* Segitiga panah ke bawah */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900 dark:border-t-white" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sell Token Modal ──────────────────────────────────────────────────────────
function SellModal({ investment, onClose, onSuccess }) {
  const [tokenAmount,   setTokenAmount]   = useState("");
  const [pricePerToken, setPricePerToken] = useState(investment.property?.tokenPrice ?? 100000);
  const [submitting,    setSubmitting]    = useState(false);

  const maxTokens   = investment.tokenAmount ?? 0;
  const totalPrice  = (parseInt(tokenAmount) || 0) * (parseFloat(pricePerToken) || 0);

  const handleSubmit = async () => {
    const qty   = parseInt(tokenAmount);
    const price = parseFloat(pricePerToken);

    if (!qty || qty <= 0)           { Swal.fire({ icon:"warning", title:"Masukkan jumlah token", confirmButtonColor:"#EC5B13" }); return; }
    if (qty > maxTokens)            { Swal.fire({ icon:"warning", title:`Maksimal ${maxTokens} token`, confirmButtonColor:"#EC5B13" }); return; }
    if (!price || price <= 0)       { Swal.fire({ icon:"warning", title:"Masukkan harga per token", confirmButtonColor:"#EC5B13" }); return; }

    const ok = await Swal.fire({
      icon:"question", title:"Konfirmasi Jual Token",
      html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.5">
        🏠 <b>${investment.property?.title}</b><br/>
        🪙 Token dijual: <b>${qty.toLocaleString()} PROP</b><br/>
        💰 Harga/token: <b>Rp ${price.toLocaleString("id-ID")}</b><br/>
        💵 Total: <b style="color:#EC5B13">Rp ${totalPrice.toLocaleString("id-ID")}</b><br/><br/>
        <div style="background:#fef9f6;padding:10px;border-radius:8px;border:1px solid #fed7aa;font-size:11px;color:#9a3412">
          ⚠️ Token akan tampil di Secondary Market dan bisa dibeli investor lain.
        </div>
      </div>`,
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Jual Token!", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;

    setSubmitting(true);
    try {
      await api.post("/listings", {
        propertyId:   investment.propertyId,
        tokenAmount:  qty,
        pricePerToken:price,
      });
      await Swal.fire({ icon:"success", title:"Token Berhasil Dilisting! 🎉",
        html:`<div style="font-size:13px;color:#64748b">${qty} token ${investment.property?.title} kini tampil di Secondary Market.</div>`,
        confirmButtonColor:"#EC5B13", timer:2500, showConfirmButton:false,
      });
      onSuccess();
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal", text:err.response?.data?.message ?? "Coba lagi.", confirmButtonColor:"#EC5B13" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jual Token</h3>
            <p className="text-xs text-slate-500 mt-0.5">{investment.property?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Available tokens */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
            <span className="text-sm text-slate-500">Token yang kamu miliki</span>
            <span className="font-bold text-slate-900 dark:text-white">{maxTokens.toLocaleString()} PROP</span>
          </div>

          {/* Token amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Jumlah Token yang Dijual</label>
            <input
              type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)}
              min="1" max={maxTokens} placeholder={`Maks ${maxTokens}`}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-lg font-bold"
            />
            {/* Quick select */}
            <div className="flex gap-2 mt-2">
              {[25,50,75,100].map(pct => (
                <button key={pct} onClick={() => setTokenAmount(Math.floor(maxTokens * pct/100).toString())}
                  className="flex-1 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#EC5B13] hover:text-[#EC5B13] transition-colors text-slate-500"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Price per token */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Harga per Token (Rp)</label>
            <input
              type="number" value={pricePerToken} onChange={e => setPricePerToken(e.target.value)}
              min="1" placeholder="Harga jual per token"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white text-lg font-bold"
            />
            <p className="text-xs text-slate-400 mt-1">
              Harga pasar: Rp {(investment.property?.tokenPrice ?? 0).toLocaleString("id-ID")} / token
            </p>
          </div>

          {/* Summary */}
          <div className="p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Estimasi pendapatan</span>
              <span className="font-black text-[#EC5B13] text-lg">Rp {totalPrice.toLocaleString("id-ID")}</span>
            </div>
            <p className="text-xs text-slate-400">Setelah listing, investor lain bisa membeli token kamu kapan saja.</p>
          </div>

          <button
            onClick={handleSubmit} disabled={submitting}
            className="w-full py-4 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#d44e0f] shadow-lg shadow-[#EC5B13]/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting
              ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Memproses...</>
              : <><span className="material-symbols-outlined text-[18px]">sell</span>List for Sale</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PortfolioInvestor() {
  const navigate = useNavigate();
  const [loading,     setLoading]     = useState(true);
  const [investments, setInvestments] = useState([]);
  const [dividends,   setDividends]   = useState([]);
  const [myListings,  setMyListings]  = useState([]);
  const [user,        setUser]        = useState(null);
  const [claiming,    setClaiming]    = useState(false);
  const [period,      setPeriod]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("assets");  // assets | secondary
  const [sellModal,   setSellModal]   = useState(null);      // investment object

  // ── Pagination State: My Assets ──
  const [assetsPage,          setAssetsPage]          = useState(1);
  const [assetsItemsPerPage,  setAssetsItemsPerPage]  = useState(5);

  // ── Pagination State: Secondary Market ──
  const [secondaryPage,         setSecondaryPage]         = useState(1);
  const [secondaryItemsPerPage, setSecondaryItemsPerPage] = useState(5);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [portfolioRes, dividendRes, listingsRes] = await Promise.allSettled([
        api.get("/investments/my-portfolio"),
        api.get("/dividends/history"),
        api.get("/listings/my"),
      ]);
      if (portfolioRes.status === "fulfilled") {
        const raw = portfolioRes.value.data?.data;
        setInvestments(Array.isArray(raw) ? raw : Array.isArray(raw?.investments) ? raw.investments : []);
      }
      if (dividendRes.status === "fulfilled") {
        const raw = dividendRes.value.data?.data;
        setDividends(Array.isArray(raw) ? raw : []);
      }
      if (listingsRes.status === "fulfilled") {
        setMyListings(listingsRes.value.data?.data ?? []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset ke halaman 1 saat ganti tab
  useEffect(() => {
    setAssetsPage(1);
    setSecondaryPage(1);
  }, [activeTab]);

  const inv  = Array.isArray(investments) ? investments : [];
  const divs = Array.isArray(dividends)   ? dividends   : [];

  const totalPortfolioValue = inv.reduce((s,i) => s + (i.tokenAmount??0)*(i.property?.tokenPrice??0), 0);
  const totalInvested       = inv.reduce((s,i) => s + (i.totalPaid??0), 0);
  const overallROI          = totalInvested > 0 ? (((totalPortfolioValue-totalInvested)/totalInvested)*100).toFixed(1) : "0.0";
  const totalDividendsClaimed = divs.filter(d=>d.status==="CLAIMED").reduce((s,d)=>s+(d.amount??0),0);
  const claimableDivs  = divs.filter(d=>d.status==="PENDING");
  const totalClaimable = claimableDivs.reduce((s,d)=>s+(d.amount??0),0);

  const filteredInv = useMemo(() => {
    if (period === "all") return inv;
    const cutoff = new Date();
    if (period==="1m") cutoff.setMonth(cutoff.getMonth()-1);
    if (period==="6m") cutoff.setMonth(cutoff.getMonth()-6);
    if (period==="1y") cutoff.setFullYear(cutoff.getFullYear()-1);
    return inv.filter(i => new Date(i.createdAt) >= cutoff);
  }, [inv, period]);

  const getROI = (i) => {
    const cur = (i.tokenAmount??0)*(i.property?.tokenPrice??0);
    if (!i.totalPaid || i.totalPaid===0) return 0;
    return ((cur-i.totalPaid)/i.totalPaid)*100;
  };

  // Token yang sudah di-listing (lock)
  const listedTokensByProperty = myListings.reduce((acc, l) => {
    if (l.status === "OPEN") acc[l.propertyId] = (acc[l.propertyId] ?? 0) + l.tokenAmount;
    return acc;
  }, {});

  // ── Pagination: My Assets ──────────────────────────────────────────────────
  const assetsTotalPages = Math.max(1, Math.ceil(inv.length / assetsItemsPerPage));
  const pagedInv = useMemo(() => {
    const start = (assetsPage - 1) * assetsItemsPerPage;
    return inv.slice(start, start + assetsItemsPerPage);
  }, [inv, assetsPage, assetsItemsPerPage]);

  // ── Pagination: Secondary Market ──────────────────────────────────────────
  const openListings = myListings.filter(l => l.status === "OPEN");
  const secondaryTotalPages = Math.max(1, Math.ceil(myListings.length / secondaryItemsPerPage));
  const pagedListings = useMemo(() => {
    const start = (secondaryPage - 1) * secondaryItemsPerPage;
    return myListings.slice(start, start + secondaryItemsPerPage);
  }, [myListings, secondaryPage, secondaryItemsPerPage]);

  const handleCancelListing = async (listingId) => {
    const ok = await Swal.fire({
      icon:"warning", title:"Batalkan Listing?",
      text:"Token akan kembali ke portfolio kamu.",
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Batalkan", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;
    try {
      await api.patch(`/listings/${listingId}/cancel`);
      setMyListings(prev => prev.map(l => l.id===listingId ? {...l, status:"CANCELLED"} : l));
      Swal.fire({ icon:"success", title:"Listing Dibatalkan", timer:1500, showConfirmButton:false });
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal", text:err.response?.data?.message, confirmButtonColor:"#EC5B13" });
    }
  };

  const handleClaimAll = async () => {
    if (!claimableDivs.length) return;
    const ok = await Swal.fire({
      icon:"question", title:"Claim Semua Dividend?",
      html:`Total: <b style="color:#EC5B13">Rp ${totalClaimable.toLocaleString("id-ID")}</b> dari ${claimableDivs.length} properti`,
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Claim Sekarang", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;
    setClaiming(true);
    Swal.fire({ title:"Memproses...", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    try {
      const ids = claimableDivs.map((d) => d.id);
      await api.post("/dividends/claim-all", { ids });
      await fetchAll();
      Swal.fire({ icon:"success", title:"Dividend Berhasil Diklaim!", html:`Rp ${totalClaimable.toLocaleString("id-ID")} masuk ke wallet kamu.`, confirmButtonColor:"#EC5B13", timer:2000, showConfirmButton:false });
    } catch { Swal.fire({ icon:"error", title:"Gagal Claim", confirmButtonColor:"#EC5B13" }); }
    finally { setClaiming(false); }
  };

  return (
    <div className="flex h-screen bg-[#f8f6f6] dark:bg-[#221610] overflow-hidden">
      <InvestorSidebar activeLabel="Portfolio" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <InvestorHeader search={search} onSearch={setSearch} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">

            {/* ── Metrics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {loading ? [...Array(4)].map((_,i) => <Skeleton key={i} className="h-32" />) : (
                <>
                  {[
                    { label:"Total Portfolio Value", value:`Rp ${totalPortfolioValue.toLocaleString("id-ID")}`, sub:`${parseFloat(overallROI)>=0?"+":""}${overallROI}%`, subColor:parseFloat(overallROI)>=0?"text-green-500":"text-red-500", icon:"trending_up" },
                    { label:"Overall ROI", value:`${parseFloat(overallROI)>=0?"+":""}${overallROI}%`, sub:"Annualized yield", subColor:"text-slate-400", icon:null },
                    { label:"Total Dividends Claimed", value:`Rp ${totalDividendsClaimed.toLocaleString("id-ID")}`, sub:"Since inception", subColor:"text-slate-400", icon:null },
                  ].map(m => (
                    <div key={m.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-500">{m.label}</p>
                      <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white truncate">{m.value}</h3>
                      {m.icon
                        ? <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${m.subColor}`}><span className="material-symbols-outlined text-sm">{m.icon}</span>{m.sub}</div>
                        : <p className={`text-xs mt-2 ${m.subColor}`}>{m.sub}</p>}
                    </div>
                  ))}

                  {/* Claim card */}
                  <div className="bg-[#EC5B13] p-6 rounded-xl text-white shadow-lg shadow-[#EC5B13]/20 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">Dividends to Claim</p>
                      <h3 className="text-2xl font-bold mt-1">Rp {totalClaimable.toLocaleString("id-ID")}</h3>
                      <p className="text-xs text-white/70 mt-1">{claimableDivs.length} dividend tersedia</p>
                    </div>
                    <button onClick={handleClaimAll} disabled={!claimableDivs.length || claiming}
                      className="w-full mt-4 py-2 bg-white text-[#EC5B13] font-bold rounded-lg text-sm hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      {claiming ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Processing...</> : claimableDivs.length > 0 ? "Claim Rewards" : "No Rewards"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Portfolio Growth</h4>
                  <select value={period} onChange={e => setPeriod(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-semibold py-1.5 pl-3 pr-8 focus:ring-[#EC5B13] outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {[["1m","Last 1 Month"],["6m","Last 6 Months"],["1y","Last 1 Year"],["all","All Time"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                    {loading ? <Skeleton className="h-64" /> : <GrowthChart investments={filteredInv} />}
                    <div className="flex justify-between mt-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2">
                    {filteredInv.slice(0,6).map((inv,i) => <span key={i}>{new Date(inv.createdAt).toLocaleString("id-ID",{month:"short"})}</span>)}
                    {!filteredInv.length && <span className="w-full text-center">Tidak ada data</span>}
                    </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Asset Allocation</h4>
                {loading ? <div className="flex flex-col items-center gap-4"><Skeleton className="w-40 h-40 rounded-full" /><Skeleton className="h-4 w-full" /></div> : <DonutChart investments={inv} />}
              </div>
            </div>

            {/* ── Asset Table + Secondary Market ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => setActiveTab("assets")}
                  className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==="assets" ? "border-[#EC5B13] text-[#EC5B13]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  My Assets
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{inv.length}</span>
                </button>
                <button onClick={() => setActiveTab("secondary")}
                  className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==="secondary" ? "border-[#EC5B13] text-[#EC5B13]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  Secondary Market
                  {openListings.length > 0 && (
                    <span className="bg-[#EC5B13] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openListings.length}</span>
                  )}
                </button>
              </div>

              {/* ── Tab: My Assets ── */}
              {activeTab === "assets" && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          {["Property Name","Tokens Held","Terlisting","Purchase Price","Current Value","Performance","Action"].map(h => (
                            <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? [...Array(assetsItemsPerPage)].map((_,i) => (
                          <tr key={i}>{[...Array(7)].map((__,j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}</tr>
                        )) : pagedInv.length > 0 ? pagedInv.map(investment => {
                          const currentVal  = (investment.tokenAmount??0)*(investment.property?.tokenPrice??0);
                          const roi         = getROI(investment);
                          const thumbnail   = investment.property?.images?.[0]?.url ?? null;
                          const isPositive  = roi >= 0;
                          const listedQty   = listedTokensByProperty[investment.propertyId] ?? 0;
                          const availTokens = (investment.tokenAmount??0) - listedQty;
                          const hasListing  = listedQty > 0;

                          return (
                            <tr key={investment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                                    {thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-slate-400 text-sm">home_work</span></div>}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{investment.property?.title ?? "—"}</p>
                                    <p className="text-xs text-slate-400">{investment.property?.location ?? "—"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {(investment.tokenAmount??0).toLocaleString()} PROP
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {hasListing ? (
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-xs font-bold rounded-full">
                                    {listedQty.toLocaleString()} listed
                                  </span>
                                ) : <span className="text-slate-400 text-xs">—</span>}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Rp {(investment.totalPaid??0).toLocaleString("id-ID")}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">Rp {currentVal.toLocaleString("id-ID")}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${isPositive ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                                  {isPositive?"+":""}{roi.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSellModal(investment)}
                                    disabled={availTokens <= 0}
                                    title={availTokens <= 0 ? "Semua token sudah di-listing" : "Jual token ke pasar sekunder"}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EC5B13] text-white text-xs font-bold rounded-lg hover:bg-[#d44e0f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">sell</span>
                                    Sell
                                  </button>
                                  <button onClick={() => navigate(`/investor/property/${investment.propertyId}`)}
                                    className="p-1.5 text-slate-400 hover:text-[#EC5B13] transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-16 text-center">
                              <span className="material-symbols-outlined text-5xl text-slate-300">pie_chart</span>
                              <p className="text-slate-400 text-sm mt-3 font-medium">Belum ada aset dalam portfolio</p>
                              <button onClick={() => navigate("/investor/marketplace")}
                                className="mt-4 px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-[#d44e0f] transition-colors"
                              >
                                Mulai Investasi di Marketplace
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination: My Assets ── */}
                  {!loading && inv.length > 0 && (
                    <Pagination
                      currentPage={assetsPage}
                      totalPages={assetsTotalPages}
                      onPageChange={setAssetsPage}
                      totalItems={inv.length}
                      itemsPerPage={assetsItemsPerPage}
                      onItemsPerPageChange={(n) => { setAssetsItemsPerPage(n); setAssetsPage(1); }}
                    />
                  )}
                </div>
              )}

              {/* ── Tab: Secondary Market (My Listings) ── */}
              {activeTab === "secondary" && (
                <div>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Listing Aktifku</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Token yang kamu jual di pasar sekunder</p>
                    </div>
                    <button
                      onClick={() => navigate("/investor/marketplace?tab=secondary")}
                      className="text-sm text-[#EC5B13] font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">storefront</span>
                      Lihat Semua Pasar Sekunder
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="py-16 text-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300">swap_horiz</span>
                      <p className="text-slate-400 text-sm mt-3 font-medium">Belum ada listing aktif</p>
                      <p className="text-slate-400 text-xs mt-1">Klik tombol "Sell" pada aset kamu untuk mulai berjualan</p>
                      <button onClick={() => setActiveTab("assets")}
                        className="mt-4 px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-[#d44e0f] transition-colors"
                      >
                        Lihat Aset Saya
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pagedListings.map(listing => (
                          <div key={listing.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                listing.status==="OPEN"      ? "bg-[#EC5B13]/10 text-[#EC5B13]" :
                                listing.status==="SOLD"      ? "bg-green-100 text-green-600" :
                                "bg-slate-100 text-slate-400"
                              }`}>
                                <span className="material-symbols-outlined text-[20px]">
                                  {listing.status==="OPEN" ? "sell" : listing.status==="SOLD" ? "check_circle" : "cancel"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{listing.property?.title ?? "—"}</p>
                                <p className="text-xs text-slate-500">
                                  {listing.tokenAmount.toLocaleString()} token @ Rp {listing.pricePerToken.toLocaleString("id-ID")}/token
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(listing.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {listing.totalPrice.toLocaleString("id-ID")}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  listing.status==="OPEN"   ? "bg-[#EC5B13]/10 text-[#EC5B13]" :
                                  listing.status==="SOLD"   ? "bg-green-100 text-green-700" :
                                  "bg-slate-100 text-slate-500"
                                }`}>
                                  {listing.status}
                                </span>
                              </div>
                              {listing.status === "OPEN" && (
                                <button onClick={() => handleCancelListing(listing.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Batalkan listing"
                                >
                                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Pagination: Secondary Market ── */}
                      <Pagination
                        currentPage={secondaryPage}
                        totalPages={secondaryTotalPages}
                        onPageChange={setSecondaryPage}
                        totalItems={myListings.length}
                        itemsPerPage={secondaryItemsPerPage}
                        onItemsPerPageChange={(n) => { setSecondaryItemsPerPage(n); setSecondaryPage(1); }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Dividend History ── */}
            {divs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Dividend History</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {divs.slice(0,5).map(d => (
                    <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${d.status==="CLAIMED" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                          <span className="material-symbols-outlined text-[18px]">{d.status==="CLAIMED" ? "check_circle" : "schedule"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{d.property?.title ?? "Properti"}</p>
                          <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {(d.amount??0).toLocaleString("id-ID")}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status==="CLAIMED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-12" />
        </div>
      </main>

      {/* Sell Modal */}
      {sellModal && (
        <SellModal
          investment={sellModal}
          onClose={() => setSellModal(null)}
          onSuccess={() => { setSellModal(null); fetchAll(); setActiveTab("secondary"); }}
        />
      )}
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader  from "../../components/InvestorHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";

// --- IMPORT UNTUK WEB3 ---
import { getSigner } from "../../utils/contracts"; 
import { ethers } from "ethers";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />;
}

// ── Tenant Rating Badge ────────────────────────────────────────────────────────
function TenantRatingBadge({ rating, count, isLoading }) {
  if (isLoading) {
    return (
      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 animate-pulse">
        <span className="material-symbols-outlined text-white/60"
          style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}>star</span>
        <span className="text-white/50 font-bold" style={{ fontSize: "16px" }}>—</span>
      </div>
    );
  }

  if (!rating || rating === 0 || !count || count === 0) return null;

  const reviewLabel = count === 1 ? "ulasan" : "ulasan";

  return (
    <div
      className="absolute bottom-4 left-4 flex items-center gap-1.5"
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}
    >
      <span
        className="material-symbols-outlined text-white"
        style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
      >
        star
      </span>
      <span className="text-white font-bold leading-none" style={{ fontSize: "17px" }}>
        {Number(rating).toFixed(1)}
      </span>
      <span className="text-white/75 font-normal leading-none" style={{ fontSize: "13px" }}>
        ({count} {reviewLabel})
      </span>
    </div>
  );
}

// ─── Primary Market Card ────────────────────────────────────────────────────────
function PropertyCard({ property, onInvest, investingId, isFavorite, onToggleFavorite, onViewDetail, ratingData, isLoadingRating }) {
  const fundedPct   = property.fundingTarget > 0
    ? Math.min(Math.round((property.currentFunding / property.fundingTarget) * 100), 100) : 0;
  const thumbnail   = property.images?.find(img => img?.url)?.url ?? null;
  const isFeatured  = fundedPct >= 80;
  const isNew       = fundedPct < 20 && !isFeatured;
  const isInvesting = investingId === property.id;
  const roi         = property.estimatedRoi ?? property.roi ?? null;

  return (
    <div
      onClick={() => onViewDetail(property.id)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col cursor-pointer"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {isFeatured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-[#EC5B13] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">Featured</span>
          </div>
        )}
        {isNew && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">New Release</span>
          </div>
        )}

        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(property.id); }}
            className={`size-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm ${
              isFavorite ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white hover:text-red-500"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
        </div>

        {thumbnail
          ? <img src={thumbnail} alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={e => { e.target.style.display = "none"; }} />
          : <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-white/60">home_work</span>
            </div>
        }

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

        {(!ratingData || ratingData.count === 0) && !isLoadingRating && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span className="text-sm font-bold">{property.investments?.length ?? 0}</span>
            <span className="text-[10px] opacity-70">investor</span>
          </div>
        )}

        <TenantRatingBadge
          rating={ratingData?.avg}
          count={ratingData?.count}
          isLoading={isLoadingRating}
        />

        {property.status === "FUNDED" && (
          <div className="absolute bottom-4 right-4">
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">FULLY FUNDED</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#EC5B13] transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="text-right shrink-0 ml-2">
            <p className={`font-black text-lg leading-none ${roi ? "text-[#EC5B13]" : "text-slate-300"}`}>
              {roi ? `${roi}%` : "—"}
            </p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Annual ROI</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-sm mb-1">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
          <span className="material-symbols-outlined text-[14px]">category</span>
          <span>{property.category ?? "Properti"}</span>
        </div>

        <div className="space-y-4 mt-auto">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
              <span className="text-slate-400">Funding Progress</span>
              <span className="text-[#EC5B13]">{fundedPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-[#EC5B13] h-2 rounded-full transition-all duration-700" style={{ width: `${fundedPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Rp {(property.currentFunding ?? 0).toLocaleString("id-ID")} terkumpul</span>
              <span>Target Rp {(property.fundingTarget ?? 0).toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Token Price</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Rp {property.tokenPrice?.toLocaleString("id-ID")}
              </p>
            </div>
            {property.status === "FUNDED"
              ? <span className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-black">Fully Funded</span>
              : <button
                  onClick={e => { e.stopPropagation(); onInvest(property); }}
                  disabled={isInvesting}
                  className="bg-[#EC5B13] hover:bg-[#d44e0f] text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-[#EC5B13]/20 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
                >
                  {isInvesting
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Processing...</>
                    : <><span className="material-symbols-outlined text-[16px]">arrow_forward</span>Lihat Detail</>}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Secondary Market Card ──────────────────────────────────────────────────────
function SecondaryListingCard({ listing, onBuy, buyingId, currentUserId, onViewDetail, ratingData, isLoadingRating }) {
  const isBuying     = buyingId === listing.id;
  const property     = listing.property  ?? {};
  const seller       = listing.seller    ?? {};
  const thumbnail    = property.images?.find(img => img?.url)?.url ?? null;
  const roi          = property.estimatedRoi ?? property.roi ?? null;
  const isOwnListing = currentUserId === (listing.sellerId ?? seller.id);
  const totalPrice   = (listing.tokenAmount ?? 0) * (listing.pricePerToken ?? 0);

  return (
    <div
      onClick={() => onViewDetail?.(listing.propertyId || listing.property?.id)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col cursor-pointer"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-[#EC5B13] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">sync_alt</span>Resale
          </span>
        </div>

        {thumbnail
          ? <img src={thumbnail} alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={e => { e.target.style.display = "none"; }} />
          : <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-white/60">home_work</span>
            </div>
        }

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

        <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-slate-400 flex items-center justify-center border-2 border-white/20 overflow-hidden">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-300 uppercase font-bold leading-none">Penjual</p>
              <p className="text-sm font-bold line-clamp-1">{seller.fullName ?? "Investor"}</p>
            </div>
          </div>
        </div>

        <TenantRatingBadge
          rating={ratingData?.avg}
          count={ratingData?.count}
          isLoading={isLoadingRating}
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#EC5B13] transition-colors line-clamp-1">
              {property.title ?? "Nama Properti"}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span className="truncate">{property.location ?? "—"}</span>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <p className={`font-black text-sm leading-none ${roi ? "text-[#EC5B13]" : "text-slate-400"}`}>
              {roi ? `${roi}%` : "—"}
            </p>
            <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">ROI/Thn</p>
          </div>
        </div>

        <div className="mt-auto bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center mb-2 border-b border-orange-100 dark:border-orange-800/30 pb-2">
            <span className="text-xs text-slate-500 font-medium">Jumlah Token</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{listing.tokenAmount?.toLocaleString()} PROP</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Harga / Token</span>
            <span className="text-sm font-bold text-[#EC5B13]">Rp {listing.pricePerToken?.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Total Harga</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Rp {totalPrice.toLocaleString("id-ID")}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onBuy(listing); }}
            disabled={isBuying || isOwnListing}
            className={`font-bold py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 ${
              isOwnListing
                ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                : "bg-[#EC5B13] hover:bg-orange-700 text-white shadow-orange-600/20 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            }`}
          >
            {isOwnListing ? <><span className="material-symbols-outlined text-[16px]">lock</span>Milik Anda</>
            : isBuying    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Proses...</>
            : <><span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>Beli</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketplaceInvestor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab,       setActiveTab]       = useState(searchParams.get("tab") === "secondary" ? "secondary" : "primary");
  const [properties,      setProperties]      = useState([]);
  const [listings,        setListings]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingRatings,  setLoadingRatings]  = useState(false);
  const [propertyRatings, setPropertyRatings] = useState({});
  const [search,          setSearch]          = useState("");
  const [sortRoi,         setSortRoi]         = useState("newest");
  const [sortSecondary,   setSortSecondary]   = useState("newest");
  const [filterStatus,    setFilterStatus]    = useState("ALL");
  const [investingId,     setInvestingId]     = useState(null);
  const [buyingId,        setBuyingId]        = useState(null);
  const [favorites,       setFavorites]       = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("prop_favorites") ?? "[]")); }
    catch { return new Set(); }
  });
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [user,        setUser]        = useState(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
  }, []);

  // ─── Fetch properties + listings ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [propsRes, listingsRes] = await Promise.allSettled([
          api.get("/properties/marketplace/investor"),
          api.get("/listings"),
        ]);

        let uniqueProps = [];
        if (propsRes.status === "fulfilled") {
          const raw  = propsRes.value.data?.data ?? [];
          const seen = new Set();
          uniqueProps = raw.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return p.status === "ACTIVE";
          });
          setProperties(uniqueProps);
          console.log("Sample property:", uniqueProps[0]);
        }
        if (listingsRes.status === "fulfilled") {
          setListings(listingsRes.value.data?.data ?? []);
        }

        if (uniqueProps.length > 0) {
          fetchRatings(uniqueProps);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fetchRatings = async (props) => {
    if (!props || props.length === 0) return;
    setLoadingRatings(true);
    try {
      const results = await Promise.allSettled(
        props.map(p =>
          api.get(`/reviews/property/${p.id}`)
            .then(res => ({ propertyId: p.id, reviews: res.data?.data ?? [] }))
            .catch(() => ({ propertyId: p.id, reviews: [] }))
        )
      );

      const ratingsMap = {};
      results.forEach(result => {
        if (result.status !== "fulfilled") return;
        const { propertyId, reviews } = result.value;

        if (!Array.isArray(reviews) || reviews.length === 0) {
          ratingsMap[propertyId] = { avg: 0, count: 0 };
          return;
        }

        const valid = reviews.filter(r => typeof r.avgRating === "number");
        if (valid.length === 0) {
          ratingsMap[propertyId] = { avg: 0, count: 0 };
          return;
        }

        const total = valid.reduce((sum, r) => sum + r.avgRating, 0);
        ratingsMap[propertyId] = {
          avg:   Math.round((total / valid.length) * 10) / 10,
          count: valid.length,
        };
      });

      setPropertyRatings(ratingsMap);
    } catch (err) {
      console.warn("Gagal fetch tenant ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  };

  const filteredPrimary = useMemo(() => {
    let list = [...properties];
    if (filterStatus !== "ALL") list = list.filter(p => p.status === filterStatus);
    if (showFavOnly)             list = list.filter(p => favorites.has(p.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (sortRoi === "high_to_low")  list.sort((a, b) => (b.estimatedRoi ?? 0) - (a.estimatedRoi ?? 0));
    if (sortRoi === "low_to_high")  list.sort((a, b) => (a.estimatedRoi ?? 0) - (b.estimatedRoi ?? 0));
    if (sortRoi === "funding_high") list.sort((a, b) => {
      const pa = a.fundingTarget > 0 ? a.currentFunding / a.fundingTarget : 0;
      const pb = b.fundingTarget > 0 ? b.currentFunding / b.fundingTarget : 0;
      return pb - pa;
    });
    if (sortRoi === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [properties, search, sortRoi, filterStatus, showFavOnly, favorites]);

  const filteredSecondary = useMemo(() => {
    let list = [...listings];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.property?.title?.toLowerCase().includes(q) ||
        l.property?.location?.toLowerCase().includes(q) ||
        l.seller?.fullName?.toLowerCase().includes(q)
      );
    }
    if (sortSecondary === "price_low")  list.sort((a, b) => (a.pricePerToken ?? 0) - (b.pricePerToken ?? 0));
    if (sortSecondary === "price_high") list.sort((a, b) => (b.pricePerToken ?? 0) - (a.pricePerToken ?? 0));
    if (sortSecondary === "newest")     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [listings, search, sortSecondary]);

  const handleToggleFavorite = (propertyId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(propertyId) ? next.delete(propertyId) : next.add(propertyId);
      localStorage.setItem("prop_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const handleInvest = (property) => {
    navigate(`/investor/property/${property.id}`);
  };

  // ─── FUNGSI HANDLE BUY (REVISI WEB3) ──────────────────────────────────────────
  const handleBuy = async (listing) => {
    const totalPrice = (listing.tokenAmount ?? 0) * (listing.pricePerToken ?? 0);
    
    const ok = await Swal.fire({
      icon: "question", title: "Konfirmasi Pembelian",
      html: `<div style="text-align:left;font-size:14px;color:#64748b;line-height:2.2;margin-top:10px">
        🏠 <b>${listing.property?.title ?? "Properti"}</b><br/>
        👤 Penjual: <b>${listing.seller?.fullName ?? "Investor"}</b><br/>
        🪙 Token: <b>${listing.tokenAmount?.toLocaleString()} PROP</b><br/>
        💰 Harga/token: <b>Rp ${listing.pricePerToken?.toLocaleString("id-ID")}</b><br/>
        <hr style="margin:12px 0;border-color:#e2e8f0"/>
        <b>Total: <span style="color:#EC5B13;font-size:18px">Rp ${totalPrice.toLocaleString("id-ID")}</span></b>
      </div>`,
      showCancelButton: true, confirmButtonColor: "#EC5B13", cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Beli Sekarang", cancelButtonText: "Batal",
    });

    if (!ok.isConfirmed) return;

    // Tampilkan loading Swall
    Swal.fire({ 
      title: "Memproses Transaksi...", 
      html: "Hubungkan ke MetaMask & Mengirim Dana...", 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    setBuyingId(listing.id);

    try {
      // 1. Ambil Signer (MetaMask)
      const signer = await getSigner();
      
      // 2. Simulasi/Eksekusi Transfer ETH (Simulasi saldo terpotong)
      // Catatan: Anda bisa menyesuaikan jumlah ETH yang dikirim sesuai kurs Anda
      // Untuk simulasi, kita kirim jumlah kecil atau sesuai kebutuhan Smart Contract
      const tx = await signer.sendTransaction({
        to: listing.seller.walletAddress || "0x0000000000000000000000000000000000000000",
        value: ethers.parseEther("0.0001") // Simulasi biaya transaksi dalam ETH Sepolia
      });

      console.log("Menunggu Blockchain...", tx.hash);
      
      // 3. Tunggu transaksi masuk block
      const receipt = await tx.wait();

      // 4. Kirim txHash ke Backend (SECURITY GATE LOLOS!)
      await api.post(`/listings/${listing.id}/buy`, { 
        txHash: receipt.hash,
        totalPaid: totalPrice 
      });

      setListings(prev => prev.filter(l => l.id !== listing.id));
      
      await Swal.fire({
        icon: "success", title: "Pembelian Sukses! 🎉",
        text: `Token ${listing.property?.title} berhasil dipindahkan ke portfolio Anda.`,
        confirmButtonColor: "#EC5B13",
      });
      
      navigate("/investor/portfolio");
    } catch (err) {
      console.error("Buy Error:", err);
      Swal.fire({ 
        icon: "error", 
        title: "Transaksi Gagal", 
        text: err.response?.data?.message || err.message || "Pastikan MetaMask terhubung dan saldo cukup.", 
        confirmButtonColor: "#EC5B13" 
      });
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <InvestorSidebar activeLabel="Marketplace" />

      <main className="flex-1">
        <InvestorHeader search={search} onSearch={setSearch} />

        <div className="p-8 max-w-7xl mx-auto">
          {/* Tab Bar dkk... */}
          <div className="flex items-center gap-1 mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-sm w-fit">
            {[
              { id: "primary",   label: "Primary Market",   icon: "storefront", count: properties.length },
              { id: "secondary", label: "Secondary Market", icon: "sync_alt",   count: listings.length   },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#EC5B13] text-white shadow-md shadow-[#EC5B13]/20"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══ PRIMARY MARKET ══ */}
          {activeTab === "primary" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Listings</h2>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    {loading ? "Memuat..." : `${filteredPrimary.length} properti ditemukan`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sorting & Filter dkk... */}
                  <button onClick={() => setShowFavOnly(v => !v)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${
                      showFavOnly
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-red-400 hover:text-red-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: showFavOnly ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    {showFavOnly ? "Semua" : `Favorit (${favorites.size})`}
                  </button>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase mr-3">Status</span>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="bg-transparent border-none text-sm font-semibold p-0 focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200 outline-none">
                      <option value="ALL">Semua</option>
                      <option value="ACTIVE">Active</option>
                      <option value="FUNDED">Funded</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading
                  ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-[500px]" />)
                  : filteredPrimary.length > 0
                  ? filteredPrimary.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onInvest={handleInvest}
                      investingId={investingId}
                      isFavorite={favorites.has(p.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onViewDetail={id => navigate(`/investor/property/${id}`)}
                      ratingData={propertyRatings[p.id] ?? null}
                      isLoadingRating={loadingRatings}
                    />
                  ))
                  : (
                    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-[#EC5B13]/40">storefront</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Belum Ada Properti Aktif
                      </h3>
                      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mb-1">
                        Semua properti yang tersedia sudah <span className="font-bold text-emerald-500">fully funded</span> oleh investor.
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mb-8">
                        Cek <span className="font-bold text-[#EC5B13]">Secondary Market</span> untuk membeli token resale dari investor lain.
                      </p>
                      <button
                        onClick={() => setActiveTab("secondary")}
                        className="flex items-center gap-2 bg-[#EC5B13] hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#EC5B13]/20"
                      >
                        <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                        Buka Secondary Market
                      </button>
                    </div>
                  )
                }
              </div>
            </>
          )}

          {/* ══ SECONDARY MARKET ══ */}
          {activeTab === "secondary" && (
            <>
              <div className="bg-gradient-to-r from-[#EC5B13] to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[32px]">sync_alt</span>
                    Secondary Market
                  </h1>
                  <p className="text-orange-50 max-w-lg">Beli token resale dari investor lain. Akses properti yang sudah sold out di primary market!</p>
                </div>
                <button onClick={() => navigate("/investor/portfolio")}
                  className="shrink-0 bg-white text-[#EC5B13] font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">sell</span>
                  Jual Aset Saya
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading
                  ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-[500px]" />)
                  : filteredSecondary.length > 0
                  ? filteredSecondary.map(listing => (
                      <SecondaryListingCard
                        key={listing.id} listing={listing} onBuy={handleBuy} buyingId={buyingId}
                        currentUserId={user?.id} onViewDetail={id => navigate(`/investor/property/${id}`)}
                        ratingData={propertyRatings[listing.propertyId || listing.property?.id] ?? null}
                        isLoadingRating={loadingRatings}
                      />
                    ))
                  : (
                    // ── EMPTY STATE ──
                    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-[#EC5B13]/40">sync_alt</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Belum Ada Listing di Secondary Market
                      </h3>
                      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mb-1">
                        Saat ini belum ada investor yang menjual token mereka di secondary market.
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mb-8">
                        Cek <span className="font-bold text-[#EC5B13]">Primary Market</span> untuk membeli token properti langsung dari listing aktif.
                      </p>
                      <button
                        onClick={() => setActiveTab("primary")}
                        className="flex items-center gap-2 bg-[#EC5B13] hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#EC5B13]/20"
                      >
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                        Buka Primary Market
                      </button>
                    </div>
                  )
                }
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
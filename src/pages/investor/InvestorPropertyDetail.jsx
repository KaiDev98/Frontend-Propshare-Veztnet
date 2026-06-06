import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { ethers } from "ethers";

// --- IMPORT WEB3 UTILS ---
import { getSigner, getFundingContract, ensureSepolia } from "../../utils/contracts";

import InvestorHeader from "../../components/InvestorHeader";
import InvestorSidebar from "../../components/InvestorSidebar";

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PRIMARY = "#ea580c";

// ─── Gas fee estimasi dalam IDR (setara ~$1.20 × kurs ~Rp 16.200) ────────────
const GAS_FEE_IDR = 19_440;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(value, currency = "IDR") {
  if (value == null) return "-";
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${Number(value).toLocaleString("id-ID")} ${currency}`;
}

function calcFundedPct(funded, goal) {
  if (!goal || goal === 0) return 0;
  return Math.min(100, Math.round((funded / goal) * 100));
}

function resolveMainImage(images) {
  if (!images || images.length === 0) return null;
  const first = images[0];
  return first?.url ?? first?.image_url ?? first?.path ?? (typeof first === "string" ? first : null);
}

async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const q = encodeURIComponent(address + ", Indonesia");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "Accept-Language": "id,en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function getFacilityConfig(name) {
  const lower = String(name).toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet"))
    return { label: "Wi-Fi Cepat", icon: "wifi", bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400", hover: "group-hover:bg-blue-600 group-hover:text-white" };
  if (lower.includes("ac") || lower.includes("aircon"))
    return { label: "AC", icon: "ac_unit", bg: "bg-cyan-100 dark:bg-cyan-900/30", color: "text-cyan-600 dark:text-cyan-400", hover: "group-hover:bg-cyan-600 group-hover:text-white" };
  if (lower.includes("laundry") || lower.includes("cuci"))
    return { label: "Laundry", icon: "local_laundry_service", bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-400", hover: "group-hover:bg-purple-600 group-hover:text-white" };
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("olahraga"))
    return { label: "Pusat Kebugaran", icon: "fitness_center", bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-600 dark:text-red-400", hover: "group-hover:bg-red-600 group-hover:text-white" };
  if (lower.includes("pool") || lower.includes("renang"))
    return { label: "Kolam Renang", icon: "pool", bg: "bg-sky-100 dark:bg-sky-900/30", color: "text-sky-600 dark:text-sky-400", hover: "group-hover:bg-sky-600 group-hover:text-white" };
  if (lower.includes("security") || lower.includes("cctv") || lower.includes("keamanan"))
    return { label: "Keamanan 24/7", icon: "security", bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400", hover: "group-hover:bg-emerald-600 group-hover:text-white" };
  if (lower.includes("parkir") || lower.includes("parking"))
    return { label: "Area Parkir", icon: "local_parking", bg: "bg-slate-100 dark:bg-slate-700/50", color: "text-slate-600 dark:text-slate-400", hover: "group-hover:bg-slate-600 group-hover:text-white" };
  if (lower.includes("kantin") || lower.includes("restaurant") || lower.includes("cafe") || lower.includes("dapur"))
    return { label: "Kantin / Dapur", icon: "restaurant", bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-600 dark:text-orange-400", hover: "group-hover:bg-orange-600 group-hover:text-white" };
  return { label: name, icon: "check_circle", bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400", hover: "group-hover:bg-slate-600 group-hover:text-white" };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />;
}

function ErrorState({ message, onBack }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">{message || "Properti tidak ditemukan"}</h2>
      <button onClick={onBack} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-700 transition-colors">
        Kembali
      </button>
    </div>
  );
}

function PropertyMap({ property }) {
  const [coords,    setCoords]    = useState(null);
  const [gmapQuery, setGmapQuery] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const addressLabel = property?.location ?? property?.address ?? property?.city ?? property?.title ?? "";

  useEffect(() => {
    if (!property) return;
    const resolve = async () => {
      setLoading(true);
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setCoords({ lat, lng });
        setLoading(false);
        return;
      }

      const addressStr = property.location ?? property.address ?? property.city;
      if (addressStr) {
        const geo = await geocodeAddress(addressStr);
        if (geo) {
          setCoords(geo);
          setLoading(false);
          return;
        }
        setGmapQuery(encodeURIComponent(addressStr + ", Indonesia"));
      }
      setLoading(false);
    };
    resolve();
  }, [property]);

  if (loading) return <Skeleton className="w-full h-[300px]" />;

  if (coords) {
    return (
      <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
        <MapContainer center={[coords.lat, coords.lng]} zoom={16} className="w-full h-full" scrollWheelZoom={false}>
          <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[coords.lat, coords.lng]}>
            <Popup>
              <div className="text-sm font-bold">{property?.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{addressLabel}</div>
            </Popup>
          </Marker>
        </MapContainer>
        <MapOverlay addressLabel={addressLabel} mapsHref={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} />
      </div>
    );
  }

  if (gmapQuery) {
    return (
      <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
        <iframe title="Peta Lokasi Properti" className="w-full h-full border-0" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${gmapQuery}&output=embed&hl=id`}
        />
        <MapOverlay addressLabel={addressLabel} mapsHref={`https://www.google.com/maps/search/?api=1&query=${gmapQuery}`} />
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 border border-slate-200 dark:border-slate-700">
      <span className="material-symbols-outlined text-4xl text-slate-300">location_off</span>
      <p className="text-sm text-slate-400 font-medium">Data lokasi tidak tersedia</p>
    </div>
  );
}

function MapOverlay({ addressLabel, mapsHref }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center justify-between z-[1000] shadow-sm pointer-events-none">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-orange-600 text-[16px] shrink-0">location_on</span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{addressLabel}</span>
      </div>
      <a href={mapsHref} target="_blank" rel="noreferrer" className="text-orange-600 text-xs font-bold hover:underline shrink-0 ml-2 pointer-events-auto">
        Buka Maps
      </a>
    </div>
  );
}

function StarRating({ score = 0, size = "sm" }) {
  const full  = Math.floor(score);
  const half  = score % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const cls   = `material-symbols-outlined text-${size} text-orange-500`;
  return (
    <div className="flex">
      {[...Array(full)].map((_, i)  => <span key={`f${i}`} className={cls} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
      {half                          && <span className={cls} style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>}
      {[...Array(empty)].map((_, i) => <span key={`e${i}`} className={cls} style={{ fontVariationSettings: "'FILL' 0" }}>star</span>)}
    </div>
  );
}

function ReviewCard({ review }) {
  const name    = review.tenant?.fullName || review.name || "Anonim";
  const avatar  = review.tenant?.avatar || review.avatar;
  const rating  = review.avgRating || review.rating || 5;
  const comment = review.comment || review.body || "";
  const date    = review.createdAt || review.date;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-sm">{initials}</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{name}</p>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">verified</span> Penyewa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {date ? new Date(date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
            </p>
          </div>
        </div>
        <StarRating score={rating} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{comment}</p>
    </div>
  );
}

// ─── MetaMask Icon SVG ────────────────────────────────────────────────────────
function MetaMaskIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
      <polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/>
      <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="44.4,35.5 143.1,110.1 125.6,65.8"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
      <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
      <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 140.6,230.9 111.4,208.1"/>
      <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 211.8,247.4 207.1,208.1"/>
      <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
      <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function InvestorPropertyDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [property,       setProperty]       = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [reviewMeta,     setReviewMeta]     = useState({ avg: 0, total: 0 });
  const [topHolders,     setTopHolders]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [amount,         setAmount]         = useState("");
  const [minting,        setMinting]        = useState(false);
  const [showAllRev,     setShowAllRev]     = useState(false);

  // ── MetaMask State ─────────────────────────────────────────────────────────
  const [walletAddress,  setWalletAddress]  = useState(null);
  const [isConnecting,   setIsConnecting]   = useState(false);
  const walletConnected = !!walletAddress;

  // ── Cek apakah sudah ada koneksi MetaMask sebelumnya ──────────────────────
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window.ethereum === "undefined") return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch {
        // silent
      }
    };
    checkExistingConnection();

    // Listen perubahan akun MetaMask
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
        } else {
          setWalletAddress(accounts[0]);
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  // ── Connect MetaMask ───────────────────────────────────────────────────────
  const connectMetaMask = async () => {
    // MetaMask tidak terinstal
    if (typeof window.ethereum === "undefined") {
      Swal.fire({
        icon: "warning",
        title: "MetaMask Tidak Ditemukan",
        html: `MetaMask belum terinstal di browser kamu.<br/><br/>
          <a href="https://metamask.io/download/" target="_blank" 
             style="color:#ea580c;font-weight:bold;text-decoration:underline;">
            Klik di sini untuk menginstal MetaMask →
          </a>`,
        confirmButtonColor: PRIMARY,
        confirmButtonText: "Mengerti",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        Swal.fire({
          icon: "success",
          title: "Wallet Terhubung! 🎉",
          html: `<span style="font-family:monospace;font-size:13px;word-break:break-all;">${accounts[0]}</span>`,
          confirmButtonColor: PRIMARY,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      if (err.code === 4001) {
        Swal.fire({
          icon: "info",
          title: "Koneksi Dibatalkan",
          text: "Kamu membatalkan permintaan koneksi MetaMask.",
          confirmButtonColor: PRIMARY,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menghubungkan",
          text: err?.message ?? "Terjadi kesalahan saat menghubungkan MetaMask.",
          confirmButtonColor: PRIMARY,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnectWallet = () => {
    setWalletAddress(null);
    setAmount("");
    Swal.fire({
      icon: "info",
      title: "Wallet Terputus",
      text: "Kamu telah memutus koneksi wallet dari aplikasi ini.",
      confirmButtonColor: PRIMARY,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  // ── Format alamat wallet singkat ───────────────────────────────────────────
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  // ── Fetch Property ─────────────────────────────────────────────────────────
  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); 

      const res = await api.get(`/properties/${id}`);
      const data = res.data?.data ?? res.data;
      setProperty(data);

      try {
        const revRes = await api.get(`/reviews/property/${id}`);
        const revData = revRes.data?.data ?? revRes.data;
        if (Array.isArray(revData)) {
          setReviews(revData);
          if (revData.length > 0) {
            const totalScore = revData.reduce((acc, curr) => acc + (curr.avgRating || curr.rating || 5), 0);
            setReviewMeta({ avg: totalScore / revData.length, total: revData.length });
          }
        }
      } catch (e) {
        console.warn("Gagal memuat ulasan", e);
      }

      try {
        const holdRes = await api.get(`/properties/${id}/holders`);
        const holdData = holdRes.data?.data ?? holdRes.data;
        setTopHolders(Array.isArray(holdData) ? holdData.slice(0, 3) : []);
      } catch {}

    } catch (err) {
      const msg = err?.response?.data?.message ?? "Properti tidak ditemukan atau terjadi kesalahan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  // ── Data Transform ─────────────────────────────────────────────────────────
  const currency    = "IDR";
  const tokenPrice  = Number(property?.tokenPrice    ?? 0);
  const fundGoal    = Number(property?.fundingTarget  ?? 0);
  const fundedAmt   = Number(property?.currentFunding ?? 0);
  const totalTokens = Number(property?.totalTokens   ?? 0);
  const fundedPct   = calcFundedPct(fundedAmt, fundGoal);
  const tokensSold  = tokenPrice > 0 ? Math.floor(fundedAmt / tokenPrice) : 0;
  const tokensLeft  = totalTokens - tokensSold;
  const mainImg     = resolveMainImage(property?.images);

  const PINATA_GATEWAY = "https://lavender-rainy-muskox-903.mypinata.cloud";

const rawLegalDoc = property?.ipfsLegalDoc ?? null;
const contractAddr = property?.contractAddress ?? null;

// Parse CID(s) — support format "cid1|cid2"
const legalDocs = rawLegalDoc
  ? rawLegalDoc.split("|").filter(Boolean).map((cid, i) => ({
      cid,
      url: cid.startsWith("http") ? cid : `${PINATA_GATEWAY}/ipfs/${cid}`,
      label: i === 0 ? "Sertifikat Hak Milik (SHM)" : "Izin Mendirikan Bangunan (IMB)",
      icon: i === 0 ? "verified_user" : "architecture",
    }))
  : [];

  const tokensToMint = amount && tokenPrice > 0
    ? (parseFloat(amount) / tokenPrice).toFixed(4)
    : "0.0000";

  // ── Fasilitas ──────────────────────────────────────────────────────────────
  let facilities = [];
  if (property?.facilities && Array.isArray(property.facilities)) {
    facilities = property.facilities.map(f => (typeof f === "string" ? f : f.name || f.title || ""));
  } else if (property?.rooms && Array.isArray(property.rooms)) {
    const roomFeatures = new Set();
    property.rooms.forEach(room => {
      if (Array.isArray(room.facilities)) room.facilities.forEach(f => roomFeatures.add(f));
      const roomDesc = String(room.description || "").toLowerCase();
      if (roomDesc.includes("ac")) roomFeatures.add("AC");
      if (roomDesc.includes("wifi") || roomDesc.includes("internet")) roomFeatures.add("WiFi");
      if (roomDesc.includes("km dalam") || roomDesc.includes("kamar mandi")) roomFeatures.add("Kamar Mandi Dalam");
    });
    facilities = Array.from(roomFeatures);
  }
  facilities = [...new Set(facilities.filter(Boolean))];

  // ── Action: Mint/Invest — WEB3 INTEGRATED ─────────────────────────────────
  const handleMint = async () => {
    if (!walletConnected) {
      connectMetaMask();
      return;
    }
    if (!amount || parseFloat(amount) <= 0) return;

    setMinting(true);
    try {
      // 1. Validasi & pastikan jaringan Sepolia
      await ensureSepolia();

      // 2. Setup smart contract
      const contract = await getFundingContract(true);

      // 3. Konversi: jumlah IDR → token → ETH (1 PROP token = 0.00001 ETH)
      const tokenAmount = parseFloat(amount) / (tokenPrice || 1);
      const ethToPay    = (tokenAmount * 0.00001).toFixed(6);

      // 4. Tampilkan loading swal sebelum popup MetaMask muncul
      Swal.fire({
        title: "Konfirmasi MetaMask",
        text: "Silakan setujui pembayaran di wallet Anda...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 5. Eksekusi transaksi on-chain
      const tx = await contract.invest(id, {
        value: ethers.parseEther(ethToPay),
      });

      Swal.fire({
        title: "Mining...",
        text: "Menunggu konfirmasi jaringan Sepolia...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 6. Tunggu receipt (konfirmasi block)
      const receipt = await tx.wait();

      // 7. Simpan bukti transaksi ke backend (termasuk txHash sebagai bukti sah)
      await api.post(`/properties/${id}/invest`, {
        amount:        parseFloat(amount),
        tokens:        tokenAmount,
        currency,
        txHash:        receipt.hash,   // bukti on-chain yang sah
        walletAddress,
      });

      Swal.fire({
        icon: "success",
        title: "Investasi Berhasil! 🎉",
        text: `Kamu berhasil membeli ${parseFloat(tokensToMint).toFixed(4)} token untuk properti ${property?.title}.`,
        confirmButtonColor: PRIMARY,
      });

      setAmount("");
      fetchProperty();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err?.reason ?? err?.response?.data?.message ?? "Transaksi dibatalkan atau error.",
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setMinting(false);
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">

      {/* ── Sidebar ── */}
      <InvestorSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Header ── */}
        <InvestorHeader />

        {/* ── Konten Utama ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">

            {!loading && error ? (
              <ErrorState message={error} onBack={() => navigate(-1)} />
            ) : (
              <>
                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6">
                  <button onClick={() => navigate(-1)} className="hover:text-orange-600 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">arrow_back_ios</span>
                    Marketplace
                  </button>
                  <span>/</span>
                  {loading
                    ? <Skeleton className="w-32 h-4" />
                    : <span className="text-slate-600 dark:text-slate-300">{property?.title}</span>}
                </div>

                {/* ── Hero Image ── */}
                {loading ? <Skeleton className="w-full h-[400px] rounded-3xl mb-8" /> : (
                  <div className="relative w-full h-[380px] rounded-[2rem] overflow-hidden mb-8 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />
                    {mainImg
                      ? <img src={mainImg} alt={property?.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-6xl text-slate-400">apartment</span>
                        </div>
                    }
                    <div className="absolute bottom-0 left-0 p-8 md:p-10 z-20">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {property?.status && (
                          <span className="bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                            {property.status === "ACTIVE" ? "PROYEK AKTIF" : property.status}
                          </span>
                        )}
                        {(property?.location ?? property?.city ?? property?.address) && (
                          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {property?.location ?? property?.city ?? property?.address}
                          </span>
                        )}
                      </div>
                      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">{property?.title}</h1>
                      {property?.subtitle && (
                        <p className="text-white/80 text-sm max-w-xl font-medium">{property.subtitle}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">

                  {/* ── LEFT COLUMN ── */}
                  <div className="lg:col-span-2 space-y-10">

                    {/* Stats Row */}
                    {loading ? (
                      <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wide">Harga per Token</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                            {tokenPrice > 0 ? formatCurrency(tokenPrice, currency) : "-"}
                          </p>
                          <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">done</span> Harga Tetap
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wide">Token Tersedia</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                            {totalTokens > 0 ? tokensLeft.toLocaleString("id-ID") : "-"}
                          </p>
                          <p className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">token</span>
                            dari {totalTokens > 0 ? totalTokens.toLocaleString("id-ID") : "-"} total
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wide">Target Dana</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                            {fundGoal > 0 ? formatCurrency(fundGoal, currency) : "-"}
                          </p>
                          <p className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">savings</span>
                            {fundGoal > 0 ? formatCurrency(fundGoal - fundedAmt, currency) + " lagi" : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Funding Progress */}
                    {loading ? <Skeleton className="h-32" /> : fundGoal > 0 && (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Progres Pendanaan</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                              {formatCurrency(fundedAmt, currency)} terkumpul
                            </p>
                          </div>
                          <span className="text-4xl font-black text-orange-600">{fundedPct}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden my-3">
                          <div className="h-full bg-orange-600 rounded-full transition-all" style={{ width: `${fundedPct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-slate-400">
                          <span>0</span>
                          <span>Target: {formatCurrency(fundGoal, currency)}</span>
                        </div>
                      </div>
                    )}

                    {/* Property Overview */}
                    {loading ? <Skeleton className="h-48" /> : (
                      <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                          <span className="material-symbols-outlined text-orange-600">info</span>
                          Tentang Properti
                        </h2>
                        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium whitespace-pre-line">
                          {property?.description ?? "Tidak ada deskripsi."}
                        </p>
                      </section>
                    )}

                    {/* Fasilitas Properti */}
                    <section>
                      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Fasilitas Properti</h3>

                      {loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                      )}

                      {!loading && facilities.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {facilities.map((name, idx) => {
                            const cfg = getFacilityConfig(name);
                            return (
                              <div
                                key={`${name}-${idx}`}
                                className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center hover:border-[#EC5B13]/40 cursor-pointer group shadow-sm transition-all"
                              >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${cfg.bg} ${cfg.color} ${cfg.hover}`}>
                                  <span className="material-symbols-outlined text-2xl">{cfg.icon}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{cfg.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!loading && facilities.length === 0 && (
                        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center gap-2 text-center mt-4">
                          <span className="material-symbols-outlined text-3xl text-slate-300">category</span>
                          <p className="text-sm text-slate-400">Belum ada fasilitas terdaftar</p>
                        </div>
                      )}
                    </section>

                    {/* Reviews */}
                    {loading ? <Skeleton className="h-64" /> : (
                      <section>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                          <span className="material-symbols-outlined text-orange-600">reviews</span>
                          Ulasan & Penilaian
                        </h2>

                        {reviews.length > 0 ? (
                          <>
                            <div className="flex flex-col md:flex-row gap-8 mb-8">
                              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm min-w-[150px]">
                                <span className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                                  {reviewMeta.avg > 0 ? reviewMeta.avg.toFixed(1) : "5.0"}
                                </span>
                                <StarRating score={reviewMeta.avg || 5} />
                                <span className="text-xs text-slate-400 font-medium mt-1">
                                  Dari {reviewMeta.total || reviews.length} ulasan
                                </span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {(showAllRev ? reviews : reviews.slice(0, 2)).map((r, i) => (
                                <ReviewCard key={r.id ?? i} review={r} />
                              ))}
                            </div>

                            {reviews.length > 2 && (
                              <button
                                onClick={() => setShowAllRev(v => !v)}
                                className="w-full mt-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                {showAllRev ? "Sembunyikan" : `Lihat ${reviews.length - 2} ulasan lainnya ↓`}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">rate_review</span>
                            <p className="text-sm text-slate-400 font-medium">Belum ada ulasan untuk properti ini.</p>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Map */}
                    {!loading && (
                      <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Lokasi</h2>
                        <PropertyMap property={property} />
                      </section>
                    )}
                  </div>

                  {/* ── RIGHT SIDEBAR ── */}
                  <div className="space-y-6">

                    {/* ══ Invest Widget ══ */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-orange-500 shadow-lg shadow-orange-500/10 sticky top-24">
                      <h3 className="text-xl font-extrabold mb-1 text-slate-900 dark:text-white">Investasi Sekarang</h3>

                      {/* ── Status Wallet ── */}
                      {walletConnected ? (
                        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 mb-5 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                              {shortAddress}
                            </span>
                          </div>
                          <button
                            onClick={disconnectWallet}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                          >
                            Putuskan
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium mb-5 mt-1">
                          Hubungkan wallet untuk mulai berinvestasi.
                        </p>
                      )}

                      {loading ? <Skeleton className="h-48" /> : (
                        <div className="space-y-5">

                          {/* Input Jumlah — tampil hanya jika wallet terhubung */}
                          {walletConnected && (
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                Jumlah Investasi ({currency})
                              </label>
                              <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <input
                                  type="number"
                                  value={amount}
                                  onChange={e => setAmount(e.target.value)}
                                  placeholder="0"
                                  min={tokenPrice || 1}
                                  className="w-full bg-transparent py-4 px-4 text-lg font-bold outline-none text-slate-900 dark:text-white"
                                />
                                <span className="font-bold text-slate-400 text-sm px-4 shrink-0">{currency}</span>
                              </div>
                              {tokenPrice > 0 && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Min. {formatCurrency(tokenPrice, currency)} (1 token)
                                </p>
                              )}
                            </div>
                          )}

                          {/* Preview — hanya tampil jika wallet terhubung */}
                          {walletConnected && (
                            <div className="py-2 space-y-3">
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-slate-500">Token yang Didapat</span>
                                <span className="text-slate-900 dark:text-white">{tokensToMint} Token</span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-slate-500">Estimasi Biaya Gas</span>
                                <span className="text-slate-900 dark:text-white">
                                  {formatCurrency(GAS_FEE_IDR, "IDR")}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* ── Tombol Utama ── */}
                          {!walletConnected ? (
                            /* CONNECT METAMASK */
                            <button
                              onClick={connectMetaMask}
                              disabled={isConnecting}
                              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all shadow-md
                                bg-[#F6851B] hover:bg-[#e2761b] text-white
                                disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isConnecting ? (
                                <>
                                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                  Menghubungkan...
                                </>
                              ) : (
                                <>
                                  <MetaMaskIcon size={22} />
                                  Hubungkan MetaMask
                                </>
                              )}
                            </button>
                          ) : (
                            /* BELI TOKEN */
                            <button
                              onClick={handleMint}
                              disabled={minting || !amount || parseFloat(amount) <= 0}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {minting ? "progress_activity" : "token"}
                              </span>
                              {minting ? "Memproses Blockchain..." : "Beli Token"}
                            </button>
                          )}

                          <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                            {walletConnected
                              ? "Dengan klik Beli Token, kamu menyetujui Smart Contract, Syarat & Ketentuan, serta Perjanjian Pembelian Properti."
                              : "Kamu perlu menghubungkan MetaMask sebelum melakukan investasi."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Legal & Info Kontrak */}
                    {/* Legal & Info Kontrak */}
                    {!loading && (legalDocs?.length > 0 || contractAddr) && (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Legalitas & Kontrak</h3>

                        <div className="space-y-3">
                          {/* Legal Docs dari IPFS */}
                          {legalDocs?.map((doc) => (
                            <a
                              key={doc.cid}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                                  {doc.icon}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                                    {doc.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    IPFS: {doc.cid.slice(0, 10)}…{doc.cid.slice(-6)}
                                  </p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-300 text-sm">open_in_new</span>
                            </a>
                          ))}

                          {/* Smart Contract */}
                          {contractAddr && (
                            <a
                              href={`https://etherscan.io/address/${contractAddr}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">code</span>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">Smart Contract</p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">{contractAddr}</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-300 text-sm">open_in_new</span>
                            </a>
                          )}
                        </div>

                        {/* Token summary */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Ringkasan Token</h4>
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-500">Total Token</span>
                            <span className="text-slate-900 dark:text-white">{totalTokens.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-500">Sudah Terjual</span>
                            <span className="text-orange-600">{tokensSold.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-slate-900 dark:text-white">Sisa Token</span>
                            <span className="text-emerald-500">{tokensLeft.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader  from "../../components/AdminHeader";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { ethers } from "ethers";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

const STATUS_STYLES = {
  FUNDING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/30",
  INACTIVE:  "bg-slate-100 text-slate-600 dark:bg-slate-800",
  PENDING:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30",
  REFUNDED:  "bg-red-100 text-red-700 dark:bg-red-900/30",
};

export default function ManajemenEscrow() {
  const [poolSearch,  setPoolSearch]  = useState("");
  const [properties,  setProperties]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fee,         setFee]         = useState(2);
  const [savingFee,   setSavingFee]   = useState(false);
  const [contractInfo, setContractInfo] = useState({
    network:    "Sepolia Testnet",
    pscAddress: import.meta.env.VITE_PSC_CONTRACT_ADDRESS  ?? "Belum dikonfigurasi",
    rentAddress:import.meta.env.VITE_RENT_CONTRACT_ADDRESS ?? "Belum dikonfigurasi",
    lastDeploy: "—",
  });
  const [chainStats, setChainStats] = useState({
    tvl:         0,
    feeRevenue:  0,
    activePools: 0,
  });

  // ─── Fetch data ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ Hapus fetch payments — endpoint tidak ada & tidak dipakai di UI
      const propsRes = await api.get("/properties").catch(() => ({ data: { data: [] } }));

      const props = Array.isArray(propsRes.data?.data) ? propsRes.data.data : [];
      setProperties(props);

      // Hitung stats dari data properti
      const totalRent = props.reduce((s, p) => s + (p.tokenPrice ?? p.rentPrice ?? 0), 0);
      setChainStats({
        tvl:         totalRent,
        feeRevenue:  parseFloat((totalRent * (fee / 100)).toFixed(2)),
        activePools: props.filter(p => p.status === "ACTIVE").length,
      });

    } catch (err) {
      console.error("Fetch escrow error:", err);
    } finally {
      setLoading(false);
    }
  }, [fee]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Fetch on-chain balance (kalau MetaMask tersedia) ────────────────────────
  useEffect(() => {
    const fetchOnChain = async () => {
      try {
        if (!window.ethereum || !contractInfo.rentAddress || contractInfo.rentAddress === "Belum dikonfigurasi") return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(contractInfo.rentAddress);
        setChainStats(prev => ({ ...prev, feeRevenue: parseFloat(ethers.formatEther(bal)).toFixed(4) }));
      } catch { /* skip — MetaMask mungkin tidak connect */ }
    };
    fetchOnChain();
  }, [contractInfo.rentAddress]);

  // ─── Save fee ────────────────────────────────────────────────────────────────
  const handleSaveFee = async () => {
    const ok = await Swal.fire({
      icon: "question",
      title: "Update Platform Fee?",
      html: `<div style="font-size:13px;color:#64748b">Fee baru: <b style="color:#fd9914">${fee.toFixed(1)}%</b><br/>Perubahan akan tercatat di database.</div>`,
      showCancelButton: true, confirmButtonColor: "#fd9914", cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Simpan", cancelButtonText: "Batal",
    });
    if (!ok.isConfirmed) return;
    setSavingFee(true);
    try {
      await api.post("/admin/config", { key: "platformFee", value: fee.toString() }).catch(() => {});
      Swal.fire({ icon:"success", title:"Fee Tersimpan!", text:`Platform fee diupdate ke ${fee.toFixed(1)}%`, timer:2000, showConfirmButton:false });
    } catch {
      Swal.fire({ icon:"info", title:"Tersimpan Lokal", text:"Fee akan diterapkan pada transaksi berikutnya.", timer:2000, showConfirmButton:false });
    } finally {
      setSavingFee(false);
    }
  };

  // ─── Property actions ─────────────────────────────────────────────────────
  const handleReleasePool = async (prop) => {
    const ok = await Swal.fire({
      icon:"warning", title:"Release Escrow Pool?",
      html:`<div style="font-size:13px;color:#64748b">
        🏠 <b>${prop.title}</b><br/>
        💰 Target: <b>Rp ${prop.tokenPrice?.toLocaleString("id-ID") ?? "—"}</b><br/>
        ⚠️ Dana akan dirilis ke owner properti.
      </div>`,
      showCancelButton:true, confirmButtonColor:"#fd9914", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Release", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;
    try {
      await api.patch(`/admin/properties/${prop.id}/verify`, { status:"ACTIVE" });
      setProperties(prev => prev.map(p => p.id === prop.id ? {...p, status:"ACTIVE"} : p));
      Swal.fire({ icon:"success", title:"Pool Released!", timer:1500, showConfirmButton:false });
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal", text:err.response?.data?.message, confirmButtonColor:"#fd9914" });
    }
  };

  const handleViewDetails = (prop) => {
    Swal.fire({
      title: prop.title,
      html: `<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.5">
        👤 Owner: <b>${prop.owner?.fullName ?? "—"}</b><br/>
        📍 Lokasi: <b>${prop.location ?? "—"}</b><br/>
        💰 Harga: <b>Rp ${prop.tokenPrice?.toLocaleString("id-ID") ?? "—"}</b><br/>
        🏷️ Kategori: <b>${prop.category ?? "—"}</b><br/>
        📊 Status: <b>${prop.status ?? "PENDING"}</b><br/>
        📅 Dibuat: <b>${prop.createdAt ? new Date(prop.createdAt).toLocaleDateString("id-ID") : "—"}</b>
      </div>`,
      confirmButtonColor: "#fd9914",
    });
  };

  const filtered = properties.filter(p =>
    p.title?.toLowerCase().includes(poolSearch.toLowerCase()) ||
    p.owner?.fullName?.toLowerCase().includes(poolSearch.toLowerCase())
  );

  const CONTRACT_HEALTH = [
    { label:"Network",      value: contractInfo.network,                style:"bg-[#fd9914]/10 text-[#fd9914]"  },
    { label:"PSC Contract", value: contractInfo.pscAddress !== "Belum dikonfigurasi" ? "Deployed ✅" : "Belum Deploy", style:"bg-green-100 text-green-700" },
    { label:"Rent Contract",value: contractInfo.rentAddress !== "Belum dikonfigurasi" ? "Deployed ✅" : "Belum Deploy", style:"bg-green-100 text-green-700" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <AdminSidebar activeLabel="Manajemen Escrow" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title="Manajemen Escrow & Smart Contract"
          icon="account_balance"
          onSearch={undefined}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? [...Array(3)].map((_,i) => <Skeleton key={i} className="h-32" />) : [
              { label:"Total Property Value",  value:`Rp ${chainStats.tvl.toLocaleString("id-ID")}`,  trend:"dari seluruh properti",  trendUp:true, icon:"account_balance_wallet" },
              { label:"Platform Fee Revenue",  value:`${fee.toFixed(1)}% per transaksi`,              trend:`≈ Rp ${chainStats.feeRevenue.toLocaleString("id-ID")}`, trendUp:true, icon:"payments" },
              { label:"Active Escrow Pools",   value:`${chainStats.activePools} properti`,            trend:"properti aktif",         trendUp:true, icon:"layers" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500">{s.label}</span>
                  <span className="material-symbols-outlined text-[#fd9914]">{s.icon}</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 mt-1 ${s.trendUp ? "text-green-600" : "text-red-500"}`}>
                    <span className="material-symbols-outlined text-sm">{s.trendUp ? "trending_up" : "trending_down"}</span>
                    {s.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Fee Config + Contract Health */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-[#fd9914]">settings_applications</span>
                Platform Fee Configuration
              </h3>
              <p className="text-sm text-slate-500 mb-6">Atur persentase fee platform untuk setiap transaksi sewa.</p>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Fee (%)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="10" step="0.1" value={fee}
                    onChange={e => setFee(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#fd9914]"
                  />
                  <span className="font-bold text-[#fd9914] w-12 shrink-0">{fee.toFixed(1)}%</span>
                </div>
                <button onClick={handleSaveFee} disabled={savingFee}
                  className="w-full bg-[#fd9914] hover:bg-[#fd9914]/90 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                >
                  <span className="material-symbols-outlined text-sm">{savingFee ? "progress_activity" : "save"}</span>
                  {savingFee ? "Menyimpan..." : "Save Configuration"}
                </button>
              </div>

              {/* Contract health */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-400">Smart Contract Health</h4>
                <div className="space-y-3">
                  {CONTRACT_HEALTH.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.style}`}>{item.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">PSC Address</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {contractInfo.pscAddress !== "Belum dikonfigurasi"
                        ? `${contractInfo.pscAddress.slice(0,8)}...`
                        : "—"}
                    </span>
                  </div>
                </div>

                {contractInfo.pscAddress === "Belum dikonfigurasi" && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      ⚠️ Contract belum deploy. Tambahkan VITE_PSC_CONTRACT_ADDRESS ke .env frontend.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow Pools Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Escrow Pools Overview
                  {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} properti)</span>}
                </h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <input type="text" value={poolSearch} onChange={e => setPoolSearch(e.target.value)}
                      placeholder="Cari properti..."
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-[#fd9914] outline-none w-48 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-lg">search</span>
                  </div>
                  <button onClick={fetchAll} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-[#fd9914] transition-colors">
                    <span className="material-symbols-outlined text-lg">refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      {["Properti","Owner","Harga/Bulan","Status","Actions"].map((h,i) => (
                        <th key={h} className={`px-6 py-4 ${i===4?"text-right":""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? [...Array(5)].map((_,i) => (
                      <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-8" /></td></tr>
                    )) : filtered.length > 0 ? filtered.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.category ?? "—"}</p>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{p.owner?.fullName ?? "—"}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">
                          {p.tokenPrice ? `Rp ${p.tokenPrice.toLocaleString("id-ID")}` : "—"}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[p.status] ?? STATUS_STYLES.PENDING}`}>
                            {p.status ?? "PENDING"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right space-x-3">
                          {p.status !== "ACTIVE" && (
                            <button onClick={() => handleReleasePool(p)} className="text-sm font-bold text-[#fd9914] hover:text-[#fd9914]/70 transition-colors">
                              Release
                            </button>
                          )}
                          <button onClick={() => handleViewDetails(p)} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            Details
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                          <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                          {poolSearch ? `Tidak ada hasil untuk "${poolSearch}"` : "Tidak ada properti"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500">
                <p>Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span> dari <span className="font-bold text-slate-900 dark:text-white">{properties.length}</span> properti</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Update terakhir: {new Date().toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
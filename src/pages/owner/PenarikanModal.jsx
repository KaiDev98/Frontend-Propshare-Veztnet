import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { getFundingContract, ensureSepolia } from "../../utils/contracts";

export default function PenarikanModal() {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [properties, setProperties] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [property,   setProperty]   = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [claiming,   setClaiming]   = useState(false);
  const [claimed,    setClaimed]    = useState(false);
  const [user,       setUser]       = useState(null);

  // ─── Load user dari localStorage + sync dari DB ───────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
        setUser(stored);
        // Sync wallet terbaru dari DB
        const res = await api.get("/auth/users/profile");
        const fresh = res.data?.data;
        if (fresh) {
          setUser(fresh);
          localStorage.setItem("user", JSON.stringify({ ...stored, ...fresh }));
        }
      } catch {}
    };
    loadUser();
  }, []);

  // ─── Fetch properti owner ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        let all = [];
        try {
          const res = await api.get("/properties/my-listings");
          all = res.data?.data ?? [];
        } catch {
          const res = await api.get("/properties");
          const u   = JSON.parse(localStorage.getItem("user") ?? "{}");
          all = (res.data?.data ?? []).filter(p => p.ownerId === u.id || p.owner?.id === u.id);
        }

        const eligible = all.filter(p =>
          p.status === "FUNDED" ||
          (p.status === "ACTIVE" && (p.currentFunding ?? 0) >= (p.fundingTarget ?? 1) && p.fundingTarget > 0)
        );

        setProperties(eligible);
        if (eligible.length > 0) setSelected(eligible[0].id);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // ─── Fetch detail properti ────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const fetchDetail = async () => {
      try {
        const res  = await api.get(`/properties/${selected}`);
        const data = res.data?.data ?? res.data;
        setProperty(data);
        setClaimed(data?.isClaimed ?? false);
      } catch (err) {
        console.error("Fetch detail error:", err);
      }
    };
    fetchDetail();
  }, [selected]);

  // ─── Kalkulasi ────────────────────────────────────────────────────────────
  const PLATFORM_FEE_PCT = 0.02;
  const totalRaised = property?.currentFunding ?? 0;
  const platformFee = Math.round(totalRaised * PLATFORM_FEE_PCT);
  const netAmount   = totalRaised - platformFee;

  const ELIGIBILITY = [
    {
      label:   "Admin Approval Verified",
      desc:    "Dokumentasi dan compliance check selesai oleh PropShare",
      checked: property?.status === "FUNDED" ||
               (property?.status === "ACTIVE" && (property?.currentFunding ?? 0) >= (property?.fundingTarget ?? 1)),
    },
    {
      label:   "Funding Goal Reached 100%",
      desc:    "Target funding tercapai. Dana siap untuk ditarik.",
      checked: property ? (property.currentFunding ?? 0) >= (property.fundingTarget ?? 1) : false,
    },
  ];

  const isEligible = ELIGIBILITY.every(e => e.checked);

  // ─── Copy contract address ────────────────────────────────────────────────
  const handleCopy = () => {
    const addr = property?.contractAddress ?? "";
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Connect MetaMask → simpan ke DB ─────────────────────────────────────
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      Swal.fire({
        icon:  "error",
        title: "MetaMask Tidak Ditemukan",
        html:  `<div style="font-size:13px;color:#64748b">
          Install MetaMask terlebih dahulu.<br/>
          <a href="https://metamask.io/download/" target="_blank" style="color:#EC5B13;font-weight:bold">
            Download MetaMask →
          </a>
        </div>`,
        confirmButtonColor: "#EC5B13",
      });
      return;
    }

    try {
      Swal.fire({ title: "Menghubungkan MetaMask...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address  = accounts[0];

      // Simpan ke DB
      await api.patch("/auth/users/wallet", { walletAddress: address });

      // Sync localStorage
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      const updated = { ...stored, walletAddress: address };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);

      await Swal.fire({
        icon:  "success",
        title: "Wallet Berhasil Terhubung! 🎉",
        html:  `<div style="font-size:13px;color:#64748b">
          <b style="font-family:monospace">${address.slice(0,8)}...${address.slice(-6)}</b><br/>
          Wallet kamu sudah tersimpan di database.
        </div>`,
        confirmButtonColor: "#EC5B13",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon:  "error",
        title: err.code === 4001 ? "Koneksi Ditolak" : "Gagal Menghubungkan",
        text:  err.code === 4001
          ? "Kamu menolak permintaan dari MetaMask."
          : err.response?.data?.message ?? "Coba lagi.",
        confirmButtonColor: "#EC5B13",
      });
    }
  };

  // ─── Claim Funds ──────────────────────────────────────────────────────────
  const handleClaim = async () => {
  if (claimed) return;

  if (!isEligible) { /* ... existing check ... */ return; }
  if (!user?.walletAddress) { /* ... existing check ... */ return; }

  const confirm = await Swal.fire({ /* ... existing confirm dialog ... */ });
  if (!confirm.isConfirmed) return;

  setClaiming(true);
  Swal.fire({
    title: "Menunggu Konfirmasi MetaMask...",
    html:  "Buka MetaMask dan konfirmasi transaksi.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    // 1. Pastikan network Sepolia
    await ensureSepolia();

    // 2. Get contract
    const contract = await getFundingContract();

    // 3. Panggil withdrawFunds — MetaMask popup muncul
    const tx = await contract.withdrawFunds(property.id);

    Swal.fire({
      title: "Transaksi Dikirim...",
      html:  `<div style="font-size:13px;color:#64748b">
        Menunggu konfirmasi blockchain.<br/>
        <a href="https://sepolia.etherscan.io/tx/${tx.hash}"
           target="_blank" style="color:#EC5B13">
          Lihat di Etherscan →
        </a>
      </div>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // 4. Tunggu 1 konfirmasi
    const receipt = await tx.wait(1);
    const txHash  = receipt.hash;

    // 5. Simpan ke database
    await api.patch(`/properties/${property.id}/claim`, {
      txHash,
      walletAddress: user.walletAddress,
      amount:        netAmount,
    });

    setClaimed(true);
    setProperty(prev => ({
      ...prev,
      isClaimed:      true,
      claimedAt:      new Date().toISOString(),
      claimedTxHash:  txHash,
    }));

    await Swal.fire({
      icon:  "success",
      title: "Dana Berhasil Diklaim! 🎉",
      html:  `<div style="font-size:13px;color:#64748b;line-height:2">
        <div style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0">
          ✅ Properti: <b>${property.title}</b><br/>
          ✅ Net amount: <b>Rp ${netAmount.toLocaleString("id-ID")}</b><br/>
          ✅ Wallet: <b>${user.walletAddress.slice(0,6)}...${user.walletAddress.slice(-4)}</b><br/>
          🔗 TX: <a href="https://sepolia.etherscan.io/tx/${txHash}"
                    target="_blank"
                    style="color:#3b82f6;font-family:monospace;font-size:10px">
                    ${txHash.slice(0,20)}{'...'}
                 </a>
        </div>
      </div>`,
      confirmButtonColor: "#EC5B13",
    });

    navigate("/owner/dashboard-funding");

  } catch (err) {
    const msg =
      err.code === 4001         ? "Transaksi dibatalkan dari MetaMask."         :
      err.code === "ACTION_REJECTED" ? "Transaksi ditolak."                    :
      err.reason ?? err.response?.data?.message ?? "Terjadi kesalahan.";

    Swal.fire({
      icon:               "error",
      title:              "Gagal Menarik Dana",
      text:               msg,
      confirmButtonColor: "#EC5B13",
    });
  } finally {
    setClaiming(false);
  }
};  

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
        <OwnerSidebar activeLabel="Sistem Penarikan Modal" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f6] dark:bg-[#221610]">
      <OwnerSidebar activeLabel="Sistem Penarikan Modal" />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md border-b border-[#EC5B13]/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#EC5B13]">account_balance_wallet</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Capital Withdrawal</h2>
          </div>
          {properties.length > 1 && (
            <select
              value={selected ?? ""}
              onChange={e => setSelected(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-[#EC5B13]"
            >
              {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
        </header>

        <div className="max-w-5xl mx-auto p-8 space-y-6">

          {/* Empty State */}
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-6xl text-slate-300">account_balance_wallet</span>
              <p className="text-xl font-bold text-slate-400">Belum Ada Dana yang Bisa Ditarik</p>
              <p className="text-sm text-slate-400 text-center max-w-sm">
                Penarikan tersedia jika properti sudah:<br/>
                ✅ Status <b>FUNDED</b> atau <b>ACTIVE</b><br/>
                ✅ Funding sudah mencapai <b>100%</b> dari target
              </p>
            </div>
          ) : (
            <>
              {/* Already Claimed Banner */}
              {claimed && (
                <div className="flex items-center gap-4 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                  <div className="size-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-green-800 dark:text-green-400">Dana Sudah Berhasil Diklaim</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {property?.claimedAt
                        ? `Diklaim pada ${new Date(property.claimedAt).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}`
                        : "Klaim berhasil diproses"}
                    </p>
                    {property?.claimedTxHash && (
                      
                       <a  href={`https://sepolia.etherscan.io/tx/${property.claimedTxHash}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 w-fit"
                      >
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        // ✅ Fix
                      Lihat di Etherscan: {property.claimedTxHash.slice(0,16)}{'...'}
                      </a>
                    )}
                  </div>
                  <span className="text-sm font-black text-green-700">Rp {netAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              {/* ── Wallet Status ── */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 rounded-xl border border-[#EC5B13]/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${user?.walletAddress ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                    <span className={`material-symbols-outlined ${user?.walletAddress ? "text-green-500" : "text-amber-500"}`}>
                      {user?.walletAddress ? "link" : "link_off"}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight">
                      {user?.walletAddress ? "MetaMask Terhubung" : "MetaMask Belum Terhubung"}
                    </p>
                    <p className="text-slate-500 text-sm font-mono">
                      {user?.walletAddress
                        ? `${user.walletAddress.slice(0,8)}...${user.walletAddress.slice(-6)}`
                        : "Klik tombol untuk hubungkan wallet"}
                    </p>
                    {user?.walletAddress && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Sepolia Testnet</p>
                    )}
                  </div>
                </div>

                {user?.walletAddress ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 text-sm font-bold rounded-xl border border-green-200">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Verified
                    </span>
                    <button
                      onClick={connectMetaMask}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      title="Ganti wallet"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectMetaMask}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#EC5B13] text-white text-sm font-bold rounded-xl hover:bg-[#d44e0f] transition-all shadow-lg shadow-[#EC5B13]/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    Hubungkan MetaMask
                  </button>
                )}
              </div>

              {/* Property Banner */}
              {property && (
                <div className="flex items-center gap-4 p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl">
                  <span className="material-symbols-outlined text-[#EC5B13]">home_work</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{property.title}</p>
                    <p className="text-xs text-slate-500">{property.location} • {property.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                      {property.status} ✓
                    </span>
                    {claimed && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Diklaim
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Eligibility */}
                  <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#EC5B13]/10 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#EC5B13]">verified</span>
                      Withdrawal Eligibility
                    </h3>
                    <div className="space-y-4">
                      {ELIGIBILITY.map(item => (
                        <div key={item.label} className={`flex items-center gap-4 p-4 rounded-xl border ${
                          item.checked
                            ? "border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10"
                            : "border-red-100 bg-red-50 dark:bg-red-900/10"
                        }`}>
                          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            item.checked ? "bg-emerald-500 text-white" : "bg-white border-2 border-red-300"
                          }`}>
                            {item.checked && <span className="material-symbols-outlined text-[16px]">check</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-slate-100 font-bold">{item.label}</p>
                            <p className="text-slate-500 text-sm">{item.desc}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            item.checked ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                          }`}>
                            {item.checked ? "✓ OK" : "✗ Belum"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Smart Contract */}
                  <section className="bg-slate-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <span className="material-symbols-outlined text-8xl">terminal</span>
                    </div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative">
                      <span className="material-symbols-outlined text-[#EC5B13]">data_object</span>
                      Smart Contract Reference
                    </h3>
                    {property?.contractAddress ? (
                      <>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-sm break-all flex justify-between items-center gap-4">
                          <span className="text-slate-300">{property.contractAddress}</span>
                          <button onClick={handleCopy} className="text-[#EC5B13] hover:opacity-80 transition-opacity shrink-0">
                            <span className="material-symbols-outlined text-lg">{copied ? "check" : "content_copy"}</span>
                          </button>
                        </div>
                        {copied && (
                          <p className="mt-2 text-xs text-green-400 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>Copied!
                          </p>
                        )}
                        <p className="mt-4 text-xs text-slate-400">Deployed on Sepolia Testnet.</p>
                      </>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                        <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">code_off</span>
                        <p className="text-slate-400 text-sm">Contract address belum tersedia.</p>
                        <p className="text-slate-500 text-xs mt-1">Admin akan menambahkan setelah approval.</p>
                      </div>
                    )}
                  </section>

                  {/* Timeline */}
                  {claimed && (
                    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-[#EC5B13]">history</span>
                        Riwayat Transaksi
                      </h3>
                      <div className="space-y-4">
                        {[
                          { icon:"verified",               label:"Admin Approval",     desc:"Properti diverifikasi oleh admin",                done:true },
                          { icon:"paid",                   label:"Funding 100%",       desc:`Rp ${totalRaised.toLocaleString("id-ID")} terkumpul`, done:true },
                          { icon:"account_balance_wallet", label:"Klaim Berhasil",     desc:`Net: Rp ${netAmount.toLocaleString("id-ID")}`,     done:true },
                          { icon:"send",                   label:"Transfer ke Wallet", desc:"Dana sedang dikirim 1-3 menit",                    done:false, inProgress:true },
                        ].map((step,i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                              step.done        ? "bg-green-100 dark:bg-green-900/30" :
                              step.inProgress  ? "bg-blue-100 dark:bg-blue-900/30 animate-pulse" :
                              "bg-slate-100 dark:bg-slate-800"
                            }`}>
                              <span className={`material-symbols-outlined text-[18px] ${
                                step.done       ? "text-green-600" :
                                step.inProgress ? "text-blue-500"  : "text-slate-400"
                              }`}>{step.icon}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{step.label}</p>
                              <p className="text-xs text-slate-500">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right — Withdrawal Summary */}
                <div className="space-y-6">
                  <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#EC5B13]/10 shadow-lg">
                    <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Withdrawal Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 text-sm">Total Terkumpul</span>
                        <span className="font-bold text-slate-900 dark:text-white">Rp {totalRaised.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 text-sm">Platform Fee (2%)</span>
                        <span className="font-bold text-red-500">- Rp {platformFee.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 text-sm">Total Investor</span>
                        <span className="font-bold text-slate-900 dark:text-white">{property?.investments?.length ?? 0} investor</span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="font-bold text-slate-900 dark:text-white">Yang Kamu Terima</span>
                        <span className="font-black text-2xl text-[#EC5B13]">Rp {netAmount.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <button
                        onClick={handleClaim}
                        disabled={claiming || !isEligible || claimed}
                        className={`w-full flex items-center justify-center gap-3 font-bold py-4 rounded-xl shadow-lg transition-all ${
                          claimed
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 cursor-not-allowed"
                            : isEligible && user?.walletAddress
                            ? "bg-[#EC5B13] hover:bg-[#EC5B13]/90 text-white shadow-[#EC5B13]/30 hover:-translate-y-0.5 active:scale-95"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {claimed ? (
                          <><span className="material-symbols-outlined">check_circle</span>Dana Sudah Diklaim ✓</>
                        ) : claiming ? (
                          <><span className="material-symbols-outlined animate-spin">progress_activity</span>Processing...</>
                        ) : !user?.walletAddress ? (
                          <><span className="material-symbols-outlined">link_off</span>Hubungkan Wallet Dulu</>
                        ) : (
                          <><span className="material-symbols-outlined">account_balance_wallet</span>{isEligible ? "Claim Funds" : "Syarat Belum Terpenuhi"}</>
                        )}
                      </button>

                      {claimed ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-center space-y-2">
                          <p className="text-xs text-green-700 dark:text-green-400 font-bold">✅ Klaim berhasil diproses</p>
                          {property?.claimedTxHash && (
                            
                              <a href={`https://sepolia.etherscan.io/tx/${property.claimedTxHash}`}
                              target="_blank" rel="noreferrer"
                              className="text-[10px] text-blue-500 hover:underline flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              Verifikasi di Etherscan
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-center text-slate-400">
                          Klaim hanya bisa dilakukan <b>1 kali</b>. Transaksi bersifat irreversible.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="bg-[#EC5B13]/5 rounded-xl p-6 border border-[#EC5B13]/20">
                    <h4 className="font-bold text-[#EC5B13] mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">support_agent</span>
                      Need Assistance?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Butuh bantuan dengan penarikan? Manager kami siap membantu.
                    </p>
                    <a href="mailto:support@propshare.id"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#EC5B13] hover:underline"
                    >
                      Contact Support
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </section>
                </div>
              </div>

              <footer className="text-center text-slate-400 text-xs pt-4 pb-2">
                © 2026 PropShare Campus.
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// tess
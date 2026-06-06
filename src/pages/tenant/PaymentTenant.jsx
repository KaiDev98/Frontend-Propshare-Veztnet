import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import api from "../../utils/api";
import TenantSidebar from "../../components/TenantSidebar";
import Swal from "sweetalert2";
import TenantHeader from "../../components/TenantHeader";

const PSC_ADDRESS  = import.meta.env.VITE_PSC_CONTRACT_ADDRESS  ?? "";
const RENT_ADDRESS = import.meta.env.VITE_RENT_CONTRACT_ADDRESS ?? "";
const SEPOLIA_CHAIN_ID = "0xaa36a7";

const PSC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const RENT_ABI = [
  "function payRentWithPSC(address ownerAddr, string rentalId, uint256 amount) external",
  "function payRentWithETH(address payable ownerAddr, string rentalId) external payable",
];

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

function StatusBadge({ status }) {
  const map = {
    VERIFIED: { label: "Terverifikasi", cls: "bg-green-100 text-green-700" },
    PENDING:  { label: "Menunggu",      cls: "bg-amber-100 text-amber-700" },
    FAILED:   { label: "Gagal",         cls: "bg-red-100 text-red-600"     },
  };
  const s = map[status] ?? map.PENDING;
  return <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${s.cls}`}>{s.label}</span>;
}

export default function PaymentTenant() {
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [rental,       setRental]       = useState(null);
  const [payments,     setPayments]     = useState([]);
  const [user,         setUser]         = useState(null);
  const [method,       setMethod]       = useState("manual");
  const [proofFile,    setProofFile]    = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [wallet,       setWallet]       = useState(null);
  const [pscBalance,   setPscBalance]   = useState(null);
  const [ethBalance,   setEthBalance]   = useState(null);
  const [tokenType,    setTokenType]    = useState("PSC");
  const [web3Loading,  setWeb3Loading]  = useState(false);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user"))); } catch {}
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res    = await api.get("/rentals/my-rentals");
      const raw    = res.data?.data;
      const list   = Array.isArray(raw) ? raw : [];
      const active = list.find(r => r.status === "ACTIVE") ?? null;
      setRental(active);
      setPayments(active?.payments ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshPayments(); }, [refreshPayments]);

  const property   = rental?.room?.property ?? rental?.property ?? null;
  const room       = rental?.room ?? null;
  const rentAmount = room?.pricePerMonth ?? property?.tokenPrice ?? 0;
  const ownerWallet= property?.owner?.walletAddress ?? null;
  const paidTotal  = payments.filter(p => p.status === "VERIFIED").reduce((s, p) => s + (p.amount ?? 0), 0);
  const hasPending = payments.some(p => p.status === "PENDING");

  const nextDue  = rental ? (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1); return d; })() : null;
  const diffDays = nextDue ? Math.ceil((nextDue - new Date()) / (1000 * 60 * 60 * 24)) : null;

  // ─── Connect MetaMask ─────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      Swal.fire({ icon:"warning", title:"MetaMask Tidak Ditemukan", html:`Install di <a href="https://metamask.io" target="_blank" class="text-[#EC5B13] underline">metamask.io</a>`, confirmButtonColor:"#EC5B13" });
      return;
    }
    setWeb3Loading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      try {
        await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{ chainId:SEPOLIA_CHAIN_ID }] });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId:SEPOLIA_CHAIN_ID, chainName:"Sepolia Testnet", nativeCurrency:{name:"Sepolia ETH",symbol:"ETH",decimals:18}, rpcUrls:["https://rpc.sepolia.org"], blockExplorerUrls:["https://sepolia.etherscan.io"] }],
          });
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const address  = await signer.getAddress();
      setWallet(address);
      const ethBal = await provider.getBalance(address);
      setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));
      if (PSC_ADDRESS) {
        const psc = new ethers.Contract(PSC_ADDRESS, PSC_ABI, provider);
        const bal = await psc.balanceOf(address);
        setPscBalance(parseFloat(ethers.formatUnits(bal, 18)).toFixed(2));
      }
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal Connect", text:err.message, confirmButtonColor:"#EC5B13" });
    } finally {
      setWeb3Loading(false);
    }
  }, []);

  // ─── Pay with MetaMask ────────────────────────────────────────────────────────
  const handleWeb3Pay = async () => {
    if (!wallet) { connectWallet(); return; }
    if (!rental) return;
    if (!RENT_ADDRESS) {
      Swal.fire({ icon:"warning", title:"Contract Belum Deploy", text:"Tambahkan VITE_RENT_CONTRACT_ADDRESS ke .env", confirmButtonColor:"#EC5B13" });
      return;
    }

    const ok = await Swal.fire({
      icon:"question", title:"Konfirmasi Pembayaran Blockchain",
      html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2.2">
        🏠 <b>${property?.title ?? "Properti"}</b><br/>
        💰 <b style="color:#EC5B13">Rp ${rentAmount.toLocaleString("id-ID")}</b><br/>
        🔗 Network: <b>Sepolia Testnet</b><br/>
        🪙 Token: <b>${tokenType}</b><br/>
        👛 <small>${wallet?.slice(0,14)}...${wallet?.slice(-6)}</small><br/><br/>
        <div style="background:#fef9f6;padding:10px;border-radius:8px;border:1px solid #fed7aa;font-size:11px;color:#9a3412">
          ⚠️ Pastikan punya Sepolia ETH untuk gas fee.
        </div>
      </div>`,
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Ya, Bayar!", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;

    setWeb3Loading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();

      // ── Cek saldo ETH untuk gas fee ──────────────────────────────────────────
      const ethBal = await provider.getBalance(wallet);
      const minGas = ethers.parseEther("0.001"); // minimal untuk gas
      if (ethBal < minGas) {
        Swal.fire({
          icon: "warning",
          title: "Saldo ETH Tidak Cukup",
          html: `Kamu butuh minimal <b>0.001 SepoliaETH</b> untuk gas fee.<br/>
          Dapatkan gratis di <a href="https://sepoliafaucet.com" target="_blank"
          class="text-[#EC5B13] underline font-bold">sepoliafaucet.com</a>`,
          confirmButtonColor: "#EC5B13",
        });
        return;
      }
      // ────────────────────────────────────────────────────────────────────────

      Swal.fire({ title:"Mengirim Transaksi...", html:"Tunggu konfirmasi MetaMask", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

      const rent = new ethers.Contract(RENT_ADDRESS, RENT_ABI, signer);
      let tx;

      if (tokenType === "PSC") {
        const psc       = new ethers.Contract(PSC_ADDRESS, PSC_ABI, signer);
        const amountPSC = ethers.parseUnits(rentAmount.toString(), 18);
        const allowance = await psc.allowance(wallet, RENT_ADDRESS);
        if (allowance < amountPSC) {
          Swal.update({ html:"Approve PSC dulu..." });
          const approveTx = await psc.approve(RENT_ADDRESS, amountPSC);
          await approveTx.wait();
        }
        Swal.update({ html:"Mengirim PSC..." });
        tx = await rent.payRentWithPSC(ownerWallet ?? ethers.ZeroAddress, rental.id, amountPSC);
      } else {
        const ethAmt = ethers.parseEther((rentAmount / 50_000_000).toFixed(6));
        Swal.update({ html:"Mengirim ETH..." });
        tx = await rent.payRentWithETH(ownerWallet ?? ethers.ZeroAddress, rental.id, { value: ethAmt });
      }

      Swal.update({ html:`Menunggu konfirmasi...<br/><small>${tx.hash.slice(0,20)}...</small>` });
      const receipt = await tx.wait();

      await api.post("/payments", {
        rentalId:    rental.id,
        amount:      rentAmount,
        txHash:      receipt.hash,
        paymentType: tokenType === "PSC" ? "BLOCKCHAIN_PSC" : "BLOCKCHAIN_ETH",
        month:       new Date().getMonth() + 1,
        year:        new Date().getFullYear(),
      });

      await refreshPayments();

      await Swal.fire({
        icon:"success", title:"Pembayaran Berhasil! 🎉",
        html:`<div style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0;font-size:13px;color:#64748b">
          ✅ Dikonfirmasi di Sepolia<br/>
          🔗 <a href="https://sepolia.etherscan.io/tx/${receipt.hash}" target="_blank" style="color:#EC5B13">Lihat di Etherscan →</a>
        </div>`,
        confirmButtonColor:"#EC5B13", timer:5000,
      });
    } catch (err) {
      Swal.fire({ icon:"error", title:"Transaksi Gagal", text:(err.reason ?? err.message ?? "Error").slice(0,120), confirmButtonColor:"#EC5B13" });
    } finally {
      setWeb3Loading(false);
    }
  };

  // ─── Manual transfer ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { Swal.fire({ icon:"warning", title:"File > 5MB", confirmButtonColor:"#EC5B13" }); return; }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleManualPay = async () => {
    if (!rental || !proofFile) { Swal.fire({ icon:"warning", title:"Upload bukti bayar dulu", confirmButtonColor:"#EC5B13" }); return; }

    const ok = await Swal.fire({
      icon:"question", title:"Kirim Bukti Bayar?",
      html:`<div style="text-align:left;font-size:13px;color:#64748b;line-height:2">
        💰 <b style="color:#EC5B13">Rp ${rentAmount.toLocaleString("id-ID")}</b><br/>
        📄 File: <b>${proofFile.name}</b>
      </div>`,
      showCancelButton:true, confirmButtonColor:"#EC5B13", cancelButtonColor:"#94a3b8",
      confirmButtonText:"Kirim", cancelButtonText:"Batal",
    });
    if (!ok.isConfirmed) return;

    Swal.fire({ title:"Mengirim...", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });
    setSubmitting(true);
    try {
      let proofUrl = null;
      try {
        const formData = new FormData();
        formData.append("file", proofFile);
        const uploadRes = await api.post("/upload/ipfs", formData, { headers:{"Content-Type":"multipart/form-data"} });
        proofUrl = uploadRes.data?.url ?? null;
      } catch { /* upload gagal, lanjut tanpa url */ }

      await api.post("/payments", {
        rentalId:    rental.id,
        amount:      rentAmount,
        paymentProof:proofUrl,
        month:       new Date().getMonth() + 1,
        year:        new Date().getFullYear(),
      });

      await refreshPayments();
      setProofFile(null);
      setProofPreview(null);

      await Swal.fire({ icon:"success", title:"Bukti Terkirim! ✅", text:"Owner akan verifikasi dalam 1×24 jam.", confirmButtonColor:"#EC5B13", timer:3000, showConfirmButton:false });
    } catch (err) {
      Swal.fire({ icon:"error", title:"Gagal", text:err.response?.data?.message ?? "Coba lagi.", confirmButtonColor:"#EC5B13" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <TenantSidebar activeLabel="Payments" />
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <TenantHeader />

        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">

          {/* ── Hero ─────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-slate-900 text-white p-8 relative min-h-[200px] flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-[#EC5B13]/20" />

            {/* === BELUM SEWA === */}
            {!loading && !rental && (
              <div className="relative z-10 flex flex-col items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">home_work</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Status Pembayaran</p>
                    <p className="text-xl font-bold text-white mt-0.5">Belum Ada Sewa Aktif</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  Anda belum menyewa properti apapun. Tagihan & jatuh tempo akan muncul otomatis setelah booking disetujui oleh owner.
                </p>
                <button
                  onClick={() => navigate("/tenant/marketplace")}
                  className="flex items-center gap-2 px-6 py-3 bg-[#EC5B13] text-white font-bold rounded-xl shadow-lg hover:brightness-110 mt-2"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  Cari Properti
                </button>
              </div>
            )}

            {/* === LOADING === */}
            {loading && (
              <div className="relative z-10 space-y-3">
                <Skeleton className="h-4 w-36 bg-slate-700" />
                <Skeleton className="h-12 w-64 bg-slate-700" />
                <Skeleton className="h-4 w-52 bg-slate-700" />
              </div>
            )}

            {/* === ADA RENTAL AKTIF === */}
            {!loading && rental && (
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tagihan Bulan Ini</p>
                <p className="text-5xl font-black">Rp {rentAmount.toLocaleString("id-ID")}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="material-symbols-outlined text-[#EC5B13] text-[18px]">calendar_today</span>
                  <p className={`text-sm font-semibold ${diffDays <= 5 ? "text-red-400" : "text-slate-300"}`}>
                    Jatuh tempo {diffDays} hari lagi —{" "}
                    {nextDue.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}

            {/* Buttons bawah — hanya jika ada rental */}
            {!loading && rental && (
              <div className="relative z-10 flex gap-3 mt-6">
                <button
                  onClick={() => document.getElementById("pay-section")?.scrollIntoView({ behavior: "smooth" })}
                  disabled={hasPending}
                  className="flex items-center gap-2 px-6 py-3 bg-[#EC5B13] text-white font-bold rounded-xl shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  {hasPending ? "Menunggu Verifikasi" : "Bayar Sekarang"}
                </button>
                <button onClick={() => navigate("/tenant/room")} className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20">
                  Lihat Detail Kamar
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: "shield_with_heart",
                label: "Status Sewa",
                value: rental ? `Aktif — Kamar #${room?.roomNumber ?? "—"}` : "Belum aktif",
                color: rental ? "text-green-600" : "text-slate-400",
                bg: rental ? "bg-green-50 dark:bg-green-900/20" : "bg-slate-100 dark:bg-slate-800",
              },
              {
                icon: "account_balance_wallet",
                label: "Total Dibayar",
                value: `Rp ${paidTotal.toLocaleString("id-ID")}`,
                color: "text-[#EC5B13]",
                bg: "bg-[#EC5B13]/10",
              },
              {
                icon: "receipt_long",
                label: "Transaksi",
                value: `${payments.length} pembayaran`,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20",
              },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pay Section — hanya tampil jika ada rental aktif & tidak pending ── */}
          {!loading && rental && !hasPending && (
            <div id="pay-section" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pilih Metode Pembayaran</h3>

                {/* Method tabs */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id:"manual",   icon:"account_balance",   label:"Manual Transfer", sub:"Upload bukti bayar"   },
                    { id:"metamask", icon:"currency_bitcoin",  label:"MetaMask / Web3", sub:"Bayar via blockchain" },
                  ].map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        method === m.id ? "border-[#EC5B13] bg-[#EC5B13]/5" : "border-slate-200 dark:border-slate-700 hover:border-[#EC5B13]/40"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${method === m.id ? "bg-[#EC5B13] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                        <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                      </div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Manual */}
                {method === "manual" && (
                  <div className="space-y-5">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transfer ke Rekening</p>
                      {[
                        { bank:"BCA",       no:"1234567890",  name:"PropShare Campus" },
                        { bank:"BRI",       no:"0987654321",  name:"PropShare Campus" },
                        { bank:"GOPAY/OVO", no:"081234567890",name:"PropShare"        },
                      ].map(r => (
                        <div key={r.bank} className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{r.bank}</p>
                            <p className="text-xs text-slate-500">{r.no} — {r.name}</p>
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(r.no); Swal.fire({icon:"success",title:"Disalin!",timer:800,showConfirmButton:false}); }}
                            className="text-xs font-bold text-[#EC5B13] flex items-center gap-1 hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>Salin
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Nominal Transfer</span>
                      <span className="font-black text-[#EC5B13] text-lg">Rp {rentAmount.toLocaleString("id-ID")}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Bukti Transfer</p>
                      {proofPreview ? (
                        <div className="relative rounded-xl overflow-hidden h-48 bg-slate-100 dark:bg-slate-800">
                          <img src={proofPreview} alt="bukti" className="w-full h-full object-contain" />
                          <button onClick={() => { setProofFile(null); setProofPreview(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow"
                          >
                            <span className="material-symbols-outlined text-[16px] text-slate-600">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#EC5B13]/50 cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-colors">
                          <span className="material-symbols-outlined text-3xl text-slate-400">upload_file</span>
                          <p className="text-sm text-slate-500 font-medium">Klik untuk upload foto bukti transfer</p>
                          <p className="text-xs text-slate-400">JPG, PNG, PDF — maks 5MB</p>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>

                    <button onClick={handleManualPay} disabled={submitting || !proofFile}
                      className="w-full py-4 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#d44e0f] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting
                        ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Mengirim...</>
                        : <><span className="material-symbols-outlined text-[18px]">send</span>Kirim Bukti Bayar</>}
                    </button>
                  </div>
                )}

                {/* MetaMask */}
                {method === "metamask" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id:"PSC", icon:"toll",              label:"PSC Token",   sub:"PropShare Coin" },
                        { id:"ETH", icon:"currency_exchange", label:"Sepolia ETH", sub:"Token asli"   },
                      ].map(t => (
                        <button key={t.id} onClick={() => setTokenType(t.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${tokenType === t.id ? "border-[#EC5B13] bg-[#EC5B13]/5" : "border-slate-200 dark:border-slate-700"}`}
                        >
                          <span className={`material-symbols-outlined text-xl ${tokenType === t.id ? "text-[#EC5B13]" : "text-slate-400"}`}>{t.icon}</span>
                          <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{t.label}</p>
                          <p className="text-xs text-slate-500">{t.sub}</p>
                        </button>
                      ))}
                    </div>

                    {wallet ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-xs font-bold text-green-600">Wallet Terhubung</p>
                        </div>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400">{wallet}</p>
                        <div className="flex gap-4 pt-1">
                          <div><p className="text-[10px] text-slate-400">ETH</p><p className="text-sm font-bold text-slate-900 dark:text-white">{ethBalance ?? "—"}</p></div>
                          {PSC_ADDRESS && <div><p className="text-[10px] text-slate-400">PSC</p><p className="text-sm font-bold text-slate-900 dark:text-white">{pscBalance ?? "—"}</p></div>}
                        </div>
                      </div>
                    ) : (
                      <button onClick={connectWallet} disabled={web3Loading}
                        className="w-full py-3 border-2 border-[#EC5B13] text-[#EC5B13] font-bold rounded-xl hover:bg-[#EC5B13]/5 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {web3Loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Menghubungkan...</> : <>
                          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>Hubungkan MetaMask
                        </>}
                      </button>
                    )}

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        🔗 Network: <strong>Sepolia Testnet</strong> (simulasi gratis)<br/>
                        Dapatkan Sepolia ETH gratis di <a href="https://sepoliafaucet.com" target="_blank" className="underline font-bold">sepoliafaucet.com</a>
                      </p>
                    </div>

                    <button onClick={handleWeb3Pay} disabled={web3Loading}
                      className="w-full py-4 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#d44e0f] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {web3Loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Memproses...</> :
                      !wallet ? <><span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>Hubungkan & Bayar</> :
                      <><span className="material-symbols-outlined text-[18px]">bolt</span>Bayar dengan {tokenType}</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Empty state saat belum punya rental & tidak loading ── */}
          {!loading && !rental && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300">payments</span>
              <p className="font-bold text-slate-500">Belum ada tagihan</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Tagihan pembayaran akan muncul setelah Anda menyewa properti dan disetujui oleh owner.
              </p>
              <button
                onClick={() => navigate("/tenant/marketplace")}
                className="mt-2 px-5 py-2 bg-[#EC5B13]/10 text-[#EC5B13] font-bold rounded-xl text-sm hover:bg-[#EC5B13]/20"
              >
                Jelajahi Properti →
              </button>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Riwayat Pembayaran</h3>
              <span className="text-xs text-slate-400">{payments.length} transaksi</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading
                ? [...Array(3)].map((_, i) => <div key={i} className="p-5"><Skeleton className="h-10" /></div>)
                : payments.length > 0
                  ? payments.map(p => (
                    <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === "VERIFIED" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                          <span className="material-symbols-outlined text-[20px]">{p.status === "VERIFIED" ? "check_circle" : "hourglass_top"}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            Sewa — {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "—"}
                          </p>
                          <span className="text-xs text-slate-400">
                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.txHash && (
                              <a href={`https://sepolia.etherscan.io/tx/${p.txHash}`} target="_blank" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">link</span>Etherscan
                              </a>
                            )}
                            <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString("id-ID")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">Rp {p.amount?.toLocaleString("id-ID")}</p>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))
                  : (
                    <div className="p-12 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                      <p className="text-slate-400 text-sm">Belum ada pembayaran</p>
                    </div>
                  )
              }
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
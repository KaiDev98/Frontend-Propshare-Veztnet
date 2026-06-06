import { useState, useEffect, useMemo } from "react";
import InvestorSidebar from "../../components/InvestorSidebar";
import InvestorHeader from "../../components/InvestorHeader";
import api from "../../utils/api";

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

// ─── TX Type Config ────────────────────────────────────────────────────────────
const TX_TYPE = {
  INVESTMENT: { label: "Token Minting",    icon: "token",    color: "text-[#EC5B13]" },
  DIVIDEND:   { label: "Dividend Claim",   icon: "payments", color: "text-green-500"  },
  PAYMENT:    { label: "Rent Payment",     icon: "receipt",  color: "text-blue-500"   },
};

const STATUS_STYLE = {
  CONFIRMED: { label: "Confirmed", className: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  VERIFIED:  { label: "Confirmed", className: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  PENDING:   { label: "Pending",   className: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 animate-pulse" },
  FAILED:    { label: "Failed",    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  CLAIMED:   { label: "Confirmed", className: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
};

const PER_PAGE = 10;

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function InvestorTransactions() {
  const [loading,      setLoading]      = useState(true);
  const [investments,  setInvestments]  = useState([]);
  const [dividends,    setDividends]    = useState([]);
  const [user,         setUser]         = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page,         setPage]         = useState(1);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ─── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [invRes, divRes] = await Promise.allSettled([
          api.get("/investments/my-portfolio"),
          api.get("/dividends/history"),
        ]);

        if (invRes.status === "fulfilled") {
          const raw = invRes.value.data?.data;
          setInvestments(
            Array.isArray(raw) ? raw
            : Array.isArray(raw?.investments) ? raw.investments
            : []
          );
        }
        if (divRes.status === "fulfilled") {
          const raw = divRes.value.data?.data;
          setDividends(
            Array.isArray(raw) ? raw
            : Array.isArray(raw?.dividends) ? raw.dividends
            : []
          );
        }
      } catch (err) {
        console.error("Fetch transactions error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Merge semua transaksi jadi satu list ─────────────────────────────────────
  const allTransactions = useMemo(() => {
    const inv = (Array.isArray(investments) ? investments : []).map((i) => ({
      id:         i.id,
      type:       "INVESTMENT",
      assetTitle: i.property?.title ?? "Properti",
      assetCode:  `PROP-${i.propertyId?.slice(0, 6).toUpperCase() ?? "XX"}`,
      amount:     i.totalPaid ?? 0,
      amountSub:  `${(i.tokenAmount ?? 0).toLocaleString()} Token`,
      status:     "CONFIRMED",
      txHash:     i.txHash ?? `0x${i.id?.slice(0, 8)}...${i.id?.slice(-4)}`,
      createdAt:  i.createdAt,
    }));

    const div = (Array.isArray(dividends) ? dividends : []).map((d) => ({
      id:         `div-${d.id}`,
      type:       "DIVIDEND",
      assetTitle: d.property?.title ?? "Properti",
      assetCode:  "Dividend Yield",
      amount:     d.amount ?? 0,
      amountSub:  "Monthly Yield",
      status:     d.status === "CLAIMED" ? "CLAIMED" : "PENDING",
      txHash:     d.txHash ?? `0x${d.id?.slice(0, 8)}...${d.id?.slice(-4)}`,
      createdAt:  d.createdAt,
    }));

    return [...inv, ...div].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [investments, dividends]);

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      const q = search.toLowerCase();

      const matchSearch =
        !search ||
        tx.assetTitle.toLowerCase().includes(q) ||
        tx.txHash?.toLowerCase().includes(q) ||
        tx.assetCode?.toLowerCase().includes(q);

      const matchType =
        filterType === "all" ||
        (filterType === "minting"  && tx.type === "INVESTMENT") ||
        (filterType === "dividend" && tx.type === "DIVIDEND");

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "confirmed" && ["CONFIRMED", "CLAIMED", "VERIFIED"].includes(tx.status)) ||
        (filterStatus === "pending"   && tx.status === "PENDING") ||
        (filterStatus === "failed"    && tx.status === "FAILED");

      return matchSearch && matchType && matchStatus;
    });
  }, [allTransactions, search, filterType, filterStatus]);

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── Stats ────────────────────────────────────────────────────────────────────
  const totalTx        = allTransactions.length;
  const totalInvested  = (Array.isArray(investments) ? investments : [])
    .reduce((s, i) => s + (i.totalPaid ?? 0), 0);
  const walletAddress  = user?.walletAddress ?? null;
  const walletShort    = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "No Wallet";

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Type", "Asset", "Amount", "Status", "TX Hash"],
      ...allTransactions.map((tx) => [
        new Date(tx.createdAt).toLocaleDateString("id-ID"),
        TX_TYPE[tx.type]?.label ?? tx.type,
        tx.assetTitle,
        `Rp ${tx.amount.toLocaleString("id-ID")}`,
        tx.status,
        tx.txHash,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "propshare_transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">
      <InvestorSidebar activeLabel="Transactions" />

      <main className="flex-1 min-w-0 max-w-full overflow-hidden">

        {/* ── Header ── */}
        <InvestorHeader search={search} onSearch={setSearch} />

        <div className="p-8 space-y-8">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                {/* Total Transactions */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EC5B13]/5 rounded-full group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Total Transactions
                  </p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalTx}</h3>
                    <span className="text-green-500 text-sm font-bold flex items-center mb-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      {investments.length} investasi
                    </span>
                  </div>
                </div>

                {/* Total Invested */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EC5B13]/5 rounded-full group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Total Invested
                  </p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate w-full block">
                      Rp {totalInvested.toLocaleString("id-ID")}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Across all properties</p>
                </div>

                {/* Wallet */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EC5B13]/5 rounded-full group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Active Wallet Address
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white truncate max-w-[160px]">
                      {walletShort}
                    </h3>
                    <button
                      onClick={handleCopyWallet}
                      disabled={!walletAddress}
                      className="text-[#EC5B13] hover:bg-[#EC5B13]/10 p-2 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined">
                        {copied ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-500 font-medium mt-1">
                      Copied to clipboard!
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="border-none bg-transparent text-sm focus:ring-0 p-0 font-medium cursor-pointer pr-2 outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Types</option>
                  <option value="minting">Token Minting</option>
                  <option value="dividend">Dividend Claim</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="border-none bg-transparent text-sm focus:ring-0 p-0 font-medium cursor-pointer pr-2 outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Result count */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="material-symbols-outlined text-[#EC5B13] text-sm">receipt_long</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {filtered.length} transaksi
                </span>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={allTransactions.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[#EC5B13] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#EC5B13]/25 hover:bg-[#d44e0f] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">download</span>
              Download History
            </button>
          </div>

          {/* ── Transaction Table ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm max-w-full">
            <div className="overflow-x-auto w-full block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {[
                      "Date & Time",
                      "Transaction Type",
                      "Asset Name",
                      "Amount",
                      "Status",
                      "TX Hash",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${
                          h === "TX Hash" ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length > 0 ? (
                    paginated.map((tx) => {
                      const typeConf   = TX_TYPE[tx.type]   ?? { label: tx.type,   icon: "receipt", color: "text-slate-400" };
                      const statusConf = STATUS_STYLE[tx.status] ?? { label: tx.status, className: "bg-slate-100 text-slate-500" };

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300`}>
                              <span className={`material-symbols-outlined ${typeConf.color}`}>
                                {typeConf.icon}
                              </span>
                              {typeConf.label}
                            </span>
                          </td>

                          {/* Asset */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {tx.assetTitle}
                            </div>
                            <div className="text-xs text-slate-400">{tx.assetCode}</div>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              Rp {tx.amount.toLocaleString("id-ID")}
                            </div>
                            <div className="text-xs text-slate-400">{tx.amountSub}</div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusConf.className}`}>
                              {statusConf.label}
                            </span>
                          </td>

                          {/* TX Hash */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-[#EC5B13] font-mono text-sm inline-flex items-center gap-1 group cursor-pointer hover:underline">
                              {tx.txHash?.length > 20
                                ? `${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-6)}`
                                : tx.txHash ?? "—"}
                              <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                                open_in_new
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300">
                          receipt_long
                        </span>
                        <p className="text-slate-400 text-sm mt-3 font-medium">
                          {search || filterType !== "all" || filterStatus !== "all"
                            ? "Tidak ada transaksi yang cocok dengan filter"
                            : "Belum ada riwayat transaksi"}
                        </p>
                        {(search || filterType !== "all" || filterStatus !== "all") && (
                          <button
                            onClick={() => { setSearch(""); setFilterType("all"); setFilterStatus("all"); }}
                            className="mt-3 text-sm text-[#EC5B13] font-bold hover:underline"
                          >
                            Reset Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
                results
              </p>

              <div className="flex items-center gap-2">
                {/* Prev */}
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 text-slate-400"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                        page === p
                          ? "bg-[#EC5B13] text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="mx-1 text-slate-400">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 ${
                        page === totalPages ? "bg-[#EC5B13] text-white" : ""
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Verification Note ── */}
          <div className="flex items-start gap-3 p-5 bg-[#EC5B13]/5 rounded-xl border border-[#EC5B13]/10">
            <span className="material-symbols-outlined text-[#EC5B13] shrink-0">info</span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Verification Note
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mt-0.5">
                All transactions displayed are recorded permanently on the blockchain.
                For deep auditing, use the TX hash to view on Etherscan or other block explorers.
              </p>
            </div>
          </div>

        </div>

        <div className="h-12" />
      </main>
    </div>
  );
}
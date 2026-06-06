import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerSidebar from "../../components/OwnerSidebar";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Total Funding Received",
    value: "$450,230.50",
    sub: "+12.4%",
    subColor: "text-green-500",
    extra: "progress",
  },
  {
    label: "Active Investors",
    value: "1,248",
    sub: "+52 today",
    subColor: "text-green-500",
    extra: "avatars",
  },
  {
    label: "Average Contribution",
    value: "$360.75",
    sub: "Per Investor",
    subColor: "text-slate-400",
    extra: "bar",
  },
];

const INVESTOR_TYPES = ["All Investor Types", "Student", "Faculty", "Alumni"];
const AMOUNT_RANGES  = ["Contribution Amount", "$0 - $500", "$500 - $5k", "$5k+"];

const TRANSACTIONS = [
  {
    id: "0x7a...4e92", investorId: "Investor_9921",
    type: "Student",  typeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    status: "Verified", statusColor: "text-green-600 dark:text-green-400", statusIcon: "verified", pending: false,
    amount: "$1,250.00", tokens: "125.0 RWA",
    date: "Oct 24, 2023", time: "14:22:15 UTC", tx: "0x9f1...88b2",
  },
  {
    id: "0x3b...8f21", investorId: "Investor_7730",
    type: "Faculty", typeColor: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    status: "Pending", statusColor: "text-amber-600 dark:text-amber-400", statusIcon: "hourglass_empty", pending: true,
    amount: "$5,000.00", tokens: "500.0 RWA",
    date: "Oct 24, 2023", time: "14:18:44 UTC", tx: "0x5e2...99a1",
  },
  {
    id: "0x12...99c4", investorId: "Investor_0192",
    type: "Alumni", typeColor: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    status: "Verified", statusColor: "text-green-600 dark:text-green-400", statusIcon: "verified", pending: false,
    amount: "$250.00", tokens: "25.0 RWA",
    date: "Oct 24, 2023", time: "13:55:01 UTC", tx: "0x2c0...44d7",
  },
  {
    id: "0xab...2105", investorId: "Investor_8841",
    type: "Student", typeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    status: "Verified", statusColor: "text-green-600 dark:text-green-400", statusIcon: "verified", pending: false,
    amount: "$1,000.00", tokens: "100.0 RWA",
    date: "Oct 24, 2023", time: "12:05:12 UTC", tx: "0x8e1...77b4",
  },
];

const AVATAR_SRCS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZDql07k15dnXf6oaXFW5-ZVO6ck0jkgzdSSW-EjGNjjUpxravbBZxjxw1Y5JrcmNz9Fp0Jx4LNPODMY8Co9EgPLpbnY5g9DWLDZOsa0EkMU04UDfH-hj8WSU5zMwSYa8REWtTDbIKdWytwDczQygmKv0cJITLSOXUeGOeOgTnjHaqeLw15r9L9o3WOXAday4wCjD8CMPUucFSP9RSo-qjel7nRMEh_W7yqSlkosUkeA8trbN0EKrzaJhESTvmSdwCX5LGeTYv",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFbMKwFWSnzfdqC3LEfGXUIAqO6PAJIiSNIorbslASvSPuEZokJ_tNdGPb6F_KsUMW9NjLrrQ4hgv3v-yzrK0rkD2A7d7I2kDIq7alRGsfvrEZ5f7-2M7N2mceyBnJtwy3HDHk-DDtNM8DydmP-fnkoftMIJI5wq5jUtnfpurInhb7QLMDHvCKwU-4HIH8-W_AJ7xq-li9F6-vuP3Dc6ujbyy4gvb2E-dGYIDNES81XCZoL3rCC0MNROKYrLBKE3ZUJEBR98JS",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuMxB3E7E8aDSzMkiWRHZ0chS5DJq5loMQurDZx4VHvNTTg8tCFyyswnkl0KCtQT6ga5TnSZkFw_1qsTltrkWqKe2XEGveuh6dyYMpXZwRq1scgOLjQeOU3BfmZ0ngaG73J_SwCWeL9PmyfC_WwKktwvlXqk2M3SVHzWUA8PKlwPCXCu6zGt-hRzZi_MCZWNJvWoyJ36EQFNSGe6W3aaPeEBkNPRVSjf7H_rGd-nngegEA-YyBWyLcauPtvRxoGRdmUUs06Bp8",
];

const TABLE_HEADS = [
  { label: "Investor ID",    align: "" },
  { label: "Type",           align: "" },
  { label: "Status",         align: "" },
  { label: "Amount (USD)",   align: "text-right" },
  { label: "Tokens (RWA)",   align: "text-right" },
  { label: "Date / Time",    align: "" },
  { label: "TX Hash",        align: "" },
];

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function AllTransaction() {
  const navigate = useNavigate();
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("All Investor Types");
  const [amtFilter,  setAmtFilter]  = useState("Contribution Amount");
  const [page,       setPage]       = useState(1);

  return (
    <div className="flex min-h-screen bg-[#f8f6f6] dark:bg-[#221610]">

      <OwnerSidebar activeLabel="Dashboard Funding Real-time" />

      <main className="flex-1 overflow-y-auto p-8">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/owner/dashboard-funding")}
                className="flex items-center gap-1 text-slate-400 hover:text-[#EC5B13] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Live Investment Feed
              </h2>
              <span className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full uppercase tracking-widest gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                Live
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Central Campus Residency B •{" "}
              <span className="text-[#EC5B13] font-medium">ID: CCR-002-B</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#EC5B13]/20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-[#EC5B13]/5 transition-all">
              <span className="material-symbols-outlined text-lg">download</span>
              Export CSV/PDF
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EC5B13] text-white font-bold text-sm shadow-xl shadow-[#EC5B13]/25 hover:scale-[1.02] transition-all">
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh Data
            </button>
          </div>
        </header>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Total Funding */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#EC5B13]/10 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-slate-500 font-medium">Total Funding Received</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">$450,230.50</h3>
              <span className="text-green-500 text-xs font-bold">+12.4%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3">
              <div className="bg-[#EC5B13] h-1.5 rounded-full" style={{ width: "75%" }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">75% of Target Met</p>
          </div>

          {/* Active Investors */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#EC5B13]/10 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-slate-500 font-medium">Active Investors</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">1,248</h3>
              <span className="text-green-500 text-xs font-bold">+52 today</span>
            </div>
            <div className="flex -space-x-2 mt-4 overflow-hidden">
              {AVATAR_SRCS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Investor"
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                />
              ))}
              <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-[#EC5B13]/20 text-[#EC5B13] text-[10px] flex items-center justify-center font-black">
                +1.2k
              </div>
            </div>
          </div>

          {/* Average Contribution */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#EC5B13]/10 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-slate-500 font-medium">Average Contribution</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">$360.75</h3>
              <span className="text-slate-400 text-xs font-bold">Per Investor</span>
            </div>
            <div className="mt-4 flex gap-1 items-end h-4">
              <div className="h-2 flex-1 bg-[#EC5B13]/30 rounded-sm" />
              <div className="h-3 flex-1 bg-[#EC5B13]/60 rounded-sm" />
              <div className="h-4 flex-1 bg-[#EC5B13] rounded-sm" />
            </div>
          </div>

        </div>

        {/* ── Table Card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#EC5B13]/10 shadow-sm overflow-hidden">

          {/* Filter Bar */}
          <div className="p-4 border-b border-[#EC5B13]/10 bg-[#EC5B13]/5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Investor ID, Wallet Address or TX Hash..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border-none ring-1 ring-[#EC5B13]/20 focus:ring-[#EC5B13] bg-white dark:bg-slate-800 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm font-medium border-none ring-1 ring-[#EC5B13]/20 focus:ring-[#EC5B13] rounded-xl bg-white dark:bg-slate-800 py-2 pl-3 pr-8 outline-none text-slate-900 dark:text-white"
              >
                {INVESTOR_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select
                value={amtFilter}
                onChange={(e) => setAmtFilter(e.target.value)}
                className="text-sm font-medium border-none ring-1 ring-[#EC5B13]/20 focus:ring-[#EC5B13] rounded-xl bg-white dark:bg-slate-800 py-2 pl-3 pr-8 outline-none text-slate-900 dark:text-white"
              >
                {AMOUNT_RANGES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-[#EC5B13]/20 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-[#EC5B13]/5 transition-colors">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                Date Range
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {TABLE_HEADS.map((h) => (
                    <th
                      key={h.label}
                      className={`px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest ${h.align}`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EC5B13]/5">
                {TRANSACTIONS.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#EC5B13]/5 transition-colors"
                  >
                    {/* Investor ID */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tx.id}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                        {tx.investorId}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${tx.typeColor}`}>
                        {tx.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-sm font-bold ${tx.statusColor} ${tx.pending ? "animate-pulse" : ""}`}>
                        <span className="material-symbols-outlined text-sm">{tx.statusIcon}</span>
                        {tx.status}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">
                      {tx.amount}
                    </td>

                    {/* Tokens */}
                    <td className="px-6 py-4 text-right font-medium text-[#EC5B13]">
                      {tx.tokens}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{tx.date}</p>
                      <p className="text-[10px] text-slate-400">{tx.time}</p>
                    </td>

                    {/* TX Hash */}
                    <td className="px-6 py-4">
                      
                       <a href="#"
                        className="flex items-center gap-1 text-[#EC5B13] hover:underline text-xs font-mono font-bold"
                      >
                        {tx.tx}
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[#EC5B13]/10 flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs font-medium text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">1-10</span> of{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">1,248</span> transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-[#EC5B13]/20 hover:bg-[#EC5B13]/5 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    page === p
                      ? "bg-[#EC5B13] text-white"
                      : "hover:bg-[#EC5B13]/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-slate-400 text-xs font-bold">...</span>
              <button
                onClick={() => setPage(125)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  page === 125
                    ? "bg-[#EC5B13] text-white"
                    : "hover:bg-[#EC5B13]/5 text-slate-600 dark:text-slate-400"
                }`}
              >
                125
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-[#EC5B13]/20 hover:bg-[#EC5B13]/5 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Message */}
        <div className="mt-6 flex items-center gap-3 p-4 bg-[#EC5B13]/5 rounded-xl border border-[#EC5B13]/10 text-slate-600 dark:text-slate-400 text-xs italic">
          <span className="material-symbols-outlined text-[#EC5B13] text-sm shrink-0">info</span>
          Data is fetched directly from the Ethereum Mainnet and refreshed every 15 seconds.
          All contribution amounts are converted to USD at the time of block confirmation.
        </div>

      </main>
    </div>
  );
}
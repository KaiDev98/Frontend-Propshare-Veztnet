import { useState, useEffect } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const FUNDING_PERIODS = ["30 Hari", "60 Hari", "90 Hari"];

// Format angka → "5,000,000"
const formatRupiah = (val) => {
  const num = val.replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Hapus koma → angka murni "5000000"
const parseNumber = (val) => parseInt(val.replace(/,/g, "") || "0");

// ─── Sub Components ────────────────────────────────────────────────────────────

function TokenPreviewCard({ target, pricePerToken, roi }) {
  const rawTarget = parseNumber(target);
  const rawPrice  = parseNumber(pricePerToken);
  const supply    = rawPrice > 0 ? Math.floor(rawTarget / rawPrice) : 0;

  return (
    <div className="sticky top-28 space-y-6">
      <div className="bg-gradient-to-br from-[#EC5B13] to-[#FF8C42] rounded-3xl p-[3px] shadow-2xl shadow-[#EC5B13]/20">
        <div className="bg-white dark:bg-[#221610] rounded-[calc(1.5rem-3px)] p-6 overflow-hidden relative">
          <div className="absolute -right-12 -top-12 size-32 bg-[#EC5B13]/5 rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative">
            <div className="size-10 bg-[#EC5B13]/10 rounded-full flex items-center justify-center text-[#EC5B13]">
              <span className="material-symbols-outlined">token</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Token Preview</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Real World Asset
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {[
              { label: "Token Ticker",    value: "PROP-2405",                                              color: "text-[#EC5B13]" },
              { label: "Capital Goal",    value: rawTarget > 0 ? `Rp ${target}` : "—",                    color: "" },
              { label: "Price / Token",   value: rawPrice > 0  ? `Rp ${pricePerToken}` : "—",             color: "" },
              { label: "Token Supply",    value: supply > 0    ? `${supply.toLocaleString()} UNIT` : "—", color: "" },
              { label: "Projected Yield", value: roi           ? `+${roi}% p.a` : "—",                    color: "text-emerald-500" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-center pb-3 ${
                  i < arr.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
                }`}
              >
                <span className="text-xs text-slate-500">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#EC5B13] text-sm mt-0.5">info</span>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                Estimasi ini bersifat indikatif. Smart contract akan secara otomatis
                mendistribusikan dividen setelah masa tunggu selesai.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-[#221610]/40 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div className="size-10 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">help</span>
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800 dark:text-white">Butuh Bantuan?</h5>
          <p className="text-xs text-slate-500">Tim kami siap membantu Anda menghitung ROI ideal.</p>
          <button className="text-xs text-[#EC5B13] font-bold mt-1 hover:underline">
            Hubungi Advisor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

// Props:
// values   → { fundingTarget, tokenPrice, totalTokens } dari parent
// onChange → function({ fundingTarget, tokenPrice, totalTokens }) kirim ke parent
export default function FinancialGoals({ values = {}, onChange }) {

  // State lokal pakai format rupiah untuk display
  const [target,        setTarget]  = useState(
    values.fundingTarget ? Number(values.fundingTarget).toLocaleString() : "5,000,000,000"
  );
  const [pricePerToken, setPrice]   = useState(
    values.tokenPrice ? Number(values.tokenPrice).toLocaleString() : "1,000,000"
  );
  const [totalTokens,   setTotal]   = useState(
    values.totalTokens ? Number(values.totalTokens).toLocaleString() : "5,000"
  );
  const [roi,           setRoi]     = useState("12.5");
  const [period,        setPeriod]  = useState("30 Hari");

  // ─── Auto-hitung total token ───────────────────────────────────────────────
  useEffect(() => {
    const rawTarget = parseNumber(target);
    const rawPrice  = parseNumber(pricePerToken);
    if (rawTarget > 0 && rawPrice > 0) {
      const result = Math.floor(rawTarget / rawPrice);
      setTotal(result.toLocaleString());
    } else {
      setTotal("0");
    }
  }, [target, pricePerToken]);

  // ─── Kirim ke parent setiap kali nilai berubah ─────────────────────────────
  useEffect(() => {
    if (!onChange) return;
    onChange({
      fundingTarget: parseNumber(target),
      tokenPrice:    parseNumber(pricePerToken),
      totalTokens:   parseNumber(totalTokens),
    });
  }, [target, pricePerToken, totalTokens]);

  const handleCurrency = (setter) => (e) => {
    setter(formatRupiah(e.target.value));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ── Left: Form ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-[#221610]/40 border border-[#EC5B13]/10 rounded-2xl p-6 shadow-sm">

          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-[#EC5B13]">payments</span>
            Detail Pendanaan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Target Pendanaan */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Target Pendanaan (IDR) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  value={target}
                  onChange={handleCurrency(setTarget)}
                  className="w-full pl-12 pr-4 py-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl focus:ring-2 focus:ring-[#EC5B13] focus:border-transparent transition-all outline-none font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Harga per Token */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Harga per Token (IDR) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  value={pricePerToken}
                  onChange={handleCurrency(setPrice)}
                  className="w-full pl-12 pr-4 py-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl focus:ring-2 focus:ring-[#EC5B13] focus:border-transparent transition-all outline-none font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Total Token — auto calculated */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Total Token Diterbitkan
              </label>
              <input
                type="text"
                value={totalTokens}
                disabled
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400">
                Dihitung otomatis: Target ÷ Harga per Token
              </p>
            </div>

            {/* Estimasi ROI */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Estimasi ROI Tahunan (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roi}
                  onChange={(e) => setRoi(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full px-4 py-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl focus:ring-2 focus:ring-[#EC5B13] focus:border-transparent transition-all outline-none font-medium text-slate-900 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#EC5B13] font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Periode Pendanaan */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Periode Pendanaan
              </label>
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-3 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl focus:ring-2 focus:ring-[#EC5B13] focus:border-transparent transition-all outline-none appearance-none font-medium text-slate-900 dark:text-white"
                >
                  {FUNDING_PERIODS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  expand_more
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ROI Breakdown */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-5 flex gap-4">
          <span className="material-symbols-outlined text-emerald-500 shrink-0 mt-0.5">
            trending_up
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Estimasi Distribusi Dividen
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
              Dengan ROI <strong>{roi || "0"}%</strong> per tahun, setiap token senilai{" "}
              <strong>Rp {pricePerToken || "0"}</strong> akan menghasilkan sekitar{" "}
              <strong>
                Rp{" "}
                {Math.floor(
                  (parseNumber(pricePerToken) * parseFloat(roi || "0")) / 100
                ).toLocaleString()}
              </strong>{" "}
              per tahun.
            </p>

            {/* Summary yang akan disimpan */}
            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 grid grid-cols-3 gap-2">
              {[
                { label: "Funding Target", value: `Rp ${target}` },
                { label: "Token Price",    value: `Rp ${pricePerToken}` },
                { label: "Total Tokens",   value: totalTokens },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Right: Token Preview ── */}
      <TokenPreviewCard
        target={target}
        pricePerToken={pricePerToken}
        roi={roi}
      />

    </div>
  );
}

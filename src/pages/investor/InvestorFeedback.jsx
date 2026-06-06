import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import InvestorSidebar from "../../components/InvestorHeader";
import Swal from "sweetalert2";

const PROPERTIES = [
  { value: "", label: "Choose a property to review..." },
  { value: "stellar", label: "Stellar Student Suites - Austin, TX" },
  { value: "grand", label: "Grand Canyon Living - Flagstaff, AZ" },
  { value: "apex", label: "Apex Collegiate Residences - Ann Arbor, MI" },
];

const PREVIOUS_REVIEWS = [
  {
    id: 1,
    property: "Apex Collegiate",
    status: "Published",
    statusColor: "bg-emerald-100 text-emerald-700",
    rating: 4,
    comment:
      "Strong Q3 performance. Management team was responsive to maintenance requests during the heavy move-in period.",
    date: "Oct 12, 2023",
  },
  {
    id: 2,
    property: "Grand Canyon Living",
    status: "Under Review",
    statusColor: "bg-amber-100 text-amber-700",
    rating: 3,
    comment:
      "Occupancy rates are slightly below projection. Amenities need better upkeep to attract the higher-end student demographic.",
    date: "Jan 05, 2024",
  },
];

const METRICS = [
  { key: "financial", label: "Financial Performance", initial: 4 },
  { key: "management", label: "Management Quality", initial: 3 },
  { key: "overall", label: "Overall Satisfaction", initial: 5 },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <span
              className={`material-symbols-outlined text-3xl transition-colors ${
                filled ? "text-[#EC5B13]" : "text-slate-300 dark:text-slate-600"
              }`}
              style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RatingLabel({ value }) {
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${
        value >= 4
          ? "bg-emerald-100 text-emerald-700"
          : value === 3
          ? "bg-amber-100 text-amber-700"
          : value > 0
          ? "bg-red-100 text-red-600"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {labels[value] || "Not rated"}
    </span>
  );
}

export default function InvestorFeedback() {
  const navigate = useNavigate();

  const [property, setProperty] = useState("");
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState({ financial: 4, management: 3, overall: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avgRating =
    Math.round(
      ((ratings.financial + ratings.management + ratings.overall) / 3) * 10
    ) / 10;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!property) {
      Swal.fire({
        title: "Pilih Properti",
        text: "Harap pilih properti yang ingin Anda ulas.",
        icon: "warning",
        confirmButtonColor: "#EC5B13",
        customClass: { popup: "rounded-2xl", confirmButton: "rounded-xl font-bold px-6" },
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);

    await Swal.fire({
      title: "Review Terkirim! 🎉",
      text: "Terima kasih. Ulasan Anda sedang dalam proses review.",
      icon: "success",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "font-bold",
        timerProgressBar: "bg-[#EC5B13]",
      },
    });

    setProperty("");
    setComment("");
    setRatings({ financial: 4, management: 3, overall: 5 });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f0a08] overflow-hidden">
      <InvestorSidebar activeLabel="Feedback" />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#1a0f0a] border-b border-slate-200 dark:border-slate-800 px-8 h-16 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EC5B13]/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#EC5B13] text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rate_review
              </span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                Investor Feedback
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Portfolio Review & Rating
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search properties..."
                className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-[#EC5B13]/30 focus:outline-none w-56 transition-all"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-[#EC5B13] transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EC5B13] rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Submit Your Feedback
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
                Your insights help us maintain the highest standards of architectural excellence
                and management performance across the PropShare Campus portfolio.
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              {/* ── LEFT: Form ── */}
              <div className="flex-1 min-w-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Property Selection */}
                  <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                      Select Property from Portfolio
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                        location_city
                      </span>
                      <select
                        value={property}
                        onChange={(e) => setProperty(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] focus:outline-none cursor-pointer transition-all"
                      >
                        {PROPERTIES.map((p) => (
                          <option key={p.value} value={p.value} disabled={p.value === ""}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Rating Card */}
                  <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Performance Metrics
                      </h3>
                      <div className="flex items-center gap-2 bg-[#EC5B13]/10 px-3 py-1.5 rounded-full">
                        <span
                          className="material-symbols-outlined text-[#EC5B13] text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="text-sm font-bold text-[#EC5B13]">
                          {avgRating} avg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-7">
                      {METRICS.map(({ key, label }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-2.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {label}
                            </label>
                            <RatingLabel value={ratings[key]} />
                          </div>
                          <StarRating
                            value={ratings[key]}
                            onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))}
                          />
                          {/* Progress bar */}
                          <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#EC5B13] to-[#ff8c4b] rounded-full transition-all duration-500"
                              style={{ width: `${(ratings[key] / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                      Detailed Experience
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={5}
                      placeholder="Provide context for your ratings. Mention specific strengths or areas for improvement regarding the property's performance or management..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] focus:outline-none resize-none transition-all"
                    />
                    <div className="flex justify-end mt-1.5">
                      <span className="text-xs text-slate-400">{comment.length} chars</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex items-center gap-2.5 bg-gradient-to-br from-[#EC5B13] to-[#d44e0f] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-[#EC5B13]/30 hover:shadow-[#EC5B13]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            send
                          </span>
                          Submit Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── RIGHT: Sidebar ── */}
              <div className="w-full xl:w-80 shrink-0 space-y-5">
                {/* Previous Reviews */}
                <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-5">
                    <span
                      className="material-symbols-outlined text-[#EC5B13] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      history
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Previous Reviews
                    </h3>
                    <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {PREVIOUS_REVIEWS.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {PREVIOUS_REVIEWS.map((r) => (
                      <div
                        key={r.id}
                        className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#EC5B13]/40 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#EC5B13] transition-colors">
                            {r.property}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.statusColor}`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`material-symbols-outlined text-[14px] ${
                                s <= r.rating ? "text-[#EC5B13]" : "text-slate-300 dark:text-slate-600"
                              }`}
                              style={{
                                fontVariationSettings: s <= r.rating ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          ))}
                          <span className="ml-1 text-xs text-slate-400 font-medium">
                            {r.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {r.comment}
                        </p>
                        <p className="mt-2.5 text-[11px] text-slate-400 font-medium">{r.date}</p>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 py-2.5 text-xs font-bold text-[#EC5B13] hover:bg-[#EC5B13]/5 rounded-xl transition-colors">
                    View All History →
                  </button>
                </div>

                {/* Stats Summary */}
                <div className="bg-white dark:bg-[#1a0f0a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[#EC5B13] text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      insights
                    </span>
                    Your Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Reviews Given", value: "7", icon: "rate_review" },
                      { label: "Avg Rating", value: "4.1", icon: "star" },
                      { label: "Properties", value: "3", icon: "apartment" },
                      { label: "Pending", value: "1", icon: "pending" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center"
                      >
                        <span
                          className="material-symbols-outlined text-[#EC5B13] text-[20px] block mb-1"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {s.icon}
                        </span>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                          {s.value}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decorative Banner */}
                <div className="rounded-2xl overflow-hidden relative h-44 shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#EC5B13] to-[#7c2d00]" />
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-white"
                        style={{
                          width: `${40 + i * 15}px`,
                          height: `${40 + i * 15}px`,
                          top: `${-10 + (i % 4) * 30}%`,
                          left: `${-10 + (i % 3) * 35}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 p-5 flex flex-col h-full justify-end">
                    <span
                      className="material-symbols-outlined text-white/60 text-[32px] mb-1"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      domain
                    </span>
                    <p className="text-white font-bold text-sm leading-snug">
                      Elevating standard living into architectural experiences.
                    </p>
                    <p className="text-white/60 text-xs mt-1">PropShare Campus Portfolio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
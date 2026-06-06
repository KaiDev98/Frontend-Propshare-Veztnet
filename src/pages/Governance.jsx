import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Variants ─────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -52 },
  visible: (delay = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 52 },
  visible: (delay = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const stagger = (s = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: s, delayChildren: 0.04 } },
});

// Bidirectional viewport
const vp = { once: false, amount: 0.15 };
const vpFull = { once: false, amount: 0.3 };

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Proposals",  value: "142",         icon: "description",           trend: "+12% this month" },
  { label: "Active Voters",    value: "8,412",        icon: "how_to_reg",            trend: "+5% increase"    },
  { label: "Treasury Balance", value: "12.5M MATIC",  icon: "account_balance_wallet", trend: "+2% growth"      },
];

const TABS = ["All Proposals", "Active", "Passed", "Defeated"];

const PROPOSALS = [
  {
    id: 1,
    number: "#142",
    author: "0x71C...3d2",
    status: "Active",
    statusStyle: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    title: "Expand Campus Network to South-East Asia",
    desc: "This proposal aims to allocate 1.2M MATIC from the treasury to establish a network of 5 new digital hubs across Singapore and Indonesia...",
    forPct: 78,
    againstPct: 22,
    endIcon: "schedule",
    endLabel: "Ends in 2 days",
    tab: "Active",
  },
  {
    id: 2,
    number: "#141",
    author: "CoreDAO",
    status: "Executed",
    statusStyle: "bg-[#EC5B13]/10 text-[#EC5B13]",
    title: "Upgrade Smart Contract Governance Logic (v2.1)",
    desc: "Implementation of the new voting delegation mechanism and reduced quorum requirements for minor operational adjustments...",
    forPct: 94,
    againstPct: 6,
    endIcon: "check_circle",
    endLabel: "Passed Nov 12, 2023",
    tab: "Passed",
  },
  {
    id: 3,
    number: "#140",
    author: "CommunityVibes",
    status: "Defeated",
    statusStyle: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    title: "Increase Weekly Token Rewards by 50%",
    desc: "A proposal to increase the liquidity mining rewards to stabilize token price and attract more long-term stakers to the platform...",
    forPct: 42,
    againstPct: 58,
    endIcon: "cancel",
    endLabel: "Rejected Oct 28, 2023",
    tab: "Defeated",
  },
];

const DECISION_STEPS = [
  { number: 1, title: "Discussion & Ideation",  desc: "Join the PropShare forum to discuss ideas with the community before formalizing a proposal." },
  { number: 2, title: "On-Chain Proposal",       desc: "Formalize your idea with a smart contract proposal. Requires a minimum stake of 1,000 $PROP tokens." },
  { number: 3, title: "Voting Period",           desc: "A 7-day voting window opens. Token holders vote proportionally to their holdings or delegated power." },
  { number: 4, title: "Execution",               desc: "If quorum is reached and majority votes 'For', the proposal is executed automatically or by the multi-sig treasury." },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, trend }) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{
        y: -6,
        boxShadow: "0 20px 50px -10px rgba(236,91,19,0.18)",
        borderColor: "rgba(236,91,19,0.3)",
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 rounded-xl p-8 border border-[#EC5B13]/10 bg-white dark:bg-slate-900/50 shadow-sm cursor-default"
    >
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
          {label}
        </p>
        <motion.span
          className="material-symbols-outlined text-[#EC5B13]"
          whileHover={{ scale: 1.25, rotate: 8 }}
          transition={{ type: "spring", stiffness: 350, damping: 18 }}
        >
          {icon}
        </motion.span>
      </div>
      <p className="text-slate-900 dark:text-white text-3xl font-bold">{value}</p>
      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
        <span className="material-symbols-outlined text-xs">trending_up</span>
        <span>{trend}</span>
      </div>
    </motion.div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal }) {
  return (
    <motion.div
      variants={fadeUp}
      layout
      whileHover={{
        y: -4,
        borderColor: "rgba(236,91,19,0.3)",
        boxShadow: "0 16px 40px -8px rgba(236,91,19,0.14)",
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row gap-6 p-6 bg-white dark:bg-slate-900/50 border border-[#EC5B13]/5 rounded-xl cursor-pointer group"
    >
      {/* Left */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${proposal.statusStyle}`}
          >
            {proposal.status}
          </motion.span>
          <span className="text-slate-400 text-sm">
            {proposal.number} • Proposed by {proposal.author}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#EC5B13] transition-colors duration-300">
          {proposal.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-sm">{proposal.desc}</p>
      </div>

      {/* Right — Votes */}
      <div className="flex flex-col min-w-[200px] justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-emerald-500">For: {proposal.forPct}%</span>
            <span className="text-rose-500">Against: {proposal.againstPct}%</span>
          </div>
          {/* Animated progress bar */}
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-emerald-500 rounded-l-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${proposal.forPct}%` }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
            <motion.div
              className="h-full bg-rose-500 rounded-r-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${proposal.againstPct}%` }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-slate-400 mt-4">
          <span className="material-symbols-outlined text-sm">{proposal.endIcon}</span>
          <span className="text-xs font-medium">{proposal.endLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Governance() {
  const [activeTab, setActiveTab] = useState("All Proposals");

  const filtered = PROPOSALS.filter(
    (p) => activeTab === "All Proposals" || p.tab === activeTab
  );

  return (
    <main className="flex flex-1 flex-col px-6 md:px-20 lg:px-40 py-10">

      {/* ── Hero ── */}
      <motion.div
        className="flex flex-col gap-4 mb-10"
        variants={stagger(0.12)}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          className="text-slate-900 dark:text-white text-5xl font-black leading-tight tracking-tighter"
        >
          Governance
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl"
        >
          Participate in decentralized decision-making and shape the future of PropShare Campus.
          Every token holder has a voice in our community-led evolution.
        </motion.p>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        variants={stagger(0.13)}
        initial="hidden"
        whileInView="visible"
        viewport={vp}
      >
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </motion.div>

      {/* ── Tabs + New Proposal ── */}
      <motion.div
        className="flex flex-col md:flex-row items-center justify-between border-b border-[#EC5B13]/10 mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={vp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex gap-8 overflow-x-auto w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative pb-4 pt-2 text-sm font-bold whitespace-nowrap transition-colors duration-200"
            >
              <span className={activeTab === tab ? "text-[#EC5B13]" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}>
                {tab}
              </span>
              {/* Spring-animated underline */}
              {activeTab === tab && (
                <motion.span
                  layoutId="gov-tab-line"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EC5B13] rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2, boxShadow: "0 12px 30px rgba(236,91,19,0.35)" }}
          whileTap={{ scale: 0.96 }}
          className="mt-4 md:mt-0 mb-4 flex items-center gap-2 bg-[#EC5B13] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-colors duration-200"
        >
          <motion.span
            className="material-symbols-outlined"
            animate={{ rotate: [0, 0] }}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            add_circle
          </motion.span>
          New Proposal
        </motion.button>
      </motion.div>

      {/* ── Proposal List ── */}
      <motion.div
        key={activeTab}
        className="flex flex-col gap-4"
        variants={stagger(0.1)}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400"
            >
              <span className="material-symbols-outlined text-5xl">inbox</span>
              <p className="font-bold">No proposals in this category</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── How Decision-Making Works ── */}
      <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* Steps */}
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-black text-slate-900 dark:text-white mb-8"
          >
            How Decision-Making Works
          </motion.h2>

          <motion.div
            className="space-y-6"
            variants={stagger(0.13)}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {DECISION_STEPS.map(({ number, title, desc }) => (
              <motion.div
                key={number}
                variants={fadeUp}
                className="flex gap-4 group cursor-default"
              >
                {/* Number + connector */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <motion.div
                    className="h-10 w-10 bg-[#EC5B13]/15 text-[#EC5B13] rounded-full flex items-center justify-center font-bold text-sm"
                    whileHover={{ scale: 1.18, backgroundColor: "rgba(236,91,19,0.9)", color: "#fff", rotate: 5 }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                  >
                    {number}
                  </motion.div>
                  {number < DECISION_STEPS.length && (
                    <motion.div
                      className="w-px flex-1 bg-[#EC5B13]/15 rounded-full min-h-[1.5rem]"
                      initial={{ scaleY: 0, originY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: false, amount: 0.5 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  )}
                </div>
                {/* Text */}
                <div className="pb-2">
                  <h4 className="font-bold text-lg dark:text-white mb-1 group-hover:text-[#EC5B13] transition-colors duration-300">
                    {title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Image */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          variants={fadeRight}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          whileHover={{ scale: 1.02, boxShadow: "0 32px 80px -12px rgba(236,91,19,0.22)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUUTE8gnRGtcyOyw6QsAkt70nSPH9-_g1tXm4TGmBHnUiXUrywA3pbqiRs5P6SYlZladZU8QnHXPZGVbnD6KgoJ_31HHjRZOU8Kxmgdwr6GGjaRQpbBwSq91XUvN7y07LXNcKwxDaucEBqDbLIHOIRde7dzVMJDc3guf0O6yotPtTIJFUr7sHVnosjGn25y5NP4WF9svEVZ9jHT2Kz_F12dxj_ClBq0_Wix3u28viO7KD5aJO-_7xbuW0B7NV9sc-b_JD1RJzn"
            alt="Team meeting"
            className="w-full h-[420px] object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#221610]/80 to-transparent flex flex-col justify-end p-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={vp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.p
              className="text-white text-lg font-bold"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              Empowering our community to lead.
            </motion.p>
            <motion.p
              className="text-slate-200 text-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              Decentralization isn't just a goal; it's our operating system.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

    </main>
  );
}
import { useState } from "react";

const DOCUMENTS = [
  {
    icon: "menu_book",
    title: "Whitepaper",
    desc: "Detailed investment strategy, asset selection process, and market analysis report.",
    linkLabel: "Download PDF",
    linkIcon: "download",
  },
  {
    icon: "gavel",
    title: "Legal Documentation",
    desc: "Compliance frameworks, SPV structures, and privacy policies for all investors.",
    linkLabel: "View Documents",
    linkIcon: "open_in_new",
  },
  {
    icon: "help",
    title: "FAQ",
    desc: "Commonly asked questions about fractional ownership, returns, and taxes.",
    linkLabel: "Visit Help Center",
    linkIcon: "chevron_right",
  },
];

const BLOG_POSTS = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQlW4HhSvtbxc8x2bl7eJYFF2miG3ImSpxthZUn4DZPFdBzp9s86484vwaN2nstmyL9qu1TrUlv1Hj--faPAHYk8WyIAgztdPuBiyKo85wxXZRb9Yi5uWXv2ZCbx9g2ubPPmbj30gsYhb24sXaIuHzZxAU-HzHiS4pznAOJWZvU6_R9DzLadt6VW42ldKu-2D0of6lePvfvkg4Auy3pdz_A9MJDk_WMcSM7OrFVLCXuyTxioFA4CYfMGjbCZHyaefwKskY0ELx",
    category: "Market Trends",
    readTime: "5 min read",
    title: "The Rise of Fractional Real Estate in 2024",
    desc: "Exploring how blockchain and regulatory shifts are opening up commercial real estate to retail investors...",
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCm8QpuKmnH5BUnDDp9czPq11u2UP8k32fRdYXplIs0TlGORECKlVbm9uKMqjgyROk0eBaZF5fGDIEPrV_7PFdcZUSnDrUps7-xHICFnMyTCMadpN1cl92p9QOJ8JLlaIii41xsZZ2VVGxhiyDrpec0WB5Qv6uJ0dggYHSmgSE_TbDFnr326jbQjhSlNHQu0cV8lK7Earhd6Pr1TRHTujOZpMKu4xjadprl3MYym7MZfYbshfxrMSVpvUWxHfCgCZHsntOb3vW7",
    category: "Investment Guide",
    readTime: "8 min read",
    title: "Diversifying Your Portfolio with SPVs",
    desc: "A comprehensive guide on how Special Purpose Vehicles protect and organize asset ownership for groups.",
  },
];

function DocumentCard({ icon, title, desc, linkLabel, linkIcon }) {
  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#EC5B13] transition-all group">
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#EC5B13]/10 text-[#EC5B13] group-hover:bg-[#EC5B13] group-hover:text-white transition-colors">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-slate-900 dark:text-white text-lg font-bold">{title}</p>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{desc}</p>
      </div>
      <a href="#" className="mt-2 text-[#EC5B13] text-sm font-semibold flex items-center gap-1 hover:underline">
        {linkLabel}
        <span className="material-symbols-outlined text-xs">{linkIcon}</span>
      </a>
    </div>
  );
}

function BlogCard({ image, category, readTime, title, desc }) {
  return (
    <div className="flex flex-col gap-4 pb-6 cursor-pointer group">
      <div
        className="w-full aspect-video bg-center bg-no-repeat bg-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
        style={{ backgroundImage: `url("${image}")` }}
      />
      <div className="space-y-2">
        <div className="flex gap-2 text-xs font-bold text-[#EC5B13] uppercase tracking-wider">
          <span>{category}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{readTime}</span>
        </div>
        <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-snug group-hover:text-[#EC5B13] transition-colors">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-base">{desc}</p>
      </div>
    </div>
  );
}

export default function Resources() {
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");

  return (
    <main className="flex flex-1 justify-center py-10 px-4 md:px-0">
      <div className="flex flex-col max-w-[960px] w-full flex-1">

        {/* Hero */}
        <div className="flex flex-col gap-4 p-4 mb-6">
          <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Resource Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
            Access all investment guides, legal frameworks, and educational content to maximize
            your real estate portfolio.
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 mb-8">
          <div className="flex w-full items-stretch rounded-xl h-14 border border-[#EC5B13]/10 bg-white dark:bg-slate-800 shadow-sm">
            <div className="text-[#EC5B13] flex items-center justify-center pl-5">
              <span className="material-symbols-outlined text-2xl">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for documentation, guides, or articles"
              className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-lg px-4 placeholder:text-slate-400 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Essential Documents */}
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold px-4 pb-6">
          Essential Documents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 mb-12">
          {DOCUMENTS.map((doc) => (
            <DocumentCard key={doc.title} {...doc} />
          ))}
        </div>

        {/* Latest Insights */}
        <div className="flex items-center justify-between px-4 mb-6">
          <h2 className="text-slate-900 dark:text-white text-2xl font-bold">Latest Insights</h2>
          <a href="#" className="text-[#EC5B13] font-semibold text-sm hover:underline">
            View all blog posts
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 mb-16">
          {BLOG_POSTS.map((post) => (
            <BlogCard key={post.title} {...post} />
          ))}
        </div>

        {/* Newsletter */}
        <div className="m-4 p-8 rounded-2xl bg-[#EC5B13]/10 border border-[#EC5B13]/20 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Stay Updated</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Join 10,000+ investors receiving our weekly analysis on market trends and new opportunities.
            </p>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 md:w-64 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-[#EC5B13] focus:border-[#EC5B13] px-4 py-2 text-sm outline-none bg-white text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button className="bg-[#EC5B13] hover:bg-[#d44e0f] text-white px-6 py-2 rounded-xl font-bold transition-colors">
              Subscribe
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
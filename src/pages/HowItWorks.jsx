import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ─── Reusable Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (delay = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (delay = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// Stagger wrapper
const stagger = (staggerTime = 0.12) => ({
  hidden: {},
  visible: { transition: { staggerChildren: staggerTime, delayChildren: 0.05 } },
});

// Viewport config — bidirectional (replay naik & turun)
const vp = { once: false, amount: 0.18 };

// ─── Data ─────────────────────────────────────────────────────────────────────

const WEB3_CARDS = [
  {
    icon: "token",
    title: "Tokenisasi Aset",
    desc: "Aset real estat dibagi menjadi token digital di blockchain, di mana setiap token mewakili bagian kepemilikan dari properti tersebut.",
  },
  {
    icon: "account_balance_wallet",
    title: "Modal Awal Terjangkau",
    desc: "Tidak perlu modal miliaran rupiah. Mulai berinvestasi di properti komersial premium hanya dengan nominal yang sangat terjangkau.",
  },
  {
    icon: "security",
    title: "Kontrak Pintar (Smart Contracts)",
    desc: "Hak kepemilikan, pembagian dividen, dan hak suara diproses secara otomatis oleh kontrak pintar yang transparan dan tidak dapat diubah.",
  },
];

const INVESTOR_STEPS = [
  { number: "01", title: "Temukan Properti",  desc: "Telusuri pilihan kurasi kampus komersial berimbal hasil tinggi dan proyek hunian mahasiswa premium." },
  { number: "02", title: "Beli Token",        desc: "Beli token fraksional menggunakan Rupiah atau stablecoin. Kepemilikan Anda langsung dicetak (minted) secara on-chain." },
  { number: "03", title: "Dapatkan Imbal Hasil", desc: "Pendapatan sewa didistribusikan secara proporsional langsung ke dompet (wallet) digital pemegang token setiap bulannya." },
];

const OWNER_STEPS = [
  { number: "01", title: "Daftarkan Aset Anda",  desc: "Ajukan pendaftaran properti Anda. Tim ahli kami akan melakukan uji kelayakan (due diligence) yang ketat terkait valuasi dan legalitas hukum." },
  { number: "02", title: "Buka Likuiditas",      desc: "Kumpulkan dana dengan menjual sebagian kecil saham properti Anda, sambil tetap mempertahankan hak pengelolaan jika diinginkan." },
  { number: "03", title: "Manajemen Otomatis",   desc: "Gunakan platform Web3 kami untuk menangani komunikasi dengan investor, pemungutan suara, dan distribusi keuntungan secara otomatis." },
];

const TENANT_STEPS = [
  { number: "01", title: "Perjanjian Sewa Cerdas", desc: "Tandatangani kontrak sewa digital yang dapat diverifikasi dan dikelola secara otomatis sepenuhnya melalui kontrak pintar." },
  { number: "02", title: "Stake untuk Tinggal",    desc: "Dapatkan potongan harga sewa eksklusif khusus bagi penyewa yang menahan (hold) batas minimum token tata kelola properti." },
  { number: "03", title: "Tata Kelola Transparan", desc: "Ikut serta dalam keputusan operasional kampus melalui sistem pemungutan suara berbasis DAO untuk pemeliharaan dan fasilitas." },
];

// ─── Step List ────────────────────────────────────────────────────────────────

function StepList({ steps, dark = false }) {
  return (
    <motion.div
      className="space-y-8"
      variants={stagger(0.14)}
      initial="hidden"
      whileInView="visible"
      viewport={vp}
    >
      {steps.map(({ number, title, desc }) => (
        <motion.div
          key={number}
          variants={fadeUp}
          className="flex gap-5 group"
        >
          {/* Number badge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <motion.div
              whileHover={{ scale: 1.15, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl bg-[#EC5B13]/10 flex items-center justify-center"
            >
              <span className="text-[#EC5B13] font-black text-sm">{number}</span>
            </motion.div>
            {/* Connector line */}
            <motion.div
              className="w-px flex-1 bg-[#EC5B13]/15 rounded-full min-h-[2rem]"
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={vp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>

          {/* Content */}
          <div className="pb-2">
            <h4 className={`font-bold text-lg mb-1 group-hover:text-[#EC5B13] transition-colors duration-300 ${dark ? "text-white" : "text-slate-900 dark:text-white"}`}>
              {title}
            </h4>
            <p className={dark ? "text-slate-400 text-sm leading-relaxed" : "text-slate-600 dark:text-slate-400 text-sm leading-relaxed"}>
              {desc}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Section Row (Investor / Tenant — light bg) ───────────────────────────────

function SectionRow({ icon, title, steps, image, imageAlt, reverse = false }) {
  const ContentVariant = reverse ? fadeRight : fadeLeft;
  const ImageVariant   = reverse ? fadeLeft  : fadeRight;

  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto">
      <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-14`}>

        {/* Text side */}
        <motion.div
          className="w-full md:w-1/2"
          variants={ContentVariant}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <motion.h2
            className="text-3xl font-bold mb-8 flex items-center gap-3 text-slate-900 dark:text-white"
            variants={fadeUp}
            custom={0}
          >
            <motion.span
              className="material-symbols-outlined text-[#EC5B13] text-4xl"
              whileHover={{ scale: 1.2, rotate: 8 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              {icon}
            </motion.span>
            {title}
          </motion.h2>
          <StepList steps={steps} />
        </motion.div>

        {/* Image side */}
        <motion.div
          className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-2xl"
          variants={ImageVariant}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
          whileHover={{ scale: 1.02, boxShadow: "0 32px 80px -12px rgba(236,91,19,0.22)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={image}
            alt={imageAlt}
            className="w-full h-auto object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HowItWorks() {
  return (
    <main className="flex-1">

      {/* ══════════════════════════════════════════
          HERO — slide up on mount
         ══════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-12">
        <motion.div
          className="relative rounded-2xl overflow-hidden min-h-[400px] flex flex-col justify-end p-8 md:p-16 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(34,22,16,0.92) 0%, rgba(34,22,16,0.2) 100%), url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80')`,
          }}
          initial={{ opacity: 0, scale: 0.97, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated gradient overlay sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#EC5B13]/10 to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          />

          <div className="max-w-2xl relative z-10">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#EC5B13] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block"
            >
              Masa Depan Real Estat
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="text-white text-4xl md:text-5xl font-extrabold leading-tight mb-4"
            >
              Revolusi Real Estat dengan Teknologi Web3
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-slate-200 text-lg font-light leading-relaxed"
            >
              PropShare Campus memanfaatkan kepemilikan fraksional Web3 untuk membuat aset hunian mahasiswa kelas institusional dapat diakses oleh semua orang melalui teknologi blockchain. Transparan, likuid, dan aman.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          WEB3 CARDS — stagger on scroll
         ══════════════════════════════════════════ */}
      <section className="bg-[#EC5B13]/5 py-20 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold mb-4 text-slate-900 dark:text-white"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            Apa itu Kepemilikan Web3 Fraksional?
          </motion.h2>

          <motion.div
            className="grid md:grid-cols-3 gap-8 mt-12"
            variants={stagger(0.14)}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {WEB3_CARDS.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={scaleIn}
                custom={i * 0.05}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 50px -10px rgba(236,91,19,0.18)",
                  borderColor: "rgba(236,91,19,0.35)",
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-[#EC5B13]/10 cursor-default"
              >
                <motion.div
                  className="bg-[#EC5B13]/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6"
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(236,91,19,0.9)", rotate: 6 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                >
                  <motion.span
                    className="material-symbols-outlined text-[#EC5B13]"
                    whileHover={{ color: "#fff" }}
                  >
                    {icon}
                  </motion.span>
                </motion.div>
                <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR INVESTORS — slide in from left/right
         ══════════════════════════════════════════ */}
      <SectionRow
        icon="trending_up"
        title="Untuk Investor"
        steps={INVESTOR_STEPS}
        image="https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&q=80"
        imageAlt="Dashboard Investasi"
      />

      {/* ══════════════════════════════════════════
          FOR OWNERS — dark bg, reversed layout
         ══════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row-reverse items-center gap-14">

          {/* Text */}
          <motion.div
            className="w-full md:w-1/2"
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            <motion.h2
              className="text-3xl font-bold mb-8 flex items-center gap-3 text-white"
              variants={fadeUp}
              custom={0}
            >
              <motion.span
                className="material-symbols-outlined text-[#EC5B13] text-4xl"
                whileHover={{ scale: 1.2, rotate: 8 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
              >
                domain
              </motion.span>
              Untuk Pemilik Properti
            </motion.h2>
            <StepList steps={OWNER_STEPS} dark />
          </motion.div>

          {/* Image */}
          <motion.div
            className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-2xl"
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
            whileHover={{ scale: 1.02, boxShadow: "0 32px 80px -12px rgba(236,91,19,0.22)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
              alt="Gedung properti modern"
              className="w-full h-auto object-cover opacity-80"
              whileHover={{ scale: 1.06, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR TENANTS
         ══════════════════════════════════════════ */}
      <SectionRow
        icon="key"
        title="Untuk Penyewa"
        steps={TENANT_STEPS}
        image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
        imageAlt="Ruang coworking modern"
        reverse
      />

      {/* ══════════════════════════════════════════
          CTA BANNER
         ══════════════════════════════════════════ */}
      <section className="bg-[#EC5B13] py-16 px-6 text-center text-white overflow-hidden relative">
        {/* Decorative animated blobs */}
        <motion.div
          className="absolute -top-16 -left-16 w-64 h-64 border-[32px] border-white/10 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-16 -right-16 w-64 h-64 border-[32px] border-white/10 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.1, 1], rotate: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative z-10 max-w-xl mx-auto"
          variants={stagger(0.13)}
          initial="hidden"
          whileInView="visible"
          viewport={vp}
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold mb-4"
          >
            Siap Bergabung dengan Komunitas Kami?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg opacity-90 mb-8"
          >
            Mulai perjalanan Anda di ekosistem real estat fraksional hari ini. Buat akun Anda dan jelajahi peluang investasi yang tersedia.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -3, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                to="/register" // Disamakan dengan path register biasanya
                className="bg-white text-[#EC5B13] px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors inline-block"
              >
                Daftar Sekarang
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.06, y: -3, backgroundColor: "rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.96 }}
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold transition-colors"
            >
              Jadwalkan Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

    </main>
  );
}
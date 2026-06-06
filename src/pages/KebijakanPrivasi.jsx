import React from "react";

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl bg-white dark:bg-slate-950 p-10 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
          Kebijakan Privasi
        </h1>
        <p className="text-sm text-slate-500 mb-8">Terakhir diperbarui: April 2026</p>
        
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">1. Pengumpulan Informasi</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat menggunakan platform PropShare, termasuk namun tidak terbatas pada nama, alamat email, dan data transaksi yang terkait dengan dompet Web3 Anda.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">2. Penggunaan Data</h2>
            <p>
              Data yang dikumpulkan digunakan untuk memfasilitasi transaksi properti, memverifikasi identitas pengguna, dan meningkatkan kualitas layanan ekosistem PropShare. Kami tidak pernah menjual data pribadi Anda kepada pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">3. Keamanan Data</h2>
            <p>
              PropShare menerapkan standar keamanan industri tertinggi untuk melindungi informasi pribadi Anda. Interaksi blockchain diproses menggunakan protokol enkripsi standar untuk memastikan integritas aset digital Anda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
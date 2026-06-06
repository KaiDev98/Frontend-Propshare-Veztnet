import React from "react";

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl bg-white dark:bg-slate-950 p-10 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
          Syarat & Ketentuan
        </h1>
        <p className="text-sm text-slate-500 mb-8">Terakhir diperbarui: April 2026</p>
        
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">1. Penerimaan Syarat</h2>
            <p>
              Dengan mengakses dan menggunakan platform PropShare, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun, harap hentikan penggunaan platform kami.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">2. Risiko Investasi Web3</h2>
            <p>
              Semua investasi real estat yang ditokenisasi melalui platform PropShare memiliki risiko yang melekat. Nilai aset digital dapat berfluktuasi. Anda bertanggung jawab penuh atas keputusan investasi Anda.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">3. Tanggung Jawab Pengguna</h2>
            <p>
              Pengguna wajib menjaga kerahasiaan kunci pribadi (private keys) dompet Web3 mereka. PropShare tidak bertanggung jawab atas kerugian aset yang disebabkan oleh kelalaian pengguna atau peretasan pada tingkat pengguna.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
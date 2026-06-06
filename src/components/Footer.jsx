import { Link } from "react-router-dom";
import { useState } from "react";

export default function Footer() {
  // --- State untuk Form Kontak ---
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  // --- Fungsi Handle Submit Form ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "Pengunjung Website", 
          email: email,
          message: message 
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setStatus({ type: "success", message: "Pesan Anda berhasil terkirim!" });
        setEmail("");   
        setMessage(""); 
      } else {
        throw new Error(data.message || "Gagal mengirim pesan");
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#F8F9FB] pt-24 pb-10 border-t border-slate-100 font-sans">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* Brand & Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#EC5B13] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-2xl">
                  domain
                </span>
              </div>
              <h2 className="text-slate-900 text-2xl font-bold tracking-tight">
                PropShare
              </h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Mendesentralisasi investasi hunian mahasiswa. Kami memanfaatkan teknologi Web3 untuk memberikan likuiditas, transparansi, dan akses ke real estat kampus.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {/* WhatsApp */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#25D366] hover:border-[#25D366] hover:shadow-sm transition-all"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#E1306C] hover:border-[#E1306C] hover:shadow-sm transition-all"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1877F2] hover:border-[#1877F2] hover:shadow-sm transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-6 text-sm">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              {[
                { to: "/marketplace", label: "Marketplace" },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="hover:text-[#EC5B13] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-6 text-sm">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <Link to="/kebijakan-privasi" className="hover:text-[#EC5B13] transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="hover:text-[#EC5B13] transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Form Hubungi Kami */}
          <div className="lg:col-span-4">
            <h4 className="font-bold text-slate-900 mb-4 text-sm">
              Hubungi Kami
            </h4>
            <p className="text-sm text-slate-500 mb-6">
              Punya pertanyaan? Kirimkan pesan langsung ke tim kami.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-slate-200 focus-within:border-[#EC5B13] focus-within:ring-1 focus-within:ring-[#EC5B13]/20 shadow-sm transition-all p-1">
                <input
                  className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:ring-0 px-3 py-2 outline-none disabled:opacity-50"
                  placeholder="Alamat Email Anda"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 focus-within:border-[#EC5B13] focus-within:ring-1 focus-within:ring-[#EC5B13]/20 shadow-sm transition-all p-1">
                <textarea
                  className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm focus:ring-0 px-3 py-2 outline-none disabled:opacity-50 resize-none h-20"
                  placeholder="Tuliskan pesan Anda di sini..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-[#EC5B13] text-white py-3 px-4 flex items-center justify-center gap-2 rounded-xl hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-sm mt-1"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                ) : (
                  <>
                    Kirim Pesan
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>

              {status.message && (
                <p className={`text-xs font-medium pl-1 mt-1 ${status.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} PropShare. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Dibuat menggunakan 
            <span className="material-symbols-outlined text-[14px] text-[#EC5B13] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span> 
            oleh tim <span className="text-slate-700 font-semibold">VeztNet</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
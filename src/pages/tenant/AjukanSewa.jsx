import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import TenantSidebar from "../../components/TenantSidebar";
import Swal from "sweetalert2";

// ─── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onChange }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  const DAYS   = ["S","M","T","W","T","F","S"];
  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    const s = new Date(selectedDate);
    return s.getDate() === d && s.getMonth() === viewMonth && s.getFullYear() === viewYear;
  };

  const isPast = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handleSelect = (d) => {
    if (isPast(d)) return;
    const pad = n => String(n).padStart(2, "0");
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-900 dark:text-white">{MONTHS[viewMonth]} {viewYear}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:text-[#EC5B13] rounded-lg hover:bg-[#EC5B13]/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:text-[#EC5B13] rounded-lg hover:bg-[#EC5B13]/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-2">
        {DAYS.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
        {[...Array(daysInMonth)].map((_, i) => {
          const d        = i + 1;
          const past     = isPast(d);
          const selected = isSelected(d);
          return (
            <button key={d} onClick={() => handleSelect(d)} disabled={past}
              className={`p-2 rounded-lg font-medium transition-all text-sm ${
                selected ? "bg-[#EC5B13] text-white font-bold shadow-md shadow-[#EC5B13]/20"
                : past   ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              }`}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );
}

const TIME_SLOTS  = ["09:00", "11:30", "14:00", "16:30", "18:00"];
const TIME_LABELS = { "09:00": "09:00 AM", "11:30": "11:30 AM", "14:00": "02:00 PM", "16:30": "04:30 PM", "18:00": "06:00 PM" };

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />;
}

// ─── Blocked UI: tenant sudah punya sewa aktif/pending ────────────────────────
function RentalBlockedView({ rental, onBack, onGoToDashboard }) {
  const isActive       = rental.status === "ACTIVE";
  const propertyName   =
    rental.room?.property?.title ??
    rental.property?.title ??
    "properti lain";
  const ownerPhone     =
    rental.room?.property?.owner?.phone ??
    rental.property?.owner?.phone ??
    null;
  const ownerName      =
    rental.room?.property?.owner?.fullName ??
    rental.property?.owner?.fullName ??
    "Owner";

  const waLink = ownerPhone
    ? `https://wa.me/${ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Halo ${ownerName}, saya ingin menghubungi terkait kontrak sewa di ${propertyName}.`
      )}`
    : null;

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
        }`}>
          <span className={`material-symbols-outlined text-5xl ${
            isActive ? "text-green-500" : "text-amber-500"
          }`}>
            {isActive ? "home" : "pending"}
          </span>
        </div>

        {/* Judul */}
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {isActive ? "Kamu Sudah Memiliki Sewa Aktif" : "Pengajuan Sedang Diproses"}
        </h2>

        {/* Deskripsi */}
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-2">
          {isActive
            ? <>Kamu sedang aktif menyewa di <strong className="text-slate-700 dark:text-slate-200">{propertyName}</strong>. Kamu hanya bisa menyewa 1 properti dalam satu waktu.</>
            : <>Pengajuan sewa kamu di <strong className="text-slate-700 dark:text-slate-200">{propertyName}</strong> sedang menunggu persetujuan owner.</>
          }
        </p>

        {/* Info cara akhiri kontrak */}
        <div className={`mt-5 mb-7 p-4 rounded-2xl border text-left ${
          isActive
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
            isActive ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          }`}>
            {isActive ? "Ingin mengakhiri kontrak?" : "Ingin membatalkan pengajuan?"}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            {isActive
              ? "Hubungi owner via WhatsApp untuk mendiskusikan pengakhiran kontrak sewa kamu."
              : "Kamu bisa membatalkan pengajuan yang sedang menunggu melalui halaman dashboard, atau hubungi owner via WhatsApp."
            }
          </p>
        </div>

        {/* Tombol aksi */}
        <div className="flex flex-col gap-3">
          {/* Tombol WA owner — hanya tampil jika ada nomor */}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat Owner via WhatsApp
            </a>
          )}

          <button
            onClick={onGoToDashboard}
            className="w-full py-3.5 bg-[#EC5B13] hover:bg-[#d44e0f] text-white font-bold rounded-xl transition-colors"
          >
            {isActive ? "Lihat Kamar Aktif" : "Lihat Status di Dashboard"}
          </button>

          <button
            onClick={onBack}
            className="w-full py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Kembali ke Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AjukanSewa() {
  const navigate       = useNavigate();
  const { propertyId } = useParams();

  const [property,      setProperty]      = useState(null);
  const [rooms,         setRooms]         = useState([]);
  const [loadingProp,   setLoadingProp]   = useState(true);
  const [loadingRooms,  setLoadingRooms]  = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  // ── Cek sewa aktif ─────────────────────────────────────────────────────────
  const [checkingRental, setCheckingRental] = useState(true);
  const [activeRental,   setActiveRental]   = useState(null); // rental ACTIVE/PENDING jika ada

  const [selectedRoom,   setSelectedRoom]   = useState("");
  const [selectedDate,   setSelectedDate]   = useState("");
  const [selectedTime,   setSelectedTime]   = useState("");
  const [leaseDuration,  setLeaseDuration]  = useState(3);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", notes: "" });

  // Pre-fill dari localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) setForm(prev => ({ ...prev, fullName: user.fullName ?? "", email: user.email ?? "" }));
    } catch {}
  }, []);

  // ── Fetch: cek rental aktif + property + rooms sekaligus ──────────────────
  useEffect(() => {
    if (!propertyId) return;

    const fetchAll = async () => {
      try {
        // Fetch semua paralel agar cepat
        const [rentalRes, propRes, roomRes] = await Promise.allSettled([
          api.get("/rentals/my-rentals"),
          api.get(`/properties/${propertyId}`),
          api.get(`/rooms/${propertyId}`),
        ]);

        // ── Cek rental aktif/pending ──
        if (rentalRes.status === "fulfilled") {
          const rentals = rentalRes.value.data?.data ?? [];
          const found   = rentals.find(r => r.status === "ACTIVE" || r.status === "PENDING");
          setActiveRental(found ?? null);
        }

        // ── Property ──
        if (propRes.status === "fulfilled") {
          setProperty(propRes.value.data?.data ?? null);
        }

        // ── Rooms ──
        if (roomRes.status === "fulfilled") {
          const raw   = roomRes.value.data?.data ?? [];
          const avail = Array.isArray(raw) ? raw : [];
          setRooms(avail);
          if (avail.length === 1) setSelectedRoom(avail[0].id);
        }
      } catch (err) {
        console.error("fetchAll AjukanSewa:", err);
      } finally {
        setCheckingRental(false);
        setLoadingProp(false);
        setLoadingRooms(false);
      }
    };

    fetchAll();
  }, [propertyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const calcEndDate = (startDate, months) => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  };

  const roomData  = rooms.find(r => r.id === selectedRoom);
  const thumbnail = property?.images?.find(img => img?.url)?.url ?? null;
  const price     = roomData?.pricePerMonth ?? roomData?.rentPrice ?? property?.tokenPrice ?? 0;

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (rooms.length > 0 && !selectedRoom) {
      Swal.fire({ icon: "warning", title: "Pilih Kamar", text: "Silakan pilih kamar yang ingin disewa.", confirmButtonColor: "#EC5B13" });
      return;
    }
    if (!selectedDate) {
      Swal.fire({ icon: "warning", title: "Pilih Tanggal", text: "Pilih tanggal mulai sewa.", confirmButtonColor: "#EC5B13" });
      return;
    }
    if (!form.fullName || !form.phone) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Nama dan nomor telepon wajib diisi.", confirmButtonColor: "#EC5B13" });
      return;
    }

    const endDate = calcEndDate(selectedDate, leaseDuration);

    const ok = await Swal.fire({
      icon: "question", title: "Konfirmasi Pengajuan Sewa",
      html: `
        <div style="text-align:left;font-size:13px;color:#64748b;line-height:2.2">
          🏠 Properti: <b>${property?.title ?? "—"}</b><br/>
          🚪 Kamar: <b>#${roomData?.roomNumber ?? "—"}</b><br/>
          📅 Mulai: <b>${selectedDate}</b><br/>
          📅 Selesai: <b>${endDate}</b><br/>
          ⏳ Durasi: <b>${leaseDuration} bulan</b><br/>
          💰 Estimasi: <b style="color:#EC5B13">Rp ${(price * leaseDuration).toLocaleString("id-ID")}</b><br/><br/>
          <div style="background:#fef9f6;padding:10px;border-radius:8px;border:1px solid #fed7aa;font-size:11px;color:#9a3412">
            ⚠️ Pengajuan akan diproses owner dalam 1×24 jam.
          </div>
        </div>
      `,
      showCancelButton: true, confirmButtonColor: "#EC5B13", cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Ajukan!", cancelButtonText: "Cek Lagi",
    });

    if (!ok.isConfirmed) return;

    Swal.fire({ title: "Memproses...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    setSubmitting(true);

    try {
      await api.post("/rentals", {
        propertyId,
        roomId:    selectedRoom || null,
        startDate: new Date(selectedDate).toISOString(),
        endDate:   new Date(endDate).toISOString(),
        notes:     form.notes || null,
      });

      await Swal.fire({
        icon: "success", title: "Pengajuan Berhasil! 🎉",
        html: `
          <div style="background:#f0fdf4;padding:12px;border-radius:10px;border:1px solid #bbf7d0;font-size:13px;color:#64748b">
            ✅ Pengajuan sewa kamar #${roomData?.roomNumber ?? "—"} dikirim<br/>
            ✅ Mulai: ${selectedDate}<br/>
            ⏳ Owner akan mengkonfirmasi dalam 1×24 jam
          </div>
        `,
        confirmButtonColor: "#EC5B13", timer: 3000, showConfirmButton: false,
      });

      setSubmitted(true);
    } catch (err) {
      // Backend juga guard — tampilkan pesan dari server jika ada
      const serverMsg = err.response?.data?.message ?? "Terjadi kesalahan.";
      Swal.fire({
        icon: "error", title: "Pengajuan Gagal",
        html: `<div style="font-size:13px;color:#64748b">${serverMsg}</div>`,
        confirmButtonColor: "#EC5B13",
      });
    } finally { setSubmitting(false); }
  };

  // ── Loading awal: cek rental ──
  if (checkingRental) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
        <TenantSidebar activeLabel="My Room" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            <p className="text-sm font-medium">Memeriksa status sewa...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Blocked: tenant sudah punya sewa aktif/pending ──
  if (activeRental) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
        <TenantSidebar activeLabel="My Room" />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
          <RentalBlockedView
            rental={activeRental}
            onBack={() => navigate("/tenant/marketplace")}
            onGoToDashboard={() =>
              activeRental.status === "ACTIVE"
                ? navigate("/tenant/room")
                : navigate("/tenant/dashboard")
            }
          />
        </main>
      </div>
    );
  }

  // ── Success State ──
  if (submitted) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
        <TenantSidebar activeLabel="My Room" />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pengajuan Terkirim! 🎉</h2>
            <p className="text-slate-500 text-sm mb-8">
              Pengajuan sewa untuk <strong>{property?.title}</strong> mulai <strong className="text-[#EC5B13]">{selectedDate}</strong> sudah dikirim ke owner.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate("/tenant/dashboard")} className="w-full py-3 bg-[#EC5B13] text-white font-bold rounded-xl hover:bg-[#d44e0f]">Ke Dashboard</button>
              <button onClick={() => navigate("/tenant/marketplace")} className="w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">Lihat Properti Lain</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#221610]">
      <TenantSidebar activeLabel="My Room" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-12">

          {/* Header */}
          <header className="mb-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#EC5B13] transition-colors mb-6">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>Kembali
            </button>
            <span className="text-[#EC5B13] font-bold tracking-widest uppercase text-xs mb-2 block">Rental Application</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Ajukan Sewa Kamar</h1>
            <p className="text-slate-500 text-lg">
              {loadingProp
                ? <span className="inline-block w-40 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                : (property?.title ?? "Properti")}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* ── Left Form ── */}
            <div className="lg:col-span-8 flex flex-col gap-12">

              {/* STEP 1: Pilih Kamar */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#EC5B13] text-white flex items-center justify-center font-bold text-sm shrink-0">1</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pilih Kamar</h2>
                </div>

                {loadingRooms ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                  </div>
                ) : rooms.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {rooms.map((room) => {
                        const isSelected = selectedRoom === room.id;
                        const roomPrice  = room.pricePerMonth ?? room.rentPrice ?? 0;
                        const isOccupied = room.status === "OCCUPIED";

                        return (
                          <button
                            key={room.id}
                            onClick={() => !isOccupied && setSelectedRoom(room.id)}
                            disabled={isOccupied}
                            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                              isOccupied
                                ? "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
                                : isSelected
                                ? "border-[#EC5B13] bg-[#EC5B13]/5 shadow-lg shadow-[#EC5B13]/10"
                                : "border-slate-200 dark:border-slate-700 hover:border-[#EC5B13]/50 hover:bg-[#EC5B13]/5 cursor-pointer"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#EC5B13] flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[14px]">check</span>
                              </div>
                            )}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                              isSelected ? "bg-[#EC5B13] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              <span className="material-symbols-outlined text-[20px]">bed</span>
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Room #{room.roomNumber}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{room.roomType ?? "Standard"}</p>
                            <p className={`text-sm font-bold mt-2 ${isSelected ? "text-[#EC5B13]" : "text-slate-700 dark:text-slate-300"}`}>
                              Rp {roomPrice.toLocaleString("id-ID")}
                              <span className="text-[10px] text-slate-400 font-normal"> /bln</span>
                            </p>
                            {isOccupied && (
                              <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">
                                OCCUPIED
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedRoom && roomData && (
                      <div className="mt-4 p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#EC5B13]">bed</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">Room #{roomData.roomNumber} dipilih</p>
                          <p className="text-xs text-slate-500">
                            Rp {(roomData.pricePerMonth ?? roomData.rentPrice ?? 0).toLocaleString("id-ID")} / bulan
                          </p>
                        </div>
                        <button onClick={() => setSelectedRoom("")} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">meeting_room</span>
                    <p className="text-slate-500 font-medium">Belum ada kamar tersedia di properti ini</p>
                    <p className="text-slate-400 text-xs mt-1">Hubungi owner untuk informasi lebih lanjut</p>
                  </div>
                )}
              </section>

              {/* STEP 2: Tanggal & Durasi */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#EC5B13] text-white flex items-center justify-center font-bold text-sm shrink-0">2</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tanggal Mulai Sewa</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <MiniCalendar selectedDate={selectedDate} onChange={setSelectedDate} />

                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Durasi Sewa</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 3, 6, 12].map(m => (
                          <button key={m} onClick={() => setLeaseDuration(m)}
                            className={`py-3 rounded-xl border-2 font-bold text-sm text-center transition-all ${
                              leaseDuration === m
                                ? "border-[#EC5B13] bg-[#EC5B13]/10 text-[#EC5B13]"
                                : "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#EC5B13]/40"
                            }`}
                          >{m} bln</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
                        Waktu Viewing <span className="text-slate-400 font-normal">(Opsional)</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map(slot => (
                          <button key={slot}
                            onClick={() => setSelectedTime(prev => prev === slot ? "" : slot)}
                            className={`py-2.5 rounded-xl border-2 font-bold text-xs text-center transition-all ${
                              selectedTime === slot
                                ? "border-[#EC5B13] bg-[#EC5B13]/10 text-[#EC5B13]"
                                : "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#EC5B13]/40"
                            }`}
                          >{TIME_LABELS[slot]}</button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && (
                      <div className="p-4 bg-[#EC5B13]/5 border border-[#EC5B13]/20 rounded-xl text-sm">
                        <p className="font-bold text-[#EC5B13] text-xs uppercase tracking-wider mb-2">Ringkasan Jadwal</p>
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <p>📅 Mulai: <strong>{selectedDate}</strong></p>
                          <p>📅 Selesai: <strong>{calcEndDate(selectedDate, leaseDuration)}</strong></p>
                          <p>⏳ Durasi: <strong>{leaseDuration} bulan</strong></p>
                          {selectedTime && <p>🕐 Viewing: <strong>{TIME_LABELS[selectedTime]}</strong></p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* STEP 3: Info Kontak */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#EC5B13] text-white flex items-center justify-center font-bold text-sm shrink-0">3</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Informasi Kontak</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: "Nama Lengkap",  name: "fullName", type: "text",  placeholder: "Nama lengkap",      span: false },
                    { label: "Nomor Telepon", name: "phone",    type: "tel",   placeholder: "08xxxxxxxxxx",       span: false },
                    { label: "Email Address", name: "email",    type: "email", placeholder: "email@example.com",  span: true  },
                  ].map(field => (
                    <div key={field.name} className={`flex flex-col gap-1.5 ${field.span ? "md:col-span-2" : ""}`}>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                      <input
                        type={field.type} name={field.name} value={form[field.name]}
                        onChange={handleChange} placeholder={field.placeholder}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm transition-all"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Catatan Tambahan (Opsional)</label>
                    <textarea
                      name="notes" value={form.notes} onChange={handleChange} rows={3}
                      placeholder="Pertanyaan atau kebutuhan khusus..."
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#EC5B13]/30 focus:border-[#EC5B13] outline-none resize-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Mobile CTA */}
              <div className="lg:hidden">
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full py-4 bg-[#EC5B13] text-white font-bold text-lg rounded-xl shadow-xl hover:bg-[#d44e0f] disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengirim...</>
                    : "Ajukan Sewa"}
                </button>
              </div>
            </div>

            {/* ── Right: Summary ── */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">

                <div className="relative rounded-xl overflow-hidden h-40 bg-slate-200 dark:bg-slate-800">
                  {thumbnail ? (
                    <img src={thumbnail} alt={property?.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-400">apartment</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#EC5B13] text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">No Broker Fee</span>
                  </div>
                </div>

                <div>
                  {loadingProp ? <><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4" /></> : (
                    <>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{property?.title ?? "Properti"}</h3>
                      <div className="flex items-start gap-1 text-slate-500 mt-1">
                        <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">location_on</span>
                        <p className="text-xs">{property?.location ?? "—"}</p>
                      </div>
                      <p className="text-[#EC5B13] font-extrabold text-base mt-2">
                        Rp {price.toLocaleString("id-ID")}
                        <span className="text-xs text-slate-400 font-normal"> / bulan</span>
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 py-4 border-y border-slate-100 dark:border-slate-800">
                  {[
                    { label: "Kamar",      value: roomData ? `#${roomData.roomNumber}` : (rooms.length === 0 ? "—" : "Belum dipilih") },
                    { label: "Mulai",      value: selectedDate || "Belum dipilih" },
                    { label: "Selesai",    value: selectedDate ? calcEndDate(selectedDate, leaseDuration) : "—" },
                    { label: "Durasi",     value: `${leaseDuration} bulan` },
                    { label: "Total Est.", value: selectedDate && price > 0 ? `Rp ${(price * leaseDuration).toLocaleString("id-ID")}` : "—" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className={`font-bold text-xs ${
                        row.value === "Belum dipilih" || row.value === "—"
                          ? "text-slate-300 dark:text-slate-600" : "text-slate-900 dark:text-white"
                      }`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:flex flex-col gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedDate || !form.fullName || (rooms.length > 0 && !selectedRoom)}
                    className="w-full py-4 bg-[#EC5B13] text-white font-bold rounded-xl shadow-lg hover:bg-[#d44e0f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengirim...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[18px]">home_work</span>Ajukan Sewa</>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-slate-400">
                    Dengan mengajukan, kamu menyetujui Terms of Service PropShare Campus.
                  </p>

                  <div className="space-y-1.5 mt-1">
                    {[
                      { done: rooms.length === 0 || !!selectedRoom, label: "Pilih kamar"     },
                      { done: !!selectedDate,                        label: "Pilih tanggal"   },
                      { done: !!form.fullName && !!form.phone,       label: "Isi data kontak" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[14px] ${item.done ? "text-green-500" : "text-slate-300"}`}>
                          {item.done ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        <span className={`text-[11px] font-medium ${item.done ? "text-green-600 line-through" : "text-slate-400"}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6 pb-4 flex items-center justify-between text-xs text-slate-400 mt-16">
            <p>© 2026 PropShare Campus Housing.</p>
            <div className="flex gap-5">
              {["Privacy Policy", "Terms of Service"].map(l => (
                <button key={l} className="hover:text-[#EC5B13]">{l}</button>
              ))}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
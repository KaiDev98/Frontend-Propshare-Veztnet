import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { to: "/", label: "Home", hash: null },
  { to: "/#peluang-aktif", label: "Peluang Aktif", hash: "peluang-aktif" },
  { to: "/#cara-kerja", label: "Cara Kerja", hash: "cara-kerja" },
  { to: "/#ulasan", label: "Ulasan", hash: "ulasan" },
];

const sectionIds = ["peluang-aktif", "cara-kerja", "ulasan"];

function NavItem({ item, mobile, onClose, activeHash, setActiveHash }) {
  const location = useLocation();
  const navigate = useNavigate();

  const active = item.hash
    ? activeHash === item.hash
    : activeHash === null && location.pathname === "/";

  function handleClick(e) {
    if (onClose) onClose();

    if (!item.hash) {
      setActiveHash(null);
      return;
    }

    e.preventDefault();

    function scrollToSection() {
      var el = document.getElementById(item.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", "/#" + item.hash);
        setActiveHash(item.hash);
      }
    }

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(scrollToSection, 100);
    } else {
      scrollToSection();
    }
  }

  var baseClass = active ? "text-[#EC5B13]" : "text-slate-600";
  var mobileClass = mobile
  ? "block text-base font-semibold py-2 transition-colors hover:text-[#EC5B13] " + baseClass
  : "text-sm font-semibold transition-colors hover:text-[#EC5B13] " + baseClass;

  return (
    <a href={item.to} onClick={handleClick} className={mobileClass}>
      {item.label}
    </a>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(null);
  const location = useLocation();
  const isManualScroll = useRef(false);

  // ── Scroll Spy ───────────────────────────────────────────────────────────────
  useEffect(function () {
    // Hanya aktif di halaman utama
    if (location.pathname !== "/") return;

    var observers = [];

    // Track berapa banyak section yang visible sekarang
    var visibleSections = {};

    function updateActive() {
      // Cari section dengan visibility ratio tertinggi
      var topSection = null;
      var topRatio = 0;

      sectionIds.forEach(function (id) {
        if (visibleSections[id] && visibleSections[id] > topRatio) {
          topRatio = visibleSections[id];
          topSection = id;
        }
      });

      // Jika tidak ada section yang visible, berarti di Hero (Home)
      if (!isManualScroll.current) {
        setActiveHash(topSection);
        if (topSection) {
          window.history.replaceState(null, "", "/#" + topSection);
        } else {
          window.history.replaceState(null, "", "/");
        }
      }
    }

    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;

      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            visibleSections[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
          });
          updateActive();
        },
        {
          // Navbar height offset: hitung dari 96px (h-24)
          rootMargin: "-96px 0px -40% 0px",
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return function () {
      observers.forEach(function (obs) { obs.disconnect(); });
    };
  }, [location.pathname]);

  // Reset isManualScroll setelah scroll selesai
  useEffect(function () {
    var timeout;

    function onScroll() {
      if (isManualScroll.current) {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          isManualScroll.current = false;
        }, 800);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return function () {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Sync saat pertama load dengan URL hash
  useEffect(function () {
    if (location.hash) {
      var hashVal = location.hash.replace("#", "");
      setActiveHash(hashVal);
      var el = document.querySelector(location.hash);
      if (el) {
        setTimeout(function () {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    } else {
      setActiveHash(null);
    }
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  // Saat klik menu, set flag manual agar scroll spy tidak override
  function handleSetActiveHash(hash) {
    isManualScroll.current = true;
    setActiveHash(hash);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md font-sans transition-all">
      <div className="container mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center group py-2"
          onClick={function () { setActiveHash(null); }}
        >
          <img
            src="/propshare-logo.png"
            alt="PropShare Logo"
            className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(function (item) {
            return (
              <NavItem
                key={item.to}
                item={item}
                mobile={false}
                activeHash={activeHash}
                setActiveHash={handleSetActiveHash}
              />
            );
          })}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/signin"
            className="text-sm font-bold px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            Masuk
          </Link>
          <Link
            to="/signup"
            className="bg-[#EC5B13] text-white text-sm font-bold px-7 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md"
          >
            Daftar Sekarang
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden text-slate-700 hover:text-[#EC5B13] transition-colors"
          onClick={function () { setMenuOpen(!menuOpen); }}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-3xl">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 shadow-xl absolute w-full left-0">
          {navLinks.map(function (item) {
            return (
              <NavItem
                key={item.to}
                item={item}
                mobile={true}
                onClose={closeMenu}
                activeHash={activeHash}
                setActiveHash={handleSetActiveHash}
              />
            );
          })}

          <div className="pt-6 mt-4 flex flex-col gap-3 border-t border-slate-100">
            <Link
              to="/signin"
              onClick={closeMenu}
              className="text-sm font-bold px-4 py-3 border border-slate-200 rounded-xl w-full text-center text-slate-700 hover:bg-slate-50 hover:text-[#EC5B13] transition-colors"
            >
              Masuk
            </Link>
            <Link
              to="/signup"
              onClick={closeMenu}
              className="bg-[#EC5B13] text-white text-sm font-bold px-6 py-3 rounded-xl w-full text-center hover:bg-orange-600 transition-colors shadow-sm"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
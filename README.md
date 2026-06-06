# PropShare Frontend — VeztNet

Client-side React application untuk platform **VeztNet** — tokenisasi investasi properti kost/kontrakan berbasis Real World Asset (RWA) & Blockchain, dibangun dengan Vite + React.js.

---

## ⚡ Quick Start

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Salin file environment dan isi variabel
cp .env.example .env

# 4. Jalankan development server
npm run dev
```

---

## 📁 Struktur Folder

```
frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/                    # Komponen UI reusable
│   │   ├── AdminHeader.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── ContactForm.jsx
│   │   ├── Footer.jsx
│   │   ├── InvestorHeader.jsx
│   │   ├── InvestorSidebar.jsx
│   │   ├── LocationPicker.jsx
│   │   ├── Navbar.jsx
│   │   ├── OwnerSidebar.jsx
│   │   ├── PacmanLoader.jsx
│   │   ├── PropertyCard.jsx
│   │   ├── TenantHeader.jsx
│   │   └── TenantSidebar.jsx
│   ├── context/                       # Global state management
│   │   ├── AuthContext.jsx            # State autentikasi & user session
│   │   └── Web3Context.jsx            # State wallet MetaMask & Web3
│   ├── hooks/                         # Custom React hooks
│   │   ├── useLang.js                 # Hook multi-bahasa
│   │   ├── useMarketplaceProperties.js
│   │   └── useNotifications.js
│   ├── i18n/                          # Internasionalisasi
│   │   └── translations.js            # Tabel terjemahan (ID/EN)
│   ├── pages/                         # Halaman per role
│   │   ├── admin/                     # Halaman khusus Admin
│   │   │   └── dashboard/
│   │   ├── investor/                  # Halaman khusus Investor
│   │   │   ├── DashboardInvestor.jsx
│   │   │   ├── FormReview.jsx
│   │   │   ├── InvestorFeedback.jsx
│   │   │   ├── InvestorNotifikasi.jsx
│   │   │   ├── InvestorProfile.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── MarketplaceInvestor.jsx
│   │   │   ├── PortfolioInvestor.jsx
│   │   │   └── TransaksiInvestor.jsx
│   │   ├── owner/                     # Halaman khusus Property Owner
│   │   └── tenant/                    # Halaman publik & Tenant
│   │       ├── ForgotPassword.jsx
│   │       ├── Governance.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── KebijakanPrivasi.jsx
│   │       ├── LandingPage.jsx
│   │       ├── Marketplace.jsx
│   │       ├── PasswordUpdated.jsx
│   │       ├── PropertyDetail.jsx
│   │       ├── ResetPassword.jsx
│   │       ├── Resources.jsx
│   │       ├── SignIn.jsx
│   │       ├── SignUp.jsx
│   │       └── SyaratKetentuan.jsx
│   ├── services/
│   │   └── api.js                     # Axios instance & endpoint calls
│   ├── utils/
│   │   ├── contractABI.json           # ABI Smart Contract (Solidity)
│   │   └── contracts.js               # Helper interaksi Smart Contract
│   ├── App.css
│   ├── App.jsx                        # Root component & React Router setup
│   ├── index.css
│   └── main.jsx                       # Entry point Vite
├── .env
├── .eslintrc.config.js
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

---

## 🔐 Autentikasi & Role

Autentikasi dikelola via **AuthContext** menggunakan JWT dari backend. Navigasi dilindungi dengan Protected Routes berdasarkan role pengguna.

| Role       | Akses Halaman                                          |
|------------|--------------------------------------------------------|
| `ADMIN`    | Dashboard admin, verifikasi properti, moderasi pasar  |
| `OWNER`    | Manajemen listing properti, verifikasi pembayaran     |
| `INVESTOR` | Dashboard, marketplace, portfolio, riwayat transaksi  |
| `TENANT`   | Halaman publik, marketplace, booking, pembayaran sewa |

---

## 🌐 Web3 & Blockchain

Integrasi Web3 dikelola via **Web3Context** yang menyediakan:

- Koneksi wallet **MetaMask**
- Saldo token & alamat wallet
- Interaksi Smart Contract via `ethers.js` / `web3.js`
- ABI Contract tersedia di `src/utils/contractABI.json`
- Helper fungsi kontrak di `src/utils/contracts.js`

---

## 🗂️ Halaman Utama

### Publik (Tenant / Guest)
| Halaman             | Path                   | Deskripsi                              |
|---------------------|------------------------|----------------------------------------|
| Landing Page        | `/`                    | Halaman utama platform                 |
| Marketplace         | `/marketplace`         | Daftar properti tersedia               |
| Property Detail     | `/property/:id`        | Detail properti & form investasi       |
| How It Works        | `/how-it-works`        | Panduan cara kerja platform            |
| Governance          | `/governance`          | Tata kelola & voting                   |
| Resources           | `/resources`           | Artikel & dokumentasi                  |
| Sign In             | `/signin`              | Login pengguna                         |
| Sign Up             | `/signup`              | Registrasi pengguna baru               |
| Forgot Password     | `/forgot-password`     | Permintaan reset password              |
| Reset Password      | `/reset-password`      | Halaman buat password baru             |
| Kebijakan Privasi   | `/privacy-policy`      | Kebijakan privasi platform             |
| Syarat & Ketentuan  | `/terms`               | Syarat dan ketentuan penggunaan        |

### Investor (Protected)
| Halaman                  | Deskripsi                              |
|--------------------------|----------------------------------------|
| Dashboard Investor       | Ringkasan portofolio & dividen         |
| Marketplace Investor     | Marketplace khusus investor            |
| Portfolio Investor       | Detail kepemilikan token properti      |
| Transaksi Investor       | Riwayat transaksi investasi            |
| Investor Notifikasi      | Notifikasi investasi & dividen         |
| Investor Profile         | Profil & pengaturan akun              |
| Investor Feedback        | Kirim ulasan / laporan                 |
| Form Review              | Formulir ulasan properti              |
| Map View                 | Visualisasi lokasi properti di peta    |

---

## 🌍 Internasionalisasi (i18n)

Platform mendukung multi-bahasa menggunakan hook `useLang` dan file terjemahan di `src/i18n/translations.js`.

```javascript
import { useLang } from '../hooks/useLang';

const { t } = useLang();
// t('key') → mengembalikan terjemahan sesuai bahasa aktif
```

---

## 📡 Komunikasi dengan Backend

Semua request ke backend menggunakan **Axios** via `src/services/api.js`.

```javascript
// Contoh: ambil properti marketplace
import api from '../services/api';

const { data } = await api.get('/properties/marketplace/investor');
```

Base URL dikonfigurasi via environment variable:

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🌐 Environment Variables

| Key                  | Deskripsi                                  |
|----------------------|--------------------------------------------|
| `VITE_API_BASE_URL`  | URL backend API (Express.js)               |
| `VITE_CONTRACT_ADDRESS` | Alamat Smart Contract yang di-deploy    |
| `VITE_CHAIN_ID`      | Chain ID jaringan blockchain (misal: `11155111` untuk Sepolia) |
| `VITE_PINATA_GATEWAY` | URL gateway IPFS Pinata untuk preview dokumen |

---

## 🛠️ Tech Stack

| Teknologi       | Keterangan                                  |
|-----------------|---------------------------------------------|
| React.js        | UI library berbasis komponen                |
| Vite            | Build tool & dev server                     |
| React Router    | Client-side routing & protected routes      |
| Axios           | HTTP client untuk komunikasi API            |
| ethers.js       | Interaksi Smart Contract & wallet Web3      |
| Context API     | Global state (Auth & Web3)                  |

---

## 🧑‍💻 Tim Pengembang

Proyek ini dikembangkan oleh mahasiswa Program Studi Ilmu Komputer, **Institut Teknologi Bacharuddin Jusuf Habibie (ITH)** — 2026.

| Nama                  | NIM        | Peran                                          |
|-----------------------|------------|------------------------------------------------|
| Muhammad Rifki Rusli  | 231011027  | Fullstack Developer, Blockchain & Smart Contract |
| Putri Adelia          | 231011024  | UI/UX Designer & Frontend Developer            |
| Ryan Hidayat          | 231011074  | QA Engineer & Backend Support                  |
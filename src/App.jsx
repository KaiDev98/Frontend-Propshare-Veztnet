import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from "axios";

// Layout & UI Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SyaratKetentuan from "./pages/SyaratKetentuan"; // Path ke file yang baru dibuat
import KebijakanPrivasi from "./pages/KebijakanPrivasi"; // Path ke file yang baru dibuat

// Public Pages
import LandingPage from './pages/LandingPage';
import Marketplace from './pages/Marketplace';
import HowItWorks from './pages/HowItWorks';
import Governance from './pages/Governance';
import Resources from './pages/Resources';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

// Password Management Pages
import ForgotPassword  from "./pages/ForgotPassword";
import ResetPassword   from "./pages/ResetPassword";
import PasswordUpdated from "./pages/PasswordUpdated";

// Owner Pages
import ManajemenProposal from './pages/owner/ManajemenProposal';  
import NewProperty from './pages/owner/NewProperty';
import ReviewPublish from "./pages/owner/ReviewPublish";
import Profile from "./pages/owner/Profile";
import DashboardFunding from "./pages/owner/DashboardFunding";
import AllTransaction from "./pages/owner/AllTransaction";
import PenarikanModal from "./pages/owner/PenarikanModal";
import ManajemenHunian from "./pages/owner/ManajemenHunian";
import PusatLaporan from "./pages/owner/PusatLaporan";
import DetailProperty from "./pages/owner/DetailProperty";
import OwnerReviews from './pages/owner/OwnerReviews';

// Admin Pages
import ManajemenEscrow from "./pages/admin/ManajemenEscrow";
import MonitoringAktivitas from "./pages/admin/MonitoringAktivitas";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifikasi from "./pages/admin/AdminNotifikasi";
import UserManagement from './pages/admin/UserManagement';
import PropertyManagement from "./pages/admin/PropertyManagement";
import AdminEditProfile from './pages/admin/AdminEditProfile';

// Investor Pages
import DashboardInvestor from "./pages/investor/DashboardInvestor";
import MarketplaceInvestor from "./pages/investor/MarketplaceInvestor";
import InvestorPortfolio from "./pages/investor/PortfolioInvestor";
import InvestorTransactions from "./pages/investor/TransaksiInvestor";
import InvestorPropertyDetail from "./pages/investor/InvestorPropertyDetail";
import InvestorProfile from './pages/investor/InvestorProfile';
import MapView from './pages/investor/MapView';
import InvestorNotifikasi from './pages/investor/InvestorNotifikasi';
import InvestorFeedback from "./pages/investor/InvestorFeedback";

// Tenant Pages
import DashboardTenant from "./pages/tenant/DashboardTenant";
import RoomTenant from "./pages/tenant/RoomTenant";
import PaymentTenant from "./pages/tenant/PaymentTenant";
import MaintenanceTenant from "./pages/tenant/MaintenanceTenant";
import TenantMarketplace from "./pages/tenant/TenantMarketplace";
import AjukanSewa        from "./pages/tenant/AjukanSewa";
import PropertyDetail from "./pages/tenant/PropertyDetail";
import MyBookings from "./pages/tenant/MyBookings";
import TenantSupport from "./pages/tenant/TenantSupport";
import NotificationsTenant from "./pages/tenant/NotificationsTenant";
import ProfileTenant from "./pages/tenant/ProfileTenant";
import TenantReview from './pages/tenant/TenantReview';
import TenantFeedback from './pages/tenant/TenantFeedback';

// Komponen untuk scroll ke atas otomatis saat pindah halaman
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return null;
}

function Layout() {
  const location = useLocation();

  // Logika untuk menyembunyikan Navbar & Footer pada halaman tertentu
  const isAuthPage = [
    '/signin', 
    '/signup', 
    '/forgot-password', 
    '/reset-password', 
    '/password-updated'
  ].includes(location.pathname)
    || location.pathname.startsWith('/owner')
    || location.pathname.startsWith('/investor')
    || location.pathname.startsWith('/tenant')
    || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />

      {/* Navbar hanya muncul jika BUKAN halaman auth/dashboard */}
      {!isAuthPage && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage key={location.key} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/syarat-ketentuan" element={<SyaratKetentuan />} />
          <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />

          {/* Password Management */}
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/reset-password"   element={<ResetPassword />} />
          <Route path="/password-updated" element={<PasswordUpdated />} />

          {/* Owner Routes */}
          <Route path="/owner/proposal" element={<ManajemenProposal />} />
          <Route path="/owner/new-property" element={<NewProperty />} />
          <Route path="/owner/review-publish" element={<ReviewPublish />} />
          <Route path="/owner/profile" element={<Profile />} />
          <Route path="/owner/dashboard-funding" element={<DashboardFunding />} />
          <Route path="/owner/transactions" element={<AllTransaction />} />
          <Route path="/owner/withdrawal" element={<PenarikanModal />} />
          <Route path="/owner/hunian" element={<ManajemenHunian />} />
          <Route path="/owner/laporan" element={<PusatLaporan />} />
          <Route path="/owner/property/:id" element={<DetailProperty />} />
          <Route path="/owner/reviews" element={<OwnerReviews />} />

          {/* Admin Routes */}
          <Route path="/admin/escrow" element={<ManajemenEscrow />} />
          <Route path="/admin/monitoring" element={<MonitoringAktivitas />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/notifikasi" element={<AdminNotifikasi />} />
          <Route path="/admin/editprofile" element={<AdminEditProfile/>} />
          <Route path="/admin/users" element={<UserManagement/>} />
          <Route path="/admin/properties" element={<PropertyManagement />} />

          {/* Investor Routes */}
          <Route path="/investor/dashboard" element={<DashboardInvestor />} />
          <Route path="/investor/marketplace" element={<MarketplaceInvestor />} />
          <Route path="/investor/portfolio" element={<InvestorPortfolio />} />
          <Route path="/investor/transactions" element={<InvestorTransactions />} />
          <Route path="/investor/property/:id" element={<InvestorPropertyDetail />} />
          <Route path="/investor/profile" element={<InvestorProfile />} />
          <Route path="/investor/map"      element={<MapView />} />
          <Route path="/investor/notifications" element={<InvestorNotifikasi />} />
          {/* <Route path="/investor/feedback" element={<InvestorFeedback />} /> */}

          {/* Tenant Routes */}
          <Route path="/tenant/dashboard" element={<DashboardTenant />} />
          <Route path="/tenant/room" element={<RoomTenant />} />
          <Route path="/tenant/payments" element={<PaymentTenant />} />
          <Route path="/tenant/maintenance" element={<MaintenanceTenant />} />
          <Route path="/tenant/marketplace" element={<TenantMarketplace />} />
          <Route path="/tenant/apply/:propertyId" element={<AjukanSewa />} />
          <Route path="/tenant/property/:propertyId" element={<PropertyDetail />} />
          <Route path="/tenant/bookings" element={<MyBookings />} />
          <Route path="/tenant/support" element={<TenantSupport />} />
          <Route path="/tenant/notifications" element={<NotificationsTenant />} />
          <Route path="/tenant/profile" element={<ProfileTenant />} />
          <Route path="/tenant/review" element={<TenantReview />} />
          <Route path="/tenant/feedback" element={<TenantFeedback />} />
        </Routes>
      </main>

      {/* Footer hanya muncul jika BUKAN halaman auth/dashboard */}
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { ShoppingBagIcon } from "@heroicons/react/24/outline";

import { doc, getDoc } from 'firebase/firestore';
import { auth, db, onAuthStateChanged } from './Components/firebaseConfig.js';
import { signOut } from 'firebase/auth';

import TrackOrder from './Components/TrackOrder.jsx';
import WorkerDashboard from './Components/WorkerDashboard.jsx';
import AdminPanel from './Components/AdminPanel.jsx';
import Home from './Components/Home.jsx';
import Login from './Components/Login.jsx';
import Register from './Components/Register.jsx';
import Profile from './Components/Profile.jsx';
import FarmerDashboard from './Components/FarmerDashboard.jsx';
import AboutUs from './Components/pages/AboutUs.jsx';
import ContactUs from './Components/pages/ContactUs.jsx';
import Terms from './Components/pages/Terms.jsx';
import RefundPolicy from './Components/pages/RefundPolicy.jsx';
import PrivacyPolicy from './Components/pages/PrivacyPolicy.jsx';
import DriverDashboard from './Components/DriverDashboard.js';
import TermsAndConditions from './Components/TermsAndConditions.js';
import SendWhatsAppMessage from './Components/SendWhatsAppMessage.jsx';
import UploadEquipment from './Components/pages/newpages/UploadEquipment.jsx';
import EquipmentList from './Components/pages/newpages/EquipmentList.jsx';
import EquipmentDetails from './Components/pages/newpages/EquipmentDetails.jsx';
import AdminEquipment from './Components/pages/newpages/AdminEquipment.jsx';
import Marketplace from './Components/Marketplace/Marketplace.jsx';
import MarketplaceAdmin from './Components/Marketplace/MarketplaceAdmin.jsx';
import ProductDetails from './Components/Marketplace/ProductDetails.jsx';
import SellForm from './Components/Marketplace/SellForm.jsx';
import MyListings from './Components/Marketplace/MyListings.jsx';
import MyBids from './Components/Marketplace/MyBids.jsx';
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";

/* -------------------------
   BOTTOM NAV (with translations, ripple, pulse, glow)
   ------------------------- */
const BottomNav = ({ user, role, lang, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const translations = {
    mr: {
      home: "मुख्यपृष्ठ",
      register: "नोंदणी",
      about: "आमच्याबद्दल",
      login: "लॉगिन",
      orders: "ऑर्डर्स",
      profile: "प्रोफाइल",
      logout: "बाहेर पडा",
      dashboard: "डॅशबोर्ड",
      admin: "ॲडमिन"
    },
    hi: {
      home: "होम",
      register: "रजिस्टर",
      about: "हमारे बारे में",
      login: "लॉगिन",
      orders: "ऑर्डर्स",
      profile: "प्रोफाइल",
      logout: "लॉगआउट",
      dashboard: "डैशबोर्ड",
      admin: "एडमिन"
    },
    en: {
      home: "Home",
      register: "Register",
      about: "About Us",
      login: "Login",
      orders: "Orders",
      profile: "Profile",
      logout: "Logout",
      dashboard: "Dashboard",
      admin: "Admin"
    }
  };

  const t = translations[lang] || translations['mr'];

  const getNavItems = () => {
    if (!user) {
      return [
        { label: t.home, to: "/", icon: "fas fa-home" },
        { label: t.register, to: "/register", icon: "fas fa-user-plus" },
        { label: t.about, to: "/about", icon: "fas fa-info-circle" },
        { label: t.login, to: "/login", icon: "fas fa-sign-in-alt" }
      ];
    }

    if (role === "farmer") {
      return [
        { label: t.home, to: "/", icon: "fas fa-home" },
        { label: t.orders, to: "/farmer-dashboard", icon: "fas fa-clipboard-list" },
        { label: t.profile, to: "/profile", icon: "fas fa-user" },
        { label: t.logout, to: "#", icon: "fas fa-sign-out-alt", action: handleLogout }
      ];
    }

    if (role === "worker") {
      return [
        { label: t.home, to: "/", icon: "fas fa-home" },
        { label: t.dashboard, to: "/worker-dashboard", icon: "fas fa-chart-line" },
        { label: t.profile, to: "/profile", icon: "fas fa-user" },
        { label: t.logout, to: "#", icon: "fas fa-sign-out-alt", action: handleLogout }
      ];
    }

    if (role === "driver") {
      return [
        { label: t.home, to: "/", icon: "fas fa-home" },
        { label: t.dashboard, to: "/driver-dashboard", icon: "fas fa-tachometer-alt" },
        { label: t.profile, to: "/profile", icon: "fas fa-user" },
        { label: t.logout, to: "#", icon: "fas fa-sign-out-alt", action: handleLogout }
      ];
    }

    if (role === "admin") {
      return [
        { label: t.home, to: "/", icon: "fas fa-home" },
        { label: t.admin, to: "/admin-panel", icon: "fas fa-cogs" },
        { label: t.profile, to: "/profile", icon: "fas fa-user" },
        { label: t.logout, to: "#", icon: "fas fa-sign-out-alt", action: handleLogout }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const handleFloatingButton = () => {
    if (!user) return navigate("/");
    if (role === "farmer") return navigate("/marketplace");
    if (role === "worker") return navigate("/worker-dashboard");
    if (role === "driver") return navigate("/driver-dashboard");
    if (role === "admin") return navigate("/admin-panel");
    return navigate("/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center z-50 md:hidden">
      <div className="
        bg-white shadow-xl border-t border-gray-200
        rounded-t-3xl w-full
        h-20 px-6 flex justify-between items-center
        relative backdrop-blur-lg
      ">
        {/* LEFT */}
        <div className="flex space-x-6">
          {navItems.slice(0, 2).map((item, i) => (
            <button
              key={i}
              className="flex flex-col items-center ripple"
              onClick={() => item.action ? item.action() : navigate(item.to)}
            >
              <i
                className={`${item.icon} text-xl ${location.pathname === item.to ? "text-green-700 scale-110 active-glow" : "text-gray-500"
                  }`}
              ></i>
              <span className={`text-xs mt-1 ${location.pathname === item.to ? "text-green-700 font-bold" : "text-gray-500"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* FLOATING + BUTTON */}
        <button
          onClick={handleFloatingButton}
          className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-green-700 w-16 h-16 rounded-full text-white shadow-[0_0_15px_rgba(0,150,0,0.6)] border-4 border-white flex items-center justify-center transition-all hover:scale-110 active:scale-90"

          aria-label="Primary Action"
        >
          <ShoppingBagIcon className="w-8 h-8 text-white" />
        </button>


        {/* RIGHT */}
        <div className="flex space-x-6">
          {navItems.slice(-2).map((item, i) => (
            <button
              key={i}
              className="flex flex-col items-center ripple"
              onClick={() => item.action ? item.action() : navigate(item.to)}
            >
              <i
                className={`${item.icon} text-xl ${location.pathname === item.to ? "text-green-700 scale-110 active-glow" : "text-gray-500"
                  }`}
              ></i>
              <span className={`text-xs mt-1 ${location.pathname === item.to ? "text-green-700 font-bold" : "text-gray-500"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------
   MAIN APP
   ------------------------- */
const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // language default = Marathi
  const [lang, setLang] = useState('mr');

  const navT = {
    mr: {
      home: "मुख्यपृष्ठ",
      register: "नोंदणी",
      profile: "प्रोफाइल",
      track: "ट्रॅक ऑर्डर्स",
      worker: "वर्कर डॅशबोर्ड",
      driver: "ड्रायव्हर डॅशबोर्ड",
      admin: "ॲडमिन पॅनल",
      login: "लॉगिन",
      logout: "बाहेर पडा"
    },
    hi: {
      home: "होम",
      register: "रजिस्टर",
      profile: "प्रोफाइल",
      track: "ट्रैक ऑर्डर",
      worker: "वर्कर डैशबोर्ड",
      driver: "ड्राइवर डैशबोर्ड",
      admin: "एडमिन पैनल",
      login: "लॉगिन",
      logout: "लॉगआउट"
    },
    en: {
      home: "Home",
      register: "Register",
      profile: "Profile",
      track: "Track Orders",
      worker: "Worker Dashboard",
      driver: "Driver Dashboard",
      admin: "Admin Panel",
      login: "Login",
      logout: "Logout"
    }
  };

  const tTop = navT[lang] || navT['mr'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser(currentUser);
            setRole(userDoc.data().role || '');
          } else {
            setError('User data not found.');
          }
        } catch (err) {
          setError('Error fetching user data: ' + err.message);
        }
      } else {
        setUser(null);
        setRole('');
      }
    });
    return () => unsubscribe();
  }, []);



  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole('');
      setIsMenuOpen(false);
      window.location.href = '/login';
    } catch (err) {
      setError('Error logging out: ' + err.message);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <Router>
        <div className="pb-20 md:pb-0">
          {/* TOP NAV */}
          <nav className="bg-gradient-to-r from-green-700 to-green-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                <Link to="/" className="flex items-center space-x-2">
                  <img
                    src="https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png"
                    width={45}
                    alt="logo" />
                  <span className="text-2xl font-extrabold">खेतीसाथी</span>
                </Link>

                {/* language selector (desktop) */}
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="hidden md:block bg-green-800 text-white text-xs px-2 py-1 rounded-md"
                >
                  <option value="mr">मराठी</option>
                  <option value="hi">हिन्दी</option>
                  <option value="en">English</option>
                </select>

                {/* desktop menu */}
                <div className="hidden md:flex items-center space-x-6">
                  {(role === 'farmer' || !user) && <Link to="/" className="toplink">{tTop.home}</Link>}
                  {!user && <Link to="/register" className="toplink">{tTop.register}</Link>}

                  {user && role === 'farmer' && (
                    <>
                      <Link to="/profile" className="toplink">{tTop.profile}</Link>
                      <Link to="/farmer-dashboard" className="toplink">{tTop.track}</Link>
                    </>
                  )}

                  {user && role === 'worker' && <Link to="/worker-dashboard" className="toplink">{tTop.worker}</Link>}
                  {user && role === 'driver' && <Link to="/driver-dashboard" className="toplink">{tTop.driver}</Link>}
                  {user && role === 'admin' && <Link to="/admin-panel" className="toplink">{tTop.admin}</Link>}

                  {user ? (
                    <button onClick={handleLogout} className="logoutbtn">
                      <i className="fas fa-sign-out-alt" /> <span>{tTop.logout}</span>
                    </button>
                  ) : (
                    <Link to="/login" className="loginbtn">
                      <i className="fas fa-sign-in-alt" /> <span>{tTop.login}</span>
                    </Link>
                  )}
                </div>

                {/* mobile menu toggle */}
                <div className="md:hidden">
                  <button onClick={toggleMenu} className="text-white p-2 rounded-md hover:bg-green-800/50">
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`} />
                  </button>
                </div>
              </div>

              {/* mobile menu */}
              {isMenuOpen && (
                <div className="md:hidden bg-green-800/95 backdrop-blur-sm p-4 space-y-3">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-green-700 text-white text-sm px-2 py-1 rounded-md mb-2"
                  >
                    <option value="mr">मराठी</option>
                    <option value="hi">हिन्दी</option>
                    <option value="en">English</option>
                  </select>

                  {/* {(role === 'farmer' || !user) && <Link to="/" onClick={() => setIsMenuOpen(false)} className="mobilelink">{tTop.home}</Link>}
            {!user && <Link to="/register" onClick={() => setIsMenuOpen(false)} className="mobilelink">{tTop.register}</Link>} */}

                  {/* {user && role === 'farmer' && (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="mobilelink">{tTop.profile}</Link>
                <Link to="/farmer-dashboard" onClick={() => setIsMenuOpen(false)} className="mobilelink">{tTop.track}</Link>
              </>
            )} */}

                  {/* {user && role === 'worker' && <Link to="/worker-dashboard" className="mobilelink">{tTop.worker}</Link>}
            {user && role === 'driver' && <Link to="/driver-dashboard" className="mobilelink">{tTop.driver}</Link>}
            {user && role === 'admin' && <Link to="/admin-panel" className="mobilelink">{tTop.admin}</Link>}

            {user ? (
              <button onClick={handleLogout} className="mobilelink text-left">
                <i className="fas fa-sign-out-alt" /> {tTop.logout}
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="mobilelink">{tTop.login}</Link>
            )} */}
                </div>
              )}
            </div>
          </nav>

          {/* error */}
          {error && <div className="text-red-500 text-center p-4 bg-red-100">{error}</div>}

          {/* routes */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/worker-dashboard" element={<WorkerDashboard />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/whatsapp" element={<SendWhatsAppMessage />} />
            <Route path="/upload-equipment" element={<UploadEquipment />} />
            <Route path="/equipment-list" element={<EquipmentList />} />
            <Route path="/equipment/:id" element={<EquipmentDetails />} />
            <Route path="/admin/equipments" element={<AdminEquipment />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<ProductDetails />} />
            <Route path="/sell" element={<SellForm currentUser={auth.currentUser} />} />
            <Route path="/admin/marketplace" element={<MarketplaceAdmin />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/my-bids" element={<MyBids />} />
          </Routes>
        </div>

        {/* bottom nav */}
        <BottomNav user={user} role={role} lang={lang} handleLogout={handleLogout} />
      </Router></>
  );
};

export default App;

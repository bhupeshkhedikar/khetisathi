import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from './firebaseConfig.js';
import { db } from './firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import UploadEquipment from './pages/newpages/UploadEquipment.jsx';
import EquipmentDetails from './pages/newpages/EquipmentDetails.jsx';
import EquipmentList from './pages/newpages/EquipmentList.jsx';
import AdminEquipment from './pages/newpages/AdminEquipment.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('marathi');
  const [loading, setLoading] = useState(false);

  // Popup Snackbar
  const [popup, setPopup] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();

  const translations = {
    english: {
      login: "Login",
      email: "Email",
      password: "Password",
      dontHaveAccount: "Don't have an account?",
      register: "Register",
      invalidUserRole: "Invalid user role.",
      userDataNotFound: "User data not found.",
      success: "Login successful!",
      invalidCredential: "Email or password is incorrect",
    },
    hindi: {
      login: "लॉगिन",
      email: "ईमेल",
      password: "पासवर्ड",
      dontHaveAccount: "खाता नहीं है?",
      register: "पंजीकरण करें",
      invalidUserRole: "अमान्य उपयोगकर्ता भूमिका।",
      userDataNotFound: "उपयोगकर्ता डेटा नहीं मिला।",
      success: "लॉगिन सफल!",
      invalidCredential: "ईमेल या पासवर्ड गलत है",
    },
    marathi: {
      login: "लॉगिन",
      email: "ईमेल",
      password: "पासवर्ड",
      dontHaveAccount: "खाते नाही आहे का?",
      register: "नोंदणी करा",
      invalidUserRole: "अवैध वापरकर्ता भूमिका.",
      userDataNotFound: "वापरकर्ता डेटा सापडला नाही.",
      success: "लॉगिन यशस्वी!",
      invalidCredential: "ईमेल किंवा पासवर्ड चुकीचा आहे",
    },
  };

  const t = translations[language];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Show success popup
        setPopup({ show: true, message: t.success, type: 'success' });

        // Allow popup to be visible before redirect
        setTimeout(() => {
          if (role === 'worker') {
            navigate('/worker-dashboard');
          } else if (role === 'farmer') {
            navigate('/');
          } else if (role === 'admin') {
            navigate('/admin-panel');
          } else if (role === 'driver') {
            navigate('/driver-dashboard');
          } else {
            setPopup({ show: true, message: t.invalidUserRole, type: 'error' });
          }
        }, 1500);

      } else {
        setPopup({ show: true, message: t.userDataNotFound, type: 'error' });
      }

    } catch (err) {
      let message = err.message;

      if (err.code === "auth/invalid-credential") {
        message = t.invalidCredential;
      }

      setPopup({ show: true, message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
    {/* <AdminEquipment/>
    <EquipmentList/>
    <EquipmentDetails/>
    <UploadEquipment /> */}
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg relative">

      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Snackbar Popup */}
      {popup.show && (
        <div
          className={`fixed top-6 right-6 z-50 transition-all duration-500 transform
          ${popup.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
          px-5 py-3 rounded-xl shadow-lg text-white font-semibold
          ${popup.type === 'success' ? 'bg-green-600' : 'bg-red-600'}
        `}
        >
          <i className={`fas ${popup.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
          {popup.message}

          <button
            className="ml-4 text-lg font-bold"
            onClick={() => setPopup({ show: false, message: '', type: '' })}
          >
            ✕
          </button>
        </div>
      )}

      {/* Language Dropdown */}
      <div className="mb-4">
        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="marathi">मराठी</option>
          <option value="hindi">हिन्दी</option>
          <option value="english">English</option>
        </select>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-center text-green-800">
        <i className="fas fa-sign-in-alt mr-2"></i> {t.login}
      </h2>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700">{t.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
        >
          <i className="fas fa-sign-in-alt mr-2"></i> {t.login}
        </button>
      </form>

      <p className="mt-4 text-center">{t.dontHaveAccount}</p>

      <Link to="/register">
        <button className="w-full bg-green-600 text-white p-3 rounded-full font-semibold mt-3 hover:bg-green-700 transition">
          {t.register}
        </button>
      </Link>
    </div></>
  );
};

export default Login;

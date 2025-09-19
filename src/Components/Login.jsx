import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from './firebaseConfig.js';
import { db } from './firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('marathi');
  const [loading, setLoading] = useState(false);
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
    invalidCredential: "Email or password is incorrect",   // ✅ added
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
    invalidCredential: "ईमेल या पासवर्ड गलत है",   // ✅ added
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
    invalidCredential: "ईमेल किंवा पासवर्ड चुकीचा आहे",   // ✅ added
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

      setPopup({ show: true, message: t.success, type: 'success' });

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
          setError(t.invalidUserRole);
          setPopup({ show: true, message: t.invalidUserRole, type: 'error' });
        }
      }, 1500);
    } else {
      setError(t.userDataNotFound);
      setPopup({ show: true, message: t.userDataNotFound, type: 'error' });
    }
  } catch (err) {
    let message = err.message;

    // 👇 custom error handling for wrong email/password
    if (err.code === "auth/invalid-credential") {
         message = t.invalidCredential; 
    }

    setError(message);
    setPopup({ show: true, message, type: 'error' });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg relative">
      {/* Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="w-12 h-12 border-4 border-green-600 border-dashed rounded-full animate-spin"></div>
        </div>
      )}

      {/* Popup */}
      {popup.show && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white transition ${
            popup.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {popup.message}
          <button
            className="ml-3 text-white font-bold"
            onClick={() => setPopup({ show: false, message: '', type: '' })}
          >
            ✕
          </button>
        </div>
      )}

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

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700">{t.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? '...' : <><i className="fas fa-sign-in-alt mr-2"></i> {t.login}</>}
        </button>
      </form>

      <p className="mt-4 text-center">
        {t.dontHaveAccount}
      </p> 
      <br />
      <Link to="/register">
        <button
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
        >
          {t.register}
        </button>
      </Link>
    </div>
  );
};

export default Login;

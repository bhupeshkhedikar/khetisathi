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
    },
    hindi: {
      login: "लॉगिन",
      email: "ईमेल",
      password: "पासवर्ड",
      dontHaveAccount: "खाता नहीं है?",
      register: "पंजीकरण करें",
      invalidUserRole: "अमान्य उपयोगकर्ता भूमिका।",
      userDataNotFound: "उपयोगकर्ता डेटा नहीं मिला।",
    },
    marathi: {
      login: "लॉगिन",
      email: "ईमेल",
      password: "पासवर्ड",
      dontHaveAccount: "खाते नाही आहे का?",
      register: "नोंदणी करा",
      invalidUserRole: "अवैध वापरकर्ता भूमिका.",
      userDataNotFound: "वापरकर्ता डेटा सापडला नाही.",
    },
  };

  const t = translations[language];

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Redirect based on role
        if (role === 'worker') {
          navigate('/worker-dashboard');
        } else if (role === 'farmer') {
          navigate('/');
        } else if (role === 'admin') {
          navigate('/admin-panel');
        }else if (role === 'driver') {
          navigate('/driver-dashboard');
        } else {
          setError(t.invalidUserRole);
        }
      } else {
        setError(t.userDataNotFound);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
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
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
        >
          <i className="fas fa-sign-in-alt mr-2"></i> {t.login}
        </button>
      </form>
      <p className="mt-4 text-center">
        {t.dontHaveAccount}
      </p> <br/>
              <button
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
        >
         <Link to="/register">{t.register}</Link> 
        </button>
    </div>
  );
};

export default Login;

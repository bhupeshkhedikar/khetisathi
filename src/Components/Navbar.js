import React, { useState, useEffect } from 'react';
import { auth, signOut, onAuthStateChanged } from './firebaseConfig.js';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => setUser(user));
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="bg-green-600 p-4 text-white flex justify-between items-center shadow-lg">
      <div className="text-2xl font-bold flex items-center">
        <i className="fas fa-tractor mr-2"></i> KhetiSathi
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="hidden md:inline mr-4">Welcome, {user.email}</span>
            {user.email === 'admin@farmconnect.com' && (
              <a href="#admin" className="hover:text-green-200 transition"><i className="fas fa-cogs mr-1"></i> Admin</a>
            )}
            <a href="#track" className="hover:text-green-200 transition"><i className="fas fa-map-marker-alt mr-1"></i> Track</a>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded-full font-semibold hover:bg-red-600 transition"
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Logout
            </button>
          </>
        ) : (
          <>
            <a href="#login" className="hover:text-green-200 transition"><i className="fas fa-sign-in-alt mr-1"></i> Login</a>
            <a
              href="#register"
              className="bg-blue-500 px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition"
            >
              <i className="fas fa-user-plus mr-1"></i> Register
            </a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
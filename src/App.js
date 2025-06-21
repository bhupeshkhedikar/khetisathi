import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, where, query, doc, getDoc } from 'firebase/firestore';
import { auth, db, onAuthStateChanged } from './Components/firebaseConfig.js';
import TrackOrder from './Components/TrackOrder.jsx';
import { signOut } from 'firebase/auth';
import WorkerDashboard from './Components/WorkerDashboard.jsx';
import AdminPanel from './Components/AdminPanel.jsx';
import Home from './Components/Home.jsx';
import Login from './Components/Login.jsx';
import Register from './Components/Register.jsx';
import Profile from './Components/Profile.jsx';
import FarmerDashboard from './Components/FarmerDashboard.jsx';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUser(user);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Router>
      <nav className="bg-gradient-to-r from-green-700 to-green-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
             <img src='https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png' height='100px' width={45}/>
              <span className="text-2xl font-extrabold tracking-tight text-white font-poppins">खेतीसाथी</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                Home
              </Link>
              <Link to="/register" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                Register
              </Link>
              {user && role === 'farmer' && (
                <>
                  <Link to="/track-order" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                    Track Orders
                  </Link>
                  <Link to="/profile" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                    Profile
                  </Link>
                  <Link to="/farmer-dashboard" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                    Farmer Dashboard
                  </Link>
                </>
              )}
              {user && role === 'worker' && (
                <Link to="/worker-dashboard" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                  Worker Dashboard
                </Link>
              )}
              {user && role === 'admin' && (
                <Link to="/admin-panel" className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hover:bg-green-800/50">
                  Admin Panel
                </Link>
              )}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-green-300 font-medium text-sm px-4 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              ) : (
                <Link to="/login" className="text-white hover:text-green-300 font-medium text-sm px-4 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="text-white focus:outline-none p-2 rounded-md hover:bg-green-800/50 transition duration-300"
                aria-label="Toggle menu"
              >
                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-green-800/95 backdrop-blur-sm">
              <div className="flex flex-col space-y-2 py-4 px-4">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                >
                  Home
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                >
                  Register
                </Link>
                {user && role === 'farmer' && (
                  <>
                    <Link
                      to="/track-order"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                    >
                      Track Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/farmer-dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                    >
                      Farmer Dashboard
                    </Link>
                  </>
                )}
                {user && role === 'worker' && (
                  <Link
                    to="/worker-dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                  >
                    Worker Dashboard
                  </Link>
                )}
                {user && role === 'admin' && (
                  <Link
                    to="/admin-panel"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50"
                  >
                    Admin Panel
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50 text-left flex items-center space-x-2"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white hover:text-green-300 font-medium text-sm px-3 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-green-700/50 flex items-center space-x-2"
                  >
                    <i className="fas fa-sign-in-alt"></i>
                    <span>Login</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {error && (
        <div className="text-red-500 text-center p-4 bg-red-100/80 backdrop-blur-sm">
          {error}
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
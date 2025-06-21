import React, { useState } from 'react';
import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import SKILLS from '../utils/skills.js';

const Register = () => {
  const [activeTab, setActiveTab] = useState('farmer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'farmer',
    gender: '',
    pincode: '',
    mobile: '',
    skills: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData({ ...formData, role: tab, gender: '', skills: [] });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'skills') {
      const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
      setFormData({ ...formData, skills: selectedOptions });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, name, role, gender, pincode, mobile, skills } = formData;

    // Validate inputs
    if (!email || !password || !name || !role || !pincode || !mobile) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (role === 'worker' && (!gender || skills.length === 0)) {
      setError('Gender and at least one skill are required for workers.');
      setLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setError('Pincode must be a 6-digit number.');
      setLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('Mobile number must be a 10-digit number.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in Firestore
      const userData = {
        email,
        name,
        role,
        pincode,
        mobile,
        status: role === 'worker' ? 'pending' : 'approved',
        createdAt: new Date().toISOString(),
      };
      if (role === 'worker') {
        userData.gender = gender;
        userData.skills = skills;
        userData.availability = { workingDays: [], offDays: [] };
      }
      await setDoc(doc(db, 'users', user.uid), userData);

      alert('Registration successful!');
      navigate(role === 'worker' ? '/worker-dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-green-800">Register</h2>
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('farmer')}
          className={`flex-1 py-3 text-center font-semibold rounded-l-lg transition duration-300 ${
            activeTab === 'farmer'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Farmer
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('worker')}
          className={`flex-1 py-3 text-center font-semibold rounded-r-lg transition duration-300 ${
            activeTab === 'worker'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Worker
        </button>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        {activeTab === 'worker' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Skills</label>
              <select
                name="skills"
                multiple
                value={formData.skills}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                {SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple skills.</p>
            </div>
          </>
        )}
        <div className="mb-4">
          <label className="block text-gray-700">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
            pattern="\d{6}"
            title="Enter a 6-digit pincode"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Mobile Number</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
            pattern="\d{10}"
            title="Enter a 10-digit mobile number"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-green-600 hover:underline">Login</Link>
      </p>
    </div>
  );
};

export default Register;
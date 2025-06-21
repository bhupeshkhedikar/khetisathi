import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', pincode: '', mobile: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            name: userData.name || '',
            pincode: userData.pincode || '',
            mobile: userData.mobile || ''
          });
        } else {
          setError('Profile not found.');
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(profile.pincode)) {
      setError('Pincode must be a 6-digit number.');
      return;
    }
    if (!/^\d{10}$/.test(profile.mobile)) {
      setError('Mobile number must be a 10-digit number.');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: profile.name,
        pincode: profile.pincode,
        mobile: profile.mobile
      });
      alert('Profile updated successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-green-800">Update Profile</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Pincode</label>
          <input
            type="text"
            value={profile.pincode}
            onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
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
            value={profile.mobile}
            onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
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
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      <p className="mt-4 text-center">
        Back to <Link to="/" className="text-green-600 hover:underline">Home</Link>
      </p>
    </div>
  );
};

export default Profile;

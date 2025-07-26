import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const FarmerProfileCard = () => {
  const [profile, setProfile] = useState({ name: '', village: '', pincode: '', mobile: '' });
  const [editModal, setEditModal] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fullProfile = {
            name: userData.name || 'Unknown Farmer',
            village: userData.village || 'Unknown Village',
            pincode: userData.pincode || '',
            mobile: userData.mobile || ''
          };
          setProfile(fullProfile);
          setTempProfile(fullProfile);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setSuccess('');
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), tempProfile);
      setProfile(tempProfile);
      setEditModal(false);
      setSuccess('✅ Profile updated successfully!');
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-b-3xl relative">
          <div className="flex justify-center">
            <img
              src="https://png.pngtree.com/png-clipart/20230126/original/pngtree-farmer-farm-worker-hand-painted-png-image_8930802.png"
              alt="Farmer Avatar"
              className="w-24 h-24 rounded-full border-4 border-white -mb-12 shadow-md"
            />
          </div>
          <div className="mt-14 text-center">
            <h2 className="text-white text-xl font-bold">{profile.name}</h2>
            <p className="text-green-100 text-sm">Registered Farmer</p>
          </div>

          {/* <div className="flex justify-around mt-4 text-white text-sm">
            <div className="flex flex-col items-center">
              <span className="material-icons text-xl">email</span>
              <span>Email</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-icons text-xl">call</span>
              <span>Call</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-icons text-xl">whatsapp</span>
              <span>WhatsApp</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-icons text-xl">star</span>
              <span>Favorite</span>
            </div>
          </div> */}
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4 text-gray-700">
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <DetailItem label="📍 Village" value={profile.village} />
          <DetailItem label="🏷️ Pincode" value={profile.pincode} />
          <DetailItem label="📱 Mobile" value={profile.mobile} />

          <div className="flex justify-between pt-4 border-t mt-4">
            <button
              onClick={() => setEditModal(true)}
              className="flex-1 bg-green-600 text-white py-2 rounded-full mr-2 font-semibold shadow hover:bg-green-700 transition"
            >
              Update Profile
            </button>
            <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-full ml-2 font-semibold shadow hover:bg-gray-300 transition">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* 🔁 Update Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-green-700">✏️ Edit Profile</h3>

            {['name', 'village', 'pincode', 'mobile'].map((field, i) => (
              <div key={i} className="mb-4">
                <label className="block text-sm font-medium mb-1 capitalize">
                  {field}
                </label>
                <input
                  type="text"
                  value={tempProfile[field]}
                  onChange={(e) => setTempProfile({ ...tempProfile, [field]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:outline-none"
                />
              </div>
            ))}

            <div className="flex justify-end mt-4 space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between items-center border-b pb-2">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-base font-medium">{value}</span>
  </div>
);

export default FarmerProfileCard;

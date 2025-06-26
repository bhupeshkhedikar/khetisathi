import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

const DriverApproval = () => {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect for authentication and data fetching
  useEffect(() => {
    if (!auth) {
      setError('Firebase Authentication not initialized.');
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            setError('User document does not exist.');
            return;
          }
          const userData = userDoc.data();
          if (userData.role !== 'admin') {
            setError('Access restricted to admins.');
            return;
          }
          setUser(user);

          // Query for all drivers
          const driversQuery = query(
            collection(db, 'users'),
            where('role', '==', 'driver')
          );

          const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
            const driverList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setDrivers(driverList);
          }, (err) => {
            console.error('Error fetching drivers:', err);
            setError(`Error fetching drivers: ${err.message}`);
          });

          // Cleanup listener
          return () => unsubscribeDrivers();
        } catch (err) {
          console.error('Error initializing driver approval:', err);
          setError(`Initialization error: ${err.message}`);
        }
      } else {
        setError('Please log in as an admin.');
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(`Authentication error: ${err.message}`);
    });

    return () => unsubscribeAuth();
  }, []);

  // Handle approving a driver
  const handleApproveDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to approve this driver?')) return;
    setLoading(true);
    try {
      const driverRef = doc(db, 'users', driverId);
      await updateDoc(driverRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      alert('Driver approved successfully!');
    } catch (err) {
      console.error('Error approving driver:', err);
      setError(`Error approving driver: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting a driver
  const handleRejectDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to reject this driver?')) return;
    setLoading(true);
    try {
      const driverRef = doc(db, 'users', driverId);
      await updateDoc(driverRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      alert('Driver rejected successfully!');
    } catch (err) {
      console.error('Error rejecting driver:', err);
      setError(`Error rejecting driver: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user || error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 text-center">{error || 'Please log in as an admin.'}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-center text-green-700">Driver Approval</h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      {/* Drivers Table */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-green-700">Driver Registrations</h3>
        {drivers.length === 0 ? (
          <p className="text-center text-gray-600">No driver registrations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-green-600 text-white">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Pincode</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Vehicle Skills</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{driver.name || 'N/A'}</td>
                    <td className="p-3">{driver.pincode || 'N/A'}</td>
                    <td className="p-3">{driver.mobile || 'N/A'}</td>
                    <td className="p-3">
                      {driver.vehicleSkills && driver.vehicleSkills.length > 0
                        ? driver.vehicleSkills
                            .map((skill) => skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                            .join(', ')
                        : 'None'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
                          ${driver.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            driver.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                      >
                        {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      {driver.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveDriver(driver.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectDriver(driver.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`text-sm font-semibold ${driver.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DriverApproval;
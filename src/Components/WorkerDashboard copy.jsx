import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import SKILLS from '../utils/skills.js';

const WorkerDashboard = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('pending');
  const [workerStatus, setWorkerStatus] = useState('ready');
  const [orders, setOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [availability, setAvailability] = useState({ workingDays: [], offDays: [] });
  const [skills, setSkills] = useState([]);
  const [profile, setProfile] = useState({ name: '', pincode: '', gender: '', mobile: '', workerStatus: 'ready' });
  const [newAvailabilityDate, setNewAvailabilityDate] = useState('');
  const [availabilityType, setAvailabilityType] = useState('working');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timers, setTimers] = useState({});
  const [timerIntervals, setTimerIntervals] = useState({});
  const [paymentMethod, setPaymentMethod] = useState({});
  const [orderPincodes, setOrderPincodes] = useState({});

  // Format date as "DD MMMM YYYY"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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
          if (userData.role !== 'worker') {
            setError('Access restricted to workers.');
            return;
          }
          setUser(user);
          setStatus(userData.status || 'pending');
          setWorkerStatus(userData.workerStatus || 'ready');
          setProfile({
            name: userData.name || '',
            pincode: userData.pincode || '',
            gender: userData.gender || '',
            mobile: userData.mobile || '',
            workerStatus: userData.workerStatus || 'ready'
          });
          setSkills(userData.skills || []);
          setAvailability(userData.availability || { workingDays: [], offDays: [] });

          // Query for active orders (pending or assigned)
          const singleWorkerQuery = query(
            collection(db, 'orders'),
            where('workerId', '==', user.uid),
            where('status', 'in', ['pending', 'assigned'])
          );
          const arrayWorkerQuery = query(
            collection(db, 'orders'),
            where('workerId', 'array-contains', user.uid),
            where('status', 'in', ['pending', 'assigned'])
          );

          // Query for rejected orders (pending reassignment)
          const singleRejectedQuery = query(
            collection(db, 'orders'),
            where('workerId', '==', user.uid),
            where('accepted', '==', 'rejected'),
            where('status', '==', 'pending')
          );
          const arrayRejectedQuery = query(
            collection(db, 'orders'),
            where('workerAcceptances', 'array-contains', { workerId: user.uid, status: 'rejected' }),
            where('status', '==', 'pending')
          );

          // Fetch active orders
          const unsubscribeSingleWorker = onSnapshot(singleWorkerQuery, async (snapshot) => {
            const singleOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(prevOrders => {
              const arrayOrders = prevOrders.filter(o => Array.isArray(o.workerId));
              return [...arrayOrders, ...singleOrders];
            });
            await fetchOrderPincodes(singleOrders);
          }, (err) => {
            console.error('Error fetching single worker orders:', err);
            setError(`Error fetching orders: ${err.message}`);
          });

          const unsubscribeArrayWorker = onSnapshot(arrayWorkerQuery, async (snapshot) => {
            const arrayOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(prevOrders => {
              const singleOrders = prevOrders.filter(o => !Array.isArray(o.workerId));
              return [...singleOrders, ...arrayOrders];
            });
            await fetchOrderPincodes(arrayOrders);
          }, (err) => {
            console.error('Error fetching array worker orders:', err);
            setError(`Error fetching orders: ${err.message}`);
          });

          // Fetch rejected orders
          const unsubscribeSingleRejected = onSnapshot(singleRejectedQuery, async (snapshot) => {
            const singleRejected = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRejectedOrders(prevOrders => {
              const arrayRejected = prevOrders.filter(o => Array.isArray(o.workerId));
              return [...arrayRejected, ...singleRejected];
            });
            await fetchOrderPincodes(singleRejected);
          }, (err) => {
            console.error('Error fetching single rejected orders:', err);
            setError(`Error fetching rejected orders: ${err.message}`);
          });

          const unsubscribeArrayRejected = onSnapshot(arrayRejectedQuery, async (snapshot) => {
            const arrayRejected = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRejectedOrders(prevOrders => {
              const singleRejected = prevOrders.filter(o => !Array.isArray(o.workerId));
              return [...singleRejected, ...arrayRejected];
            });
            await fetchOrderPincodes(arrayRejected);
          }, (err) => {
            console.error('Error fetching array rejected orders:', err);
            setError(`Error fetching rejected orders: ${err.message}`);
          });

          // Fetch pincodes for orders
          const fetchOrderPincodes = async (orders) => {
            const newOrderPincodes = { ...orderPincodes };
            for (const order of orders) {
              if (!order.farmerId) continue;
              const farmerRef = doc(db, 'users', order.farmerId);
              const farmerDoc = await getDoc(farmerRef);
              if (farmerDoc.exists()) {
                newOrderPincodes[order.id] = farmerDoc.data().pincode || '';
              }
            }
            setOrderPincodes(newOrderPincodes);
          };

          // Fetch services and earnings
          const servicesSnapshot = await getDocs(collection(db, 'services'));
          setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          const earningsSnapshot = await getDocs(collection(db, `users/${user.uid}/earnings`));
          setEarnings(earningsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Cleanup listeners
          return () => {
            unsubscribeSingleWorker();
            unsubscribeArrayWorker();
            unsubscribeSingleRejected();
            unsubscribeArrayRejected();
          };
        } catch (err) {
          console.error('Error initializing worker dashboard:', err);
          setError(`Initialization error: ${err.message}`);
        }
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(`Authentication error: ${err.message}`);
    });

    return () => unsubscribeAuth();
  }, []);

  // Handle order timeout
const handleTimeoutOrder = async (orderId) => {
  setLoading(true);
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      console.warn(`Order ${orderId} does not exist.`);
      return;
    }
    const orderData = orderDoc.data();

    let updateData = {};
    if (Array.isArray(orderData.workerId)) {
      const updatedAcceptances = orderData.workerAcceptances
        ? orderData.workerAcceptances.map(wa =>
            wa.workerId === user.uid
              ? { ...wa, status: 'rejected', rejectedAt: new Date().toISOString() }
              : wa
          )
        : orderData.workerId.map(wid => ({
            workerId: wid,
            status: wid === user.uid ? 'rejected' : 'pending',
            ...(wid === user.uid ? { rejectedAt: new Date().toISOString() } : {})
          }));
      const updatedWorkerIds = orderData.workerId.filter(id => id !== user.uid);
      const updatedAttemptedWorkers = [...(orderData.attemptedWorkers || []), user.uid];
      updateData = {
        workerId: updatedWorkerIds.length > 0 ? updatedWorkerIds : null,
        workerAcceptances: updatedAcceptances,
        status: 'pending',
        attemptedWorkers: updatedAttemptedWorkers,
        updatedAt: serverTimestamp(),
      };
    } else {
      updateData = {
        workerId: null,
        accepted: 'rejected',
        status: 'pending',
        attemptedWorkers: [...(orderData.attemptedWorkers || []), user.uid],
        updatedAt: serverTimestamp(),
      };
    }

    await updateDoc(orderRef, updateData);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { workerStatus: 'ready' });
    setWorkerStatus('ready');
    setProfile(prev => ({ ...prev, workerStatus: 'ready' }));
  } catch (err) {
    console.error('Error handling timeout order:', err);
    setError(`Error handling timeout: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  // Effect for updating timers
  useEffect(() => {
    const updateTimers = (newOrders) => {
      newOrders.forEach(order => {
        const workerAcceptance = Array.isArray(order.workerAcceptances)
          ? order.workerAcceptances.find(wa => wa.workerId === user?.uid)?.status || 'pending'
          : order.accepted || 'pending';
        if (workerAcceptance === 'pending' && order.timeout) {
          const timeout = new Date(order.timeout).getTime();
          const updateTimer = () => {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((timeout - now) / 1000));
            setTimers(prev => ({ ...prev, [order.id]: timeLeft }));
            if (timeLeft === 0) {
              clearInterval(timerIntervals[order.id]);
              setTimerIntervals(prev => {
                const newIntervals = { ...prev };
                delete newIntervals[order.id];
                return newIntervals;
              });
              // Handle timeout by rejecting the order
              handleTimeoutOrder(order.id);
            }
          };
          updateTimer();
          if (!timerIntervals[order.id]) {
            const interval = setInterval(updateTimer, 1000);
            setTimerIntervals(prev => ({ ...prev, [order.id]: interval }));
          }
        } else {
          clearInterval(timerIntervals[order.id]);
          setTimerIntervals(prev => {
            const newIntervals = { ...prev };
            delete newIntervals[order.id];
            return newIntervals;
          });
          setTimers(prev => ({ ...prev, [order.id]: 0 }));
        }
      });
    };

    updateTimers(orders);

    return () => {
      Object.values(timerIntervals).forEach(clearInterval);
      setTimerIntervals({});
    };
  }, [orders, user]);

  // Handle accepting an order
  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();

      let updateData = {};
      if (Array.isArray(orderData.workerId)) {
        const updatedAcceptances = orderData.workerAcceptances
          ? orderData.workerAcceptances.map(wa =>
              wa.workerId === user.uid ? { ...wa, status: 'accepted' } : wa
            )
          : orderData.workerId.map(wid => ({
              workerId: wid,
              status: wid === user.uid ? 'accepted' : 'pending'
            }));
        const allAccepted = updatedAcceptances.every(wa => wa.status === 'accepted');
        updateData = {
          workerAcceptances: updatedAcceptances,
          status: allAccepted ? 'assigned' : 'pending',
          updatedAt: serverTimestamp(),
        };
      } else {
        updateData = {
          accepted: 'accepted',
          status: 'assigned',
          updatedAt: serverTimestamp(),
        };
      }

      await updateDoc(orderRef, updateData);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { workerStatus: 'busy' });
      setWorkerStatus('busy');
      setProfile(prev => ({ ...prev, workerStatus: 'busy' }));

      alert('Order accepted!');
    } catch (err) {
      console.error('Error accepting order:', err);
      setError(`Error accepting order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting an order
const handleRejectOrder = async (orderId) => {
  setLoading(true);
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    const orderData = orderDoc.data();

    let updateData = {};
    if (Array.isArray(orderData.workerId)) {
      const updatedAcceptances = orderData.workerAcceptances
        ? orderData.workerAcceptances.map(wa =>
            wa.workerId === user.uid
              ? { ...wa, status: 'rejected', rejectedAt: new Date().toISOString() }
              : wa
          )
        : orderData.workerId.map(wid => ({
            workerId: wid,
            status: wid === user.uid ? 'rejected' : 'pending',
            ...(wid === user.uid ? { rejectedAt: new Date().toISOString() } : {})
          }));
      const updatedWorkerIds = orderData.workerId.filter(id => id !== user.uid);
      const updatedAttemptedWorkers = [...(orderData.attemptedWorkers || []), user.uid];
      updateData = {
        workerId: updatedWorkerIds.length > 0 ? updatedWorkerIds : null,
        workerAcceptances: updatedAcceptances,
        status: 'pending',
        attemptedWorkers: updatedAttemptedWorkers,
        updatedAt: serverTimestamp(),
      };
    } else {
      updateData = {
        workerId: null,
        accepted: 'rejected',
        status: 'pending',
        attemptedWorkers: [...(orderData.attemptedWorkers || []), user.uid],
        updatedAt: serverTimestamp(),
      };
    }

    await updateDoc(orderRef, updateData);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { workerStatus: 'ready' });
    setWorkerStatus('ready');
    setProfile(prev => ({ ...prev, workerStatus: 'ready' }));

    alert('Order rejected! It is now pending reassignment by the admin.');
  } catch (err) {
    console.error('Error rejecting order:', err);
    setError(`Error rejecting order: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  // Handle completing an order
  const handleCompleteOrder = async (orderId) => {
    if (!paymentMethod[orderId]) {
      setError('Please select a payment method.');
      return;
    }
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();

      let updateData = {};
      if (Array.isArray(orderData.workerId)) {
        const updatedAcceptances = orderData.workerAcceptances.map(wa =>
          wa.workerId === user.uid
            ? { ...wa, status: 'completed', completedAt: new Date().toISOString(), paymentMethod: paymentMethod[orderId] }
            : wa
        );
        const allFinalized = updatedAcceptances.every(wa => wa.status === 'completed' || wa.status === 'rejected');
        const hasCompletedWorkers = updatedAcceptances.some(wa => wa.status === 'completed');
        updateData = {
          workerAcceptances: updatedAcceptances,
          status: allFinalized && hasCompletedWorkers ? 'completed' : 'assigned',
          updatedAt: serverTimestamp(),
        };
        if (allFinalized && hasCompletedWorkers) {
          updateData.paymentStatus = {
            method: paymentMethod[orderId],
            status: 'paid'
          };
        }
      } else {
        updateData = {
          accepted: 'completed',
          status: 'completed',
          completedAt: serverTimestamp(),
          paymentStatus: { method: paymentMethod[orderId], status: 'paid' },
          updatedAt: serverTimestamp(),
        };
      }

      await updateDoc(orderRef, updateData);

      const workerCount = Array.isArray(orderData.workerId) ? orderData.workerId.length : 1;
      await addDoc(collection(db, `users/${user.uid}/earnings`), {
        orderId,
        serviceType: orderData.serviceType,
        cost: orderData.cost / workerCount,
        completedAt: serverTimestamp(),
        paymentMethod: paymentMethod[orderId],
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { workerStatus: 'ready' });
      setWorkerStatus('ready');
      setProfile(prev => ({ ...prev, workerStatus: 'ready' }));

      setPaymentMethod(prev => ({ ...prev, [orderId]: undefined }));
      alert('Task marked as completed and payment recorded!');
    } catch (err) {
      console.error('Error completing order:', err);
      setError(`Error completing order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding availability
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!newAvailabilityDate) {
      setError('Please select a date.');
      return;
    }
    setLoading(true);
    try {
      const updatedAvailability = { ...availability };
      if (availabilityType === 'working') {
        if (!updatedAvailability.workingDays.includes(newAvailabilityDate)) {
          updatedAvailability.workingDays.push(newAvailabilityDate);
          updatedAvailability.offDays = updatedAvailability.offDays.filter(d => d !== newAvailabilityDate);
        }
      } else {
        if (!updatedAvailability.offDays.includes(newAvailabilityDate)) {
          updatedAvailability.offDays.push(newAvailabilityDate);
          updatedAvailability.workingDays = updatedAvailability.workingDays.filter(d => d !== newAvailabilityDate);
        }
      }
      await updateDoc(doc(db, 'users', user.uid), { availability: updatedAvailability });
      setAvailability(updatedAvailability);
      setNewAvailabilityDate('');
      alert('Availability updated!');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(`Error updating availability: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating skills
  const handleUpdateSkills = async (e) => {
    e.preventDefault();
    if (skills.length === 0) {
      setError('Please select at least one skill.');
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { skills });
      alert('Skills updated!');
    } catch (err) {
      console.error('Error updating skills:', err);
      setError(`Error updating skills: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!/^\d{6}$/.test(profile.pincode)) {
        setError('Pincode must be a 6-digit number.');
        setLoading(false);
        return;
      }
      if (!/^\d{10}$/.test(profile.mobile)) {
        setError('Mobile number must be a 10-digit number.');
        setLoading(false);
        return;
      }
      if (!['busy', 'ready'].includes(profile.workerStatus)) {
        setError('Invalid worker status selected.');
        setLoading(false);
        return;
      }

      const updatedProfile = {
        name: profile.name,
        pincode: profile.pincode,
        gender: profile.gender,
        mobile: profile.mobile,
        workerStatus: profile.workerStatus,
      };

      await updateDoc(doc(db, 'users', user.uid), updatedProfile);
      setWorkerStatus(profile.workerStatus);
      setError('');
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Error updating profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle skills change
  const handleSkillsChange = (e) => {
    const selectedSkills = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSkills(selectedSkills);
  };

  if (!user || error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 text-center">{error || 'Please log in as a worker.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
      {/* Welcome and Status Chips */}
      <div className="text-center mb-4">
        <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white">
          Welcome, {profile.name || 'Worker'}
        </span>
      </div>
      <div className="text-center mb-4 flex justify-center space-x-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
            ${status === 'approved' ? 'bg-green-100 text-green-800' :
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'}`}
        >
          Approval: {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
            ${workerStatus === 'busy' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'}`}
        >
          Status: {workerStatus.charAt(0).toUpperCase() + workerStatus.slice(1)}
        </span>
      </div>
      <h2 className="text-3xl font-bold mb-8 text-center text-green-700">Worker Dashboard</h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      {/* Pending Tasks Section */}
    <section className="mb-8">
  <h3 className="text-2xl font-semibold mb-4 text-green-700">Pending Tasks</h3>
  <div className="grid grid-cols-1 gap-6">
    {orders.length === 0 ? (
      <p className="text-center text-gray-600">No tasks assigned yet.</p>
    ) : (
      orders.map(order => {
        const isWorkerAssigned = Array.isArray(order.workerId)
          ? order.workerId.includes(user.uid)
          : order.workerId === user.uid;
        const workerAcceptance = Array.isArray(order.workerAcceptances)
          ? order.workerAcceptances.find(wa => wa.workerId === user.uid)?.status || 'pending'
          : order.accepted || 'pending';

        if (!isWorkerAssigned || workerAcceptance === 'rejected' || workerAcceptance === 'completed') {
          return null;
        }

        return (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {services.find(s => s.type === order.serviceType)?.name || order.serviceType}
                </h4>
                <p className="text-sm text-gray-500">
                  Earnings: ₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)}
                </p>
              </div>
              {workerAcceptance === 'pending' && (
                timers[order.id] > 0 ? (
                  <span className="text-sm font-medium text-red-600">
                    Time Left: {Math.floor(timers[order.id] / 60)}:{(timers[order.id] % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    Timeout
                  </span>
                )
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.serviceType === 'farm-workers' && (
                <>
                  {order.bundleDetails ? (
                    <p className="text-gray-600">
                      <span className="font-medium">Bundle:</span> {order.bundleDetails.name} (
                      {order.bundleDetails.maleWorkers} Male + {order.bundleDetails.femaleWorkers} Female)
                    </p>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        <span className="font-medium">Male Workers:</span> {order.maleWorkers || 0}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Female Workers:</span> {order.femaleWorkers || 0}
                      </p>
                    </>
                  )}
                </>
              )}
              {order.serviceType === 'tractor-drivers' && (
                <p className="text-gray-600">
                  <span className="font-medium">Hours:</span> {order.hours || 'N/A'}
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Days:</span> {order.numberOfDays || 1} Day{order.numberOfDays > 1 ? 's' : ''}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Start Date:</span> {order.startDate || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">End Date:</span> {order.endDate || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Start Time:</span> {order.startTime || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> {order.address || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Pincode:</span> {orderPincodes[order.id] || 'N/A'}
                {!orderPincodes[order.id] && (
                  <span className="text-yellow-600 text-sm ml-2">[Missing]</span>
                )}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Contact:</span> {order.contactNumber || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Payment Method:</span>{' '}
                {order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Note:</span> {order.additionalNote || 'None'}
              </p>
            </div>
            {workerAcceptance === 'pending' && (
              <>
                {timers[order.id] > 0 ? (
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                      disabled={loading || status !== 'approved'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Accept (₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)})
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      disabled={loading || status !== 'approved'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <p className="text-red-600 font-semibold">You cannot accept this task now.</p>
                  </div>
                )}
              </>
            )}
            {workerAcceptance === 'accepted' && (
              <div className="mt-6">
                <p className="text-green-600 font-semibold mb-2">Task Accepted</p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <select
                    value={paymentMethod[order.id] || ''}
                    onChange={e => setPaymentMethod(prev => ({ ...prev, [order.id]: e.target.value }))}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    disabled={loading || !paymentMethod[order.id] || status !== 'approved'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Mark as Completed
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
</section>

        {/* Rejected Tasks Section */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Rejected Tasks (Pending Reassignment)</h3>
          <div className="grid grid-cols-1 gap-6">
            {rejectedOrders.length === 0 ? (
              <p className="text-center text-gray-600">No tasks rejected.</p>
            ) : (
              rejectedOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {services.find(s => s.type === order.serviceType)?.name || order.serviceType}
                      </h4>
                      <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                      <p className="text-sm text-gray-500">
                        Earnings: ₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)}
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      Pending Reassignment
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <p className="text-gray-600">
                      <span className="font-medium">Start Date:</span> {order.startDate || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Pincode:</span> {orderPincodes[order.id] || 'N/A'}
                      {!orderPincodes[order.id] && (
                        <span className="text-yellow-600 text-sm ml-2">[Missing]</span>
                      )}
                    </p>
                  </div>
                  <p className="mt-4 text-gray-600 font-semibold">
                    This task was rejected by you and is now pending reassignment by the admin.
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Availability Section */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Set Availability</h3>
          <form onSubmit={handleAddAvailability} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  value={newAvailabilityDate}
                  onChange={e => setNewAvailabilityDate(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Type</label>
                <select
                  value={availabilityType}
                  onChange={e => setAvailabilityType(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="working">Working Day</option>
                  <option value="off">Off Day</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              Update Availability
            </button>
          </form>
          <div className="mt-4">
            <p className="text-gray-700 font-semibold">Working Days:</p>
            <div className="mt-2">
              {availability.workingDays.length === 0 ? (
                <p className="text-gray-600">None</p>
              ) : (
                availability.workingDays.map(date => (
                  <span
                    key={date}
                    date
                      className="inline-block px-3 py-4 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 mr-2 mb-2"
                  >
                    {formatDate(date)}
                  </span>
                ))
              )}
            </div>
            <p className="text-gray-700 font-semibold mt-4">Off Days:</p>
            <div className="mt-2">
              {availability.offDays.length === 0 ? (
                <p className="text-gray-600">None</p>
              ) : (
                availability.offDays.map(date => (
                  <span
                    key={date}
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-red-400 text-red-100 text-red-800 mr-2 mb-2"
                  >
                    {formatDate(date)}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Earnings Section */}
<section className="mb-8">
  <h3 className="text-2xl font-semibold mb-4 text-green-700">Earnings</h3>
  <div className="bg-white rounded-lg shadow-lg p-4">
    <p className="text-green-600 font-bold text-xl">
      Total Earnings: ₹{(earnings.reduce((sum, e) => sum + (e.cost || 0), 0)).toFixed(2)}
    </p>
    <div className="grid grid-cols-1 gap-4 mt-4">
      {earnings.length === 0 ? (
        <p className="text-center text-gray-600">No earnings recorded.</p>
      ) : (
        earnings.map(earning => (
          <div key={earning.id} className="bg-gray-50 rounded-lg p-4">
            <p><strong>Order ID:</strong> {earning.orderId}</p>
            <p><strong>Service:</strong> {services.find(s => s.type === earning.serviceType)?.name || earning.serviceType}</p>
            <p><strong>Earnings:</strong> ₹{(earning.cost || 0).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> {earning.paymentMethod ? earning.paymentMethod.charAt(0).toUpperCase() + earning.paymentMethod.slice(1) : 'N/A'}</p>
            <p><strong>Completed:</strong> {earning.completedAt ? new Date(earning.completedAt.toDate()).toLocaleDateString('en-IN') : 'N/A'}</p>
          </div>
        ))
      )}
    </div>
  </div>
</section>

        {/* Skills Section */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Manage Skills</h3>
          <form onSubmit={handleUpdateSkills} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-4">
              <label className="block text-gray-700">Select Skills</label>
              <select
                multiple
                value={skills}
                onChange={handleSkillsChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
              >
                {SKILLS.map(skill => (
                  <option key={skill} value={skill}>
                    {skill.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple skills.</p>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              Update Skills
            </button>
          </form>
          <div className="mt-4">
            <p className="text-gray-700 font-semibold">Current Skills:</p>
            <div className="mt-2">
              {skills.length === 0 ? (
                <p className="text-gray-600">No skills selected.</p>
              ) : (
                skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 mr-2 mb-2"
                  >
                    {skill.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Profile Section */}
        <section>
          <h3 className="text-2xl font-semibold mb-4 text-green-700">Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-lg shadow-lg" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Pincode</label>
                <input
                  type="text"
                  value={profile.pincode || ''}
                  onChange={e => setProfile(prev => ({ ...prev, pincode: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                  pattern="\d{6}"
                  title="Enter a 6-digit pincode"
                />
              </div>
              <div>
                <label className="block text-gray-700">Mobile Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={profile.mobile || ''}
                  onChange={e => setProfile(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                  pattern="\d{10}"
                  title="Enter a 10-digit mobile number"
                  maxLength="10"
                />
              </div>
              <div>
                <label className="block text-gray-700">Gender</label>
                <select
                  value={profile.gender || ''}
                  onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700">Worker Status</label>
                <select
                  value={profile.workerStatus || 'ready'}
                  onChange={e => setProfile(prev => ({ ...prev, workerStatus: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="ready">Ready</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              Update Profile
            </button>
          </form>
        </section>
      </div>
    );
  };

  export default WorkerDashboard;
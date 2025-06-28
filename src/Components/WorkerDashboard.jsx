import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import SKILLS from '../utils/skills.js';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, CashIcon, UserIcon, ChevronDownIcon, ChevronUpIcon, BanknotesIcon, BoltIcon } from '@heroicons/react/24/outline';

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
  const [showPendingTasks, setShowPendingTasks] = useState(true);
  const [showRejectedTasks, setShowRejectedTasks] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [allSectionsOpen, setAllSectionsOpen] = useState(false);

  // Format date as "DD MMMM YYYY"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Send WhatsApp message
  const sendWhatsAppMessage = async (mobile, message) => {
    try {
      if (!mobile) return false;
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+91${mobile}`, message }),
      });
      return response.ok;
    } catch (err) {
      console.error(`[WorkerDashboard] Error sending WhatsApp message to ${mobile}`, err);
      return false;
    }
  };

  // Toggle all sections
  const toggleAllSections = () => {
    const newState = !allSectionsOpen;
    setAllSectionsOpen(newState);
    setShowPendingTasks(newState);
    setShowRejectedTasks(newState);
    setShowEarnings(newState);
    setShowAvailability(newState);
    setShowSkills(newState);
    setShowProfile(newState);
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

          const unsubscribeSingleWorker = onSnapshot(singleWorkerQuery, async (snapshot) => {
            const singleOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(prevOrders => {
              const arrayOrders = prevOrders.filter(o => Array.isArray(o.workerId));
              return [...arrayOrders, ...singleOrders];
            });
            await fetchOrderPincodes(singleOrders);
          }, (err) => {
            console.error('[WorkerDashboard] Error fetching single worker orders:', err);
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
            console.error('[WorkerDashboard] Error fetching array worker orders:', err);
            setError(`Error fetching orders: ${err.message}`);
          });

          const unsubscribeSingleRejected = onSnapshot(singleRejectedQuery, async (snapshot) => {
            const singleRejected = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRejectedOrders(prevOrders => {
              const arrayRejected = prevOrders.filter(o => Array.isArray(o.workerId));
              return [...arrayRejected, ...singleRejected];
            });
            await fetchOrderPincodes(singleRejected);
          }, (err) => {
            console.error('[WorkerDashboard] Error fetching single rejected orders:', err);
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
            console.error('[WorkerDashboard] Error fetching array rejected orders:', err);
            setError(`Error fetching rejected orders: ${err.message}`);
          });

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

          const servicesSnapshot = await getDocs(collection(db, 'services'));
          setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          const earningsSnapshot = await getDocs(collection(db, `users/${user.uid}/earnings`));
          setEarnings(earningsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          return () => {
            unsubscribeSingleWorker();
            unsubscribeArrayWorker();
            unsubscribeSingleRejected();
            unsubscribeArrayRejected();
          };
        } catch (err) {
          console.error('[WorkerDashboard] Error initializing worker dashboard:', err);
          setError(`Initialization error: ${err.message}`);
        }
      }
    }, (err) => {
      console.error('[WorkerDashboard] Auth state change error:', err);
      setError(`Authentication error: ${err.message}`);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleTimeoutOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        console.warn(`[WorkerDashboard] Order ${orderId} does not exist.`);
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
      console.error('[WorkerDashboard] Error handling timeout order:', err);
      setError(`Error handling timeout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();

      const messageSent = await sendWhatsAppMessage(
        orderData.contactNumber,
        `I am ${profile.name} and ${profile.mobile} your today's worker, I will arrive soon at ${orderData.address}. If any query call Contact: ${profile.mobile}. Regards Khetisathi`
      );
      if (!messageSent && orderData.contactNumber) {
        alert('Failed to send WhatsApp notification to farmer.');
      }

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
      console.error('[WorkerDashboard] Error accepting order:', err);
      setError(`Error accepting order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[WorkerDashboard] Error rejecting order:', err);
      setError(`Error rejecting order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      setProfile(prev => ({ ...prev, capitalworkerStatus: 'ready' }));
      setPaymentMethod(prev => ({ ...prev, [orderId]: undefined }));
      alert('Task marked as completed and payment recorded!');
    } catch (err) {
      console.error('[WorkerDashboard] Error completing order:', err);
      setError(`Error completing order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[WorkerDashboard] Error updating availability:', err);
      setError(`Error updating availability: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[WorkerDashboard] Error updating skills:', err);
      setError(`Error updating skills: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[WorkerDashboard] Error updating profile:', err);
      setError(`Error updating profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (e) => {
    const selectedSkills = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSkills(selectedSkills);
  };

  if (!user || error.includes('Access restricted') || error.includes('Please log in')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl text-center transform transition-all hover:scale-105">
          <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="text-xl font-semibold text-red-600">{error || 'Please log in as a worker.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-800 to-green-300 rounded-xl shadow-lg mb-6 p-6 transform transition-all hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <UserIcon className="w-8 h-8 mr-2 text-white" />
              Welcome, {profile.name || 'Worker'}!
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium text-white ${
                  status === 'approved' ? 'bg-green-700' : 'bg-yellow-500'
                } shadow-md`}
              >
                Approval: {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium text-white ${
                  workerStatus === 'busy' ? 'bg-blue-700' : 'bg-green-700'
                } shadow-md`}
              >
                Status: {workerStatus.charAt(0).toUpperCase() + workerStatus.slice(1)}
              </span>
              <button
                onClick={toggleAllSections}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                aria-label={allSectionsOpen ? "Collapse all sections" : "Expand all sections"}
              >
                <BoltIcon className="w-5 h-5" />
                {allSectionsOpen ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <BanknotesIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">Total Earnings</p>
              <p className="text-3xl font-bold text-white">
                ₹{(earnings.reduce((sum, e) => sum + (e.cost || 0), 0)).toFixed(2)}
              </p>
            </div>
          </div>
<div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <CheckCircleIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">Completed Tasks</p>
              <p className="text-3xl font-bold text-white">{earnings.length}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <CalendarIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">Pending Tasks</p>
              <p className="text-3xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Error and Loading */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-center shadow-md">
            <XCircleIcon className="w-6 h-6 mr-2" />
            <p>{error}</p>
          </div>
        )}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Pending Tasks Section */}
        <section className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowPendingTasks(!showPendingTasks)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-gray-800 hover:bg-gray-50 rounded-t-xl focus:outline-none"
            aria-label="Toggle Pending Tasks"
          >
            <span className="flex items-center">
              <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600" />
              Pending Tasks
            </span>
            {showPendingTasks ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showPendingTasks && (
            <div className="p-6">
              {orders.length === 0 ? (
                <p className="text-center text-gray-600 flex items-center justify-center py-4">
                  <CalendarIcon className="w-6 h-6 mr-2" />
                  No tasks assigned yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {orders.map(order => {
                    const isWorkerAssigned = Array.isArray(order.workerId)
                      ? order.workerId.includes(user.uid)
                      : order.workerId === user.uid;
                    const workerAcceptance = Array.isArray(order.workerAcceptances)
                      ? order.workerAcceptances.find(wa => wa.workerId === user.uid)?.status || 'pending'
                      : order.accepted || 'pending';

                    if (!isWorkerAssigned || workerAcceptance === 'rejected' || workerAcceptance === 'completed') {
                      return null;
                    }

                    const maxTimer = 300;
                    const progress = timers[order.id] > 0 ? (timers[order.id] / maxTimer) * 100 : 0;

                    return (
                      <div
                        key={order.id}
                        className="p-6 bg-gray-50 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800">
                              {services.find(s => s.type === order.serviceType)?.name || order.serviceType.replace('-', ' ').toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Earnings: ₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)}
                            </p>
                          </div>
                          {workerAcceptance === 'pending' && (
                            timers[order.id] > 0 ? (
                              <div className="mt-2 sm:mt-0 flex flex-col items-end gap-2">
                                <div className="flex items-center">
                                  <CalendarIcon className="w-5 h-5 mr-2 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">
                                    {Math.floor(timers[order.id] / 60)}:{(timers[order.id] % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-red-600 h-2.5 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                Timeout
                              </span>
                            )
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {order.serviceType === 'farm-workers' && (
                            <>
                              {order.bundleDetails ? (
                                <p>
                                  <span className="font-medium">Bundle:</span> {order.bundleDetails.name} (
                                  {order.bundleDetails.maleWorkers} Male + {order.bundleDetails.femaleWorkers} Female)
                                </p>
                              ) : (
                                <>
                                  <p><span className="font-medium">Male Workers:</span> {order.maleWorkers || 0}</p>
                                  <p><span className="font-medium">Female Workers:</span> {order.femaleWorkers || 0}</p>
                                </>
                              )}
                            </>
                          )}
                          {order.serviceType === 'ownertc' && (
                            <p><span className="font-medium">Hours:</span> {order.hours || 'N/A'}</p>
                          )}
                          <p><span className="font-medium">Days:</span> {order.numberOfDays || 1} Day{order.numberOfDays > 1 ? 's' : ''}</p>
                          <p><span className="font-medium">Start Date:</span> {formatDate(order.startDate)}</p>
                          <p><span className="font-medium">End Date:</span> {formatDate(order.endDate)}</p>
                          <p><span className="font-medium">Start Time:</span> {order.startTime || 'N/A'}</p>
                          <p><span className="font-medium">Address:</span> {order.address || 'N/A'}</p>
                          <p>
                            <span className="font-medium">Pincode:</span> {orderPincodes[order.id] || 'N/A'}
                            {!orderPincodes[order.id] && (
                              <span className="text-yellow-600 text-xs ml-1">[Missing]</span>
                            )}
                          </p>
                          <p><span className="font-medium">Contact:</span> {order.contactNumber || 'N/A'}</p>
                          <p>
                            <span className="font-medium">Payment Method:</span>{' '}
                            {order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'N/A'}
                          </p>
                          <p><span className="font-medium">Note:</span> {order.additionalNote || 'None'}</p>
                        </div>
                        {workerAcceptance === 'pending' && (
                          <>
                            {timers[order.id] > 0 ? (
                              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={() => handleAcceptOrder(order.id)}
                                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                  disabled={loading || status !== 'approved'}
                                  aria-label="Accept task"
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                  Accept (₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)})
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order.id)}
                                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                  disabled={loading || status !== 'approved'}
                                  aria-label="Reject task"
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <p className="mt-4 text-red-600 flex items-center">
                                <XCircleIcon className="w-5 h-5 mr-2" />
                                You cannot accept this task now.
                              </p>
                            )}
                          </>
                        )}
                        {workerAcceptance === 'accepted' && (
                          <div className="mt-4 flex flex-col sm:flex-row gap-3">
                            <select
                              value={paymentMethod[order.id] || ''}
                              onChange={e => setPaymentMethod(prev => ({ ...prev, [order.id]: e.target.value }))}
                              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                              required
                              aria-label="Select payment method"
                            >
                              <option value="">Select Payment Method</option>
                              <option value="cash">Cash</option>
                              <option value="online">Online</option>
                            </select>
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                              disabled={loading || !paymentMethod[order.id] || status !== 'approved'}
                              aria-label="Mark task as completed"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                              Mark as Completed
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Rejected Tasks Section */}
        <section className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowRejectedTasks(!showRejectedTasks)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-gray-800 hover:bg-gray-50 rounded-t-xl focus:outline-none"
            aria-label="Toggle Rejected Tasks"
          >
            <span className="flex items-center">
              <XCircleIcon className="w-6 h-6 mr-2 text-red-600" />
              Rejected Tasks
            </span>
            {showRejectedTasks ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showRejectedTasks && (
            <div className="p-6">
              {rejectedOrders.length === 0 ? (
                <p className="text-center text-gray-600 flex items-center justify-center py-4">
                  <XCircleIcon className="w-6 h-6 mr-2" />
                  No tasks rejected.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {rejectedOrders.map(order => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {services.find(s => s.type === order.serviceType)?.name || order.serviceType.replace('-', ' ').toUpperCase()}
                          </h4>
                          <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                          <p className="text-sm text-gray-600">
                            Earnings: ₹{(order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)).toFixed(2)}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Pending Reassignment
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <p><span className="font-medium">Start Date:</span> {formatDate(order.startDate)}</p>
                        <p>
                          <span className="font-medium">Pincode:</span> {orderPincodes[order.id] || 'N/A'}
                          {!orderPincodes[order.id] && (
                            <span className="text-yellow-600 text-xs ml-1">[Missing]</span>
                          )}
                        </p>
                      </div>
                      <p className="mt-4 text-red-600 flex items-center text-sm">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        This task was rejected and is pending reassignment.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Earnings Section */}
        <section className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowEarnings(!showEarnings)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-gray-800 hover:bg-gray-50 rounded-t-xl focus:outline-none"
            aria-label="Toggle Earnings"
          >
            <span className="flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2 text-green-600" />
              Earnings
            </span>
            {showEarnings ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showEarnings && (
            <div className="p-6">
              <p className="text-lg font-semibold text-green-600 mb-4">
                Total Earnings: ₹{(earnings.reduce((sum, e) => sum + (e.cost || 0), 0)).toFixed(2)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {earnings.length === 0 ? (
                  <p className="text-center text-gray-600 col-span-full flex items-center justify-center py-4">
                    <BanknotesIcon className="w-6 h-6 mr-2" />
                    No earnings recorded yet.
                  </p>
                ) : (
                  earnings.map(earning => (
                    <div key={earning.id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                      <p className="text-sm"><strong>Order ID:</strong> {earning.orderId}</p>
                      <p className="text-sm"><strong>Service:</strong> {services.find(s => s.type === earning.serviceType)?.name || earning.serviceType.replace('-', ' ').toUpperCase()}</p>
                      <p className="text-sm"><strong>Earnings:</strong> ₹{(earning.cost || 0).toFixed(2)}</p>
                      <p className="text-sm"><strong>Payment Method:</strong> {earning.paymentMethod ? earning.paymentMethod.charAt(0).toUpperCase() + earning.paymentMethod.slice(1) : 'N/A'}</p>
                      <p className="text-sm"><strong>Completed:</strong> {earning.completedAt ? formatDate(earning.completedAt.toDate()) : 'N/A'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Availability Section */}
        <section className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-gray-800 hover:bg-gray-50 rounded-t-xl focus:outline-none"
            aria-label="Toggle Set Availability"
          >
            <span className="flex items-center">
              <CalendarIcon className="w-6 h-6 mr-2 text-green-600" />
              Set Availability
            </span>
            {showAvailability ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showAvailability && (
            <div className="p-6">
              <form onSubmit={handleAddAvailability} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newAvailabilityDate}
                    onChange={e => setNewAvailabilityDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    aria-label="Select availability date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={availabilityType}
                    onChange={e => setAvailabilityType(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                    required
                    aria-label="Select availability type"
                  >
                    <option value="working">Working Day</option>
                    <option value="off">Off Day</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="col-span-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label="Update availability"
                >
                  <CalendarIcon className="w-5 h-5" />
                  Update Availability
                </button>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Working Days:</p>
                  {availability.workingDays.length === 0 ? (
                    <p className="text-sm text-gray-600">No working days set.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.workingDays.sort((a, b) => new Date(a) - new Date(b)).map(date => (
                        <span
                          key={date}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {formatDate(date)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Off Days:</p>
                  {availability.offDays.length === 0 ? (
                    <p className="text-sm text-gray-600">No off days set.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.offDays.sort((a, b) => new Date(a) - new Date(b)).map(date => (
                        <span
                          key={date}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                        >
                          {formatDate(date)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Skills Section */}
        <section className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowSkills(!showSkills)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-gray-800 hover:bg-gray-50 rounded-t-xl focus:outline-none"
            aria-label="Toggle Manage Skills"
          >
            <span className="flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-green-600" />
              Manage Skills
            </span>
            {showSkills ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showSkills && (
            <div className="p-6">
              <form onSubmit={handleUpdateSkills}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Skills</label>
                  <select
                    multiple
                    value={skills}
                    onChange={handleSkillsChange}
                    className="w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-green-600 bg-white"
                    aria-label="Select skills"
                  >
                    {SKILLS.map(skill => (
                      <option key={skill} value={skill}>
                        {skill.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple skills.</p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label="Update skills"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Update Skills
                </button>
              </form>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Current Skills:</p>
                {skills.length === 0 ? (
                  <p className="text-sm text-gray-600">No skills selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Profile Section */}
        <section className="mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-full p-4 flex items-center justify-between text-xl font-semibold text-white hover:bg-opacity-10 hover:bg-white rounded-t-xl focus:outline-none"
            aria-label="Toggle Edit Profile"
          >
            <span className="flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-white" />
              Edit Profile
            </span>
            {showProfile ? <ChevronUpIcon className="w-6 h-6 text-white" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
          </button>
          {showProfile && (
            <div className="p-6 bg-white rounded-b-xl">
              <form onSubmit={handleUpdateProfile} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={profile.pincode || ''}
                      onChange={e => setProfile(prev => ({ ...prev, pincode: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      pattern="\d{6}"
                      title="Enter a 6-digit pincode"
                      aria-label="Enter 6-digit pincode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Enter 10-digit mobile number"
                      value={profile.mobile || ''}
                      onChange={e => setProfile(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      pattern="\d{10}"
                      title="Enter a 10-digit mobile number"
                      maxLength="10"
                      aria-label="Enter 10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={profile.gender || ''}
                      onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label="Select gender"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker Status</label>
                    <select
                      value={profile.workerStatus || 'ready'}
                      onChange={e => setProfile(prev => ({ ...prev, workerStatus: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label="Select worker status"
                    >
                      <option value="ready">Ready</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label="Update profile"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Update Profile
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WorkerDashboard;
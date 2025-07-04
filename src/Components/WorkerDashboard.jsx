import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import {SKILLS,SKILL_LABELS} from '../utils/skills.js';
import translationsWorkerDashboard from './translationsWorkerDashboard.js';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon, ChevronDownIcon, ChevronUpIcon, BanknotesIcon, BoltIcon } from '@heroicons/react/24/outline';

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
  const [serviceFeeWallet, setServiceFeeWallet] = useState(0);
  const [showPendingTasks, setShowPendingTasks] = useState(true);
  const [showRejectedTasks, setShowRejectedTasks] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [allSectionsOpen, setAllSectionsOpen] = useState(false);
  const [language, setLanguage] = useState('marathi'); // Default to Marathi

  const t = translationsWorkerDashboard[language];

  // Format date based on language
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'en' ? 'en-GB' : language === 'hi' ? 'hi-IN' : 'mr-IN';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Send WhatsApp message
  const sendWhatsAppMessage = async (mobile, message) => {
    try {
      if (!mobile) {
        console.warn('[WorkerDashboard] No mobile number provided for WhatsApp message.');
        return false;
      }
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+91${mobile}`, message }),
      });
      if (!response.ok) {
        console.error('[WorkerDashboard] Failed to send WhatsApp message:', await response.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[WorkerDashboard] Error sending WhatsApp message to ${mobile}:`, err);
      return false;
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('[WorkerDashboard] Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('[WorkerDashboard] Failed to load Razorpay script');
      setError(t.errorPaymentGatewayNotLoaded);
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [t]);

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
    if (!auth || !db) {
      setError(t.errorFirebaseNotInitialized);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            setError(t.errorUserDocumentNotExist);
            return;
          }
          const userData = userDoc.data();
          if (userData.role !== 'worker') {
            setError(t.errorAccessRestricted);
            return;
          }
          setUser(user);
          setStatus(userData.status || 'pending');
          setWorkerStatus(userData.workerStatus || 'ready');
          setServiceFeeWallet(userData.serviceFeeWallet || 0);
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
            setError(`${t.errorFetchingOrders}: ${err.message}`);
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
            setError(`${t.errorFetchingOrders}: ${err.message}`);
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
            setError(`${t.errorFetchingRejectedOrders}: ${err.message}`);
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
            setError(`${t.errorFetchingRejectedOrders}: ${err.message}`);
          });

          const fetchOrderPincodes = async (orders) => {
            const newOrderPincodes = { ...orderPincodes };
            for (const order of orders) {
              if (!order.farmerId) continue;
              const farmerRef = doc(db, 'users', order.farmerId);
              const farmerDoc = await getDoc(farmerRef);
              if (farmerDoc.exists()) {
                newOrderPincodes[order.id] = farmerDoc.data().pincode || t.none;
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
          setError(`${t.errorInitialization}: ${err.message}`);
        }
      } else {
        setError(t.errorPleaseLogIn);
      }
    }, (err) => {
      console.error('[WorkerDashboard] Auth state change error:', err);
      setError(`${t.errorAuthStateChange}: ${err.message}`);
    });

    return () => unsubscribeAuth();
  }, [t]);

  const handleTimeoutOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        console.warn(`[WorkerDashboard] Order ${orderId} does not exist.`);
        setError(t.errorOrderNotFound.replace('{orderId}', orderId));
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
      setError(`${t.errorHandlingTimeout}: ${err.message}`);
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
  }, [orders, user, t]);

  const handleAcceptOrder = async (orderId) => {
    if (serviceFeeWallet >= 100) {
      setError(t.serviceFeeWarning.replace('{amount}', serviceFeeWallet.toFixed(2)));
      return;
    }
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error(t.errorOrderNotFound.replace('{orderId}', orderId));
      }
      const orderData = orderDoc.data();

      const serviceName = orderData.serviceType
        ? t[orderData.serviceType] || orderData.serviceType.replace('-', ' ')
        : t.service;

      const message = t.orderAccepted
        .replace('{name}', profile.name)
        .replace('{mobile}', profile.mobile)
        .replace('{service}', serviceName)
        .replace('{address}', orderData.address || t.none);

      const messageSent = await sendWhatsAppMessage(orderData.contactNumber, message);
      if (!messageSent && orderData.contactNumber) {
        console.warn('[WorkerDashboard] Failed to send WhatsApp notification to farmer.');
        alert(t.orderAcceptedFailedWhatsApp);
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

      alert(t.successOrderAccepted);
    } catch (err) {
      console.error('[WorkerDashboard] Error accepting order:', err);
      setError(`${t.errorCompletingOrder}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error(t.errorOrderNotFound.replace('{orderId}', orderId));
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

      alert(t.successOrderRejected);
    } catch (err) {
      console.error('[WorkerDashboard] Error rejecting order:', err);
      setError(`${t.errorRejectingOrder}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!paymentMethod[orderId]) {
      setError(t.errorSelectPaymentMethod);
      return;
    }
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error(t.errorOrderNotFound.replace('{orderId}', orderId));
      }
      const orderData = orderDoc.data();

      if (!orderData.cost || isNaN(orderData.cost) || orderData.cost <= 0) {
        throw new Error(t.errorInvalidOrderCost);
      }

      const workerCount = Array.isArray(orderData.workerId) ? orderData.workerId.length : 1;
      if (workerCount <= 0) {
        throw new Error(t.errorInvalidWorkerCount);
      }

      const grossEarnings = orderData.cost / workerCount;
      const serviceFeeRate = 0.02;
      const serviceFee = grossEarnings * serviceFeeRate;
      const netEarnings = grossEarnings - serviceFee;

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

      await addDoc(collection(db, `users/${user.uid}/earnings`), {
        orderId,
        serviceType: orderData.serviceType,
        cost: netEarnings,
        serviceFee: serviceFee,
        completedAt: serverTimestamp(),
        paymentMethod: paymentMethod[orderId],
      });

      const userRef = doc(db, 'users', user.uid);
      const newServiceFeeWallet = (serviceFeeWallet || 0) + serviceFee;
      await updateDoc(userRef, {
        serviceFeeWallet: newServiceFeeWallet,
        workerStatus: 'ready'
      });
      setServiceFeeWallet(newServiceFeeWallet);
      setWorkerStatus('ready');
      setProfile(prev => ({ ...prev, workerStatus: 'ready' }));
      setPaymentMethod(prev => ({ ...prev, [orderId]: undefined }));

      const adminWhatsAppNumber = '8788647637';
      const serviceName = orderData.serviceType
        ? t[orderData.serviceType] || orderData.serviceType.replace('-', ' ')
        : t.service;
      const paymentMethodName = t[paymentMethod[orderId]] || (paymentMethod[orderId].charAt(0).toUpperCase() + paymentMethod[orderId].slice(1));
      const completedDate = formatDate(new Date());

      const message = t.orderCompleted
        .replace('{name}', profile.name)
        .replace('{mobile}', profile.mobile)
        .replace('{service}', serviceName)
        .replace('{grossEarnings}', grossEarnings.toFixed(2))
        .replace('{serviceFee}', serviceFee.toFixed(2))
        .replace('{netEarnings}', netEarnings.toFixed(2))
        .replace('{completedDate}', completedDate)
        .replace('{address}', orderData.address || t.none)
        .replace('{paymentMethod}', paymentMethodName)
        .replace('{orderId}', orderId);

      await sendWhatsAppMessage(adminWhatsAppNumber, message);

      alert(t.successOrderCompleted);
    } catch (err) {
      console.error('[WorkerDashboard] Error completing order:', err);
      setError(`${t.errorCompletingOrder}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayServiceFee = async () => {
    if (!window.Razorpay) {
      setError(t.errorPaymentGatewayNotLoaded);
      return;
    }
    if (serviceFeeWallet < 100) {
      setError(t.errorServiceFeeLow);
      return;
    }
    setLoading(true);
    try {
      const options = {
        key: 'rzp_test_ty410dtUIacM8N',
        amount: Math.round(serviceFeeWallet * 100),
        currency: 'INR',
        name: 'KhetiSathi',
        description: t.earnings,
        handler: async (response) => {
          try {
            await addDoc(collection(db, `users/${user.uid}/serviceFeePayments`), {
              amount: serviceFeeWallet,
              paymentId: response.razorpay_payment_id,
              paidAt: serverTimestamp(),
              status: 'paid'
            });
            await updateDoc(doc(db, 'users', user.uid), { serviceFeeWallet: 0 });
            setServiceFeeWallet(0);
            setError('');
            alert(t.successServiceFeePaid);
          } catch (err) {
            console.error('[WorkerDashboard] Error saving service fee payment:', err);
            setError(`${t.errorSavingPayment}: ${err.message}`);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: profile.name || t.name,
          contact: profile.mobile || '',
        },
        theme: {
          color: '#F59E0B',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError(t.paymentCancelled);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setError(`${t.paymentFailed}: ${response.error.description}`);
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error('[WorkerDashboard] Error initiating service fee payment:', err);
      setError(`${t.errorInitiatingPayment}: ${err.message}`);
      setLoading(false);
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!newAvailabilityDate) {
      setError(t.errorSelectDate);
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
      alert(t.successAvailabilityUpdated);
    } catch (err) {
      console.error('[WorkerDashboard] Error updating availability:', err);
      setError(`${t.errorUpdatingAvailability}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async (e) => {
    e.preventDefault();
    if (skills.length === 0) {
      setError(t.errorSelectSkill);
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { skills });
      alert(t.successSkillsUpdated);
    } catch (err) {
      console.error('[WorkerDashboard] Error updating skills:', err);
      setError(`${t.errorUpdatingSkills}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!/^\d{6}$/.test(profile.pincode)) {
        setError(t.errorInvalidPincode);
        setLoading(false);
        return;
      }
      if (!/^\d{10}$/.test(profile.mobile)) {
        setError(t.errorInvalidMobile);
        setLoading(false);
        return;
      }
      if (!['busy', 'ready'].includes(profile.workerStatus)) {
        setError(t.errorInvalidWorkerStatus);
        setLoading(false);
        return;
      }

      const updatedProfile = {
        name: profile.name.trim(),
        pincode: profile.pincode,
        gender: profile.gender,
        mobile: profile.mobile,
        workerStatus: profile.workerStatus,
      };

      await updateDoc(doc(db, 'users', user.uid), updatedProfile);
      setWorkerStatus(profile.workerStatus);
      setError('');
      alert(t.successProfileUpdated);
    } catch (err) {
      console.error('[WorkerDashboard] Error updating profile:', err);
      setError(`${t.errorUpdatingProfile}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (e) => {
    const selectedSkills = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSkills(selectedSkills);
  };

  if (!user || error.includes(t.errorAccessRestricted) || error.includes(t.errorPleaseLogIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl text-center transform transition-all hover:scale-105">
          <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="text-xl font-semibold text-red-600">{error || t.errorPleaseLogIn}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Language Selector */}
        <div className="mb-6 flex justify-end">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
            aria-label={t.selectLanguage}
          >
            <option value="english">English</option>
            <option value="hindi">हिन्दी </option>
            <option value="marathi">मराठी </option>
          </select>
        </div>

        {/* Header */}
        <header className="bg-gradient-to-r from-green-800 to-green-300 rounded-xl shadow-lg mb-6 p-6 transform transition-all hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <UserIcon className="w-8 h-8 mr-2 text-white" />
              {t.welcome}, {profile.name || t.name}!
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium text-white ${
                  status === 'approved' ? 'bg-green-700' : 'bg-yellow-500'
                } shadow-md`}
              >
                {t.approval}: {t[status] || status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium text-white ${
                  workerStatus === 'busy' ? 'bg-blue-700' : 'bg-green-700'
                } shadow-md`}
              >
                {t.status}: {t[workerStatus] || workerStatus.charAt(0).toUpperCase() + workerStatus.slice(1)}
              </span>
              <button
                onClick={toggleAllSections}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                aria-label={allSectionsOpen ? t.collapseAll : t.expandAll}
              >
                <BoltIcon className="w-5 h-5" />
                {allSectionsOpen ? t.collapseAll : t.expandAll}
              </button>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <BanknotesIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">{t.totalEarnings}</p>
              <p className="text-3xl font-bold text-white">
                ₹{(earnings.reduce((sum, e) => sum + (e.cost || 0), 0)).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <CheckCircleIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">{t.completedTasks}</p>
              <p className="text-3xl font-bold text-white">{earnings.length}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 flex items-center gap-4 transform transition-all hover:scale-105">
            <CalendarIcon className="w-12 h-12 text-white" />
            <div>
              <p className="text-lg font-medium text-white">{t.pendingTasks}</p>
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
            aria-label={t.pendingTasks}
          >
            <span className="flex items-center">
              <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600" />
              {t.pendingTasks}
            </span>
            {showPendingTasks ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showPendingTasks && (
            <div className="p-6">
              {serviceFeeWallet >= 100 && (
                <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
                  <XCircleIcon className="w-6 h-6 mr-2" />
                  <p>{t.serviceFeeWarning.replace('{amount}', serviceFeeWallet.toFixed(2))}</p>
                </div>
              )}
              {orders.length === 0 ? (
                <p className="text-center text-gray-600 flex items-center justify-center py-4">
                  <CalendarIcon className="w-6 h-6 mr-2" />
                  {t.noTasksAssigned}
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
                              {services.find(s => s.type === order.serviceType)?.name ||
                                t[order.serviceType] || order.serviceType.replace('-', ' ').toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {t.earningsAfterFee.replace(
                                '{amount}',
                                ((order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)) * 0.98).toFixed(2)
                              )}
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
                                {t.timeout}
                              </span>
                            )
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {order.serviceType === 'farm-workers' && (
                            <>
                              {order.bundleDetails ? (
                                <p>
                                  <span className="font-medium">{t.bundle}:</span> {order.bundleDetails.name} (
                                  {order.bundleDetails.maleWorkers} {t.maleWorkers} + {order.bundleDetails.femaleWorkers} {t.femaleWorkers})
                                </p>
                              ) : (
                                <>
                                  <p><span className="font-medium">{t.maleWorkers}:</span> {order.maleWorkers || 0}</p>
                                  <p><span className="font-medium">{t.femaleWorkers}:</span> {order.femaleWorkers || 0}</p>
                                </>
                              )}
                            </>
                          )}
                          {order.serviceType === 'ownertc' && (
                            <p><span className="font-medium">{t.hours}:</span> {order.hours || t.none}</p>
                          )}
                          <p><span className="font-medium">{t.days}:</span> {order.numberOfDays || 1} {t.days}{order.numberOfDays > 1 ? 's' : ''}</p>
                          <p><span className="font-medium">{t.startDate}:</span> {formatDate(order.startDate)}</p>
                          <p><span className="font-medium">{t.endDate}:</span> {formatDate(order.endDate)}</p>
                          <p><span className="font-medium">{t.startTime}:</span> {order.startTime || t.none}</p>
                          <p><span className="font-medium">{t.address}:</span> {order.address || t.none}</p>
                          <p>
                            <span className="font-medium">{t.pincode}:</span> {orderPincodes[order.id] || t.none}
                            {!orderPincodes[order.id] && (
                              <span className="text-yellow-600 text-xs ml-1">{t.pincodeMissing}</span>
                            )}
                          </p>
                          <p><span className="font-medium">{t.contact}:</span> {order.contactNumber || t.none}</p>
                          <p>
                            <span className="font-medium">{t.paymentMethod}:</span>{' '}
                            {order.paymentMethod ? t[order.paymentMethod] || (order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)) : t.none}
                          </p>
                          <p><span className="font-medium">{t.note}:</span> {order.additionalNote || t.none}</p>
                        </div>
                        {workerAcceptance === 'pending' && (
                          <>
                            {timers[order.id] > 0 ? (
                              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={() => handleAcceptOrder(order.id)}
                                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                  disabled={loading || status !== 'approved' || serviceFeeWallet >= 100}
                                  aria-label={t.accept}
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                  {t.accept} (₹{((order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)) * 0.98).toFixed(2)})
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order.id)}
                                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                  disabled={loading || status !== 'approved'}
                                  aria-label={t.reject}
                                >
                                  <XCircleIcon className="w-5 h-5" />
                                  {t.reject}
                                </button>
                              </div>
                            ) : (
                              <p className="mt-4 text-red-600 flex items-center">
                                <XCircleIcon className="w-5 h-5 mr-2" />
                                {t.cannotAcceptTask}
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
                              aria-label={t.selectPaymentMethod}
                            >
                              <option value="">{t.selectPaymentMethod}</option>
                              <option value="cash">{t.paymentMethodCash}</option>
                              <option value="online">{t.paymentMethodOnline}</option>
                            </select>
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                              disabled={loading || !paymentMethod[order.id] || status !== 'approved'}
                              aria-label={t.markAsCompleted}
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                              {t.markAsCompleted}
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
            aria-label={t.rejectedTasks}
          >
            <span className="flex items-center">
              <XCircleIcon className="w-6 h-6 mr-2 text-red-600" />
              {t.rejectedTasks}
            </span>
            {showRejectedTasks ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showRejectedTasks && (
            <div className="p-6">
              {rejectedOrders.length === 0 ? (
                <p className="text-center text-gray-600 flex items-center justify-center py-4">
                  <XCircleIcon className="w-6 h-6 mr-2" />
                  {t.noTasksRejected}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {rejectedOrders.map(order => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {services.find(s => s.type === order.serviceType)?.name ||
                              t[order.serviceType] || order.serviceType.replace('-', ' ').toUpperCase()}
                          </h4>
                          <p className="text-sm text-gray-600">{t.orderId}: {order.id}</p>
                          <p className="text-sm text-gray-600">
                            {t.potentialEarnings}: ₹{((order.cost / (Array.isArray(order.workerId) ? order.workerId.length : 1)) * 0.98).toFixed(2)}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {t.pendingReassignment}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <p><span className="font-medium">{t.startDate}:</span> {formatDate(order.startDate)}</p>
                        <p>
                          <span className="font-medium">{t.pincode}:</span> {orderPincodes[order.id] || t.none}
                          {!orderPincodes[order.id] && (
                            <span className="text-yellow-600 text-xs ml-1">{t.pincodeMissing}</span>
                          )}
                        </p>
                      </div>
                      <p className="mt-4 text-red-600 flex items-center text-sm">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        {t.taskRejectedPendingReassignment}
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
            aria-label={t.earnings}
          >
            <span className="flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2 text-green-600" />
              {t.earnings}
            </span>
            {showEarnings ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showEarnings && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <p className="text-lg font-semibold text-green-600">
                  {t.totalEarnings}: ₹{(earnings.reduce((sum, e) => sum + (e.cost || 0), 0)).toFixed(2)}
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-yellow-600">
                    {t.serviceFeeWallet}: ₹{serviceFeeWallet.toFixed(2)}
                  </p>
                  {serviceFeeWallet >= 100 && (
                    <button
                      onClick={handlePayServiceFee}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center gap-2 transform hover:scale-105"
                      disabled={loading}
                      aria-label={t.payServiceFee}
                    >
                      <BanknotesIcon className="w-5 h-5" />
                      {t.payServiceFee}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {earnings.length === 0 ? (
                  <p className="text-center text-gray-600 col-span-full flex items-center justify-center py-4">
                    <BanknotesIcon className="w-6 h-6 mr-2" />
                    {t.noEarningsRecorded}
                  </p>
                ) : (
                  earnings.map(earning => (
                    <div key={earning.id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                      <p className="text-sm"><strong>{t.orderId}:</strong> {earning.orderId}</p>
                      <p className="text-sm">
                        <strong>{t.service}:</strong>{' '}
                        {services.find(s => s.type === earning.serviceType)?.name ||
                          t[earning.serviceType] || earning.serviceType.replace('-', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm"><strong>{t.earnings}:</strong> ₹{(earning.cost || 0).toFixed(2)}</p>
                      <p className="text-sm"><strong>{t.serviceFee} (2%):</strong> ₹{(earning.serviceFee || 0).toFixed(2)}</p>
                      <p className="text-sm">
                        <strong>{t.paymentMethod}:</strong>{' '}
                        {t[earning.paymentMethod] || (earning.paymentMethod?.charAt(0).toUpperCase() + earning.paymentMethod?.slice(1)) || t.none}
                      </p>
                      <p className="text-sm"><strong>{t.completed}:</strong> {earning.completedAt ? formatDate(earning.completedAt.toDate()) : t.none}</p>
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
            aria-label={t.setAvailability}
          >
            <span className="flex items-center">
              <CalendarIcon className="w-6 h-6 mr-2 text-green-600" />
              {t.setAvailability}
            </span>
            {showAvailability ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showAvailability && (
            <div className="p-6">
              <form onSubmit={handleAddAvailability} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                  <input
                    type="date"
                    value={newAvailabilityDate}
                    onChange={e => setNewAvailabilityDate(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    aria-label={t.selectAvailabilityDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
                  <select
                    value={availabilityType}
                    onChange={e => setAvailabilityType(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                    required
                    aria-label={t.selectAvailabilityType}
                  >
                    <option value="working">{t.workingDay}</option>
                    <option value="off">{t.offDay}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="col-span-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label={t.updateAvailability}
                >
                  <CalendarIcon className="w-5 h-5" />
                  {t.updateAvailability}
                </button>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t.workingDays}:</p>
                  {availability.workingDays.length === 0 ? (
                    <p className="text-sm text-gray-600">{t.noWorkingDays}</p>
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
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t.offDays}:</p>
                  {availability.offDays.length === 0 ? (
                    <p className="text-sm text-gray-600">{t.noOffDays}</p>
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
            aria-label={t.manageSkills}
          >
            <span className="flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-green-600" />
              {t.manageSkills}
            </span>
            {showSkills ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showSkills && (
            <div className="p-6">
              <form onSubmit={handleUpdateSkills}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.selectSkills}</label>
                  <select
                    multiple
                    value={skills}
                    onChange={handleSkillsChange}
                    className="w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-green-600 bg-white"
                    aria-label={t.selectSkills}
                  >
                    {SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {SKILL_LABELS[skill]?.[language] || skill}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t.skillsInstruction}</p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label={t.updateSkills}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {t.updateSkills}
                </button>
              </form>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t.currentSkills}:</p>
                {skills.length === 0 ? (
                  <p className="text-sm text-gray-600">{t.noSkillsSelected}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {t[skill] || skill.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
            aria-label={t.editProfile}
          >
            <span className="flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-white" />
              {t.editProfile}
            </span>
            {showProfile ? <ChevronUpIcon className="w-6 h-6 text-white" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
          </button>
          {showProfile && (
            <div className="p-6 bg-white rounded-b-xl">
              <form onSubmit={handleUpdateProfile} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label={t.enterName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.pincode}</label>
                    <input
                      type="text"
                      value={profile.pincode || ''}
                      onChange={e => setProfile(prev => ({ ...prev, pincode: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      pattern="\d{6}"
                      title={t.errorInvalidPincode}
                      aria-label={t.enterPincode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.mobileNumber}</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={t.mobilePlaceholder}
                      value={profile.mobile || ''}
                      onChange={e => setProfile(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      pattern="\d{10}"
                      title={t.errorInvalidMobile}
                      maxLength="10"
                      aria-label={t.enterMobileNumber}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.gender}</label>
                    <select
                      value={profile.gender || ''}
                      onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label={t.selectGender}
                    >
                      <option value="">{t.selectGender}</option>
                      <option value="male">{t.male}</option>
                      <option value="female">{t.female}</option>
                      <option value="other">{t.other}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.workerStatusLabel}</label>
                    <select
                      value={profile.workerStatus || 'ready'}
                      onChange={e => setProfile(prev => ({ ...prev, workerStatus: e.target.value }))}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                      required
                      aria-label={t.selectWorkerStatus}
                    >
                      <option value="ready">{t.ready}</option>
                      <option value="busy">{t.busy}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                  disabled={loading}
                  aria-label={t.updateProfile}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {t.updateProfile}
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
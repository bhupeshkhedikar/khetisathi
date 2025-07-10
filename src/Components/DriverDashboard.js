import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, addDoc, or,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { ASSIGNMENT_TIMEOUT, MOBILE_REGEX, PINCODE_REGEX, STATUS_COLORS } from '../Components/pages/constants.js';
import translationsDriverDashboard from './translationsDriverDashboard.js';
import {VEHICLE_SKILLS,VEHICLE_SKILL_LABELS} from '../utils/skills.js';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CashIcon, TruckIcon, CalendarIcon, UserIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const DriverDashboard = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('pending');
  const [driverStatus, setDriverStatus] = useState('available');
  const [assignments, setAssignments] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availability, setAvailability] = useState({ workingDays: [], offDays: [] });
  const [vehicleSkills, setVehicleSkills] = useState([]);
  const [profile, setProfile] = useState({ name: '', mobile: '', pincode: '', driverStatus: 'available' });
  const [updatedProfile, setUpdatedProfile] = useState({ name: '', mobile: '', pincode: '', driverStatus: 'available' });
  const [newAvailabilityDate, setNewAvailabilityDate] = useState('');
  const [newOffDayDate, setNewOffDayDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timers, setTimers] = useState({});
  const [paymentMethod, setPaymentMethod] = useState({});
  const [workerDetails, setWorkerDetails] = useState({});
  const [serviceFeeWallet, setServiceFeeWallet] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [language, setLanguage] = useState('marathi'); // Default to Marathi
  const timerRef = useRef({});
  const t = translationsDriverDashboard[language];

  // Format date based on language
  const formatDate = (date) => {
    const locale = language === 'en' ? 'en-GB' : language === 'hi' ? 'hi-IN' : 'mr-IN';
    return new Date(date).toLocaleDateString(locale);
  };

  const logError = useCallback((message, error) => console.error(`[DriverDashboard] ${message}`, error), []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => console.log('[DriverDashboard] Razorpay script loaded successfully');
    script.onerror = () => {
      console.error('[DriverDashboard] Failed to load Razorpay script');
      setError(t.errorPaymentGatewayNotLoaded);
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [t]);

  const sendWhatsAppMessage = async (mobile, message) => {
    try {
      if (!mobile) return false;
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+91${mobile.replace(/\s/g, '')}`, message }),
      });
      return response.ok;
    } catch (err) {
      logError(`Error sending WhatsApp message to ${mobile}`, err);
      return false;
    }
  };

  const fetchWorkerDetails = useCallback(async (assignments) => {
    try {
      const workerIds = new Set(assignments.flatMap((a) => a.workerIds || []));
      if (!workerIds.size) return;
      const workersQuery = query(collection(db, 'users'), where('__name__', 'in', [...workerIds]));
      const workerDocs = await getDocs(workersQuery);
      const workerMap = workerDocs.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc[doc.id] = { workerId: doc.id, name: data.name || t.none, mobile: data.mobile || t.none };
        return acc;
      }, {});
      setWorkerDetails(assignments.reduce((acc, a) => {
        acc[a.id] = (a.workerIds || []).map((wid) => workerMap[wid]).filter(Boolean);
        return acc;
      }, {}));
    } catch (err) {
      setError(t.errorFetchingWorkerDetails);
    }
  }, [t]);

  useEffect(() => {
    if (!auth || !db) {
      setError(t.errorFirebaseNotInitialized);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (authState) => {
      if (!authState) {
        setError(t.errorPleaseLogIn);
        return;
      }
      const userRef = doc(db, 'users', authState.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists() || userDoc.data().role !== 'driver') {
        setError(t.errorAccessRestricted);
        return;
      }
      const userData = userDoc.data();
      setUser(authState);
      setStatus(userData.status || 'pending');
      setDriverStatus(userData.driverStatus || 'available');
      setServiceFeeWallet(userData.serviceFeeWallet || 0);
      setProfile({
        name: userData.name || '',
        mobile: userData.mobile || '',
        pincode: userData.pincode || '',
        driverStatus: userData.driverStatus || 'available',
      });
      setUpdatedProfile({
        name: userData.name || '',
        mobile: userData.mobile || '',
        pincode: userData.pincode || '',
        driverStatus: userData.driverStatus || 'available',
      });
      setVehicleSkills(userData.vehicleSkills || []);
      setAvailability(userData.availability || { workingDays: [], offDays: [] });

      const assignmentsQuery = query(collection(db, 'assignments'), where('driverId', '==', authState.uid), where('status', 'in', ['pending', 'accepted']));
      const unsubscribeAssignments = onSnapshot(assignmentsQuery, async (snapshot) => {
        const assignmentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timeout: doc.data().createdAt ? new Date(doc.data().createdAt.toDate().getTime() + ASSIGNMENT_TIMEOUT).toISOString() : null,
        }));
        setAssignments(assignmentsData);
        await fetchWorkerDetails(assignmentsData);
      }, (err) => setError(t.errorFetchingAssignments));

      const taskHistoryQuery = query(
        collection(db, 'assignments'),
        or(
          where('driverId', '==', authState.uid),
          where('rejectedDriverIds', 'array-contains', authState.uid)
        )
      );
      const unsubscribeTaskHistory = onSnapshot(taskHistoryQuery, async (snapshot) => {
        const taskHistoryData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTaskHistory(taskHistoryData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
        await fetchWorkerDetails(taskHistoryData);
      }, (err) => setError(t.errorFetchingTaskHistory));

      const earningsSnapshot = await getDocs(collection(db, `users/${authState.uid}/earnings`));
      const earningsData = earningsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEarnings(earningsData);
      setTotalEarnings(earningsData.reduce((sum, earning) => sum + (earning.cost || 0), 0));

      return () => {
        unsubscribeAssignments();
        unsubscribeTaskHistory();
      };
    }, (err) => setError(t.errorPleaseLogIn));

    return () => unsubscribeAuth();
  }, [fetchWorkerDetails, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        assignments.reduce((acc, a) => {
          if (a.status === 'pending' && a.timeout) {
            const timeLeft = Math.max(0, Math.floor((new Date(a.timeout).getTime() - Date.now()) / 1000));
            acc[a.id] = timeLeft;
            if (timeLeft === 0 && !timerRef.current[a.id]?.timedOut) {
              timerRef.current[a.id] = { timedOut: true };
              handleTimeoutAssignment(a.id);
            }
          } else {
            acc[a.id] = 0;
          }
          return acc;
        }, {})
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [assignments]);

  const handleTimeoutAssignment = async (assignmentId) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'assignments', assignmentId), {
        driverId: '',
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedDriverIds: [...(assignments.find((a) => a.id === assignmentId)?.rejectedDriverIds || []), user.uid],
      });
      await updateDoc(doc(db, 'users', user.uid), { driverStatus: 'available' });
      setDriverStatus('available');
      setProfile((prev) => ({ ...prev, driverStatus: 'available' }));
      setUpdatedProfile((prev) => ({ ...prev, driverStatus: 'available' }));
    } catch (err) {
      logError('Error handling timeout assignment', err);
      setError(t.errorHandlingTimeout);
    } finally {
      setLoading(false);
    }
  };

const handleAcceptAssignment = async (assignmentId) => {
  if (serviceFeeWallet >= 100) {
    setError(t.serviceFeeWarning.replace('{amount}', serviceFeeWallet.toFixed(2)));
    return;
  }

  try {
    setLoading(true);
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || !assignment.location) {
      setError(t.errorInvalidAssignment);
      return;
    }

    await updateDoc(doc(db, 'assignments', assignmentId), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', user.uid), {
      driverStatus: 'busy',
    });

    setDriverStatus('busy');
    setProfile((prev) => ({ ...prev, driverStatus: 'busy' }));
    setUpdatedProfile((prev) => ({ ...prev, driverStatus: 'busy' }));

    // ✅ Send Twilio Template Message to Workers
    const workerMessages = (workerDetails[assignmentId] || []).map((worker) => {
      if (!worker?.mobile) return Promise.resolve(false);

      return fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${worker.mobile}`,
          contentSid: 'HX87a61704d6cd283a4de603faac054df7',
          contentVariables: {
            "1": profile.name || 'ड्रायव्हर',
            "2": profile.mobile || '',
            "3": assignment.location || 'लोकेशन उपलब्ध नाही'
          }
        }),
      });
    });

    const results = await Promise.all(workerMessages);
    if (workerMessages.length > 0 && results.every((r) => !r)) {
      setError(t.errorAcceptingAssignment);
    }

    alert(t.successAssignmentAccepted);
  } catch (err) {
    logError('Error accepting assignment', err);
    setError(t.errorAcceptingAssignment);
  } finally {
    setLoading(false);
  }
};


  const handleRejectAssignment = async (assignmentId) => {
    try {
      setLoading(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      await updateDoc(doc(db, 'assignments', assignmentId), {
        status: 'rejected',
        driverId: '',
        updatedAt: serverTimestamp(),
        rejectedDriverIds: [...(assignment.rejectedDriverIds || []), user.uid],
      });
      await updateDoc(doc(db, 'users', user.uid), { driverStatus: 'available' });
      setDriverStatus('available');
      setProfile((prev) => ({ ...prev, driverStatus: 'available' }));
      setUpdatedProfile((prev) => ({ ...prev, driverStatus: 'available' }));
      alert(t.successAssignmentRejected);
    } catch (err) {
      logError('Error rejecting assignment', err);
      setError(t.errorRejectingAssignment);
    } finally {
      setLoading(false);
    }
  };

const handleCompleteAssignment = async (assignmentId) => {
  if (!paymentMethod[assignmentId]) {
    setError(t.errorSelectPaymentMethod);
    return;
  }

  try {
    setLoading(true);
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }
    if (!assignment.customPrice || isNaN(assignment.customPrice) || assignment.customPrice <= 0) {
      throw new Error(t.errorInvalidAssignmentCost);
    }

    const grossEarnings = assignment.customPrice;
    const serviceFeeRate = 0.02; // 2% service fee
    const serviceFee = grossEarnings * serviceFeeRate;
    const netEarnings = grossEarnings - serviceFee;

    await updateDoc(doc(db, 'assignments', assignmentId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      paymentStatus: {
        method: paymentMethod[assignmentId],
        status: 'paid'
      },
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, `users/${user.uid}/earnings`), {
      assignmentId,
      serviceType: assignment.vehicleType,
      cost: netEarnings,
      serviceFee: serviceFee,
      completedAt: serverTimestamp(),
      paymentMethod: paymentMethod[assignmentId],
    });

    const newServiceFeeWallet = (serviceFeeWallet || 0) + serviceFee;
    await updateDoc(doc(db, 'users', user.uid), {
      driverStatus: 'available',
      serviceFeeWallet: newServiceFeeWallet,
    });

    setDriverStatus('available');
    setProfile((prev) => ({ ...prev, driverStatus: 'available' }));
    setUpdatedProfile((prev) => ({ ...prev, driverStatus: 'available' }));
    setServiceFeeWallet(newServiceFeeWallet);
    setPaymentMethod((prev) => ({ ...prev, [assignmentId]: undefined }));

    // 🔔 Send WhatsApp message using Twilio Template
    const adminWhatsAppNumber = '+918788647637';
    const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminWhatsAppNumber,
        contentSid: 'HX2f95a526950e179926f5bf9c77d3937e',
        contentVariables: {
          '1': profile.name || 'ड्रायव्हर',
          '2': profile.mobile || 'मोबाईल उपलब्ध नाही',
          '3': assignment.vehicleType?.replace('-', ' ') || 'वाहन',
          '4': grossEarnings.toFixed(2),
          '5': serviceFee.toFixed(2),
          '6': netEarnings.toFixed(2),
          '7': formatDate(new Date()), // Example: "१० जुलै २०२५"
          '8': assignment.location || t.none,
          '9': paymentMethod[assignmentId]?.charAt(0).toUpperCase() + paymentMethod[assignmentId].slice(1),
          '10': assignmentId,
        },
      }),
    });

    if (!response.ok) {
      const resJson = await response.json();
      console.error('Twilio Message Failed:', resJson);
    }

    alert(t.successAssignmentCompleted);
  } catch (err) {
    logError('Error completing assignment', err);
    setError(t.errorCompletingAssignment.replace('{message}', err.message));
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
    try {
      setLoading(true);
      const options = {
        key: 'rzp_live_2dmmin7Uu7tyRI',
        amount: Math.round(serviceFeeWallet * 100),
        currency: 'INR',
        name: 'KhetiSathi',
        description: t.payServiceFee,
        handler: async (response) => {
          try {
            await addDoc(collection(db, `users/${user.uid}/serviceFeePayments`), {
              amount: serviceFeeWallet,
              paymentId: response.razorpay_payment_id,
              paidAt: serverTimestamp(),
              status: 'paid',
            });
            await updateDoc(doc(db, 'users', user.uid), { serviceFeeWallet: 0 });
            setServiceFeeWallet(0);
            setError('');
            alert(t.successServiceFeePaid);
          } catch (err) {
            logError('Error saving service fee payment', err);
            setError(t.errorSavingPayment.replace('{message}', err.message));
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
        setError(t.paymentFailed.replace('{description}', response.error.description));
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      logError('Error initiating service fee payment', err);
      setError(t.errorInitiatingPayment.replace('{message}', err.message));
      setLoading(false);
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!newAvailabilityDate || new Date(newAvailabilityDate) < new Date().setHours(0, 0, 0, 0)) {
      setError(t.errorSelectWorkingDay);
      return;
    }
    try {
      setLoading(true);
      const updatedAvailability = {
        workingDays: availability.workingDays.includes(newAvailabilityDate)
          ? availability.workingDays
          : [...availability.workingDays, newAvailabilityDate].sort((a, b) => new Date(a) - new Date(b)),
        offDays: availability.offDays.filter((d) => d !== newAvailabilityDate),
      };
      await updateDoc(doc(db, 'users', user.uid), { availability: updatedAvailability });
      setAvailability(updatedAvailability);
      setNewAvailabilityDate('');
      alert(t.successWorkingDayAdded);
    } catch (err) {
      logError('Error adding working day', err);
      setError(t.errorUpdatingAvailability);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffDay = async (e) => {
    e.preventDefault();
    if (!newOffDayDate || new Date(newOffDayDate) < new Date().setHours(0, 0, 0, 0)) {
      setError(t.errorSelectOffDay);
      return;
    }
    try {
      setLoading(true);
      const updatedAvailability = {
        workingDays: availability.workingDays.filter((d) => d !== newOffDayDate),
        offDays: availability.offDays.includes(newOffDayDate)
          ? availability.offDays
          : [...availability.offDays, newOffDayDate].sort((a, b) => new Date(a) - new Date(b)),
      };
      await updateDoc(doc(db, 'users', user.uid), { availability: updatedAvailability });
      setAvailability(updatedAvailability);
      setNewOffDayDate('');
      alert(t.successOffDayAdded);
    } catch (err) {
      logError('Error adding off day', err);
      setError(t.errorAddingOffDay);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvailability = async (dateToRemove) => {
    try {
      setLoading(true);
      const updatedAvailability = {
        workingDays: availability.workingDays.filter((d) => d !== dateToRemove),
        offDays: availability.offDays,
      };
      await updateDoc(doc(db, 'users', user.uid), { availability: updatedAvailability });
      setAvailability(updatedAvailability);
      alert(t.successWorkingDayRemoved);
    } catch (err) {
      logError('Error removing working day', err);
      setError(t.errorRemovingWorkingDay);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOffDay = async (dateToRemove) => {
    try {
      setLoading(true);
      const updatedAvailability = {
        workingDays: availability.workingDays,
        offDays: availability.offDays.filter((d) => d !== dateToRemove),
      };
      await updateDoc(doc(db, 'users', user.uid), { availability: updatedAvailability });
      setAvailability(updatedAvailability);
      alert(t.successOffDayRemoved);
    } catch (err) {
      logError('Error removing off day', err);
      setError(t.errorRemovingOffDay);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicleSkills = async (e) => {
    e.preventDefault();
    if (!vehicleSkills.length) return setError(t.errorSelectSkill);
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), { vehicleSkills });
      alert(t.successSkillsUpdated);
    } catch (err) {
      logError('Error updating vehicle skills', err);
      setError(t.errorUpdatingSkills);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!updatedProfile.name.trim()) {
      setError(t.errorEmptyName);
      return;
    }
    if (!MOBILE_REGEX.test(updatedProfile.mobile)) {
      setError(t.errorInvalidMobile);
      return;
    }
    if (!PINCODE_REGEX.test(updatedProfile.pincode)) {
      setError(t.errorInvalidPincode);
      return;
    }
    if (!['available', 'busy'].includes(updatedProfile.driverStatus)) {
      setError(t.errorInvalidDriverStatus);
      return;
    }
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: updatedProfile.name.trim(),
        mobile: updatedProfile.mobile,
        pincode: updatedProfile.pincode,
        driverStatus: updatedProfile.driverStatus,
      });
      setProfile(updatedProfile);
      setDriverStatus(updatedProfile.driverStatus);
      alert(t.successProfileUpdated);
    } catch (err) {
      logError('Error updating profile', err);
      setError(t.errorUpdatingProfile);
    } finally {
      setLoading(false);
    }
  };

  if (!user || error.includes(t.errorAccessRestricted) || error.includes(t.errorPleaseLogIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md mx-auto p-6 bg-red-50 text-red-700 rounded-xl shadow-lg text-center flex items-center">
          <XCircleIcon className="w-6 h-6 mr-2" />
          {error || t.errorPleaseLogIn}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Language Selector */}
        <div className="mb-6 flex justify-end">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
            aria-label={t.selectLanguage}
          >
            <option value="english">{t.english}</option>
            <option value="hindi">{t.hindi}</option>
            <option value="marathi">{t.marathi}</option>
          </select>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-green-700 flex items-center">
          <UserIcon className="w-8 h-8 mr-2" />
          {t.welcome}, {profile.name || t.name}!
        </h2>
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl shadow flex items-center">
            <XCircleIcon className="w-6 h-6 mr-2" />
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-700 flex items-center">
            <UserIcon className="w-6 h-6 mr-2" />
            {t.driverInformation}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">{t.profile}:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {t[status] || status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">{t.status}:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${driverStatus === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {t[driverStatus] || driverStatus.charAt(0).toUpperCase() + driverStatus.slice(1)}
              </span>
            </div>
            <div className="flex items-center">
              <BanknotesIcon className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium text-gray-700">{t.totalEarnings}: ₹{totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-700 flex items-center">
            <TruckIcon className="w-6 h-6 mr-2" />
            {t.activeTasks}
          </h3>
          {serviceFeeWallet >= 100 && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
              <XCircleIcon className="w-6 h-6 mr-2" />
              <p>{t.serviceFeeWarning.replace('{amount}', serviceFeeWallet.toFixed(2))}</p>
            </div>
          )}
          {assignments.length === 0 ? (
            <p className="text-gray-600 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              {t.noTasksAssigned}
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                console.log(`[DriverDashboard] Assignment ID: ${assignment.id}, vehicleType: ${assignment.vehicleType}`);
                return (
                  <div key={assignment.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><strong>{t.type}:</strong> {t[assignment.vehicleType] || assignment.vehicleType.replace('-', ' ').toUpperCase()}</p>
                      <p><strong>{t.date}:</strong> {formatDate(assignment.startDate)}</p>
                      <p><strong>{t.location}:</strong> {assignment.location}</p>
                      <p><strong>{t.earnings}:</strong> ₹{((assignment.customPrice || 0) * 0.98).toFixed(2)} (after 2% service fee)</p>
                      <p>
                        <strong>{t.workers}:</strong>{' '}
                        {(workerDetails[assignment.id]?.length > 0)
                          ? workerDetails[assignment.id].map((w) => `${w.name} (${w.mobile})`).join(', ')
                          : t.none}
                      </p>
                      <p><strong>{t.status}:</strong> <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-600'}`}>{t[assignment.status] || assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}</span></p>
                    </div>
                    {assignment.status === 'pending' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAcceptAssignment(assignment.id)}
                          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || timers[assignment.id] === 0 || status !== 'approved' || serviceFeeWallet >= 100}
                          title={t.accept}
                        >
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          {t.accept}
                        </button>
                        <button
                          onClick={() => handleRejectAssignment(assignment.id)}
                          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || timers[assignment.id] === 0 || status !== 'approved'}
                          title={t.reject}
                        >
                          <XCircleIcon className="w-5 h-5 mr-2" />
                          {t.reject}
                        </button>
                        {timers[assignment.id] > 0 && (
                          <span className="flex items-center text-red-600">
                            <ClockIcon className="w-5 h-5 mr-2" />
                            {t.timeLeft}: {Math.floor(timers[assignment.id] / 60)}:{(timers[assignment.id] % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    )}
                    {assignment.status === 'accepted' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <select
                          value={paymentMethod[assignment.id] || ''}
                          onChange={(e) => setPaymentMethod((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                          className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                          aria-label={t.selectPaymentMethod}
                        >
                          <option value="" disabled>{t.selectPaymentMethod}</option>
                          <option value="cash">{t.paymentMethodCash}</option>
                          <option value="online">{t.paymentMethodOnline}</option>
                        </select>
                        <button
                          onClick={() => handleCompleteAssignment(assignment.id)}
                          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || !paymentMethod[assignment.id] || status !== 'approved'}
                          title={t.markAsCompleted}
                        >
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          {t.complete}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
   <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-2 text-green-700 flex items-center">
            <TruckIcon className="w-6 h-6 mr-2" />
            {t.taskHistory}
          </h3>
          <p className="text-sm text-gray-500 mb-4">{t.sortedNewestFirst}</p>
          {taskHistory.length === 0 ? (
            <p className="text-gray-600 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              {t.noTaskHistory}
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100">
              {taskHistory.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><strong>{t.type}:</strong> {t[assignment.vehicleType] || assignment.vehicleType.replace('-', ' ').toUpperCase()}</p>
                    <p><strong>{t.date}:</strong> {formatDate(assignment.startDate)}</p>
                    <p><strong>{t.location}:</strong> {assignment.location}</p>
                    <p><strong>{t.earnings}:</strong> ₹{((assignment.status === 'completed' ? (assignment.customPrice || 0) : 0) * 0.98).toFixed(2)}</p>
                    <p>
                      <strong>{t.workers}:</strong>{' '}
                      {(workerDetails[assignment.id]?.length > 0)
                        ? workerDetails[assignment.id].map((w) => `${w.name} (${w.mobile})`).join(', ')
                        : t.none}
                    </p>
                    <p><strong>{t.status}:</strong> <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-600'}`}>{t[assignment.status] || assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}</span></p>
                    {assignment.status === 'completed' && (
                      <p><strong>{t.serviceFee}:</strong> ₹{((assignment.customPrice || 0) * 0.02).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowEarnings(!showEarnings)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2" />
              {t.earnings}
            </span>
            {showEarnings ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showEarnings && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <p className="text-lg font-semibold text-green-600">
                  {t.totalEarnings}: ₹{totalEarnings.toFixed(2)}
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-yellow-600">
                    {t.serviceFeeWallet}: ₹{serviceFeeWallet.toFixed(2)}
                  </p>
                  {serviceFeeWallet >= 100 && (
                    <button
                      onClick={handlePayServiceFee}
                      className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      disabled={loading}
                      title={t.payServiceFee}
                    >
                      <BanknotesIcon className="w-5 h-5 mr-2" />
                      {t.payServiceFee}
                    </button>
                  )}
                </div>
              </div>
              {earnings.length === 0 ? (
                <p className="text-gray-600 flex items-center">
                  <BanknotesIcon className="w-5 h-5 mr-2" />
                  {t.noEarningsRecorded}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <p><strong>{t.assignmentId}:</strong> {earning.assignmentId}</p>
                      <p><strong>{t.vehicleType}:</strong> {t[earning.serviceType] || earning.serviceType.replace('-', ' ').toUpperCase()}</p>
                      <p><strong>{t.earnings}:</strong> ₹{(earning.cost || 0).toFixed(2)}</p>
                      <p><strong>{t.serviceFee}:</strong> ₹{(earning.serviceFee || 0).toFixed(2)}</p>
                      <p><strong>{t.paymentMethod}:</strong> {t[earning.paymentMethod] || (earning.paymentMethod ? earning.paymentMethod.charAt(0).toUpperCase() + earning.paymentMethod.slice(1) : t.none)}</p>
                      <p><strong>{t.completed}:</strong> {earning.completedAt ? formatDate(earning.completedAt.toDate()) : t.none}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

     

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <UserIcon className="w-6 h-6 mr-2" />
              {t.profile}
            </span>
            {showProfile ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showProfile && (
            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">{t.name}</label>
                <input
                  id="name"
                  type="text"
                  value={updatedProfile.name}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, name: e.target.value })}
                  placeholder={t.enterName}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  required
                  aria-label={t.enterName}
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-gray-700 font-medium mb-2">{t.mobile}</label>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={updatedProfile.mobile}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, mobile: e.target.value })}
                  placeholder={t.enterMobileNumber}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  required
                  pattern="\d{10}"
                  title={t.errorInvalidMobile}
                  maxLength="10"
                  aria-label={t.enterMobileNumber}
                />
              </div>
              <div>
                <label htmlFor="pincode" className="block text-gray-700 font-medium mb-2">{t.pincode}</label>
                <input
                  id="pincode"
                  type="text"
                  value={updatedProfile.pincode}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, pincode: e.target.value })}
                  placeholder={t.enterPincode}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  required
                  pattern="\d{6}"
                  title={t.errorInvalidPincode}
                  maxLength="6"
                  aria-label={t.enterPincode}
                />
              </div>
              <div>
                <label htmlFor="driverStatus" className="block text-gray-700 font-medium mb-2">{t.driverStatusLabel}</label>
                <select
                  id="driverStatus"
                  value={updatedProfile.driverStatus}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, driverStatus: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  required
                  aria-label={t.selectDriverStatus}
                >
                  <option value="available">{t.available}</option>
                  <option value="busy">{t.busy}</option>
                </select>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                disabled={loading}
                aria-label={t.updateProfile}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {t.updateProfile}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <CalendarIcon className="w-6 h-6 mr-2" />
              {t.availability}
            </span>
            {showAvailability ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showAvailability && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700">{t.workingDays}</h4>
                <form onSubmit={handleAddAvailability} className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label htmlFor="availability-date" className="block text-gray-700 font-medium mb-2">{t.addWorkingDay}</label>
                    <input
                      id="availability-date"
                      type="date"
                      value={newAvailabilityDate}
                      onChange={(e) => setNewAvailabilityDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-green-600 w-full"
                      required
                      aria-label={t.selectWorkingDay}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    disabled={loading || !newAvailabilityDate}
                    aria-label={t.addWorkingDay}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {t.addWorkingDay}
                  </button>
                </form>
                <div>
                  <p className="font-semibold mb-2 text-gray-700">{t.workingDays}:</p>
                  {availability.workingDays.length === 0 ? (
                    <p className="text-gray-600">{t.noWorkingDays}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.workingDays.sort((a, b) => new Date(a) - new Date(b)).map((date) => (
                        <div key={date} className="flex items-center bg-green-100 text-green-800 rounded-lg px-3 py-1">
                          <span>{formatDate(date)}</span>
                          <button
                            onClick={() => handleRemoveAvailability(date)}
                            className="ml-2 bg-red-600 text-white text-sm px-2 py-1 rounded-lg hover:bg-red-700"
                            disabled={loading}
                            title={t.removeWorkingDay}
                            aria-label={t.removeWorkingDay}
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700">{t.offDays}</h4>
                <form onSubmit={handleAddOffDay} className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label htmlFor="off-day-date" className="block text-gray-700 font-medium mb-2">{t.addOffDay}</label>
                    <input
                      id="off-day-date"
                      type="date"
                      value={newOffDayDate}
                      onChange={(e) => setNewOffDayDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-green-600 w-full"
                      required
                      aria-label={t.selectOffDay}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    disabled={loading || !newOffDayDate}
                    aria-label={t.addOffDay}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {t.addOffDay}
                  </button>
                </form>
                <div>
                  <p className="font-semibold mb-2 text-gray-700">{t.offDays}:</p>
                  {availability.offDays.length === 0 ? (
                    <p className="text-gray-600">{t.noOffDays}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.offDays.sort((a, b) => new Date(a) - new Date(b)).map((date) => (
                        <div key={date} className="flex items-center bg-red-100 text-red-800 rounded-lg px-3 py-1">
                          <span>{formatDate(date)}</span>
                          <button
                            onClick={() => handleRemoveOffDay(date)}
                            className="ml-2 bg-red-600 text-white text-sm px-2 py-1 rounded-lg hover:bg-red-700"
                            disabled={loading}
                            title={t.removeOffDay}
                            aria-label={t.removeOffDay}
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <button
            onClick={() => setShowSkills(!showSkills)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <TruckIcon className="w-6 h-6 mr-2" />
              {t.vehicleSkills}
            </span>
            {showSkills ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showSkills && (
            <form onSubmit={handleUpdateVehicleSkills}>
              <select
                multiple
                value={vehicleSkills}
                onChange={(e) => setVehicleSkills(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
                className="w-full p-3 border rounded-lg h-32 mb-4 focus:ring-2 focus:ring-green-600"
                aria-label={t.selectSkills}
              >
              {VEHICLE_SKILLS.map((skill) => (
                <option key={skill} value={skill}>
                  {VEHICLE_SKILL_LABELS[skill]?.[language] || skill}
                </option>
              ))}
              </select>
              <p className="text-sm text-gray-500 mb-4">{t.skillsInstruction}</p>
              <button
                type="submit"
                className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                disabled={loading || vehicleSkills.length === 0}
                aria-label={t.updateSkills}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {t.updateSkills}
              </button>
              <div className="mt-4">
                <p className="font-semibold text-gray-700">{t.currentSkills}:</p>
                {vehicleSkills.length === 0 ? (
                  <p className="text-gray-600">{t.noSkillsSelected}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {vehicleSkills.map((skill) => (
                      <span key={skill} className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg">
                        {t[skill] || skill.replace('-', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
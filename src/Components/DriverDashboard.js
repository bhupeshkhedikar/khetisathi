import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, addDoc, or,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { VEHICLE_SKILLS, ASSIGNMENT_TIMEOUT, MOBILE_REGEX, PINCODE_REGEX, STATUS_COLORS } from '../Components/pages/constants.js';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const timerRef = useRef({});

  const logError = useCallback((message, error) => console.error(`[DriverDashboard] ${message}`, error), []);

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
        acc[doc.id] = { workerId: doc.id, name: data.name || 'Unnamed', mobile: data.mobile || 'N/A' };
        return acc;
      }, {});
      setWorkerDetails(assignments.reduce((acc, a) => {
        acc[a.id] = (a.workerIds || []).map((wid) => workerMap[wid]).filter(Boolean);
        return acc;
      }, {}));
    } catch (err) {
      setError('Failed to load worker details.');
    }
  }, []);

  useEffect(() => {
    if (!auth || !db) {
      setError('Firebase not initialized.');
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (authState) => {
      if (!authState) {
        setError('Please log in as a driver.');
        return;
      }
      const userRef = doc(db, 'users', authState.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists() || userDoc.data().role !== 'driver') {
        setError('Access restricted to drivers.');
        return;
      }
      const userData = userDoc.data();
      setUser(authState);
      setStatus(userData.status || 'pending');
      setDriverStatus(userData.driverStatus || 'available');
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
      }, (err) => setError('Failed to fetch assignments.'));

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
      }, (err) => setError('Failed to fetch task history.'));

      const earningsSnapshot = await getDocs(collection(db, `users/${authState.uid}/earnings`));
      const earningsData = earningsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEarnings(earningsData);
      setTotalEarnings(earningsData.reduce((sum, earning) => sum + (earning.cost || 0), 0));

      return () => {
        unsubscribeAssignments();
        unsubscribeTaskHistory();
      };
    }, (err) => setError('Authentication failed.'));

    return () => unsubscribeAuth();
  }, [fetchWorkerDetails]);

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
      setError('Failed to handle timeout.');
    } finally {
      setLoading(false);
    }
  };

const handleAcceptAssignment = async (assignmentId) => {
  try {
    setLoading(true);
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || !assignment.location) {
      setError('Invalid assignment details.');
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

    // Send WhatsApp message to workers
    const workerMessages = (workerDetails[assignmentId] || []).map((worker) =>
      sendWhatsAppMessage(
        worker.mobile,
        `👋 Hello ${worker.name},

I am ${profile.name} (${profile.mobile}), your assigned driver for today.

📍 I’ll be arriving soon at: ${assignment.location}

📞 For any questions, feel free to contact me directly.

Regards,  
Khetisathi 🚜`
      )
    );

    const results = await Promise.all(workerMessages);
    if (workerMessages.length > 0 && results.every((r) => !r)) {
      setError('Failed to send notifications to workers.');
    }

    alert('Assignment accepted!');
  } catch (err) {
    logError('Error accepting assignment', err);
    setError('Failed to accept assignment.');
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
      alert('Assignment rejected.');
    } catch (err) {
      logError('Error rejecting assignment', err);
      setError('Failed to reject assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    if (!paymentMethod[assignmentId]) return setError('Select a payment method.');
    try {
      setLoading(true);
      const assignment = assignments.find((a) => a.id === assignmentId);
      await updateDoc(doc(db, 'assignments', assignmentId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        paymentStatus: { method: paymentMethod[assignmentId], status: 'paid' },
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, `users/${user.uid}/earnings`), {
        assignmentId,
        serviceType: assignment.vehicleType,
        cost: assignment.customPrice || 0,
        completedAt: serverTimestamp(),
        paymentMethod: paymentMethod[assignmentId],
      });
      await updateDoc(doc(db, 'users', user.uid), { driverStatus: 'available' });
      setDriverStatus('available');
      setProfile((prev) => ({ ...prev, driverStatus: 'available' }));
      setUpdatedProfile((prev) => ({ ...prev, driverStatus: 'available' }));
      setPaymentMethod((prev) => ({ ...prev, [assignmentId]: undefined }));
      alert('Task completed!');
    } catch (err) {
      logError('Error completing assignment', err);
      setError('Failed to complete assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!newAvailabilityDate || new Date(newAvailabilityDate) < new Date().setHours(0, 0, 0, 0)) {
      setError('Select a future date for working day.');
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
      alert('Working day added!');
    } catch (err) {
      logError('Error adding working day', err);
      setError('Failed to update availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffDay = async (e) => {
    e.preventDefault();
    if (!newOffDayDate || new Date(newOffDayDate) < new Date().setHours(0, 0, 0, 0)) {
      setError('Select a future date for off day.');
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
      alert('Off day added!');
    } catch (err) {
      logError('Error adding off day', err);
      setError('Failed to add off day.');
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
      alert('Working day removed!');
    } catch (err) {
      logError('Error removing working day', err);
      setError('Failed to remove working day.');
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
      alert('Off day removed!');
    } catch (err) {
      logError('Error removing off day', err);
      setError('Failed to remove off day.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicleSkills = async (e) => {
    e.preventDefault();
    if (!vehicleSkills.length) return setError('Select at least one vehicle skill.');
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), { vehicleSkills });
      alert('Vehicle skills updated!');
    } catch (err) {
      logError('Error updating vehicle skills', err);
      setError('Failed to update vehicle skills.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
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
      alert('Profile updated successfully!');
    } catch (err) {
      logError('Error updating profile', err);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || error.includes('Access restricted') || error.includes('Please log in')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md mx-auto p-6 bg-red-50 text-red-700 rounded-xl shadow-lg text-center">
          {error || 'Please log in as a driver.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-green-700 flex items-center">
          <UserIcon className="w-8 h-8 mr-2" />
          Welcome, {profile.name || 'Driver'}!
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
            Driver Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">Profile:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 mr-2">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${driverStatus === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {driverStatus.charAt(0).toUpperCase() + driverStatus.slice(1)}
              </span>
            </div>
            <div className="flex items-center">
              <BanknotesIcon className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium text-gray-700">Total Earnings: ₹{totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-700 flex items-center">
            <TruckIcon className="w-6 h-6 mr-2" />
            Active Tasks
          </h3>
          {assignments.length === 0 ? (
            <p className="text-gray-600 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              No active tasks assigned.
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                console.log(`[DriverDashboard] Assignment ID: ${assignment.id}, vehicleType: ${assignment.vehicleType}`);
                return (
                  <div key={assignment.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><strong>Type:</strong> {assignment.vehicleType.replace('-', ' ').toUpperCase()}</p>
                      <p><strong>Date:</strong> {new Date(assignment.startDate).toLocaleDateString('en-GB')}</p>
                      <p><strong>Location:</strong> {assignment.location}</p>
                      <p><strong>Earnings:</strong> ₹{(assignment.customPrice || 0).toFixed(2)}</p>
                      <p>
                        <strong>Workers:</strong>{' '}
                        {(workerDetails[assignment.id]?.length > 0)
                          ? workerDetails[assignment.id].map((w) => `${w.name} (${w.mobile})`).join(', ')
                          : 'None'}
                      </p>
                      <p><strong>Status:</strong> <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-600'}`}>{assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}</span></p>
                    </div>
                    {assignment.status === 'pending' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAcceptAssignment(assignment.id)}
                          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || timers[assignment.id] === 0 || status !== 'approved'}
                          title="Accept this task"
                        >
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectAssignment(assignment.id)}
                          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || timers[assignment.id] === 0 || status !== 'approved'}
                          title="Reject this task"
                        >
                          <XCircleIcon className="w-5 h-5 mr-2" />
                          Reject
                        </button>
                        {timers[assignment.id] > 0 && (
                          <span className="flex items-center text-red-600">
                            <ClockIcon className="w-5 h-5 mr-2" />
                            Time Left: {Math.floor(timers[assignment.id] / 60)}:{(timers[assignment.id] % 60).toString().padStart(2, '0')}
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
                        >
                          <option value="" disabled>Select Payment</option>
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                        <button
                          onClick={() => handleCompleteAssignment(assignment.id)}
                          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                          disabled={loading || !paymentMethod[assignment.id]}
                          title="Mark task as completed"
                        >
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          Complete
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
            Task History
          </h3>
          <p className="text-sm text-gray-500 mb-4">Sorted: Newest First</p>
          {taskHistory.length === 0 ? (
            <p className="text-gray-600 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              No task history available.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100">
              {taskHistory.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><strong>Type:</strong> {assignment.vehicleType.replace('-', ' ').toUpperCase()}</p>
                    <p><strong>Date:</strong> {new Date(assignment.startDate).toLocaleDateString('en-GB')}</p>
                    <p><strong>Location:</strong> {assignment.location}</p>
                    <p><strong>Earnings:</strong> ₹{(assignment.status === 'completed' ? (assignment.customPrice || 0) : 0).toFixed(2)}</p>
                    <p>
                      <strong>Workers:</strong>{' '}
                      {(workerDetails[assignment.id]?.length > 0)
                        ? workerDetails[assignment.id].map((w) => `${w.name} (${w.mobile})`).join(', ')
                        : 'None'}
                    </p>
                    <p><strong>Status:</strong> <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-600'}`}>{assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}</span></p>
                  </div>
                </div>
              ))}
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
              Profile
            </span>
            {showProfile ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showProfile && (
            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  value={updatedProfile.name}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-gray-700 font-medium mb-2">Mobile</label>
                <input
                  id="mobile"
                  type="text"
                  value={updatedProfile.mobile}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, mobile: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label htmlFor="pincode" className="block text-gray-700 font-medium mb-2">Pincode</label>
                <input
                  id="pincode"
                  type="text"
                  value={updatedProfile.pincode}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, pincode: e.target.value })}
                  placeholder="Enter 6-digit pincode"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label htmlFor="driverStatus" className="block text-gray-700 font-medium mb-2">Status</label>
                <select
                  id="driverStatus"
                  value={updatedProfile.driverStatus}
                  onChange={(e) => setUpdatedProfile({ ...updatedProfile, driverStatus: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                disabled={loading}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Update Profile
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
              Availability
            </span>
            {showAvailability ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showAvailability && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Working Days</h4>
                <form onSubmit={handleAddAvailability} className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label htmlFor="availability-date" className="block text-gray-700 font-medium mb-2">Add Working Day</label>
                    <input
                      id="availability-date"
                      type="date"
                      value={newAvailabilityDate}
                      onChange={(e) => setNewAvailabilityDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-green-600 w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    disabled={loading || !newAvailabilityDate}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Add Working Day
                  </button>
                </form>
                <div>
                  <p className="font-semibold mb-2 text-gray-700">Current Working Days:</p>
                  {availability.workingDays.length === 0 ? (
                    <p className="text-gray-600">No working days set.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.workingDays.sort((a, b) => new Date(a) - new Date(b)).map((date) => (
                        <div key={date} className="flex items-center bg-green-100 text-green-800 rounded-lg px-3 py-1">
                          <span>{new Date(date).toLocaleDateString('en-GB')}</span>
                          <button
                            onClick={() => handleRemoveAvailability(date)}
                            className="ml-2 bg-red-600 text-white text-sm px-2 py-1 rounded-lg hover:bg-red-700"
                            disabled={loading}
                            title="Remove working day"
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
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Off Days</h4>
                <form onSubmit={handleAddOffDay} className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label htmlFor="off-day-date" className="block text-gray-700 font-medium mb-2">Add Off Day</label>
                    <input
                      id="off-day-date"
                      type="date"
                      value={newOffDayDate}
                      onChange={(e) => setNewOffDayDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-green-600 w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    disabled={loading || !newOffDayDate}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Add Off Day
                  </button>
                </form>
                <div>
                  <p className="font-semibold mb-2 text-gray-700">Current Off Days:</p>
                  {availability.offDays.length === 0 ? (
                    <p className="text-gray-600">No off days set.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availability.offDays.sort((a, b) => new Date(a) - new Date(b)).map((date) => (
                        <div key={date} className="flex items-center bg-red-100 text-red-800 rounded-lg px-3 py-1">
                          <span>{new Date(date).toLocaleDateString('en-GB')}</span>
                          <button
                            onClick={() => handleRemoveOffDay(date)}
                            className="ml-2 bg-red-600 text-white text-sm px-2 py-1 rounded-lg hover:bg-red-700"
                            disabled={loading}
                            title="Remove off day"
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
              Vehicle Skills
            </span>
            {showSkills ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showSkills && (
            <form onSubmit={handleUpdateVehicleSkills}>
              <select
                multiple
                value={vehicleSkills}
                onChange={(e) => setVehicleSkills(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
                className="w-full p-3 border rounded-lg h-32 mb-4"
              >
                {VEHICLE_SKILLS.map((skill) => (
                  <option key={skill} value={skill}>{skill.replace('-', ' ').toUpperCase()}</option>
                ))}
              </select>
              <button
                type="submit"
                className="flex items-center justify-center bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                disabled={loading || vehicleSkills.length === 0}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Update Skills
              </button>
              <div className="mt-4">
                <p className="font-semibold text-gray-700">Current Skills:</p>
                {vehicleSkills.length === 0 ? (
                  <p className="text-gray-600">No skills selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {vehicleSkills.map((skill) => (
                      <span key={skill} className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg">
                        {skill.replace('-', ' ').toUpperCase()}
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
import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDoc,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import useDebounce from '../useDebounce.js';
import { VEHICLE_SKILLS, MAX_GROUP_SIZE, MOBILE_REGEX, PINCODE_REGEX, STATUS_COLORS } from '../constants.js';
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon, TruckIcon, MagnifyingGlassIcon, CurrencyRupeeIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DriverAssignmentDashboard = () => {
  const [user, setUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectedAssignments, setRejectedAssignments] = useState([]);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0, totalEarnings: 0 });
  const [showFilterDrivers, setShowFilterDrivers] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(true);
  const [showReassignDriver, setShowReassignDriver] = useState(true);
  const [showAssignedGroups, setShowAssignedGroups] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedWorkerSearchQuery = useDebounce(workerSearchQuery, 300);

  const logError = (message, error) => console.error(`[DriverAssignmentDashboard] ${message}`, error);

  const sendWhatsAppMessage = async (mobile, message) => {
    try {
      if (!mobile || !MOBILE_REGEX.test(mobile)) return false;
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

  const isWorkerAvailable = useCallback((worker, date) => {
    if (!date) return true;
    const workingDays = worker.availability?.workingDays || [];
    const offDays = worker.availability?.offDays || [];
    return workingDays.includes(date) && !offDays.includes(date);
  }, []);

  const getRecommendedVehicleType = useCallback((workerCount) => {
    if (workerCount <= 2) return 'bike';
    if (workerCount <= 4) return 'uv-auto';
    return 'car';
  }, []);

  const getAvailableDrivers = useCallback((vehicleType, date, workerPincodes, rejectedDriverIds = []) => {
    return drivers.filter(
      (driver) =>
        driver.vehicleSkills?.includes(vehicleType) &&
        isWorkerAvailable(driver, date) &&
        driver.driverStatus === 'available' &&
        workerPincodes.includes(driver.pincode) &&
        !rejectedDriverIds.includes(driver.id)
    );
  }, [drivers, isWorkerAvailable]);

  useEffect(() => {
    if (!auth || !db) {
      setError('Firebase services not initialized.');
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please log in as an admin.');
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          setError('Access restricted to admins.');
          return;
        }
        setUser(user);

        const workersQuery = query(collection(db, 'users'), where('role', '==', 'worker'), where('status', '==', 'approved'));
        const unsubscribeWorkers = onSnapshot(workersQuery, (snapshot) => {
          const allWorkers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setWorkers(allWorkers);
          setFilteredWorkers(allWorkers);
        }, (err) => {
          logError('Error fetching workers', err);
          setError('Failed to fetch workers.');
        });

        const driversQuery = query(collection(db, 'users'), where('role', '==', 'driver'), where('status', '==', 'approved'));
        const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
          const allDrivers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setDrivers(allDrivers);
          setFilteredDrivers(allDrivers);
        }, (err) => {
          logError('Error fetching drivers', err);
          setError('Failed to fetch drivers.');
        });

        const assignmentsQuery = query(collection(db, 'assignments'));
        const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
          const allGroups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setGroups(allGroups);
          setRejectedAssignments(allGroups.filter((g) => g.status === 'rejected'));
          setStats({
            accepted: allGroups.filter((g) => g.status === 'accepted').length,
            rejected: allGroups.filter((g) => g.status === 'rejected').length,
            totalEarnings: allGroups.reduce((sum, g) => sum + (g.customPrice || 0), 0),
          });
        }, (err) => {
          logError('Error fetching assignments', err);
          setError('Failed to fetch assignments.');
        });

        return () => {
          unsubscribeWorkers();
          unsubscribeDrivers();
          unsubscribeAssignments();
        };
      } catch (err) {
        logError('Initialization error', err);
        setError('Failed to initialize dashboard.');
      }
    }, (err) => {
      logError('Authentication error', err);
      setError('Authentication failed.');
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let filtered = drivers;
    if (filterDate) filtered = filtered.filter((driver) => isWorkerAvailable(driver, filterDate));
    if (debouncedSearchQuery.trim()) {
      const queryLower = debouncedSearchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.name?.toLowerCase().includes(queryLower) ||
          driver.mobile?.toLowerCase().includes(queryLower) ||
          driver.pincode?.toLowerCase().includes(queryLower)
      );
    }
    setFilteredDrivers(filtered);
  }, [filterDate, debouncedSearchQuery, drivers, isWorkerAvailable]);

  useEffect(() => {
    const queryLower = debouncedWorkerSearchQuery.trim().toLowerCase();
    setFilteredWorkers(
      queryLower
        ? workers.filter(
            (worker) =>
              worker.name?.toLowerCase().includes(queryLower) ||
              worker.mobile?.toLowerCase().includes(queryLower) ||
              worker.pincode?.toLowerCase().includes(queryLower)
          )
        : workers
    );
  }, [debouncedWorkerSearchQuery, workers]);

  const isFutureDate = (date) => date && new Date(date).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);

  const handleCreateGroup = async () => {
    if (!selectedWorkers.length) return setError('Select at least one worker.');
    if (selectedWorkers.length > MAX_GROUP_SIZE) return setError(`Maximum ${MAX_GROUP_SIZE} workers allowed.`);
    if (!startDate || !isFutureDate(startDate)) return setError('Select a valid future start date.');
    if (!location?.trim()) return setError('Enter a valid location.');
    if (!vehicleType) return setError('Select a vehicle type.');
    const customPriceValue = parseFloat(customPrice);
    if (isNaN(customPriceValue) || customPriceValue <= 0) return setError('Enter a valid price greater than 0.');

    const unavailableWorkers = selectedWorkers.filter((workerId) => !isWorkerAvailable(workers.find((w) => w.id === workerId), startDate));
    if (unavailableWorkers.length) return setError('Some workers are unavailable.');

    const workerPincodes = selectedWorkers
      .map((wid) => workers.find((w) => w.id === wid)?.pincode)
      .filter((pincode) => pincode && PINCODE_REGEX.test(pincode));
    if (!workerPincodes.length) return setError('No valid pincodes found.');

    try {
      setLoading(true);
      setError('');
      await addDoc(collection(db, 'assignments'), {
        workerIds: selectedWorkers,
        driverId: '',
        vehicleType: vehicleType || getRecommendedVehicleType(selectedWorkers.length),
        location: location.trim(),
        startDate,
        status: 'pending',
        workerPincodes,
        customPrice: customPriceValue,
        createdAt: serverTimestamp(),
        rejectedDriverIds: [],
      });
      setSelectedWorkers([]);
      setLocation('');
      setStartDate('');
      setCustomPrice('');
      setVehicleType('');
      setSuccess('Group created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logError('Error creating group', err);
      setError('Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async (groupId, index) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group.vehicleType) return setError('Select a vehicle type.');
    if (!selectedDriver) return setError('Select a driver.');
    if (!group.location?.trim()) return setError('Location is missing.');
    if (!group.startDate || !isFutureDate(group.startDate)) return setError('Invalid start date.');

    const driver = drivers.find((d) => d.id === selectedDriver);
    if (!driver || driver.driverStatus !== 'available') return setError('Driver unavailable.');

    try {
      setLoading(true);
      setError('');
      const assignmentRef = doc(db, 'assignments', groupId);
      await updateDoc(assignmentRef, {
        driverId: selectedDriver,
        status: 'pending',
        updatedAt: serverTimestamp(),
        rejectedDriverIds: [...(group.rejectedDriverIds || []), group.driverId].filter(Boolean),
      });

      const workerNames = group.workerIds.map((wid) => workers.find((w) => w.id === wid)?.name || 'Unknown').join(', ');
      const workerMobiles = group.workerIds.map((wid) => workers.find((w) => w.id === wid)?.mobile || 'N/A').join(', ');
      const messages = [
        ...group.workerIds.map((wid) => {
          const worker = workers.find((w) => w.id === wid);
          return worker && sendWhatsAppMessage(worker.mobile, `Assigned to driver ${driver.name} (${driver.mobile}) at ${group.location} on ${group.startDate}. Price: ₹${(group.customPrice || 0).toFixed(2)}.`);
        }),
        sendWhatsAppMessage(driver.mobile, `Assigned to transport: ${workerNames} (Contact: ${workerMobiles}) at ${group.location} on ${group.startDate}. Price: ₹${(group.customPrice || 0).toFixed(2)}. Accept/reject in dashboard.`),
      ];
      const results = await Promise.all(messages);
      const notificationErrors = results.some((r) => !r) ? ['Some notifications failed.'] : [];
      setSelectedDriver('');
      setSuccess(notificationErrors.length ? `Assignment successful, but ${notificationErrors.join('; ')}` : 'Driver assigned and notified!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logError('Error assigning driver', err);
      setError('Failed to assign driver.');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleTypeChange = async (groupId, type) => {
    if (!type) return setError('Select a valid vehicle type.');
    try {
      setLoading(true);
      setError('');
      const assignmentRef = doc(db, 'assignments', groupId);
      await updateDoc(assignmentRef, {
        vehicleType: type,
        updatedAt: serverTimestamp(),
      });
      setGroups((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          updated[index] = { ...updated[index], vehicleType: type };
        }
        return updated;
      });
      setSuccess('Vehicle type updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logError('Error updating vehicle type', err);
      setError('Failed to update vehicle type.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelection = useCallback((e) => {
    setSelectedWorkers(Array.from(e.target.selectedOptions).map((opt) => opt.value));
  }, []);

  if (!user || error.includes('Access restricted') || error.includes('Please log in')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md mx-auto p-6 bg-red-50 text-red-700 rounded-xl shadow-lg text-center flex items-center">
          <XCircleIcon className="w-6 h-6 mr-2" />
          {error || 'Please log in as an admin.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-green-700 flex items-center justify-center">
          <UserGroupIcon className="w-8 h-8 mr-2" />
          Driver Assignment Dashboard
        </h2>
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl shadow flex items-center">
            <XCircleIcon className="w-6 h-6 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-xl shadow flex items-center">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            {success}
          </div>
        )}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-green-700 flex items-center">
            <CurrencyRupeeIcon className="w-6 h-6 mr-2" />
            Dashboard Stats
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Accepted Tasks</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Rejected Tasks</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowFilterDrivers(!showFilterDrivers)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <MagnifyingGlassIcon className="w-6 h-6 mr-2" />
              Filter Drivers
            </span>
            {showFilterDrivers ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showFilterDrivers && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="filter-date" className="block text-gray-700 font-medium mb-2">Select Date</label>
                <input
                  id="filter-date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  title="Filter drivers by availability date"
                />
              </div>
              <div>
                <label htmlFor="search-drivers" className="block text-gray-700 font-medium mb-2">Search Drivers</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="search-drivers"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, mobile, or pincode"
                    className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600"
                    title="Search drivers by name, mobile, or pincode"
                  />
                </div>
              </div>
              <button
                onClick={() => { setFilterDate(''); setSearchQuery(''); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                disabled={loading}
                title="Clear all filters"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowFilterDrivers(!showFilterDrivers)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <TruckIcon className="w-6 h-6 mr-2" />
              Available Drivers
            </span>
            {showFilterDrivers ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showFilterDrivers && (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-100">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead className="sticky top-0 bg-green-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Mobile</th>
                    <th className="p-3 text-left">Pincode</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length === 0 ? (
                    <tr><td colSpan="4" className="p-3 text-center text-gray-600">No drivers available.</td></tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <tr key={driver.id} className="border-b hover:bg-gray-50 even:bg-gray-50">
                        <td className="p-3">{driver.name || 'Unnamed'}</td>
                        <td className="p-3">{driver.mobile || 'N/A'}</td>
                        <td className="p-3">{driver.pincode || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[driver.driverStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {driver.driverStatus.charAt(0).toUpperCase() + driver.driverStatus.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <UserGroupIcon className="w-6 h-6 mr-2" />
              Create Worker Group
            </span>
            {showCreateGroup ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showCreateGroup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="search-workers" className="block text-gray-700 font-medium mb-2">Search Workers</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="search-workers"
                    type="text"
                    value={workerSearchQuery}
                    onChange={(e) => setWorkerSearchQuery(e.target.value)}
                    placeholder="Search by name, mobile, or pincode"
                    className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-green-600"
                    title="Search workers by name, mobile, or pincode"
                  />
                </div>
                <label htmlFor="select-workers" className="block text-gray-700 font-medium mt-4 mb-2">Select Workers (Max {MAX_GROUP_SIZE})</label>
                <select
                  id="select-workers"
                  multiple
                  value={selectedWorkers}
                  onChange={handleWorkerSelection}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600 h-32"
                  size={Math.min(5, filteredWorkers.length)}
                  title="Select up to 5 workers for the group"
                >
                  {filteredWorkers.length === 0 ? (
                    <option disabled>No workers available.</option>
                  ) : (
                    filteredWorkers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name || 'Unnamed'} - 📲 {worker.mobile || 'N/A'} - {worker.pincode || 'N/A'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="vehicle-type" className="block text-gray-700 font-medium mb-2">Vehicle Type</label>
                <select
                  id="vehicle-type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  title="Select vehicle type for the group"
                >
                  <option value="">Select Vehicle Type</option>
                  {VEHICLE_SKILLS.map((skill) => (
                    <option key={skill} value={skill}>{skill.replace('-', ' ').toUpperCase()}</option>
                  ))}
                </select>
                <label htmlFor="start-date" className="block text-gray-700 font-medium mt-4 mb-2">Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  title="Select a future start date"
                />
                <label htmlFor="location" className="block text-gray-700 font-medium mt-4 mb-2">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 123 Main St, PIN 441804"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  title="Enter pickup location with pincode"
                />
                <label htmlFor="custom-price" className="block text-gray-700 font-medium mt-4 mb-2">Price (₹)</label>
                <input
                  id="custom-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600"
                  title="Enter price for the assignment"
                />
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  disabled={loading}
                  title="Create worker group"
                >
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  Create Group
                </button>
                <button
                  onClick={() => { setWorkerSearchQuery(''); setSelectedWorkers([]); setStartDate(''); setLocation(''); setCustomPrice(''); setVehicleType(''); }}
                  className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  disabled={loading}
                  title="Clear form fields"
                >
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  Clear Form
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowReassignDriver(!showReassignDriver)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <TruckIcon className="w-6 h-6 mr-2" />
              Reassign Driver
            </span>
            {showReassignDriver ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showReassignDriver && (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-100">
              <div className="grid grid-cols-1 gap-6">
                {rejectedAssignments.length === 0 ? (
                  <p className="text-center text-gray-600 flex items-center justify-center">
                    <TruckIcon className="w-5 h-5 mr-2" />
                    No rejected assignments.
                  </p>
                ) : (
                  rejectedAssignments.map((group, index) => {
                    const availableDrivers = getAvailableDrivers(group.vehicleType, group.startDate, group.workerPincodes, group.rejectedDriverIds || []);
                    return (
                      <div key={group.id} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-800">Group ID: {group.id}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p><strong>Workers:</strong> {group.workerIds.map((wid) => workers.find((w) => w.id === wid)?.name || 'Unknown').join(', ')}</p>
                          <p><strong>Price:</strong> ₹{(group.customPrice || 0).toFixed(2)}</p>
                          <p><strong>Vehicle:</strong> {group.vehicleType.replace('-', ' ').toUpperCase()}</p>
                          <p><strong>Location:</strong> {group.location}</p>
                          <p><strong>Start Date:</strong> {new Date(group.startDate).toLocaleDateString('en-GB')}</p>
                          <p><strong>Pincodes:</strong> {group.workerPincodes.join(', ')}</p>
                        </div>
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-600 mt-4"
                          title="Select a driver to reassign"
                        >
                          <option value="">Select Driver</option>
                          {availableDrivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} - 📲 {driver.mobile || 'N/A'} - {driver.pincode}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignDriver(group.id, index)}
                          className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors flex items-center"
                          disabled={loading || !selectedDriver}
                          title="Reassign driver to this group"
                        >
                          <TruckIcon className="w-5 h-5 mr-2" />
                          Reassign Driver
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <button
            onClick={() => setShowAssignedGroups(!showAssignedGroups)}
            className="w-full flex items-center justify-between text-xl md:text-2xl font-semibold text-green-700 mb-4 focus:outline-none"
          >
            <span className="flex items-center">
              <UserGroupIcon className="w-6 h-6 mr-2" />
              Assigned Groups
            </span>
            {showAssignedGroups ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {showAssignedGroups && (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-100">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead className="sticky top-0 bg-green-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Workers</th>
                    <th className="p-3 text-left">Vehicle Type</th>
                    <th className="p-3 text-left">Driver</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Start Date</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr><td colSpan="8" className="p-3 text-center text-gray-600">No groups created.</td></tr>
                  ) : (
                    groups.map((group, index) => {
                      const availableDrivers = getAvailableDrivers(group.vehicleType, group.startDate, group.workerPincodes || [], group.rejectedDriverIds || []);
                      return (
                        <tr key={group.id} className="border-b hover:bg-gray-50 even:bg-gray-50">
                          <td className="p-3">
                            {group.workerIds.map((wid) => workers.find((w) => w.id === wid)?.name || 'Unknown').join(', ')}
                            <p className="text-sm text-gray-500">({group.workerIds.length} worker{group.workerIds.length > 1 ? 's' : ''})</p>
                          </td>
                          <td className="p-3">
                            {group.workerIds.length <= 4 ? (
                              <select
                                value={group.vehicleType}
                                onChange={(e) => handleVehicleTypeChange(group.id, e.target.value)}
                                className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                                title="Change vehicle type"
                              >
                                <option value="">Select Vehicle Type</option>
                                {VEHICLE_SKILLS.map((skill) => (
                                  <option key={skill} value={skill}>{skill.replace('-', ' ').toUpperCase()}</option>
                                ))}
                              </select>
                            ) : (
                              group.vehicleType.replace('-', ' ').toUpperCase()
                            )}
                          </td>
                          <td className="p-3">
                            {group.driverId ? (
                              drivers.find((d) => d.id === group.driverId)?.name || 'Unknown'
                            ) : (
                              <select
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600"
                                title="Select a driver to assign"
                              >
                                <option value="">Select Driver</option>
                                {availableDrivers.map((driver) => (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.name} - 📲 {driver.mobile || 'N/A'} - {driver.pincode}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3">{group.location}</td>
                          <td className="p-3">{new Date(group.startDate).toLocaleDateString('en-GB')}</td>
                          <td className="p-3">₹{(group.customPrice || 0).toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[group.status] || 'bg-gray-100 text-gray-600'}`}>
                              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                              {group.customPrice === undefined && <span className="text-red-600 ml-2">Missing Price</span>}
                            </span>
                          </td>
                          <td className="p-3">
                            {!group.driverId && (
                              <button
                                onClick={() => handleAssignDriver(group.id, index)}
                                className="bg-green-600 text-white px-1.5 py-0.5 text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                                disabled={loading || !selectedDriver}
                                title="Assign driver to this group"
                              >
                                Assign Driver
                              </button>
                            )}
                            {group.status === 'rejected' && (
                              <button
                                onClick={() => handleAssignDriver(group.id, index)}
                                className="bg-yellow-600 text-white px-1.5 py-0.5 text-sm rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
                                disabled={loading || !selectedDriver}
                                title="Reassign driver to thisentre group"
                              >
                                Reassign Driver
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverAssignmentDashboard;
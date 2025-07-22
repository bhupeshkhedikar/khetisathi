import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, getDoc, getDocs, doc, updateDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import Analytics from './pages/AdminPages/Analytics';
import UserManagement from './pages/AdminPages/UserManagement';
import ServiceManagement from './pages/AdminPages/ServiceManagement';
import BundleManagement from './pages/AdminPages/BundleManagement';
// import OrderManagement from './pages/AdminPages/OrderManagement';
import DriverApproval from './DriverApproval';
import DriverAssignmentDashboard from './pages/AdminPages/DriverAssignmentDashboard';
import OrderManagement from './pages/AdminPages/OrderManagement';


const AdminPanel = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [users, setUsers] = useState({});
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceType, setNewServiceType] = useState('');
  const [newServiceCost, setNewServiceCost] = useState('');
  const [newMaleCost, setNewMaleCost] = useState('');
  const [newFemaleCost, setNewFemaleCost] = useState('');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleMaleWorkers, setNewBundleMaleWorkers] = useState('0');
  const [newBundleFemaleWorkers, setNewBundleFemaleWorkers] = useState('0');
  const [newBundlePrice, setNewBundlePrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [workerSortConfig, setWorkerSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [farmerSortConfig, setFarmerSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedMaleWorkers, setSelectedMaleWorkers] = useState([]);
  const [selectedFemaleWorkers, setSelectedFemaleWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditBundleModal, setShowEditBundleModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [currentBundle, setCurrentBundle] = useState(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [editServiceCost, setEditServiceCost] = useState('');
  const [editMaleCost, setEditMaleCost] = useState('');
  const [editFemaleCost, setEditFemaleCost] = useState('');
  const [editServiceImage, setEditServiceImage] = useState('');
  const [editBundleName, setEditBundleName] = useState('');
  const [editBundleMaleWorkers, setEditBundleMaleWorkers] = useState('0');
  const [editBundleFemaleWorkers, setEditBundleFemaleWorkers] = useState('0');
  const [editBundlePrice, setEditBundlePrice] = useState('');
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [currentOrderForDriver, setCurrentOrderForDriver] = useState(null);
  const [newBundleDriverId, setNewBundleDriverId] = useState('');
  const [newBundleVehicleSkills, setNewBundleVehicleSkills] = useState([]);
  const [editBundleDriverId, setEditBundleDriverId] = useState('');
  const [editBundleVehicleSkills, setEditBundleVehicleSkills] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [newBundleMaleWages, setNewBundleMaleWages] = useState('');
  const [newBundleFemaleWages, setNewBundleFemaleWages] = useState('');
  const [newBundleDriverWages, setNewBundleDriverWages] = useState('');
  const [newBundleTimeRange, setNewBundleTimeRange] = useState('');
  const [newBundleLocation, setNewBundleLocation] = useState('');
  const [editBundleMaleWages, setEditBundleMaleWages] = useState('');
  const [editBundleFemaleWages, setEditBundleFemaleWages] = useState('');
  const [editBundleDriverWages, setEditBundleDriverWages] = useState('');
  const [editBundleTimeRange, setEditBundleTimeRange] = useState('');
  const [editBundleLocation, setEditBundleLocation] = useState('');
  const [newPriceUnit, setNewPriceUnit] = useState('Per Day');
  const [newActiveStatus, setNewActiveStatus] = useState(true);
  const [editPriceUnit, setEditPriceUnit] = useState('');
  const [editActiveStatus, setEditActiveStatus] = useState(false);
  // Add state for new bundle availability fields
  const [newBundleAvailabilityStatus, setNewBundleAvailabilityStatus] = useState('Available');
  const [newBundleAvailabilityDate, setNewBundleAvailabilityDate] = useState('');

  // Add state for edit bundle availability fields
  const [editBundleAvailabilityStatus, setEditBundleAvailabilityStatus] = useState('Available');
  const [editBundleAvailabilityDate, setEditBundleAvailabilityDate] = useState('');
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          setError('Access restricted to admins.');
          return;
        }
        setAdminUser(user);

        const driversQuery = query(
          collection(db, 'users'),
          where('role', '==', 'driver'),
          where('status', '==', 'approved')
        );
        const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
          const driverList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setDrivers(driverList);
        }, (err) => setError(`Error fetching drivers: ${err.message}`));

        const workersQuery = query(collection(db, 'users'), where('role', '==', 'worker'));
        const unsubscribeWorkers = onSnapshot(workersQuery, (snapshot) => {
          const workerData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setWorkers(workerData);
        }, (err) => setError(`Error fetching workers: ${err.message}`));

        const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
        const unsubscribeFarmers = onSnapshot(farmersQuery, (snapshot) => {
          setFarmers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }, (err) => setError(`Error fetching farmers: ${err.message}`));

        const ordersQuery = query(collection(db, 'orders'));
        const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
          const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setOrders(ordersData);

          const userIds = [
            ...new Set([
              ...ordersData.map((order) => order.farmerId),
              ...ordersData.flatMap((order) =>
                Array.isArray(order.workerId) ? order.workerId : order.workerId ? [order.workerId] : []
              ),
            ]),
          ];
          const newUsers = { ...users };
          for (const userId of userIds) {
            if (!newUsers[userId]) {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) newUsers[userId] = userDoc.data();
            }
          }
          setUsers(newUsers);
        }, (err) => setError(`Error fetching orders: ${err.message}`));

        const servicesQuery = query(collection(db, 'services'));
        const unsubscribeServices = onSnapshot(servicesQuery, async (snapshot) => {
          const servicesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setServices(servicesData);

          const farmWorkersService = servicesData.find((s) => s.type === 'farm-workers');
          if (farmWorkersService) {
            const bundlesSnapshot = await getDocs(collection(db, `services/${farmWorkersService.id}/bundles`));
            setBundles(bundlesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          }
        }, (err) => setError(`Error fetching services: ${err.message}`));

        return () => {
          unsubscribeWorkers();
          unsubscribeFarmers();
          unsubscribeOrders();
          unsubscribeServices();
          unsubscribeDrivers();
        };
      }
    }, (err) => setError(`Authentication error: ${err.message}`));

    return () => unsubscribeAuth();
  }, [users]);

  const calculateWorkersNeeded = (order) => {
    let totalNeeded = order.totalWorkers || 1;
    let maleNeeded = order.serviceType === 'farm-workers' ? (order.bundleDetails?.maleWorkers || order.maleWorkers || 0) : 0;
    let femaleNeeded = order.serviceType === 'farm-workers' ? (order.bundleDetails?.femaleWorkers || order.femaleWorkers || 0) : 0;
    let rejections = 0;

    if (Array.isArray(order.workerAcceptances) && Array.isArray(order.workerId)) {
      const acceptedOrPendingWorkers = order.workerAcceptances.filter(
        (wa) => wa.status === 'accepted' || wa.status === 'pending'
      );
      const rejectedWorkers = order.workerAcceptances.filter((wa) => wa.status === 'rejected');
      rejections = rejectedWorkers.length;

      if (order.serviceType === 'farm-workers') {
        const maleAcceptedOrPending = acceptedOrPendingWorkers.reduce((count, wa) => {
          const worker = workers.find((w) => w.id === wa.workerId);
          return worker?.gender === 'male' ? count + 1 : count;
        }, 0);
        const femaleAcceptedOrPending = acceptedOrPendingWorkers.reduce((count, wa) => {
          const worker = workers.find((w) => w.id === wa.workerId);
          return worker?.gender === 'female' ? count + 1 : count;
        }, 0);
        maleNeeded = Math.max(0, maleNeeded - maleAcceptedOrPending);
        femaleNeeded = Math.max(0, femaleNeeded - femaleAcceptedOrPending);
      } else {
        totalNeeded = Math.max(0, totalNeeded - acceptedOrPendingWorkers.length);
      }
    } else if (order.workerId && !Array.isArray(order.workerId)) {
      if (order.accepted === 'rejected') {
        rejections = 1;
      } else if (order.accepted === 'accepted' || order.accepted === 'pending') {
        totalNeeded = 0;
      }
    }

    return { totalNeeded, maleNeeded, femaleNeeded, rejections };
  };

  const isWorkerAvailable = (worker, date) => {
    if (!worker.availability) return true;
    if (!worker.availability.workingDays && !worker.availability.offDays) return true;
    if (worker.availability.offDays?.includes(date)) return false;
    if (!worker.availability.workingDays) return true;
    return worker.availability.workingDays.includes(date);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFarmerSort = (key) => {
    setFarmerSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleWorkerSort = (key) => {
    setWorkerSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

const handleAddService = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const serviceData = {
      name: newServiceName,
      type: newServiceType,
      image: newServiceImage || 'https://via.placeholder.com/150',
      createdAt: serverTimestamp(),
      priceUnit: newPriceUnit, // Use the state value from the form
      activeStatus: newActiveStatus,
    };
    if (newServiceType === 'farm-workers') {
      serviceData.maleCost = parseFloat(newMaleCost) || 0;
      serviceData.femaleCost = parseFloat(newFemaleCost) || 0;
    } else {
      serviceData.cost = parseFloat(newServiceCost) || 0;
    }
    await addDoc(collection(db, 'services'), serviceData);
    setNewServiceName('');
    setNewServiceType('');
    setNewServiceCost('');
    setNewMaleCost('');
    setNewFemaleCost('');
    setNewServiceImage('');
    setNewPriceUnit('Per Acre'); // Reset to default, adjust as needed
    setNewActiveStatus(true); // Reset to default
    alert('Service added successfully!');
  } catch (err) {
    setError(`Error adding service: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

const handleEditService = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const serviceRef = doc(db, 'services', currentService.id);
    const serviceData = {
      name: editServiceName,
      type: editServiceType,
      image: editServiceImage || 'https://via.placeholder.com/150',
      updatedAt: serverTimestamp(),
      priceUnit: editPriceUnit, // Use the state value from the edit modal
      activeStatus: editActiveStatus,
    };
    if (editServiceType === 'farm-workers') {
      serviceData.maleCost = parseFloat(editMaleCost) || 0;
      serviceData.femaleCost = parseFloat(editFemaleCost) || 0;
    } else {
      serviceData.cost = parseFloat(editServiceCost) || 0;
    }
    await updateDoc(serviceRef, serviceData);
    setShowEditServiceModal(false);
    setCurrentService(null);
    alert('Service updated successfully!');
  } catch (err) {
    setError(`Error updating service: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
  const handleDeleteService = async (serviceId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      alert('Service deleted successfully!');
    } catch (err) {
      setError(`Error deleting service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBundle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm Workers service not found');
      const bundleData = {
        name: newBundleName,
        maleWorkers: parseInt(newBundleMaleWorkers) || 0,
        femaleWorkers: parseInt(newBundleFemaleWorkers) || 0,
        price: parseFloat(newBundlePrice) || 0,
        maleWages: parseFloat(newBundleMaleWages) || 0,
        femaleWages: parseFloat(newBundleFemaleWages) || 0,
        driverWages: parseFloat(newBundleDriverWages) || 0,
        timeRange: newBundleTimeRange || '',
        location: newBundleLocation || '',
        driverId: newBundleDriverId || null,
        vehicleSkills: newBundleVehicleSkills || [],
        availabilityStatus: newBundleAvailabilityStatus || 'Available',
        availabilityDate: newBundleAvailabilityDate || '',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, `services/${farmWorkersService.id}/bundles`), bundleData);
      setNewBundleName('');
      setNewBundleMaleWorkers('0');
      setNewBundleFemaleWorkers('0');
      setNewBundlePrice('');
      setNewBundleDriverId('');
      setNewBundleVehicleSkills([]);
      setNewBundleMaleWages('');
      setNewBundleFemaleWages('');
      setNewBundleDriverWages('');
      setNewBundleTimeRange('');
      setNewBundleLocation('');
      setNewBundleAvailabilityStatus('Available');
      setNewBundleAvailabilityDate('');
      alert('Bundle added successfully!');
    } catch (err) {
      console.error('Error adding bundle:', err);
      setError(`Error adding bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


const handleEditBundle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm Workers service not found');
      const bundleRef = doc(db, `services/${farmWorkersService.id}/bundles`, currentBundle.id);
      await updateDoc(bundleRef, {
        name: editBundleName,
        maleWorkers: parseInt(editBundleMaleWorkers) || 0,
        femaleWorkers: parseInt(editBundleFemaleWorkers) || 0,
        price: parseFloat(editBundlePrice) || 0,
        maleWages: parseFloat(editBundleMaleWages) || 0,
        femaleWages: parseFloat(editBundleFemaleWages) || 0,
        driverWages: parseFloat(editBundleDriverWages) || 0,
        timeRange: editBundleTimeRange || '',
        location: editBundleLocation || '',
        driverId: editBundleDriverId || null,
        vehicleSkills: editBundleVehicleSkills || [],
        availabilityStatus: editBundleAvailabilityStatus || 'Available',
        availabilityDate: editBundleAvailabilityDate || '',
        updatedAt: serverTimestamp(),
      });
      setShowEditBundleModal(false);
      setCurrentBundle(null);
      setEditBundleAvailabilityStatus('Available');
      setEditBundleAvailabilityDate('');
      alert('Bundle updated successfully!');
    } catch (err) {
      setError(`Error updating bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm Workers service not found');
      await deleteDoc(doc(db, `services/${farmWorkersService.id}/bundles`, bundleId));
      alert('Bundle deleted successfully!');
    } catch (err) {
      setError(`Error deleting bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) throw new Error('Order not found');
      const orderData = orderDoc.data();
      if (orderData.status !== 'pending') {
        throw new Error('Order cannot be accepted in its current state');
      }
      await updateDoc(orderRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      alert('Order accepted successfully!');
    } catch (err) {
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
      if (!orderDoc.exists()) throw new Error('Order not found');
      const orderData = orderDoc.data();
      if (orderData.status !== 'pending') {
        throw new Error('Order cannot be rejected in its current state');
      }
      await updateDoc(orderRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      alert('Order rejected successfully!');
    } catch (err) {
      setError(`Error rejecting order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWorker = async (workerId) => {
    setLoading(true);
    try {
      const workerRef = doc(db, 'users', workerId);
      const workerDoc = await getDoc(workerRef);
      if (!workerDoc.exists()) throw new Error('Worker not found');
      const workerData = workerDoc.data();
      await updateDoc(workerRef, {
        status: 'approved',
        workerStatus: 'ready',
        updatedAt: serverTimestamp(),
        name: workerData.name || '',
        skills: workerData.skills || [],
        availability: workerData.availability || { workingDays: [], offDays: [] },
        pincode: workerData.pincode || '',
        gender: workerData.gender || '',
      });
      alert('Worker approved!');
    } catch (err) {
      setError(`Error approving worker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWorker = async (workerId) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', workerId), {
        status: 'rejected',
        workerStatus: 'ready',
        updatedAt: serverTimestamp(),
      });
      alert('Worker rejected!');
    } catch (err) {
      setError(`Error rejecting worker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

const autoAssignWorkers = async (orderId, order) => {
  setLoading(true);
  try {
    const farmerDoc = await getDoc(doc(db, 'users', order.farmerId));
    if (!farmerDoc.exists()) throw new Error('शेतकरी सापडला नाही');
    const farmerData = farmerDoc.data();
    const farmerPincode = farmerData.pincode || '';

    let workerIds = [];
    if (!order.startDate) throw new Error('ऑर्डर प्रारंभ तारीख गहाळ आहे');
    const { maleNeeded, femaleNeeded, totalNeeded } = calculateWorkersNeeded(order);
    const attemptedWorkers = order.attemptedWorkers || [];

    if (order.serviceType === 'farm-workers') {
      if (maleNeeded > 0) {
        const availableMaleWorkers = workers
          .filter((w) =>
            w.gender === 'male' &&
            w.status === 'approved' &&
            w.workerStatus === 'ready' &&
            w.skills.includes('farm-worker') &&
            (!farmerPincode || w.pincode === farmerPincode) &&
            !attemptedWorkers.includes(w.id) &&
            isWorkerAvailable(w, order.startDate)
          )
          .map((w) => w.id);

        if (availableMaleWorkers.length < maleNeeded) {
          throw new Error(`फक्त ${availableMaleWorkers.length} पुरुष कामगार उपलब्ध, ${maleNeeded} आवश्यक आहेत`);
        }
        workerIds.push(...availableMaleWorkers.slice(0, maleNeeded));
      }

      if (femaleNeeded > 0) {
        const availableFemaleWorkers = workers
          .filter((w) =>
            w.gender === 'female' &&
            w.status === 'approved' &&
            w.workerStatus === 'ready' &&
            w.skills.includes('farm-worker') &&
            (!farmerPincode || w.pincode === farmerPincode) &&
            !attemptedWorkers.includes(w.id) &&
            isWorkerAvailable(w, order.startDate)
          )
          .map((w) => w.id);

        if (availableFemaleWorkers.length < femaleNeeded) {
          throw new Error(`फक्त ${availableFemaleWorkers.length} महिला कामगार उपलब्ध, ${femaleNeeded} आवश्यक आहेत`);
        }
        workerIds.push(...availableFemaleWorkers.slice(0, femaleNeeded));
      }
    } else {
      const skill = order.serviceType === 'ownertc' ? 'tractor-driver' : order.serviceType;
      const availableWorkers = workers
        .filter((w) =>
          w.status === 'approved' &&
          w.workerStatus === 'ready' &&
          w.skills.includes(skill) &&
          (!farmerPincode || w.pincode === farmerPincode) &&
          !attemptedWorkers.includes(w.id) &&
          isWorkerAvailable(w, order.startDate)
        )
        .map((w) => w.id);

      if (availableWorkers.length < totalNeeded) {
        throw new Error(`फक्त ${availableWorkers.length} कामगार उपलब्ध, ${totalNeeded} आवश्यक आहेत`);
      }
      workerIds = availableWorkers.slice(0, totalNeeded);
    }

    if (workerIds.length === 0) {
      throw new Error('योग्य कामगार सापडले नाहीत');
    }

    const orderRef = doc(db, 'orders', orderId);
    const existingWorkerIds = Array.isArray(order.workerId)
      ? order.workerId.filter((id) => {
          const wa = order.workerAcceptances?.find((wa) => wa.workerId === id);
          return wa?.status === 'accepted' || wa?.status === 'pending';
        })
      : order.accepted !== 'rejected' && order.workerId
      ? [order.workerId]
      : [];

    const existingAcceptances = Array.isArray(order.workerAcceptances)
      ? order.workerAcceptances.filter((wa) => wa.status === 'accepted' || wa.status === 'pending')
      : [];

    await updateDoc(orderRef, {
      workerId: [...existingWorkerIds, ...workerIds],
      status: 'pending',
      workerAcceptances: [
        ...existingAcceptances,
        ...workerIds.map((id) => ({ workerId: id, status: 'pending' }))
      ],
      timeout: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attemptedWorkers: [...attemptedWorkers, ...workerIds],
      updatedAt: serverTimestamp()
    });

    const farmerName = farmerData.name || 'शेतकरी';
    const totalAssignedWorkers = (existingWorkerIds.length + workerIds.length) || 1;
    const earningsPerWorker = (order.cost || 0) / totalAssignedWorkers;
    const responseDeadline = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('mr-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    for (const workerId of workerIds) {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker || !worker.mobile) continue;

      await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${worker.mobile}`,
          contentSid: 'HXf7eda5046a6aa7ecf802fd6cff47ad7d',
          contentVariables: {
            "1": orderId.slice(0, 8),
            "2": farmerName,
            "3": order.serviceType,
            "4": `${maleNeeded + femaleNeeded || totalNeeded}`,
            "5": `${order.serviceType === 'farm-workers' ? maleNeeded : totalNeeded}`,
            "6": `${order.serviceType === 'farm-workers' ? femaleNeeded : 0}`,
            "7": order.startDate || 'प्रदान केले नाही',
            "8": order.address || 'प्रदान केले नाही',
            "9": `₹${earningsPerWorker.toFixed(2)}`,
            "10": 'https://khetisathi.com/worker-dashboard',
            "11":'https://khetisathi.com/worker-dashboard',
            "12": responseDeadline
          }
        })
      });
    }

    alert(`${workerIds.length} कामगार यशस्वीपणे नियुक्त केले! सूचना पाठवल्या गेल्या.`);
  } catch (err) {
    setError(`कामगार नियुक्त करण्यात त्रुटी: ${err.message}`);
  } finally {
    setLoading(false);
  }
};


const handleAssignWorker = async (orderId, workerIds) => {
  if (!workerIds || workerIds.length === 0) {
    setError('कृपया किमान एक कामगार निवडा.');
    return;
  }

  setLoading(true);
  try {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('ऑर्डर सापडली नाही');

    const farmerDoc = await getDoc(doc(db, 'users', order.farmerId));
    if (!farmerDoc.exists()) throw new Error('शेतकरी सापडला नाही');
    const farmerData = farmerDoc.data();

    const orderRef = doc(db, 'orders', orderId);
    const existingWorkerIds = Array.isArray(order.workerId)
      ? order.workerId.filter((id) => {
          const wa = order.workerAcceptances?.find((wa) => wa.workerId === id);
          return wa?.status === 'accepted' || wa?.status === 'pending';
        })
      : order.accepted !== 'rejected' && order.workerId
      ? [order.workerId]
      : [];

    const existingAcceptances = Array.isArray(order.workerAcceptances)
      ? order.workerAcceptances.filter((wa) => wa.status === 'accepted' || wa.status === 'pending')
      : [];

    await updateDoc(orderRef, {
      workerId: [...existingWorkerIds, ...workerIds],
      status: 'pending',
      workerAcceptances: [
        ...existingAcceptances,
        ...workerIds.map((id) => ({ workerId: id, status: 'pending' }))
      ],
      timeout: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attemptedWorkers: [...(order.attemptedWorkers || []), ...workerIds],
      updatedAt: serverTimestamp()
    });

    const farmerName = farmerData.name || 'शेतकरी';
    const totalAssignedWorkers = (existingWorkerIds.length + workerIds.length) || 1;
    const earningsPerWorker = (order.cost || 0) / totalAssignedWorkers;
    const responseDeadline = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('mr-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const maleAssigned = workerIds.reduce((count, id) => {
      const worker = workers.find((w) => w.id === id);
      return worker?.gender === 'male' ? count + 1 : count;
    }, 0);

    const femaleAssigned = workerIds.length - maleAssigned;

    for (const workerId of workerIds) {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker || !worker.mobile) continue;

      await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${worker.mobile}`,
          contentSid: 'HXf7eda5046a6aa7ecf802fd6cff47ad7d',
          contentVariables: {
            "1": orderId.slice(0, 8),
            "2": farmerName,
            "3": order.serviceType,
            "4": `${workerIds.length}`,
            "5": `${maleAssigned}`,
            "6": `${femaleAssigned}`,
            "7": order.startDate || 'प्रदान केले नाही',
            "8": order.address || 'प्रदान केले नाही',
            "9": `₹${earningsPerWorker.toFixed(2)}`,
            "10": 'https://khetisathi.com/worker-dashboard',
            "11":'https://khetisathi.com/worker-dashboard',
            "12":responseDeadline
          }
        })
      });
    }

    setShowAssignModal(false);
    setSelectedMaleWorkers([]);
    setSelectedFemaleWorkers([]);
    setSelectedWorkers([]);
    alert(`${workerIds.length} कामगार यशस्वीपणे नियुक्त केले! सूचना पाठवल्या गेल्या.`);
  } catch (err) {
    setError(`कामगार नियुक्त करण्यात त्रुटी: ${err.message}`);
  } finally {
    setLoading(false);
  }
};


const handleAssignDriver = async (orderId, driverIds) => {
  if (!driverIds || driverIds.length === 0) {
    setError('कृपया किमान एक ड्रायव्हर निवडा.');
    return;
  }
  setLoading(true);
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('ऑर्डर सापडली नाही');
    const orderData = orderDoc.data();

    const existingDriverIds = Array.isArray(orderData.driverId)
      ? orderData.driverId.filter((id) => {
          const da = orderData.driverAcceptances?.find((da) => da.driverId === id);
          return da?.status === 'accepted' || da?.status === 'pending';
        })
      : [];

    const existingAcceptances = Array.isArray(orderData.driverAcceptances)
      ? orderData.driverAcceptances.filter((da) => da.status === 'accepted' || da.status === 'pending')
      : [];

    await updateDoc(orderRef, {
      driverId: [...existingDriverIds, ...driverIds],
      driverAcceptances: [
        ...existingAcceptances,
        ...driverIds.map((id) => ({ driverId: id, status: 'pending' })),
      ],
      timeout: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attemptedDrivers: [...(orderData.attemptedDrivers || []), ...driverIds],
      updatedAt: serverTimestamp(),
    });

    const farmerName = users[orderData.farmerId]?.name || 'शेतकरी';
    for (const driverId of driverIds) {
      const driver = workers.find((w) => w.id === driverId);
      if (!driver || !driver.mobile) continue;

      const message = `🔔 खेतीसाथीवर नवीन ड्रायव्हर नियुक्ती! 🚜\n\n` +
        `तुम्हाला ऑर्डरसाठी ड्रायव्हर म्हणून नियुक्त केले गेले आहे. कृपया 10 मिनिटांत प्रतिसाद द्या!\n\n` +
        `• 📋 ऑर्डर आयडी: ${orderId.slice(0, 8)}\n` +
        `• 👨‍🌾 शेतकरी: ${farmerName}\n` +
        `• 📅 प्रारंभ तारीख: ${orderData.startDate || 'प्रदान केले नाही'}\n` +
        `• 📍 पत्ता: ${orderData.address || 'प्रदान केले नाही'}\n` +
        `• 🚗 वाहन: ${driver.vehicleSkills.join(', ')}\n\n` +
        `📲 खालील लिंकवर क्लिक करून प्रतिसाद द्या:\n` +
        `✅ स्वीकारा: https://khetisathi.com/driver-dashboard\n` +
        `❌ नाकारा: https://khetisathi.com/driver-dashboard\n\n` +
        `⏰ अंतिम मुदत: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}`;

      try {
        const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: `+91${driver.mobile}`,
            message,
          }),
        });

        if (!response.ok) {
          console.error(`WhatsApp failed for driver ${driverId}:`, await response.json());
        }
      } catch (err) {
        console.error(`Error sending WhatsApp to driver ${driverId}:`, err);
      }
    }

    setShowAssignDriverModal(false);
    alert(`${driverIds.length} ड्रायव्हर यशस्वीपणे नियुक्त केले! सूचना पाठवल्या गेल्या.`);
  } catch (err) {
    setError(`ड्रायव्हर नियुक्त करण्यात त्रुटी: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const openAssignDriverModal = (order) => {
    setCurrentOrderForDriver(order);
    setShowAssignDriverModal(true);
  };

  const handleProcessPayment = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: { status: 'Paid', timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
      });
      alert('Payment processed successfully!');
    } catch (err) {
      setError(`Error processing payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (order) => {
    setCurrentOrder(order);
    setSelectedMaleWorkers([]);
    setSelectedFemaleWorkers([]);
    setSelectedWorkers([]);
    setShowAssignModal(true);
  };

  const openEditServiceModal = (service) => {
setCurrentService(service);
  setEditServiceName(service.name);
  setEditServiceType(service.type);
  setEditServiceCost(service.cost || '');
  setEditMaleCost(service.maleCost || '');
  setEditFemaleCost(service.femaleCost || '');
  setEditServiceImage(service.image || '');
  setEditPriceUnit(service.priceUnit || (service.type === 'ownertc' ? 'Per Hour' : service.type === 'fertilizer-applicator' ? 'Per Bag' : 'Per Acre'));
  setEditActiveStatus(service.activeStatus || false);
  setShowEditServiceModal(true);
  };

  const openEditBundleModal = (bundle) => {
    setCurrentBundle(bundle);
    setEditBundleName(bundle.name);
    setEditBundleMaleWorkers(bundle.maleWorkers.toString() || '0');
    setEditBundleFemaleWorkers(bundle.femaleWorkers.toString() || '0');
    setEditBundlePrice(bundle.price.toString() || '');
    setEditBundleDriverId(bundle.driverId || '');
    setEditBundleVehicleSkills(bundle.vehicleSkills || []);
    setEditBundleMaleWages(bundle.maleWages?.toString() || '');
    setEditBundleFemaleWages(bundle.femaleWages?.toString() || '');
    setEditBundleDriverWages(bundle.driverWages?.toString() || '');
    setEditBundleTimeRange(bundle.timeRange || '');
    setEditBundleLocation(bundle.location || '');
    setEditBundleAvailabilityStatus(bundle.availabilityStatus || 'Available');
    setEditBundleAvailabilityDate(bundle.availabilityDate || '');
    setShowEditBundleModal(true);
  };
  

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg shadow-lg">
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-green-700">KhetiSathi Admin Panel</h2>
          <button
            onClick={() => auth.signOut()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
        {loading && (
          <div className="bg-blue-100 text-blue-700 p-4 rounded-lg shadow-lg mb-6">
            <p>Loading...</p>
          </div>
        )}
        <Analytics orders={orders} workers={workers} />
        <DriverApproval/>
        <DriverAssignmentDashboard/>
        <UserManagement
          farmers={farmers}
          workers={workers}
          farmerSortConfig={farmerSortConfig}
          workerSortConfig={workerSortConfig}
          handleFarmerSort={handleFarmerSort}
          handleWorkerSort={handleWorkerSort}
          handleApproveWorker={handleApproveWorker}
          handleRejectWorker={handleRejectWorker}
          loading={loading}
        />
        <ServiceManagement
          services={services}
          newServiceName={newServiceName}
          setNewServiceName={setNewServiceName}
          newServiceType={newServiceType}
          setNewServiceType={setNewServiceType}
          newServiceCost={newServiceCost}
          setNewServiceCost={setNewServiceCost}
          newMaleCost={newMaleCost}
          setNewMaleCost={setNewMaleCost}
          newFemaleCost={newFemaleCost}
          setNewFemaleCost={setNewFemaleCost}
          newServiceImage={newServiceImage}
          setNewServiceImage={setNewServiceImage}
          handleAddService={handleAddService}
          handleDeleteService={handleDeleteService}
          openEditServiceModal={openEditServiceModal}
          showEditServiceModal={showEditServiceModal}
          currentService={currentService}
          editServiceName={editServiceName}
          setEditServiceName={setEditServiceName}
          editServiceType={editServiceType}
          setEditServiceType={setEditServiceType}
          editServiceCost={editServiceCost}
          setEditServiceCost={setEditServiceCost}
          editMaleCost={editMaleCost}
          setEditMaleCost={setEditMaleCost}
          editFemaleCost={editFemaleCost}
          setEditFemaleCost={setEditFemaleCost}
          editServiceImage={editServiceImage}
          setEditServiceImage={setEditServiceImage}
          handleEditService={handleEditService}
          setShowEditServiceModal={setShowEditServiceModal}
          loading={loading}
          newPriceUnit={newPriceUnit} // Added
  setNewPriceUnit={setNewPriceUnit} // Added
  newActiveStatus={newActiveStatus} // Added
  setNewActiveStatus={setNewActiveStatus} // Added
  editPriceUnit={editPriceUnit} // Added
  setEditPriceUnit={setEditPriceUnit} // Added
  editActiveStatus={editActiveStatus} // Added
  setEditActiveStatus={setEditActiveStatus} // Added

        />
        <BundleManagement
          bundles={bundles}
          drivers={drivers} // Pass drivers
          newBundleName={newBundleName}
          setNewBundleName={setNewBundleName}
          newBundleMaleWorkers={newBundleMaleWorkers}
          setNewBundleMaleWorkers={setNewBundleMaleWorkers}
          newBundleFemaleWorkers={newBundleFemaleWorkers}
          setNewBundleFemaleWorkers={setNewBundleFemaleWorkers}
          newBundlePrice={newBundlePrice}
          setNewBundlePrice={setNewBundlePrice}
          handleAddBundle={handleAddBundle}
          handleDeleteBundle={handleDeleteBundle}
          openEditBundleModal={openEditBundleModal}
          showEditBundleModal={showEditBundleModal}
          currentBundle={currentBundle}
          editBundleName={editBundleName}
          setEditBundleName={setEditBundleName}
          editBundleMaleWorkers={editBundleMaleWorkers}
          setEditBundleMaleWorkers={setEditBundleMaleWorkers}
          editBundleFemaleWorkers={editBundleFemaleWorkers}
          setEditBundleFemaleWorkers={setEditBundleFemaleWorkers}
          editBundlePrice={editBundlePrice}
          setEditBundlePrice={setEditBundlePrice}
          handleEditBundle={handleEditBundle}
          setShowEditBundleModal={setShowEditBundleModal}
          loading={loading}
          workers={workers}
          newBundleDriverId={newBundleDriverId}
          setNewBundleDriverId={setNewBundleDriverId}
          newBundleVehicleSkills={newBundleVehicleSkills}
          setNewBundleVehicleSkills={setNewBundleVehicleSkills}
          editBundleDriverId={editBundleDriverId}
          setEditBundleDriverId={setEditBundleDriverId}
          editBundleVehicleSkills={editBundleVehicleSkills}
          setEditBundleVehicleSkills={setEditBundleVehicleSkills}
          newBundleMaleWages={newBundleMaleWages}
          setNewBundleMaleWages={setNewBundleMaleWages}
          newBundleFemaleWages={newBundleFemaleWages}
          setNewBundleFemaleWages={setNewBundleFemaleWages}
          newBundleDriverWages={newBundleDriverWages}
          setNewBundleDriverWages={setNewBundleDriverWages}
          newBundleTimeRange={newBundleTimeRange}
          setNewBundleTimeRange={setNewBundleTimeRange}
          newBundleLocation={newBundleLocation}
          setNewBundleLocation={setNewBundleLocation}
          editBundleMaleWages={editBundleMaleWages}
          setEditBundleMaleWages={setEditBundleMaleWages}
          editBundleFemaleWages={editBundleFemaleWages}
          setEditBundleFemaleWages={setEditBundleFemaleWages}
          editBundleDriverWages={editBundleDriverWages}
          setEditBundleDriverWages={setEditBundleDriverWages}
          editBundleTimeRange={editBundleTimeRange}
          setEditBundleTimeRange={setEditBundleTimeRange}
          editBundleLocation={editBundleLocation}
          setEditBundleLocation={setEditBundleLocation}
          newBundleAvailabilityStatus={newBundleAvailabilityStatus}
          setNewBundleAvailabilityStatus={setNewBundleAvailabilityStatus}
          newBundleAvailabilityDate={newBundleAvailabilityDate}
          setNewBundleAvailabilityDate={setNewBundleAvailabilityDate}
          editBundleAvailabilityStatus={editBundleAvailabilityStatus}
          setEditBundleAvailabilityStatus={setEditBundleAvailabilityStatus}
          editBundleAvailabilityDate={editBundleAvailabilityDate}
          setEditBundleAvailabilityDate={setEditBundleAvailabilityDate}
        />
<OrderManagement
          orders={orders}
          services={services}
          users={users}
          workers={workers}
          sortConfig={sortConfig}
          handleSort={handleSort}
          calculateWorkersNeeded={calculateWorkersNeeded}
          handleAcceptOrder={handleAcceptOrder}
          handleRejectOrder={handleRejectOrder}
          autoAssignWorkers={autoAssignWorkers}
          handleProcessPayment={handleProcessPayment}
          openAssignModal={openAssignModal}
          showAssignModal={showAssignModal}
          currentOrder={currentOrder}
          setShowAssignModal={setShowAssignModal}
          selectedMaleWorkers={selectedMaleWorkers}
          setSelectedMaleWorkers={setSelectedMaleWorkers}
          selectedFemaleWorkers={selectedFemaleWorkers}
          setSelectedFemaleWorkers={setSelectedFemaleWorkers}
          selectedWorkers={selectedWorkers}
          setSelectedWorkers={setSelectedWorkers}
          handleAssignWorker={handleAssignWorker}
          isWorkerAvailable={isWorkerAvailable}
          openAssignDriverModal={openAssignDriverModal}
          showAssignDriverModal={showAssignDriverModal}
          currentOrderForDriver={currentOrderForDriver}
          setShowAssignDriverModal={setShowAssignDriverModal}
          handleAssignDriver={handleAssignDriver}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
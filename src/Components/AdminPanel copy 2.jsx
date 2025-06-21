import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, getDoc, getDocs, doc, updateDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
        };
      }
    }, (err) => setError(`Authentication error: ${err.message}`));

    return () => unsubscribeAuth();
  }, [users]);

  const isWorkerAvailable = (worker, date) => {
    if (!worker.availability) return true;
    if (!worker.availability.workingDays && !worker.availability.offDays) return true;
    if (worker.availability.offDays?.includes(date)) return false;
    if (!worker.availability.workingDays) return true;
    return worker.availability.workingDays.includes(date);
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) throw new Error('Order not found');
      const orderData = orderDoc.data();
      if (orderData.status !== 'pending' || (orderData.workerId && orderData.workerId.length > 0)) {
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
      if (orderData.status !== 'pending' || (orderData.workerId && orderData.workerId.length > 0)) {
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

const autoAssignWorkers = async (orderId, order) => {
  setLoading(true);
  try {
    const farmerDoc = await getDoc(doc(db, 'users', order.farmerId));
    if (!farmerDoc.exists()) throw new Error('Farmer not found');
    const farmerData = farmerDoc.data();
    const farmerPincode = farmerData.pincode;

    let workerIds = [];
    if (!order.startDate) throw new Error('Order start date is missing');

    if (order.serviceType === 'farm-workers') {
      const maleWorkersNeeded = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
      const femaleWorkersNeeded = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
      const attemptedWorkers = order.attemptedWorkers || [];

      if (maleWorkersNeeded > 0) {
        const availableMaleWorkers = workers
          .filter(
            (w) =>
              w.gender === 'male' &&
              w.status === 'approved' &&
              w.workerStatus === 'ready' &&
              w.skills.includes('farm-worker') &&
              !attemptedWorkers.includes(w.id) &&
              isWorkerAvailable(w, order.startDate)
          )
          .map((w) => ({
            id: w.id,
            pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false,
          }))
          .sort((a, b) => (a.pincodeMatch && !b.pincodeMatch ? -1 : !a.pincodeMatch && b.pincodeMatch ? 1 : 0));

        if (availableMaleWorkers.length < maleWorkersNeeded) {
          throw new Error(`Only ${availableMaleWorkers.length} male workers available, need ${maleWorkersNeeded}`);
        }
        workerIds.push(...availableMaleWorkers.slice(0, maleWorkersNeeded).map((w) => w.id));
      }

      if (femaleWorkersNeeded > 0) {
        const availableFemaleWorkers = workers
          .filter(
            (w) =>
              w.gender === 'female' &&
              w.status === 'approved' &&
              w.workerStatus === 'ready' &&
              w.skills.includes('farm-worker') &&
              !attemptedWorkers.includes(w.id) &&
              isWorkerAvailable(w, order.startDate)
          )
          .map((w) => ({
            id: w.id,
            pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false,
          }))
          .sort((a, b) => (a.pincodeMatch && !b.pincodeMatch ? -1 : !a.pincodeMatch && b.pincodeMatch ? 1 : 0));

        if (availableFemaleWorkers.length < femaleWorkersNeeded) {
          throw new Error(`Only ${availableFemaleWorkers.length} female workers available, need ${femaleWorkersNeeded}`);
        }
        workerIds.push(...availableFemaleWorkers.slice(0, femaleWorkersNeeded).map((w) => w.id));
      }
    } else {
      const skill = order.serviceType === 'tractor-drivers' ? 'tractor-driver' : order.serviceType;
      const workersNeeded = order.totalWorkers || 1;
      const attemptedWorkers = order.attemptedWorkers || [];

      const availableWorkers = workers
        .filter(
          (w) =>
            w.status === 'approved' &&
            w.workerStatus === 'ready' &&
            w.skills.includes(skill) &&
            !attemptedWorkers.includes(w.id) &&
            isWorkerAvailable(w, order.startDate)
        )
        .map((w) => ({
          id: w.id,
          pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false,
        }))
        .sort((a, b) => (a.pincodeMatch && !b.pincodeMatch ? -1 : !a.pincodeMatch && b.pincodeMatch ? 1 : 0));

      if (availableWorkers.length < workersNeeded) {
        throw new Error(`Only ${availableWorkers.length} workers available, need ${workersNeeded}`);
      }
      workerIds = availableWorkers.slice(0, workersNeeded).map((w) => w.id);
    }

    if (workerIds.length === 0) throw new Error('No suitable workers found');

    await updateDoc(doc(db, 'orders', orderId), {
      workerId: workerIds,
      status: 'pending',
      accepted: 'pending',
      timeout: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      attemptedWorkers: [...(order.attemptedWorkers || []), ...workerIds],
    });

    // WhatsApp Message Logic
    const farmerName = farmerData.name || 'Farmer';
    const earningsPerWorker = (order.cost || 0) / workerIds.length;
    let totalWorkersMessage = `👥 Total Workers: ${order.totalWorkers || workerIds.length}`;
    if (order.serviceType === 'farm-workers') {
      const maleCount = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
      const femaleCount = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
      totalWorkersMessage += ` (👨 ${maleCount}, 👩 ${femaleCount})`;
    }

    for (const workerId of workerIds) {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker || !worker.mobile) continue;

      const message = `🔔 New Order Assignment on KhetiSathi! 🚜\n\n` +
        `You have been assigned to a new order. Please respond within 2 minutes!\n\n` +
        `• 📋 Order ID: ${orderId.slice(0, 8)}\n` +
        `• 👨‍🌾 Farmer: ${farmerName}\n` +
        `• 🛠️ Service: ${order.serviceType}\n` +
        `${totalWorkersMessage}\n` +
        `• 📅 Start Date: ${order.startDate || 'N/A'}\n` +
        `• 📍 Address: ${order.address || 'N/A'}\n` +
        `• 💰 Your Earnings: ₹${earningsPerWorker.toFixed(2)}\n\n` +
        `📲 Click below to respond:\n` +
        `✅ Accept: https://yourdomain.com/worker-response?orderId=${orderId}&workerId=${worker.id}&response=accept\n` +
        `❌ Reject: https://yourdomain.com/worker-response?orderId=${orderId}&workerId=${worker.id}&response=reject\n\n` +
        `⏰ Deadline: ${new Date(Date.now() + 2 * 60 * 1000).toLocaleTimeString()}`;

      try {
        const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: `+91${worker.mobile}`,
            message,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`WhatsApp failed for ${worker.id}:`, errorData);
        }
      } catch (err) {
        console.error(`Error sending WhatsApp to ${worker.id}:`, err);
      }
    }

    alert(`Assigned ${workerIds.length} worker(s) successfully! Notifications sent.`);
  } catch (err) {
    setError(`Error assigning workers: ${err.message}`);
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

  const handleAssignWorker = async (orderId, workerIds) => {
    if (!workerIds || workerIds.length === 0) {
      setError('Please select at least one worker.');
      return;
    }
    setLoading(true);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      const attemptedWorkers = order.attemptedWorkers || [];

      if (order.serviceType === 'farm-workers') {
        const maleWorkersNeeded = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
        const femaleWorkersNeeded = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
        const selectedWorkers = workers.filter((w) => workerIds.includes(w.id));

        const maleCount = selectedWorkers.filter((w) => w.gender === 'male').length;
        const femaleCount = selectedWorkers.filter((w) => w.gender === 'female').length;

        if (maleCount !== maleWorkersNeeded || femaleCount !== femaleWorkersNeeded) {
          throw new Error(`Must select exactly ${maleWorkersNeeded} male and ${femaleWorkersNeeded} female workers.`);
        }

        if (
          !selectedWorkers.every(
            (w) =>
              w.status === 'approved' &&
              w.workerStatus === 'ready' &&
              w.skills.includes('farm-worker') &&
              isWorkerAvailable(w, order.startDate)
          )
        ) {
          throw new Error('Selected workers must be approved, ready, have farm-worker skills, and be available.');
        }
      } else {
        const workersNeeded = order.totalWorkers || 1;
        if (workerIds.length !== workersNeeded) {
          throw new Error(`Must select exactly ${workersNeeded} worker(s) for this service.`);
        }
        const selectedWorkers = workers.filter((w) => workerIds.includes(w.id));
        const skill = order.serviceType === 'tractor-drivers' ? 'tractor-driver' : order.serviceType;
        if (
          !selectedWorkers.every(
            (w) =>
              w.status === 'approved' &&
              w.workerStatus === 'ready' &&
              w.skills.includes(skill) &&
              isWorkerAvailable(w, order.startDate)
          )
        ) {
          throw new Error('Selected workers must be approved, ready, have the required skill, and be available.');
        }
      }

      await updateDoc(doc(db, 'orders', orderId), {
        workerId: workerIds,
        status: 'pending',
        accepted: 'pending',
        timeout: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Set to 10 minutes
        attemptedWorkers: [...attemptedWorkers, ...workerIds],
      });

      // Calculate earnings per worker
      const earningsPerWorker = (order.cost || 0) / workerIds.length;

      // Send WhatsApp message to each worker
      for (const workerId of workerIds) {
        const worker = workers.find((w) => w.id === workerId);
        if (!worker || !worker.mobile) {
          console.warn(`Worker ${workerId} does not have a phone number. Skipping WhatsApp notification.`);
          continue;
        }

        const farmerName = users[order.farmerId]?.name || 'Farmer';
        let totalWorkersMessage = `👥 Total Workers: ${order.totalWorkers}`;
        if (order.serviceType === 'farm-workers') {
          const maleCount = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
          const femaleCount = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
          totalWorkersMessage += ` (👨 ${maleCount}, 👩 ${femaleCount})`;
        }

        const message = `🔔 New Order Assignment on KhetiSathi! 🚜\n\n` +
                        `You have been assigned to a new order. Please respond within 10 minutes!\n\n` +
                        `• 📋 Order ID: ${orderId.slice(0, 8)}\n` +
                        `• 👨‍🌾 Farmer: ${farmerName}\n` +
                        `• 🛠️ Service: ${order.serviceType}\n` +
                        totalWorkersMessage + `\n` +
                        `• 📅 Start Date: ${order.startDate || 'N/A'}\n` +
                        `• 📍 Address: ${order.address || 'N/A'}\n` +
                        `• 💰 Your Earnings: ₹${earningsPerWorker.toFixed(2)}\n\n` +
`📲 Click below to respond:\n` +
`✅ Accept Order: https://yourdomain.com/worker-response?orderId=${orderId}&workerId=${worker.id}&response=accept\n` +
`❌ Reject Order: https://yourdomain.com/worker-response?orderId=${orderId}&workerId=${worker.id}&response=reject\n\n` +
                        `⏰ Deadline: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()}`;

        try {
          const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            to: `+91${worker.mobile}`,
            message: message,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to send WhatsApp notification to worker ${workerId}:`, errorData);
          }
        } catch (notificationErr) {
          console.error(`Error sending WhatsApp notification to worker ${workerId}:`, notificationErr);
        }
      }

      alert(`Assigned ${workerIds.length} worker(s)! Notifications sent.`);
      setShowAssignModal(false);
      setSelectedMaleWorkers([]);
      setSelectedFemaleWorkers([]);
      setSelectedWorkers([]);
    } catch (err) {
      setError(`Error assigning worker(s): ${err.message}`);
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

  const handleAddService = async (e) => {
    e.preventDefault();
    if (
      !newServiceName ||
      !newServiceType ||
      (newServiceType === 'farm-workers' && (!newMaleCost || !newFemaleCost)) ||
      (newServiceType !== 'farm-workers' && !newServiceCost)
    ) {
      setError('Please fill all required fields with valid values.');
      return;
    }
    setLoading(true);
    try {
      const serviceData = {
        name: newServiceName,
        type: newServiceType,
        image:
          newServiceImage ||
          'https://images.unsplash.com/photo-1500595046743-ddf4d3d753dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        createdAt: serverTimestamp(),
      };
      if (newServiceType === 'farm-workers') {
        const maleCost = parseFloat(newMaleCost);
        const femaleCost = parseFloat(newFemaleCost);
        if (isNaN(maleCost) || maleCost < 0 || isNaN(femaleCost) || femaleCost < 0) {
          throw new Error('Male and female costs must be valid non-negative numbers.');
        }
        serviceData.maleCost = maleCost;
        serviceData.femaleCost = femaleCost;
      } else {
        const cost = parseFloat(newServiceCost);
        if (isNaN(cost) || cost < 0) {
          throw new Error('Cost must be a valid non-negative number.');
        }
        serviceData.cost = cost;
      }
      await addDoc(collection(db, 'services'), serviceData);
      setNewServiceName('');
      setNewServiceType('');
      setNewServiceCost('');
      setNewMaleCost('');
      setNewFemaleCost('');
      setNewServiceImage('');
      alert('Service added successfully!');
    } catch (err) {
      setError(`Error adding service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (e) => {
    e.preventDefault();
    if (
      !currentService ||
      !editServiceName ||
      !editServiceType ||
      (editServiceType === 'farm-workers' && (!editMaleCost || !editFemaleCost)) ||
      (editServiceType !== 'farm-workers' && !editServiceCost)
    ) {
      setError('Please fill all required fields with valid values.');
      return;
    }
    setLoading(true);
    try {
      const serviceRef = doc(db, 'services', currentService.id);
      const serviceData = {
        name: editServiceName,
        type: editServiceType,
        image:
          editServiceImage ||
          'https://images.unsplash.com/photo-1500595046743-ddf4d3d753dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        updatedAt: serverTimestamp(),
      };

      if (editServiceType === 'farm-workers') {
        const maleCost = parseFloat(editMaleCost);
        const femaleCost = parseFloat(editFemaleCost);
        if (isNaN(maleCost) || maleCost < 0 || isNaN(femaleCost) || femaleCost < 0) {
          throw new Error('Male and female costs must be valid non-negative numbers.');
        }
        serviceData.maleCost = maleCost;
        serviceData.femaleCost = femaleCost;
      } else {
        const cost = parseFloat(editServiceCost);
        if (isNaN(cost) || cost < 0) {
          throw new Error('Service cost must be a valid non-negative number.');
        }
        serviceData.cost = cost;
      }

      await updateDoc(serviceRef, serviceData);
      setShowEditServiceModal(false);
      setCurrentService(null);
      setEditServiceName('');
      setEditServiceType('');
      setEditServiceCost('');
      setEditMaleCost('');
      setEditFemaleCost('');
      setEditServiceImage('');
      alert('Service updated successfully!');
    } catch (err) {
      setError(`Error updating service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
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

  const openEditServiceModal = (service) => {
    setCurrentService(service);
    setEditServiceName(service.name || '');
    setEditServiceType(service.type || '');
    setEditServiceCost(service.cost ? service.cost.toString() : '');
    setEditMaleCost(service.maleCost ? service.maleCost.toString() : '');
    setEditFemaleCost(service.femaleCost ? service.femaleCost.toString() : '');
    setEditServiceImage(service.image || '');
    setShowEditServiceModal(true);
  };

  const handleAddBundle = async (e) => {
    e.preventDefault();
    if (!newBundleName || !newBundlePrice || parseInt(newBundleMaleWorkers) + parseInt(newBundleFemaleWorkers) === 0) {
      setError('Please fill all required fields and ensure at least one worker is included.');
      return;
    }
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm-workers service not found');
      await addDoc(collection(db, `services/${farmWorkersService.id}/bundles`), {
        name: newBundleName,
        maleWorkers: parseInt(newBundleMaleWorkers) || 0,
        femaleWorkers: parseInt(newBundleFemaleWorkers) || 0,
        price: parseFloat(newBundlePrice) || 0,
        createdAt: serverTimestamp(),
      });
      setNewBundleName('');
      setNewBundleMaleWorkers('0');
      setNewBundleFemaleWorkers('0');
      setNewBundlePrice('');
      alert('Bundle added successfully!');
    } catch (err) {
      setError(`Error adding bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBundle = async (e) => {
    e.preventDefault();
    if (
      !currentBundle ||
      !editBundleName ||
      !editBundlePrice ||
      parseInt(editBundleMaleWorkers) + parseInt(editBundleFemaleWorkers) === 0
    ) {
      setError('Please fill all required fields and ensure at least one worker is included.');
      return;
    }
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm-workers service not found');
      const bundleRef = doc(db, `services/${farmWorkersService.id}/bundles`, currentBundle.id);
      await updateDoc(bundleRef, {
        name: editBundleName,
        maleWorkers: parseInt(editBundleMaleWorkers) || 0,
        femaleWorkers: parseInt(editBundleFemaleWorkers) || 0,
        price: parseFloat(editBundlePrice) || 0,
        updatedAt: serverTimestamp(),
      });
      setShowEditBundleModal(false);
      setCurrentBundle(null);
      setEditBundleName('');
      setEditBundleMaleWorkers('0');
      setEditBundleFemaleWorkers('0');
      setEditBundlePrice('');
      alert('Bundle updated successfully!');
    } catch (err) {
      setError(`Error updating bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;
    setLoading(true);
    try {
      const farmWorkersService = services.find((s) => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm-workers service not found');
      await deleteDoc(doc(db, `services/${farmWorkersService.id}/bundles`, bundleId));
      alert('Bundle deleted successfully!');
    } catch (err) {
      setError(`Error deleting bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditBundleModal = (bundle) => {
    setCurrentBundle(bundle);
    setEditBundleName(bundle.name || '');
    setEditBundleMaleWorkers(bundle.maleWorkers ? bundle.maleWorkers.toString() : '0');
    setEditBundleFemaleWorkers(bundle.femaleWorkers ? bundle.femaleWorkers.toString() : '0');
    setEditBundlePrice(bundle.price ? bundle.price.toString() : '');
    setShowEditBundleModal(true);
  };

  const handleProcessPayment = async (orderId) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();
      await updateDoc(orderRef, {
        status: 'completed',
        paymentStatus: { method: orderData.paymentMethod || 'cash', status: 'paid' },
        completedAt: serverTimestamp(),
      });

      const workerIds = Array.isArray(orderData.workerId)
        ? orderData.workerId
        : orderData.workerId
        ? [orderData.workerId]
        : [];
      for (const workerId of workerIds) {
        await addDoc(collection(db, `users/${workerId}/earnings`), {
          orderId,
          serviceId: orderData.id,
          type: orderData.serviceType,
          cost: orderData.cost / (workerIds.length || 1),
          completedAt: serverTimestamp(),
          paymentMethod: orderData.paymentMethod || 'cash',
        });
      }
      alert('Payment processed and earnings recorded successfully!');
    } catch (err) {
      setError(`Error processing payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
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

  const handleFarmerSort = (key) => {
    setFarmerSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'farmerName') {
      aValue = users[a.farmerId]?.name || '';
      bValue = users[b.farmerId]?.name || '';
    } else if (sortConfig.key === 'workerName') {
      aValue = Array.isArray(a.workerId)
        ? a.workerId.map((id) => users[id]?.name || 'N/A').join(', ')
        : users[a.workerId]?.name || 'N/A';
      bValue = Array.isArray(b.workerId)
        ? b.workerId.map((id) => users[id]?.name || 'N/A').join(', ')
        : users[b.workerId]?.name || 'N/A';
    } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'completedAt') {
      aValue = aValue ? new Date(aValue.toDate()) : new Date(0);
      bValue = bValue ? new Date(bValue.toDate()) : new Date(0);
    } else if (sortConfig.key === 'paymentStatus') {
      aValue = a.paymentStatus ? `${a.paymentStatus.status} (${a.paymentStatus.method})` : 'Not Paid';
      bValue = b.paymentStatus ? `${b.paymentStatus.status} (${b.paymentStatus.method})` : 'Not Paid';
    } else if (sortConfig.key === 'cost') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }
    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const sortedWorkers = [...workers].sort((a, b) => {
    let aValue = a[workerSortConfig.key];
    let bValue = b[workerSortConfig.key];
    if (workerSortConfig.key === 'skills') {
      aValue = (a.skills || []).join(', ') || '';
      bValue = (b.skills || []).join(', ') || '';
    } else if (workerSortConfig.key === 'phone') {
      aValue = a.phone || '';
      bValue = b.phone || '';
    }
    aValue = aValue || '';
    bValue = bValue || '';
    return workerSortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  const sortedFarmers = [...farmers].sort((a, b) => {
    let aValue = a[farmerSortConfig.key];
    let bValue = b[farmerSortConfig.key];
    if (farmerSortConfig.key === 'phone') {
      aValue = a.phone || '';
      bValue = b.phone || '';
    }
    aValue = aValue || '';
    bValue = bValue || '';
    return farmerSortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  if (!adminUser || error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 text-center">{error || 'Please log in as admin.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
        <i className="fas fa-user-shield mr-2"></i> Admin Dashboard
      </h2>
      {error && <p className="text-red-600 mb-6 text-center">{error}</p>}

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold mb-2">Total Orders</h4>
            <p className="text-2xl text-green-600">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold mb-2">Active Workers</h4>
            <p className="text-2xl text-green-600">{workers.filter((w) => w.status === 'approved').length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold mb-2">Total Revenue</h4>
            <p className="text-2xl text-green-600">₹{orders.reduce((sum, o) => sum + (o.cost || 0), 0).toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Registered Users</h3>
        <div className="mb-6">
          <h4 className="text-xl font-semibold mb-4 text-gray-800">Farmers</h4>
          {farmers.length === 0 ? (
            <p className="text-center text-gray-600">No farmers registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-lg">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('name')}>
                      Name {farmerSortConfig.key === 'name' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('email')}>
                      Email {farmerSortConfig.key === 'email' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('phone')}>
                      Phone {farmerSortConfig.key === 'phone' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('pincode')}>
                      Pincode {farmerSortConfig.key === 'pincode' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFarmers.map((farmer) => (
                    <tr key={farmer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6">{farmer.name || 'N/A'}</td>
                      <td className="py-3 px-6">{farmer.email || 'N/A'}</td>
                      <td className="py-3 px-6">{farmer.mobile || 'N/A'}</td>
                      <td className="py-3 px-6">{farmer.pincode || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-800">Workers</h4>
          {workers.length === 0 ? (
            <p className="text-center text-gray-600">No workers registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-lg">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('name')}>
                      Name {workerSortConfig.key === 'name' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('email')}>
                      Email {workerSortConfig.key === 'email' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('phone')}>
                      Phone {workerSortConfig.key === 'phone' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('gender')}>
                      Gender {workerSortConfig.key === 'gender' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('skills')}>
                      Skills {workerSortConfig.key === 'skills' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('pincode')}>
                      Pincode {workerSortConfig.key === 'pincode' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('status')}>
                      Status {workerSortConfig.key === 'status' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('workerStatus')}>
                      Worker Status {workerSortConfig.key === 'workerStatus' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6">{worker.name || 'N/A'}</td>
                      <td className="py-3 px-6">{worker.email || 'N/A'}</td>
                      <td className="py-3 px-6">{worker.phone || 'N/A'}</td>
                      <td className="py-3 px-6">{worker.gender || 'N/A'}</td>
                      <td className="py-3 px-6">{(worker.skills || []).join(', ') || 'None'}</td>
                      <td className="py-3 px-6">{worker.pincode || 'N/A'}</td>
                      <td className="py-3 px-6">{worker.status || 'Pending'}</td>
                      <td className="py-3 px-6">{worker.workerStatus || 'Ready'}</td>
                      <td className="py-3 px-6">
                        {worker.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveWorker(worker.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWorker(worker.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-lg">
              <img src={s.image} alt={s.name} className="w-full h-32 object-cover rounded-t-lg" />
              <div className="p-6">
                <h4 className="text-lg font-semibold mb-2">{s.name}</h4>
                <p className="text-gray-600 mb-2">{s.type}</p>
                <p className={s.type === 'farm-workers' ? 'text-green-600 font-semibold' : 'text-green-600 font-bold'}>
                  {s.type === 'farm-workers'
                    ? `Male: ₹${s.maleCost || 0}/day, Female: ₹${s.femaleCost || 0}/day`
                    : `₹${s.cost || 0}${s.type === 'tractor-drivers' ? '/hour' : ''}`}
                </p>
                <div className="flex space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => openEditServiceModal(s)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddService} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700">Service Name:</label>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Service Type:</label>
              <select
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">Select Type</option>
                <option value="farm-workers">Farm Workers</option>
                <option value="tractor-drivers">Tractor Drivers</option>
                <option value="plowing">Plowing</option>
                <option value="harvesting">Harvesting</option>
                <option value="irrigation">Irrigation</option>
              </select>
            </div>
            {newServiceType === 'farm-workers' ? (
              <>
                <div>
                  <label className="block text-gray-700">Male Cost (₹/day):</label>
                  <input
                    type="number"
                    value={newMaleCost}
                    onChange={(e) => setNewMaleCost(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Female Cost (₹/day):</label>
                  <input
                    type="number"
                    value={newFemaleCost}
                    onChange={(e) => setNewFemaleCost(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-gray-700">Cost (₹/{newServiceType === 'tractor-drivers' ? 'hour' : 'job'}):</label>
                <input
                  type="number"
                  value={newServiceCost}
                  onChange={(e) => setNewServiceCost(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-gray-700">Image URL (optional):</label>
              <input
                type="text"
                value={newServiceImage}
                onChange={(e) => setNewServiceImage(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-full font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> Add Service
          </button>
        </form>
      </section>

      {showEditServiceModal && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Edit Service: {currentService.name}</h3>
            <form onSubmit={handleEditService}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700">Service Name:</label>
                  <input
                    type="text"
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Service Type:</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="farm-workers">Farm Workers</option>
                    <option value="tractor-drivers">Tractor Drivers</option>
                    <option value="plowing">Plowing</option>
                    <option value="harvesting">Harvesting</option>
                    <option value="irrigation">Irrigation</option>
                  </select>
                </div>
                {editServiceType === 'farm-workers' ? (
                  <>
                    <div>
                      <label className="block text-gray-700">Male Cost (₹/day):</label>
                      <input
                        type="number"
                        value={editMaleCost}
                        onChange={(e) => setEditMaleCost(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Female Cost (₹/day):</label>
                      <input
                        type="number"
                        value={editFemaleCost}
                        onChange={(e) => setEditFemaleCost(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-gray-700">
                      Cost (₹/{editServiceType === 'tractor-drivers' ? 'hour' : 'job'}):
                    </label>
                    <input
                      type="number"
                      value={editServiceCost}
                      onChange={(e) => setEditServiceCost(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-gray-700">Image URL (optional):</label>
                  <input
                    type="text"
                    value={editServiceImage}
                    onChange={(e) => setEditServiceImage(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditServiceModal(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Bundles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {bundles.map((b) => (
            <div key={b.id} className="bg-white rounded-lg shadow-lg p-4">
              <h4 className="text-lg font-semibold mb-2">{b.name}</h4>
              <p className="text-gray-600 mb-2">
                {b.maleWorkers} male + {b.femaleWorkers} female workers
              </p>
              <p className="text-green-600 font-bold">₹{b.price.toFixed(2)}</p>
              <div className="mt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => openEditBundleModal(b)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBundle(b.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddBundle} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700">Bundle Name:</label>
              <input
                type="text"
                value={newBundleName}
                onChange={(e) => setNewBundleName(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Male Workers:</label>
              <input
                type="number"
                value={newBundleMaleWorkers}
                onChange={(e) => setNewBundleMaleWorkers(e.target.value)}
                min="0"
                step="1"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Female Workers:</label>
              <input
                type="number"
                value={newBundleFemaleWorkers}
                onChange={(e) => setNewBundleFemaleWorkers(e.target.value)}
                min="0"
                step="1"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Price (₹):</label>
              <input
                type="number"
                value={newBundlePrice}
                onChange={(e) => setNewBundlePrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-full font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> Add Bundle
          </button>
        </form>
      </section>

      {showEditBundleModal && currentBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Edit Bundle: {currentBundle.name}</h3>
            <form onSubmit={handleEditBundle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700">Bundle Name:</label>
                  <input
                    type="text"
                    value={editBundleName}
                    onChange={(e) => setEditBundleName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Male Workers:</label>
                  <input
                    type="number"
                    value={editBundleMaleWorkers}
                    onChange={(e) => setEditBundleMaleWorkers(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Female Workers:</label>
                  <input
                    type="number"
                    value={editBundleFemaleWorkers}
                    onChange={(e) => setEditBundleFemaleWorkers(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Price (₹):</label>
                  <input
                    type="number"
                    value={editBundlePrice}
                    onChange={(e) => setEditBundlePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBundleModal(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<section className="mb-8">
  <h3 className="text-2xl font-semibold mb-6 text-green-700">All Orders</h3>
  {orders.length === 0 ? (
    <p className="text-center text-gray-600">No orders found.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-lg" style={{fontSize:'13px'}}>
        <thead className="bg-green-600 text-white">
          <tr>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('id')}>
              Order ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('farmerName')}>
              Farmer Name {sortConfig.key === 'farmerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('workerName')}>
              Worker Name(s) {sortConfig.key === 'workerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('serviceType')}>
              Service Type {sortConfig.key === 'serviceType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('cost')}>
              Cost {sortConfig.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('status')}>
              Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('createdAt')}>
              Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('completedAt')}>
              Completed At {sortConfig.key === 'completedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('paymentStatus')}>
              Payment Status {sortConfig.key === 'paymentStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-6 text-left">Order Approval</th>
            <th className="py-3 px-6 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => {
            return (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">{order.id.slice(0, 8)}</td>
                <td className="py-3 px-6">
                  {users[order.farmerId]?.name || 'N/A'} - 📞 {users[order.farmerId]?.mobile || 'N/A'}
                </td>
                <td className="py-3 px-6">
                  {Array.isArray(order.workerId) && order.workerId.length > 0 ? (
                    order.workerId.map((workerId, index) => {
                      // Find the worker's status from workerAcceptances
                      const workerStatusEntry = (order.workerAcceptances || []).find(
                        (entry) => entry.workerId === workerId
                      );
                      const workerStatus = workerStatusEntry ? workerStatusEntry.status : 'pending';

                      // Determine display for acceptance and completion
                      const acceptanceText =
                        workerStatus === 'accepted'
                          ? '✅ Accepted'
                          : workerStatus === 'rejected'
                          ? '❌ Rejected'
                          : workerStatus === 'completed'
                          ? '✅ Accepted' // If completed, they must have accepted
                          : '⏳ Pending';
                      const completionText = workerStatus === 'completed' ? '✅ Completed' : '⏳ Not Completed';

                      // Get worker's phone number
                      const workerPhone = users[workerId]?.mobile || 'N/A';

                      return (
                        <div key={workerId} className="mb-1" style={{fontSize:'12px'}}>
                          {users[workerId]?.name || 'N/A'} - 📞 {workerPhone}, {acceptanceText}, {completionText}
                          {index < order.workerId.length - 1 && <br />}
                        </div>
                      );
                    })
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="py-3 px-6">
                  {services.find((s) => s.id === order.serviceId)?.name || order.serviceType || 'N/A'}
                  {order.serviceType === 'farm-workers' && (
                    <span className="block text-sm text-gray-600">
                      {order.orderType === 'bundle'
                        ? `Bundle: ${order.bundleDetails?.name || 'N/A'} (${
                            order.bundleDetails?.maleWorkers || 0
                          } Male, ${order.bundleDetails?.femaleWorkers || 0} Female)`
                        : `(${order.maleWorkers || 0} Male, ${order.femaleWorkers || 0} Female)`}
                    </span>
                  )}
                  {order.serviceType === 'tractor-drivers' && (
                    <span className="block text-sm text-gray-600">{order.hours || 0} hours</span>
                  )}
                  {order.serviceType !== 'farm-workers' && (
                    <span className="block text-sm text-gray-600">{order.totalWorkers || 1} Worker(s)</span>
                  )}
                </td>
                <td className="py-3 px-6">₹{(order.cost || 0).toFixed(2)}</td>
                <td className="py-3 px-6">{order.status || 'N/A'}</td>
                <td className="py-3 px-6">
                  {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}
                </td>
                <td className="py-3 px-6">
                  {order.completedAt ? new Date(order.completedAt.toDate()).toLocaleString() : 'N/A'}
                </td>
                <td className="py-3 px-6">{order.paymentStatus?.status || 'Not Paid'}</td>
                <td className="py-3 px-6">
                  {order.status === 'pending' && !order.workerId && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                        disabled={loading}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-3 px-6">
                  {order.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => autoAssignWorkers(order.id, order)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        disabled={loading}
                      >
                        Auto Assign
                      </button>
                      <button
                        onClick={() => openAssignModal(order)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                        disabled={loading}
                      >
                        Manual Assign
                      </button>
                    </div>
                  )}
                  {order.status === 'assigned' && !order.paymentStatus && (
                    <button
                      onClick={() => handleProcessPayment(order.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      disabled={loading}
                    >
                      Process Payment
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</section>

      {showAssignModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-600">
              Assign Workers for Order {currentOrder.id.slice(0, 8)}
            </h3>
            <p>
              <b>Service:</b> {services.find((s) => s.id === currentOrder.serviceId)?.name || currentOrder.serviceType}
            </p>
            <p>
              <b>Start Date:</b> {currentOrder.startDate || 'N/A'}
            </p>
            <p>
              <b>Farmer Pincode:</b> {users[currentOrder.farmerId]?.pincode || 'N/A'}
            </p>
            {currentOrder.serviceType === 'farm-workers' ? (
              <>
                {currentOrder.orderType === 'bundle' ? (
                  <>
                    <p>
                      <b>Bundle:</b> {currentOrder.bundleDetails?.name || 'N/A'}
                    </p>
                    <p>
                      <b>Male Workers Needed:</b> {currentOrder.bundleDetails?.maleWorkers || 0}
                    </p>
                    <p>
                      <b>Female Workers Needed:</b> {currentOrder.bundleDetails?.femaleWorkers || 0}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <b>Male Workers Needed:</b> {currentOrder.maleWorkers || 0}
                    </p>
                    <p>
                      <b>Female Workers Needed:</b> {currentOrder.femaleWorkers || 0}
                    </p>
                  </>
                )}
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Select Male Workers</h4>
                  {workers
                    .filter(
                      (w) =>
                        w.gender === 'male' &&
                        w.status === 'approved' &&
                        w.workerStatus === 'ready' &&
                        w.skills?.includes('farm-worker') &&
                        isWorkerAvailable(w, currentOrder.startDate)
                    )
                    .map((w) => (
                      <div key={w.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`male-worker-${w.id}`}
                          checked={selectedMaleWorkers.includes(w.id)}
                          onChange={() => {
                            if (selectedMaleWorkers.includes(w.id)) {
                              setSelectedMaleWorkers(selectedMaleWorkers.filter((id) => id !== w.id));
                            } else if (
                              selectedMaleWorkers.length <
                              (currentOrder.bundleDetails?.maleWorkers || currentOrder.maleWorkers || 0)
                            ) {
                              setSelectedMaleWorkers([...selectedMaleWorkers, w.id]);
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`male-worker-${w.id}`} className="text-gray-700">
                          {w.name || 'N/A'} (Pincode: {w.pincode || 'N/A'})
                        </label>
                      </div>
                    ))}
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Select Female Workers</h4>
                  {workers
                    .filter(
                      (w) =>
                        w.gender === 'female' &&
                        w.status === 'approved' &&
                        w.workerStatus === 'ready' &&
                        w.skills?.includes('farm-worker') &&
                        isWorkerAvailable(w, currentOrder.startDate)
                    )
                    .map((w) => (
                      <div key={w.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`female-worker-${w.id}`}
                          checked={selectedFemaleWorkers.includes(w.id)}
                          onChange={() => {
                            if (selectedFemaleWorkers.includes(w.id)) {
                              setSelectedFemaleWorkers(selectedFemaleWorkers.filter((id) => id !== w.id));
                            } else if (
                              selectedFemaleWorkers.length <
                              (currentOrder.bundleDetails?.femaleWorkers || currentOrder.femaleWorkers || 0)
                            ) {
                              setSelectedFemaleWorkers([...selectedFemaleWorkers, w.id]);
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`female-worker-${w.id}`} className="text-gray-700">
                          {w.name || 'N/A'} (Pincode: {w.pincode || 'N/A'})
                        </label>
                      </div>
                    ))}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleAssignWorker(currentOrder.id, [...selectedMaleWorkers, ...selectedFemaleWorkers])
                    }
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    disabled={loading}
                  >
                    Assign Workers
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <b>Workers Needed:</b> {currentOrder.totalWorkers || 1}
                </p>
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Select Workers</h4>
                  {workers
                    .filter(
                      (w) =>
                        w.status === 'approved' &&
                        w.workerStatus === 'ready' &&
                        w.skills?.includes(
                          currentOrder.serviceType === 'tractor-drivers' ? 'tractor-driver' : currentOrder.serviceType
                        ) &&
                        isWorkerAvailable(w, currentOrder.startDate)
                    )
                    .map((w) => (
                      <div key={w.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`worker-${w.id}`}
                          checked={selectedWorkers.includes(w.id)}
                          onChange={() => {
                            if (selectedWorkers.includes(w.id)) {
                              setSelectedWorkers(selectedWorkers.filter((id) => id !== w.id));
                            } else if (selectedWorkers.length < (currentOrder.totalWorkers || 1)) {
                              setSelectedWorkers([...selectedWorkers, w.id]);
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`worker-${w.id}`} className="text-gray-700">
                          {w.name || 'N/A'} (Pincode: {w.pincode || 'N/A'})
                        </label>
                      </div>
                    ))}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAssignWorker(currentOrder.id, selectedWorkers)}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    disabled={loading}
                  >
                    Assign Workers
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
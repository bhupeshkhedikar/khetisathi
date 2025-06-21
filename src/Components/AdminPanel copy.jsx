import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedMaleWorkers, setSelectedMaleWorkers] = useState([]);
  const [selectedFemaleWorkers, setSelectedFemaleWorkers] = useState([]);

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
          const workerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWorkers(workerData);
          console.log('Fetched workers:', workerData);
        }, (err) => {
          console.error('Error fetching workers:', err);
          setError(`Error fetching workers: ${err.message}`);
        });

        const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
        const unsubscribeFarmers = onSnapshot(farmersQuery, (snapshot) => {
          setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => {
          console.error('Error fetching farmers:', err);
          setError(`Error fetching farmers: ${err.message}`);
        });

        const ordersQuery = query(collection(db, 'orders'));
        const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(ordersData);

          const userIds = [
            ...new Set([
              ...ordersData.map(order => order.farmerId),
              ...ordersData.flatMap(order => Array.isArray(order.workerId) ? order.workerId : order.workerId ? [order.workerId] : [])
            ])
          ];
          const newUsers = { ...users };
          for (const userId of userIds) {
            if (!newUsers[userId]) {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                newUsers[userId] = userDoc.data();
              }
            }
          }
          setUsers(newUsers);
        }, (err) => {
          console.error('Error fetching orders:', err);
          setError(`Error fetching orders: ${err.message}`);
        });

        const servicesQuery = query(collection(db, 'services'));
        const unsubscribeServices = onSnapshot(servicesQuery, async (snapshot) => {
          const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setServices(servicesData);

          const farmWorkersService = servicesData.find(s => s.type === 'farm-workers');
          if (farmWorkersService) {
            const bundlesSnapshot = await getDocs(collection(db, `services/${farmWorkersService.id}/bundles`));
            setBundles(bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        }, (err) => {
          console.error('Error fetching services:', err);
          setError(`Error fetching services: ${err.message}`);
        });

        return () => {
          unsubscribeWorkers();
          unsubscribeFarmers();
          unsubscribeOrders();
          unsubscribeServices();
        };
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(`Authentication error: ${err.message}`);
    });

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
        updatedAt: serverTimestamp()
      });
      alert('Order accepted successfully!');
    } catch (err) {
      console.error('Error accepting order:', err);
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
        updatedAt: serverTimestamp()
      });
      alert('Order rejected successfully!');
    } catch (err) {
      console.error('Error rejecting order:', err);
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
      if (!farmerPincode) console.warn(`Farmer ${order.farmerId} is missing pincode. Proceeding with assignment.`);

      let workerIds = [];
      if (!order.startDate) throw new Error('Order start date is missing');

      if (order.serviceType === 'farm-workers') {
        const maleWorkersNeeded = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
        const femaleWorkersNeeded = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
        const attemptedWorkers = order.attemptedWorkers || [];

        if (maleWorkersNeeded > 0) {
          const availableMaleWorkers = workers
            .filter(w =>
              w.gender === 'male' &&
              w.status === 'approved' &&
              w.skills.includes('farm-worker') &&
              !attemptedWorkers.includes(w.id) &&
              isWorkerAvailable(w, order.startDate)
            )
            .map(w => ({
              id: w.id,
              pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false
            }))
            .sort((a, b) => {
              if (a.pincodeMatch && !b.pincodeMatch) return -1;
              if (!a.pincodeMatch && b.pincodeMatch) return 1;
              return 0;
            });

          if (availableMaleWorkers.length < maleWorkersNeeded) {
            throw new Error(`Only ${availableMaleWorkers.length} male workers available, need ${maleWorkersNeeded}`);
          }
          workerIds.push(...availableMaleWorkers.slice(0, maleWorkersNeeded).map(w => w.id));
        }

        if (femaleWorkersNeeded > 0) {
          const availableFemaleWorkers = workers
            .filter(w =>
              w.gender === 'female' &&
              w.status === 'approved' &&
              w.skills.includes('farm-worker') &&
              !attemptedWorkers.includes(w.id) &&
              isWorkerAvailable(w, order.startDate)
            )
            .map(w => ({
              id: w.id,
              pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false
            }))
            .sort((a, b) => {
              if (a.pincodeMatch && !b.pincodeMatch) return -1;
              if (!a.pincodeMatch && b.pincodeMatch) return 1;
              return 0;
            });

          if (availableFemaleWorkers.length < femaleWorkersNeeded) {
            throw new Error(`Only ${availableFemaleWorkers.length} female workers available, need ${femaleWorkersNeeded}`);
          }
          workerIds.push(...availableFemaleWorkers.slice(0, femaleWorkersNeeded).map(w => w.id));
        }
      } else {
        const skill = order.serviceType === 'tractor-drivers' ? 'tractor-driver' : order.serviceType;
        const availableWorkers = workers
          .filter(w =>
            w.status === 'approved' &&
            w.skills.includes(skill) &&
            (!order.attemptedWorkers || !order.attemptedWorkers.includes(w.id)) &&
            isWorkerAvailable(w, order.startDate)
          )
          .map(w => ({
            id: w.id,
            pincodeMatch: farmerPincode && w.pincode ? w.pincode === farmerPincode : false
          }))
          .sort((a, b) => {
            if (a.pincodeMatch && !b.pincodeMatch) return -1;
            if (!a.pincodeMatch && b.pincodeMatch) return 1;
            return 0;
          });

        if (availableWorkers.length === 0) throw new Error('No workers available');
        workerIds = [availableWorkers[0].id];
      }

      if (workerIds.length === 0) throw new Error('No suitable workers found');
      await updateDoc(doc(db, 'orders', orderId), {
        workerId: workerIds,
        status: 'pending',
        accepted: 'pending',
        timeout: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        attemptedWorkers: [...(order.attemptedWorkers || []), ...workerIds]
      });
      console.log(`Assigned workers ${workerIds.join(', ')} to order ${orderId}`);
      alert(`Assigned ${workerIds.length} worker(s) successfully!`);
    } catch (err) {
      console.error('Error in autoAssignWorkers:', err);
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
        updatedAt: serverTimestamp(),
        name: workerData.name || '',
        skills: workerData.skills || [],
        availability: workerData.availability || { workingDays: [], offDays: [] },
        pincode: workerData.pincode || '',
        gender: workerData.gender || ''
      });
      alert('Worker approved!');
    } catch (err) {
      console.error('Error approving worker:', err);
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
        updatedAt: serverTimestamp()
      });
      alert('Worker rejected!');
    } catch (err) {
      console.error('Error rejecting worker:', err);
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
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');
      const attemptedWorkers = order.attemptedWorkers || [];

      if (order.serviceType === 'farm-workers') {
        const maleWorkersNeeded = order.bundleDetails ? order.bundleDetails.maleWorkers : order.maleWorkers || 0;
        const femaleWorkersNeeded = order.bundleDetails ? order.bundleDetails.femaleWorkers : order.femaleWorkers || 0;
        const selectedWorkers = workers.filter(w => workerIds.includes(w.id));

        const maleCount = selectedWorkers.filter(w => w.gender === 'male').length;
        const femaleCount = selectedWorkers.filter(w => w.gender === 'female').length;

        if (maleCount !== maleWorkersNeeded || femaleCount !== femaleWorkersNeeded) {
          throw new Error(`Must select exactly ${maleWorkersNeeded} male and ${femaleWorkersNeeded} female workers.`);
        }

        if (!selectedWorkers.every(w => 
          w.status === 'approved' && 
          w.skills.includes('farm-worker') && 
          isWorkerAvailable(w, order.startDate)
        )) {
          throw new Error('Selected workers must be approved, have farm-worker skills, and be available.');
        }
      } else {
        if (workerIds.length !== 1) {
          throw new Error('Only one worker can be assigned to this service.');
        }
        const worker = workers.find(w => w.id === workerIds[0]);
        const skill = order.serviceType === 'tractor-drivers' ? 'tractor-driver' : order.serviceType;
        if (!worker || 
            worker.status !== 'approved' || 
            !worker.skills.includes(skill) || 
            !isWorkerAvailable(worker, order.startDate)
        ) {
          throw new Error('Selected worker must be approved, have the required skill, and be available.');
        }
      }

      await updateDoc(doc(db, 'orders', orderId), {
        workerId: workerIds,
        status: 'pending',
        accepted: 'pending',
        timeout: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        attemptedWorkers: [...attemptedWorkers, ...workerIds]
      });
      console.log(`Manually assigned workers ${workerIds.join(', ')} to order ${orderId}`);
      alert(`Assigned ${workerIds.length} worker(s)!`);
      setShowAssignModal(false);
      setSelectedMaleWorkers([]);
      setSelectedFemaleWorkers([]);
    } catch (err) {
      console.error('Error in handleAssignWorker:', err);
      setError(`Error assigning worker(s): ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (order) => {
    setCurrentOrder(order);
    setSelectedMaleWorkers([]);
    setSelectedFemaleWorkers([]);
    setShowAssignModal(true);
    console.log('Opening assign modal for order:', order);
    console.log('All workers:', workers);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const serviceData = {
        name: newServiceName,
        type: newServiceType,
        image: newServiceImage || 'https://images.unsplash.com/photo-1500595046743-ddf4d3d753dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        createdAt: serverTimestamp()
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
      alert('Service added successfully!');
    } catch (err) {
      console.error('Error adding service:', err);
      setError(`Error adding service: ${err.message}`);
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
      console.error('Error deleting service:', err);
      setError(`Error deleting service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBundle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const farmWorkersService = services.find(s => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm Workers service not found');
      await addDoc(collection(db, `services/${farmWorkersService.id}/bundles`), {
        name: newBundleName,
        maleWorkers: parseInt(newBundleMaleWorkers) || 0,
        femaleWorkers: parseInt(newBundleFemaleWorkers) || 0,
        price: parseFloat(newBundlePrice) || 0,
        createdAt: serverTimestamp()
      });
      setNewBundleName('');
      setNewBundleMaleWorkers('0');
      setNewBundleFemaleWorkers('0');
      setNewBundlePrice('');
      alert('Bundle added successfully!');
    } catch (err) {
      console.error('Error adding bundle:', err);
      setError(`Error adding bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;
    setLoading(true);
    try {
      const farmWorkersService = services.find(s => s.type === 'farm-workers');
      if (!farmWorkersService) throw new Error('Farm Workers service not found');
      await deleteDoc(doc(db, `services/${farmWorkersService.id}/bundles`, bundleId));
      alert('Bundle deleted successfully!');
    } catch (err) {
      console.error('Error deleting bundle:', err);
      setError(`Error deleting bundle: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
        completedAt: serverTimestamp()
      });

      const workerIds = Array.isArray(orderData.workerId) ? orderData.workerId : orderData.workerId ? [orderData.workerId] : [];
      for (const workerId of workerIds) {
        await addDoc(collection(db, `users/${workerId}/earnings`), {
          orderId,
          serviceType: orderData.serviceType,
          cost: orderData.cost / (workerIds.length || 1),
          completedAt: serverTimestamp(),
          paymentMethod: orderData.paymentMethod || 'cash'
        });
      }
      alert('Payment processed and earnings recorded!');
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(`Error processing payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedOrders = [...orders].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'farmerName') {
      aValue = users[a.farmerId]?.name || '';
      bValue = users[b.farmerId]?.name || '';
    } else if (sortConfig.key === 'workerName') {
      aValue = Array.isArray(a.workerId) ? a.workerId.map(id => users[id]?.name || 'N/A').join(', ') : users[a.workerId]?.name || '';
      bValue = Array.isArray(b.workerId) ? b.workerId.map(id => users[id]?.name || 'N/A').join(', ') : users[b.workerId]?.name || '';
    } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'completedAt') {
      aValue = aValue ? new Date(aValue.toDate()).getTime() : -Infinity;
      bValue = bValue ? new Date(bValue.toDate()).getTime() : -Infinity;
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

  if (!adminUser || error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 text-center">{error || 'Please log in as admin.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-green-700">
        <i className="fas fa-user-shield mr-2"></i> Admin Dashboard
      </h2>
      {error && <p className="text-red-600 mb-6 text-center">{error}</p>}

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover">
            <h4 className="text-lg font-semibold mb-2">Total Orders</h4>
            <p className="text-2xl text-green-600">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover">
            <h4 className="text-lg font-semibold mb-2">Active Workers</h4>
            <p className="text-2xl text-green-600">{workers.filter(w => w.status === 'approved').length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover">
            <h4 className="text-lg font-semibold mb-2">Total Revenue</h4>
            <p className="text-2xl text-green-600">${orders.reduce((sum, o) => sum + (o.cost || 0), 0)}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {farmers.map(farmer => (
                <div key={farmer.id} className="bg-white rounded-lg shadow-lg card-hover p-6">
                  <p><strong>Name:</strong> {farmer.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {farmer.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {farmer.phone || 'N/A'}</p>
                  <p><strong>Pincode:</strong> {farmer.pincode || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-800">Workers</h4>
          {workers.length === 0 ? (
            <p className="text-center text-gray-600">No workers registered.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map(worker => (
                <div key={worker.id} className="bg-white rounded-lg shadow-lg card-hover p-6">
                  <p><strong>Name:</strong> {worker.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {worker.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {worker.phone || 'N/A'}</p>
                  <p><strong>Gender:</strong> {worker.gender || 'N/A'}</p>
                  <p><strong>Skills:</strong> {(worker.skills || []).join(', ') || 'None'}</p>
                  <p><strong>Pincode:</strong> {worker.pincode || 'N/A'}</p>
                  <p><strong>Status:</strong> {worker.status || 'Pending'}</p>
                  {worker.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleApproveWorker(worker.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                        disabled={loading}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectWorker(worker.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow-lg card-hover">
              <img src={s.image} alt={s.name} className="w-full h-40 object-cover rounded-t-lg" />
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">{s.name}</h4>
                <p className="text-gray-600 mb-2">{s.type}</p>
                {s.type === 'farm-workers' ? (
                  <p className="text-green-600 font-bold">Male: ${s.maleCost}/day, Female: ${s.femaleCost}/day</p>
                ) : (
                  <p className="text-green-600 font-bold">${s.cost}{s.type === 'tractor-drivers' ? '/hour' : ''}</p>
                )}
                <button
                  onClick={() => handleDeleteService(s.id)}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddService} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700">Service Name</label>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Service Type</label>
              <select
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
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
                  <label className="block text-gray-700">Male Cost ($/day)</label>
                  <input
                    type="number"
                    value={newMaleCost}
                    onChange={(e) => setNewMaleCost(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Female Cost ($/day)</label>
                  <input
                    type="number"
                    value={newFemaleCost}
                    onChange={(e) => setNewFemaleCost(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-gray-700">Cost ($/{newServiceType === 'tractor-drivers' ? 'hour' : 'job'})</label>
                <input
                  type="number"
                  value={newServiceCost}
                  onChange={(e) => setNewServiceCost(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-gray-700">Image URL (Optional)</label>
              <input
                type="text"
                value={newServiceImage}
                onChange={(e) => setNewServiceImage(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> Add Service
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Bundles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {bundles.map(b => (
            <div key={b.id} className="bg-white rounded-lg shadow-lg card-hover p-6">
              <h4 className="text-xl font-semibold mb-2">{b.name}</h4>
              <p className="text-gray-600 mb-2">{b.maleWorkers} Male + {b.femaleWorkers} Female</p>
              <p className="text-green-600 font-bold">${b.price}</p>
              <button
                onClick={() => handleDeleteBundle(b.id)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddBundle} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700">Bundle Name</label>
              <input
                type="text"
                value={newBundleName}
                onChange={(e) => setNewBundleName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Male Workers</label>
              <input
                type="number"
                value={newBundleMaleWorkers}
                onChange={(e) => setNewBundleMaleWorkers(e.target.value)}
                min="0"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Female Workers</label>
              <input
                type="number"
                value={newBundleFemaleWorkers}
                onChange={(e) => setNewBundleFemaleWorkers(e.target.value)}
                min="0"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Bundle Price ($)</label>
              <input
                type="number"
                value={newBundlePrice}
                onChange={(e) => setNewBundlePrice(e.target.value)}
                min="0"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> Add Bundle
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-green-700">All Orders</h3>
        {orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
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
                {sortedOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6">{order.id.slice(0, 8)}</td>
                    <td className="py-3 px-6">{users[order.farmerId]?.name || 'N/A'}</td>
                    <td className="py-3 px-6">
                      {Array.isArray(order.workerId)
                        ? order.workerId.map(id => users[id]?.name || 'N/A').join(', ')
                        : users[order.workerId]?.name || 'None'}
                    </td>
                    <td className="py-3 px-6">
                      {services.find(s => s.id === order.serviceId)?.name || order.serviceType || 'N/A'}
                      {order.serviceType === 'farm-workers' && (
                        <span className="block text-sm text-gray-500">
                          {order.bundleDetails
                            ? `Bundle: ${order.bundleDetails.name}`
                            : `M: ${order.maleWorkers || 0}, F: ${order.femaleWorkers || 0}`}
                        </span>
                      )}
                      {order.serviceType === 'tractor-drivers' && (
                        <span className="block text-sm text-gray-500">Hours: ${order.hours || 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-3 px-6">${order.cost || 'N/A'}</td>
                    <td className="py-3 px-6">
                      {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                    </td>
                    <td className="py-3 px-6">
                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-6">
                      {order.completedAt ? new Date(order.completedAt.toDate()).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-6">
                      {order.paymentStatus
                        ? `${order.paymentStatus.status.charAt(0).toUpperCase() + order.paymentStatus.status.slice(1)} (${order.paymentStatus.method.charAt(0).toUpperCase() + order.paymentStatus.method.slice(1)})`
                        : 'Not Paid'}
                    </td>
                    <td className="py-3 px-6">
                      {order.status === 'pending' && (!order.workerId || order.workerId.length === 0) && (
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition text-sm"
                            disabled={loading}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition text-sm"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      {order.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => autoAssignWorkers(order.id, order)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            disabled={loading}
                          >
                            Auto Assign
                          </button>
                          {order.serviceType === 'farm-workers' ? (
                            <button
                              onClick={() => openAssignModal(order)}
                              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                              disabled={loading}
                            >
                              Manual Assign
                            </button>
                          ) : (
                            <select
                              onChange={(e) => e.target.value && handleAssignWorker(order.id, [e.target.value])}
                              className="p-2 border rounded focus:ring-2 focus:ring-green-600"
                              disabled={loading}
                            >
                              <option value="">Select Worker</option>
                              {workers
                                .filter(w =>
                                  w.status === 'approved' &&
                                  w.skills.includes(order.serviceType === 'tractor-drivers' ? 'tractor-driver' : order.serviceType) &&
                                  isWorkerAvailable(w, order.startDate)
                                )
                                .map(w => (
                                  <option key={w.id} value={w.id}>{w.name || 'N/A'}</option>
                                ))}
                            </select>
                          )}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAssignModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-700">
              Assign Workers for Order {currentOrder.id.slice(0, 8)}
            </h3>
            <p><strong>Service:</strong> {services.find(s => s.id === currentOrder.serviceId)?.name || currentOrder.serviceType}</p>
            <p><strong>Start Date:</strong> {currentOrder.startDate}</p>
            {currentOrder.bundleDetails ? (
              <p><strong>Bundle:</strong> {currentOrder.bundleDetails.name} ({currentOrder.bundleDetails.maleWorkers} Male, {currentOrder.bundleDetails.femaleWorkers} Female)</p>
            ) : (
              <>
                <p><strong>Male Workers Needed:</strong> {currentOrder.maleWorkers || 0}</p>
                <p><strong>Female Workers Needed:</strong> {currentOrder.femaleWorkers || 0}</p>
              </>
            )}
            {users[currentOrder.farmerId]?.pincode ? (
              <p><strong>Farmer Pincode:</strong> {users[currentOrder.farmerId].pincode}</p>
            ) : (
              <p className="text-yellow-600"><strong>Farmer Pincode:</strong> Not Provided</p>
            )}

            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Select Male Workers</h4>
              {(() => {
                const farmerPincode = users[currentOrder.farmerId]?.pincode;
                const filteredMaleWorkers = workers.filter(w => {
                  const isAvailable = isWorkerAvailable(w, currentOrder.startDate);
                  const hasPincode = !!w.pincode;
                  const pincodeMatch = farmerPincode && w.pincode ? w.pincode === farmerPincode : false;
                  const warnings = [];
                  if (!hasPincode) warnings.push('Missing pincode');
                  if (!w.availability || !w.availability.workingDays) warnings.push('Missing availability');
                  console.log(`Male Worker ${w.name} (${w.id}) - Status: ${w.status}, Skills: ${w.skills}, Available: ${isAvailable}, Pincode: ${w.pincode}, Pincode Match: ${pincodeMatch}, Warnings: ${warnings.join(', ')}`);
                  return (
                    w.gender === 'male' &&
                    w.status === 'approved' &&
                    w.skills?.includes('farm-worker') &&
                    isAvailable
                  );
                }).sort((a, b) => {
                  const aMatch = farmerPincode && a.pincode ? a.pincode === farmerPincode : false;
                  const bMatch = farmerPincode && b.pincode ? b.pincode === farmerPincode : false;
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  return 0;
                });
                console.log('Filtered Male Workers:', filteredMaleWorkers);
                return filteredMaleWorkers.length > 0 ? (
                  filteredMaleWorkers.map(w => (
                    <div key={w.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`male-${w.id}`}
                        checked={selectedMaleWorkers.includes(w.id)}
                        onChange={() => {
                          setSelectedMaleWorkers(prev =>
                            prev.includes(w.id)
                              ? prev.filter(id => id !== w.id)
                              : [...prev, w.id]
                          );
                        }}
                        disabled={
                          selectedMaleWorkers.length >= (currentOrder.bundleDetails?.maleWorkers || currentOrder.maleWorkers || 0) &&
                          !selectedMaleWorkers.includes(w.id)
                        }
                      />
                      <label htmlFor={`male-${w.id}`} className="ml-2">
                        {w.name || 'N/A'} (Pincode: {w.pincode || 'N/A'})
                        {farmerPincode && w.pincode && w.pincode === farmerPincode && (
                          <span className="text-green-600 text-sm ml-2">[Matches Farmer]</span>
                        )}
                        {!w.pincode && (
                          <span className="text-yellow-600 text-sm ml-2">[Missing Pincode]</span>
                        )}
                        {(!w.availability || !w.availability.workingDays) && (
                          <span className="text-yellow-600 text-sm ml-2">[Availability Assumed]</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-red-600">
                    No available male workers found for {currentOrder.startDate}. Please update worker availability.
                  </p>
                );
              })()}
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Select Female Workers</h4>
              {(() => {
                const farmerPincode = users[currentOrder.farmerId]?.pincode;
                const filteredFemaleWorkers = workers.filter(w => {
                  const isAvailable = isWorkerAvailable(w, currentOrder.startDate);
                  const hasPincode = !!w.pincode;
                  const pincodeMatch = farmerPincode && w.pincode ? w.pincode === farmerPincode : false;
                  const warnings = [];
                  if (!hasPincode) warnings.push('Missing pincode');
                  if (!w.availability || !w.availability.workingDays) warnings.push('Missing availability');
                  console.log(`Female Worker ${w.name} (${w.id}) - Status: ${w.status}, Skills: ${w.skills}, Available: ${isAvailable}, Pincode: ${w.pincode}, Pincode Match: ${pincodeMatch}, Warnings: ${warnings.join(', ')}`);
                  return (
                    w.gender === 'female' &&
                    w.status === 'approved' &&
                    w.skills?.includes('farm-worker') &&
                    isAvailable
                  );
                }).sort((a, b) => {
                  const aMatch = farmerPincode && a.pincode ? a.pincode === farmerPincode : false;
                  const bMatch = farmerPincode && b.pincode ? b.pincode === farmerPincode : false;
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  return 0;
                });
                console.log('Filtered Female Workers:', filteredFemaleWorkers);
                return filteredFemaleWorkers.length > 0 ? (
                  filteredFemaleWorkers.map(w => (
                    <div key={w.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`female-${w.id}`}
                        checked={selectedFemaleWorkers.includes(w.id)}
                        onChange={() => {
                          setSelectedFemaleWorkers(prev =>
                            prev.includes(w.id)
                              ? prev.filter(id => id !== w.id)
                              : [...prev, w.id]
                          );
                        }}
                        disabled={
                          selectedFemaleWorkers.length >= (currentOrder.bundleDetails?.femaleWorkers || currentOrder.femaleWorkers || 0) &&
                          !selectedFemaleWorkers.includes(w.id)
                        }
                      />
                      <label htmlFor={`female-${w.id}`} className="ml-2">
                        {w.name || 'N/A'} (Pincode: ${w.pincode || 'N/A'})
                        {farmerPincode && w.pincode && w.pincode === farmerPincode && (
                          <span className="text-green-600 text-sm ml-2">[Matches Farmer]</span>
                        )}
                        {!w.pincode && (
                          <span className="text-yellow-600 text-sm ml-2">[Missing Pincode]</span>
                        )}
                        {(!w.availability || !w.availability.workingDays) && (
                          <span className="text-yellow-600 text-sm ml-2">[Availability Assumed]</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-red-600">
                    No available female workers found for {currentOrder.startDate}. Please update worker availability.
                  </p>
                );
              })()}
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => handleAssignWorker(currentOrder.id, [...selectedMaleWorkers, ...selectedFemaleWorkers])}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={loading}
              >
                Assign Workers
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
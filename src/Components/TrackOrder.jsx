import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged } from './firebaseConfig.js';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

const TrackOrder = () => {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch services from Firestore
    const fetchServices = async () => {
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchServices();

    // Handle user authentication and orders
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const ordersQuery = query(
          collection(db, 'orders'),
          where('farmerId', '==', user.uid)
        );
        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribeOrders();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-green-800">
        <i className="fas fa-map-marker-alt mr-2"></i> Track Orders
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders found.</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-gray-50 rounded-lg shadow-lg card-hover p-4">
              <p><strong>Service:</strong> {services.find(s => s.type === order.serviceType)?.name || order.serviceType}</p>
              {order.serviceType === 'farm-workers' && (
                <>
                  {order.bundleDetails ? (
                    <p><strong>Bundle:</strong> {order.bundleDetails.name} ({order.bundleDetails.maleWorkers} Male + {order.bundleDetails.femaleWorkers} Female @ ${order.bundleDetails.price})</p>
                  ) : (
                    <>
                      <p><strong>Male Workers:</strong> {order.maleWorkers}</p>
                      <p><strong>Female Workers:</strong> {order.femaleWorkers}</p>
                    </>
                  )}
                </>
              )}
              {order.serviceType === 'ownertc' && (
                <p><strong>Hours:</strong> {order.hours}</p>
              )}
              <p><strong>Cost:</strong> ${order.cost}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Worker:</strong> {order.workerId || 'Not assigned'}</p>
              <p><strong>Location:</strong> Worker location tracking (Mock)</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
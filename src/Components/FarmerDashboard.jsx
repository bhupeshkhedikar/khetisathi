import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [workers, setWorkers] = useState({});
  const [error, setError] = useState('');
  const [messagesSent, setMessagesSent] = useState({});
  const [loadingCancel, setLoadingCancel] = useState({});
  const [timeLeft, setTimeLeft] = useState({}); // Track remaining time for each order

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists() || userDoc.data().role !== 'farmer') {
            setError('Access restricted to farmers.');
            return;
          }
          setUser(user);

          const ordersQuery = query(
            collection(db, 'orders'),
            where('farmerId', '==', user.uid)
          );
          const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            ordersData.sort((a, b) => {
              const aTime = a.createdAt?.toDate()?.getTime() || 0;
              const bTime = b.createdAt?.toDate()?.getTime() || 0;
              return bTime - aTime;
            });
            setOrders(ordersData);

            ordersData.forEach(order => {
              console.log(`Order ${order.id}:`, {
                workerId: order.workerId,
                workerAcceptances: order.workerAcceptances,
                accepted: order.accepted,
                status: order.status,
                paymentStatus: order.paymentStatus
              });
            });

            const workerIds = [...new Set(
              ordersData.flatMap(order => 
                Array.isArray(order.workerId) ? order.workerId : order.workerId ? [order.workerId] : []
              ).filter(id => id)
            )];
            const newWorkers = { ...workers };
            for (const workerId of workerIds) {
              if (!newWorkers[workerId]) {
                const workerDoc = await getDoc(doc(db, 'users', workerId));
                if (workerDoc.exists()) {
                  newWorkers[workerId] = workerDoc.data();
                }
              }
            }
            setWorkers(newWorkers);
          }, (err) => {
            console.error('Error fetching orders:', err);
            setError(`Error fetching orders: ${err.message}`);
          });

          const servicesSnapshot = await getDocs(collection(db, 'services'));
          setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          return () => unsubscribeOrders();
        } catch (err) {
          console.error('Error initializing farmer dashboard:', err);
          setError(`Initialization error: ${err.message}`);
        }
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(`Authentication error: ${err.message}`);
    });

    return () => unsubscribeAuth();
  }, [workers]);

  // Timer logic to update time left every second
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date().getTime();
      setTimeLeft(prev => {
        const newTimeLeft = {};
        orders.forEach(order => {
          if (order.createdAt && order.status !== 'completed' && order.status !== 'cancelled') {
            const createdTime = order.createdAt.toDate().getTime();
            const timeDiffSeconds = Math.max(0, 600 - (currentTime - createdTime) / 1000); // 600 seconds = 10 minutes
            newTimeLeft[order.id] = {
              minutes: Math.floor(timeDiffSeconds / 60),
              seconds: Math.floor(timeDiffSeconds % 60)
            };
          }
        });
        return newTimeLeft;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orders]);

  const sendWhatsAppMessage = async (farmerPhone, message) => {
    if (!farmerPhone || farmerPhone === 'N/A') {
      console.error('Farmer phone number is missing or invalid');
      return;
    }

    try {
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `+91${farmerPhone}`,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
      }
      console.log('WhatsApp message sent successfully');
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      setError(`Failed to send notification: ${err.message}`);
    }
  };

  const cancelOrder = async (orderId) => {
    setLoadingCancel(prev => ({ ...prev, [orderId]: true }));
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      console.log(`Order ${orderId} cancelled successfully`);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(`Failed to cancel order: ${err.message}`);
    } finally {
      setLoadingCancel(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const canCancelOrder = (createdAt) => {
    if (!createdAt) return false;
    const createdTime = createdAt.toDate().getTime();
    const currentTime = new Date().getTime();
    const timeDiffSeconds = (currentTime - createdTime) / 1000;
    return timeDiffSeconds <= 600; // 600 seconds = 10 minutes
  };

  if (!user || error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-600 text-center">{error || 'Please log in as a farmer.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-green-700">
        Farmer Dashboard
      </h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-green-700">Your Orders</h3>
        <div className="grid grid-cols-1 gap-6">
          {orders.length === 0 ? (
            <p className="text-center text-gray-600">No orders placed.</p>
          ) : (
            orders.map(order => {
              const estimatedCompletion = new Date(
                new Date(order.createdAt?.toDate() || Date.now()).getTime() +
                (order.serviceType === 'tractor-drivers' ? order.hours * 3600 * 1000 : 8 * 3600 * 1000) * order.numberOfDays
              );
              const workerIds = Array.isArray(order.workerId) ? order.workerId : order.workerId ? [order.workerId] : [];
              const assignedWorkers = workerIds
                .filter(id => workers[id])
                .map(id => {
                  const acceptanceStatus = Array.isArray(order.workerAcceptances)
                    ? order.workerAcceptances.find(wa => wa.workerId === id)?.status || 'pending'
                    : order.accepted || 'pending';
                  return {
                    id,
                    name: workers[id]?.name || 'Unknown',
                    mobile: workers[id]?.mobile || 'N/A',
                    acceptanceStatus
                  };
                });

              const allWorkersAccepted = assignedWorkers.length > 0 && assignedWorkers.every(
                worker => worker.acceptanceStatus === 'accepted' || worker.acceptanceStatus === 'completed'
              );

              if (allWorkersAccepted && !messagesSent[order.id] && order.status !== 'completed') {
                const workerDetails = assignedWorkers.map(worker => `${worker.name} (${worker.mobile})`).join(', ');
                const message = `All workers have accepted your have accepted your order and will arrive at your location soon. You can contact: ${workerDetails}. Regards, Khetisathi`;
                sendWhatsAppMessage(order.contactNumber, message);
                setMessagesSent(prev => ({ ...prev, [order.id]: true }));
              }

              const isCancellable = canCancelOrder(order.createdAt);
              const remainingTime = timeLeft[order.id] || { minutes: 0, seconds: 0 };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
                >
                  {/* Header Section */}
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-900">
                      {services.find(s => s.type === order.serviceType)?.name || order.serviceType}
                    </h4>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
                          ${order.status === 'assigned' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {isCancellable && (
                        <div className="text-sm text-gray-600">
                          Cancel within{' '}
                          <span className="font-semibold text-red-600">
                            {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      {isCancellable && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                          disabled={loadingCancel[order.id]}
                        >
                          {loadingCancel[order.id] ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Worker Details */}
                  <div className="mb-4">
                    <p className="text-gray-700 font-semibold">
                      Worker{workerIds.length > 1 ? 's' : ''}:
                    </p>
                    <div className="mt-2">
                      {assignedWorkers.length > 0 ? (
                        assignedWorkers.map(worker => (
                          <span
                            key={worker.id}
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mr-2 mb-2
                              ${worker.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                                worker.acceptanceStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                                worker.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}
                          >
                            {worker.name} (
                            {worker.mobile === 'N/A' ? (
                              <span>{worker.mobile}</span>
                            ) : (
                              <a
                                href={`tel:${worker.mobile}`}
                                className="text-blue-600 hover:underline"
                              >
                                {worker.mobile}
                              </a>
                            )}
                            ) - {worker.acceptanceStatus.charAt(0).toUpperCase() + worker.acceptanceStatus.slice(1)}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-600">Unassigned</p>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h5 className="text-gray-700 font-semibold mb-2">Order Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.serviceType === 'farm-workers' && (
                        <>
                          {order.bundleDetails ? (
                            <p>
                              <span className="text-gray-700 font-semibold">Bundle: </span>
                              <span className="text-gray-900">
                                {order.bundleDetails.name} ({order.bundleDetails.maleWorkers} Male + {order.bundleDetails.femaleWorkers} Female)
                              </span>
                            </p>
                          ) : (
                            <>
                              <p>
                                <span className="text-gray-700 font-semibold">Male Workers: </span>
                                <span className="text-gray-900">{order.maleWorkers || 0}</span>
                              </p>
                              <p>
                                <span className="text-gray-700 font-semibold">Female Workers: </span>
                                <span className="text-gray-900">{order.femaleWorkers || 0}</span>
                              </p>
                            </>
                          )}
                        </>
                      )}
                      {order.serviceType === 'tractor-drivers' && (
                        <p>
                          <span className="text-gray-700 font-semibold">Hours: </span>
                          <span className="text-gray-900">{order.hours || 'N/A'}</span>
                        </p>
                      )}
                      <p>
                        <span className="text-gray-700 font-semibold">Days: </span>
                        <span className="text-gray-900">{order.numberOfDays || 1} Day{order.numberOfDays > 1 ? 's' : ''}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Start Date: </span>
                        <span className="text-gray-900">{order.startDate || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">End Date: </span>
                        <span className="text-gray-900">{order.endDate || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Start Time: </span>
                        <span className="text-gray-900">{order.startTime || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Estimated Completion: </span>
                        <span className="text-gray-900">{estimatedCompletion.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Location and Contact */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h5 className="text-gray-700 font-semibold mb-2">Location & Contact</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p>
                        <span className="text-gray-700 font-semibold">Address: </span>
                        <span className="text-gray-900">{order.address || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Contact: </span>
                        <span className="text-gray-900">{order.contactNumber || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Location: </span>
                        <span className="text-gray-900 text-sm">
                          ({order.location?.latitude || 'N/A'}, {order.location?.longitude || 'N/A'})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h5 className="text-gray-700 font-semibold mb-2">Payment Info</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p>
                        <span className="text-gray-700 font-semibold">Cost: </span>
                        <span className="text-green-600 font-semibold">₹{order.cost?.toFixed(2) || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Payment Method: </span>
                        <span className="text-gray-900">{order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'N/A'}</span>
                      </p>
                      <p>
                        <span className="text-gray-700 font-semibold">Payment Status: </span>
                        <span className={`font-semibold ${order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {order.status === 'completed'
                            ? order.paymentStatus
                              ? `Paid (${order.paymentStatus.method.charAt(0).toUpperCase() + order.paymentStatus.method.slice(1)})`
                              : 'Paid (Unknown Method)'
                            : order.paymentStatus
                              ? `${order.paymentStatus.status.charAt(0).toUpperCase() + order.paymentStatus.status.slice(1)} (${order.paymentStatus.method})`
                              : 'Not Paid'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="text-gray-700 font-semibold mb-2">Additional Info</h5>
                    <p>
                      <span className="text-gray-700 font-semibold">Note: </span>
                      <span className="text-gray-900 text-sm">{order.additionalNote || 'None'}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default FarmerDashboard;
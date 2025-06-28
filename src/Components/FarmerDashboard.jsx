import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, MapPinIcon, PhoneIcon, CurrencyRupeeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [workers, setWorkers] = useState({});
  const [error, setError] = useState('');
  const [messagesSent, setMessagesSent] = useState({});
  const [loadingCancel, setLoadingCancel] = useState({});
  const [timeLeft, setTimeLeft] = useState({});

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

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date().getTime();
      setTimeLeft(prev => {
        const newTimeLeft = {};
        orders.forEach(order => {
          if (order.createdAt && order.status !== 'completed' && order.status !== 'cancelled') {
            const createdTime = order.createdAt.toDate().getTime();
            const timeDiffSeconds = Math.max(0, 600 - (currentTime - createdTime) / 1000);
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
    return timeDiffSeconds <= 600;
  };

  if (!user || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-amber-100 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-2xl text-center transform transition-all hover:scale-105">
          <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="text-xl font-semibold text-red-600">{error || 'Please log in as a farmer.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-amber-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* <header className="bg-gradient-to-r from-green-600 to-green-600 rounded-xl shadow-lg p-6 mb-8 transform transition-all hover:shadow-2xl">
          <h5 className="text-1xl font-bold text-white text-center flex items-center justify-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Your Orders
          </h5>
        </header> */}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-center shadow-md">
            <XCircleIcon className="w-6 h-6 mr-2" />
            <p>{error}</p>
          </div>
        )}

        <section className="mb-8">
          <h3 className="text-2xl font-semibold mb-3 text-green-700 text-center flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-6 h-6" />
            Your Orders
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-gray-600 flex items-center justify-center gap-2">
                  <CalendarIcon className="w-6 h-6" />
                  No orders placed yet.
                </p>
              </div>
            ) : (
              orders.map(order => {
                const estimatedCompletion = new Date(
                  new Date(order.createdAt?.toDate() || Date.now()).getTime() +
                  (order.serviceType === 'ownertc' ? order.hours * 3600 * 1000 : 8 * 3600 * 1000) * order.numberOfDays
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
                  const message = `All workers have accepted your order and will arrive at your location soon. You can contact: ${workerDetails}. Regards, Khetisathi`;
                  sendWhatsAppMessage(order.contactNumber, message);
                  setMessagesSent(prev => ({ ...prev, [order.id]: true }));
                }

                const isCancellable = canCancelOrder(order.createdAt);
                const remainingTime = timeLeft[order.id] || { minutes: 0, seconds: 0 };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-2xl transition-all transform hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-bold text-green-700 flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6" />
                        {services.find(s => s.type === order.serviceType)?.name || order.serviceType.replace('-', ' ').toUpperCase()}
                      </h4>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-block px-4 py-1 rounded-full text-sm font-semibold text-white
                            ${order.status === 'assigned' ? 'bg-green-600' :
                              order.status === 'pending' ? 'bg-yellow-500' :
                              order.status === 'completed' ? 'bg-blue-600' :
                              order.status === 'cancelled' ? 'bg-gray-500' :
                              'bg-red-600'}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {isCancellable && (
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-red-600" />
                            Cancel within{' '}
                            <span className="font-semibold text-red-600">
                              {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                        {isCancellable && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 transform hover:scale-105"
                            disabled={loadingCancel[order.id]}
                          >
                            <XCircleIcon className="w-5 h-5" />
                            {loadingCancel[order.id] ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-700 font-semibold flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-green-600" />
                        Worker{workerIds.length > 1 ? 's' : ''}:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {assignedWorkers.length > 0 ? (
                          assignedWorkers.map(worker => (
                            <span
                              key={worker.id}
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
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

                    <div className="border-t border-green-200 pt-4 mb-4">
                      <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        Order Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {order.serviceType === 'farm-workers' && (
                          <>
                            {order.bundleDetails ? (
                              <p>
                                <span className="text-gray-700 font-semibold">Bundle: </span>
                                <span className="text-gray-900">{order.bundleDetails.name} ({order.bundleDetails.maleWorkers} Male + {order.bundleDetails.femaleWorkers} Female)</span>
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
                        {order.serviceType === 'ownertc' && (
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
                          <span className="text-gray-900">{new Date(order.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </p>
                        <p>
                          <span className="text-gray-700 font-semibold">End Date: </span>
                          <span className="text-gray-900">{new Date(order.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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

                    <div className="border-t border-green-200 pt-4 mb-4">
                      <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-green-600" />
                        Location & Contact
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

                    <div className="border-t border-green-200 pt-4 mb-4">
                      <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <CurrencyRupeeIcon className="w-5 h-5 text-green-600" />
                        Payment Info
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

                    <div className="border-t border-green-200 pt-4">
                      <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        Additional Info
                      </h5>
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
    </div>
  );
};

export default FarmerDashboard;
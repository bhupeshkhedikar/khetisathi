import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged } from './firebaseConfig.js';
import { collection, getDocs, addDoc, where, query, doc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

const OrderService = () => {
  const [service, setService] = useState('');
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [area, setArea] = useState('');
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        setArea(userDoc.data().area);
        const workersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'worker'),
          where('status', '==', 'approved'),
          where('area', '==', userDoc.data().area)
        );
        const workersSnapshot = await getDocs(workersQuery);
        setWorkers(workersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'orders'), {
        farmerId: user.uid,
        workerId: selectedWorker,
        service,
        status: 'pending',
        createdAt: serverTimestamp(),
        cost: services.find(s => s.name === service)?.cost || 100
      });
      alert('Order placed successfully!');
    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  };

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <section className="hero-bg h-96 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">FarmConnect: Empowering Farmers</h1>
          <p className="text-lg md:text-xl mb-6">Book expert farm services on-demand with ease.</p>
          <a href="#order" className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition">
            Book Now
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.length === 0 ? (
            <p className="text-center col-span-full text-gray-600">No services available.</p>
          ) : (
            services.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-lg shadow-lg card-hover cursor-pointer"
                onClick={() => setService(s.name)}
              >
                <img
                  src={s.image || 'https://images.unsplash.com/photo-1500595046743-ddf4d3d753dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={s.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{s.name}</h3>
                  <p className="text-green-600 font-bold">${s.cost}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Order Form */}
      <section id="order" className="py-12 px-4 bg-white">
        <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Book a Service</h2>
          <form onSubmit={handleOrder}>
            <div className="mb-4">
              <label className="block text-gray-700">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">Select Service</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name} (${s.cost})</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Select Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">Select Worker</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.email}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
            >
              <i className="fas fa-tractor mr-2"></i> Place Order
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">FarmConnect</h3>
          <p className="mb-4">Connecting farmers with reliable services.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-green-300"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="hover:text-green-300"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-green-300"><i className="fab fa-instagram"></i></a>
          </div>
          <p className="mt-4">Contact us: support@farmconnect.com | +1-800-FARM-123</p>
        </div>
      </footer>
    </div>
  );
};

export default OrderService;
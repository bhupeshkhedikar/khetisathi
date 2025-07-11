import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged } from './firebaseConfig.js';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import Carousel from './Carousel';
import Footer from './Footer';
import './Home.css';
import translations from './translations';

const Home = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [maleWorkers, setMaleWorkers] = useState(0);
  const [femaleWorkers, setFemaleWorkers] = useState(0);
  const [otherWorkers, setOtherWorkers] = useState(0);
  const [hours, setHours] = useState('1');
  const [selectedBundle, setSelectedBundle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState('marathi');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCost, setVehicleCost] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [district, setDistrict] = useState('');
  const [tahsil, setTahsil] = useState('');
  const [village, setVillage] = useState('');
  const navigate = useNavigate();

  const t = translations[language];

  const steps = [
    { label: t.service, icon: 'fas fa-briefcase' },
    { label: t.schedule || "Schedule", icon: 'fas fa-calendar-alt' },
    { label: t.details || "Details", icon: 'fas fa-map-marker-alt' },
    { label: t.review || "Review", icon: 'fas fa-check-circle' },
    { label: t.success || "Success", icon: 'fas fa-check-double' }
  ];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsServicesLoading(true);
      try {
        const servicesSnapshot = await getDocs(query(collection(db, 'services')));
        const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('servicesData', servicesData);
        setServices(servicesData);

        const targetService = servicesData.find(s => s.type === 'farm-workers' || s.type === 'ploughing-laborer');
        if (targetService) {
          const bundlesSnapshot = await getDocs(collection(db, `services/${targetService.id}/bundles`));
          setBundles(bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices([]);
        setBundles([]);
      } finally {
        setIsServicesLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (startDate && numberOfDays) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + parseInt(numberOfDays) - 1);
      setEndDate(end.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  }, [startDate, numberOfDays]);

  useEffect(() => {
    // Combine district, tahsil, and village into address
    const addressComponents = [village, tahsil, district].filter(Boolean).join(', ');
    setAddress(addressComponents);
  }, [village, tahsil, district]);

  useEffect(() => {
    if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
      if (selectedBundle) {
        // Exclude vehicle cost when a bundle is selected
        setVehicleType('');
        setVehicleCost(0);
      } else {
        const totalWorkers = maleWorkers + femaleWorkers;
        if (totalWorkers >= 1 && totalWorkers <= 4) {
          setVehicleType('Bike');
          setVehicleCost(totalWorkers * 30);
        } else if (totalWorkers >= 5 && totalWorkers <= 6) {
          setVehicleType('UV Auto');
          setVehicleCost(150);
        } else if (totalWorkers >= 7 && totalWorkers <= 10) {
          setVehicleType('Omni');
          setVehicleCost(300);
        } else if (totalWorkers >= 11 && totalWorkers <= 20) {
          setVehicleType('Tata Magic');
          setVehicleCost(400);
        } else if (totalWorkers > 20) {
          setVehicleType('Bolero');
          setVehicleCost(400);
        } else {
          setVehicleType('');
          setVehicleCost(0);
        }
      }
    } else {
      setVehicleType('');
      setVehicleCost(0);
    }
  }, [selectedService, maleWorkers, femaleWorkers, selectedBundle, bundles]);

  const handleServiceChange = (type) => {
    setSelectedService(type);
    setMaleWorkers(0);
    setFemaleWorkers(0);
    setOtherWorkers(0);
    setHours('1');
    setSelectedBundle('');
    setAddress('');
    setDistrict('');
    setTahsil('');
    setVillage('');
    setContactNumber('');
    setPaymentMethod('');
    setAdditionalNote('');
    setNumberOfDays('1');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setCurrentStep(0);
    setSuccess('');
    setError('');
    setPaymentStatus('');
    setVehicleType('');
    setVehicleCost(0);
    setShowCashModal(false);

    const orderSection = document.getElementById('order');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const validateStep = () => {
    setError('');
    if (currentStep === 0) {
      if (!selectedService) {
        setError('Please select a service.');
        return false;
      }
      if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
        if (!selectedBundle && (maleWorkers <= 0 && femaleWorkers <= 0)) {
          setError('Please select a bundle or specify at least one worker.');
          return false;
        }
      } else {
        if (otherWorkers <= 0) {
          setError('Please specify at least 1 worker.');
          return false;
        }
      }
      if (selectedService === 'ownertc' && parseInt(hours) < 1) {
        setError('Please specify at least hours.');
        return false;
      }
      return true;
    } else if (currentStep === 1) {
      if (!numberOfDays || !startDate || !endDate || !startTime) {
        setError('Please fill in all date and time fields.');
        return false;
      }
      if (new Date(startDate) < new Date('2025-07-20')) {
        setError('Start date must be on or after July 20, 2025.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!address || !contactNumber || !district || !tahsil || !village) {
        setError('Please fill in all address and contact number fields.');
        return false;
      }
      if (contactNumber.length !== 10 || !/^\d{10}$/.test(contactNumber)) {
        setError('Contact number must be exactly 10 digits.');
        return false;
      }
      if (!paymentMethod) {
        setError('Please select a payment method.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!user) {
      setError('Please log in to book a service.');
      navigate('/login');
      return;
    }

    if (validateStep()) {
      setCurrentStep(currentStep < steps.length - 1 ? currentStep + 1 : currentStep);
    }
  };

  const handlePrevious = () => {
    setError('');
    setPaymentStatus('');
    setShowCashModal(false);
    setCurrentStep(currentStep - 1);
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentMethod(method);
    if (method === 'cash') {
      setShowCashModal(true);
    } else {
      setShowCashModal(false);
    }
  };

  const closeCashModal = () => {
    setShowCashModal(false);
  };

  const renderCashModal = () => {
    if (!showCashModal) return null;
    const service = services.find(s => s.type === selectedService);
    if (!service) return null;

    const days = parseInt(numberOfDays || 0);
    let workersCost = 0;
    let serviceFee = 0;
    const serviceFeeRate = 0.05;

    if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
      if (selectedBundle) {
        const bundle = bundles.find(b => b.id === selectedBundle);
        if (bundle) {
          workersCost = bundle.price * days;
          serviceFee = workersCost * serviceFeeRate;
        }
      } else {
        workersCost = (maleWorkers * service.maleCost + femaleWorkers * service.femaleCost) * days;
        serviceFee = workersCost * serviceFeeRate;
      }
    } else if (selectedService === 'ownertc') {
      workersCost = parseInt(hours) * service.cost * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
    } else {
      workersCost = service.cost * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>{t.cashPaymentModalTitle}</h3>
          <p>{t.cashPaymentModalMessage}</p>
          <p>
            <strong>{t.serviceFee} (5%):</strong> ₹{serviceFee.toFixed(2)} ({t.payOnline})
          </p>
          <p>
            <strong>{t.workersCost}:</strong> ₹{workersCost.toFixed(2)} ({t.payOffline})
          </p>
          <button className="modal-button" onClick={closeCashModal}>
            {t.understood}
          </button>
        </div>
      </div>
    );
  };

  const sendAdminWhatsAppMessage = async () => {
    const service = services.find(s => s.type === selectedService);
    const days = parseInt(numberOfDays || 0);
    let workersCost = 0;
    let serviceFee = 0;
    const serviceFeeRate = 0.05;
    let totalCost = 0;
    let maleWorkersCount = 0;
    let femaleWorkersCount = 0;

    if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
      if (selectedBundle) {
        const bundle = bundles.find(b => b.id === selectedBundle);
        workersCost = bundle.price * days;
        serviceFee = workersCost * serviceFeeRate;
        totalCost = workersCost * days + serviceFee; // Exclude vehicleCost
        maleWorkersCount = bundle.maleWorkers;
        femaleWorkersCount = bundle.femaleWorkers;
      } else {
        workersCost = (maleWorkers * (service.maleCost || 0) + femaleWorkers * (service.femaleCost || 0)) * days;
        serviceFee = workersCost * serviceFeeRate;
        totalCost = (workersCost + vehicleCost) * days + serviceFee;
        maleWorkersCount = maleWorkers;
        femaleWorkersCount = femaleWorkers;
      }
    } else if (selectedService === 'ownertc') {
      workersCost = parseInt(hours) * (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
    } else {
      workersCost = (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
    }

    const farmerName = user.displayName || 'शेतकरी';
    const serviceName = service ? (language === 'marathi' ? service.nameMarathi || service.name : service.name) : selectedService;
    const pinCode = user.pinCode || 'प्रदान केले नाही';
    const adminWhatsAppNumber = '+918788647637';

    const contentVariables = {
      "1": farmerName,
      "2": serviceName,
      "3": (maleWorkersCount + femaleWorkersCount).toString(),
      "4": maleWorkersCount.toString(),
      "5": femaleWorkersCount.toString(),
      "6": vehicleType || 'काही नाही',
      "7": vehicleCost.toString() || '0',
      "8": workersCost.toFixed(2),
      "9": serviceFee.toFixed(2),
      "10": totalCost.toFixed(2),
      "11": startDate || 'प्रदान केले नाही',
      "12": address || 'प्रदान केले नाही',
      "13": pinCode,
      "14": contactNumber || 'प्रदान केले नाही',
      "15": paymentMethod === 'razorpay'
        ? 'ऑनलाइन (Razorpay)'
        : paymentMethod === 'cash'
          ? 'रोख (सेवा शुल्क ऑनलाइन)'
          : 'अज्ञात',
      "16": paymentStatus === 'service_fee_paid'
        ? 'सेवा शुल्क भरले'
        : paymentStatus === 'paid'
          ? 'पूर्ण भरले'
          : paymentStatus === 'failed'
            ? 'अयशस्वी'
            : 'प्रलंबित'
    };

    try {
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: adminWhatsAppNumber,
          contentSid: 'HX3dfc5ca3689783b05c3c3e4522a289de',
          contentVariables
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send WhatsApp to admin:', errorData);
        setError('ऑर्डर बुक झाली, पण WhatsApp सूचना पाठवण्यात अयशस्वी.');
      }
    } catch (err) {
      console.error('Error sending WhatsApp to admin:', err);
      setError('ऑर्डर बुक झाली, पण WhatsApp सूचना पाठवण्यात अयशस्वी.');
    }
  };

  const sendFarmerWhatsAppMessage = async () => {
    const service = services.find(s => s.type === selectedService);
    const days = parseInt(numberOfDays || 0);
    let workersCost = 0;
    let serviceFee = 0;
    const serviceFeeRate = 0.05;
    let totalCost = 0;
    let maleWorkersCount = 0;
    let femaleWorkersCount = 0;

    if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
      if (selectedBundle) {
        const bundle = bundles.find(b => b.id === selectedBundle);
        workersCost = bundle.price * days;
        serviceFee = workersCost * serviceFeeRate;
        totalCost = workersCost * days + serviceFee; // Exclude vehicleCost
        maleWorkersCount = bundle.maleWorkers;
        femaleWorkersCount = bundle.femaleWorkers;
      } else {
        workersCost = (maleWorkers * (service.maleCost || 0) + femaleWorkers * (service.femaleCost || 0)) * days;
        serviceFee = workersCost * serviceFeeRate;
        totalCost = (workersCost + vehicleCost) * days + serviceFee;
        maleWorkersCount = maleWorkers;
        femaleWorkersCount = femaleWorkers;
      }
    } else if (selectedService === 'ownertc') {
      workersCost = parseInt(hours) * (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
    } else {
      workersCost = (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
    }

    const farmerName = user.displayName || 'शेतकरी';
    const serviceName = service ? (language === 'marathi' ? service.nameMarathi || service.name : service.name) : selectedService;
    const pinCode = user.pinCode || 'प्रदान केले नाही';

    const contentVariables = {
      "1": farmerName,
      "2": serviceName,
      "3": (maleWorkersCount + femaleWorkersCount).toString(),
      "4": maleWorkersCount.toString(),
      "5": femaleWorkersCount.toString(),
      "6": vehicleType || 'काही नाही',
      "7": vehicleCost.toString() || '0',
      "8": workersCost.toFixed(2),
      "9": serviceFee.toFixed(2),
      "10": totalCost.toFixed(2),
      "11": startDate || 'प्रदान केले नाही',
      "12": endDate || 'प्रदान केले नाही',
      "13": startTime || 'प्रदान केले नाही',
      "14": address || 'प्रदान केले नाही',
      "15": pinCode,
      "16": contactNumber || 'प्रदान केले नाही',
      "17": paymentMethod === 'razorpay'
        ? 'ऑनलाइन (Razorpay)'
        : paymentMethod === 'cash'
          ? 'रोख (सेवा शुल्क ऑनलाइन)'
          : 'अज्ञात',
      "18": paymentStatus === 'service_fee_paid'
        ? 'सेवा शुल्क भरले'
        : paymentStatus === 'paid'
          ? 'पूर्ण भरले'
          : paymentStatus === 'failed'
            ? 'अयशस्वी'
            : 'प्रलंबित'
    };

    try {
      const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `+91${contactNumber}`,
          contentSid: 'HXe4314b0088e9ef328b084ead9056ae9f',
          contentVariables
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send WhatsApp to farmer:', errorData);
        setError('ऑर्डर बुक झाली, पण शेतकऱ्याला WhatsApp सूचना पाठवण्यात अयशस्वी.');
      }
    } catch (err) {
      console.error('Error sending WhatsApp to farmer:', err);
      setError('ऑर्डर बुक झाली, पण शेतकऱ्याला WhatsApp सूचना पाठवण्यात अयशस्वी.');
    }
  };

  const handleBookService = async () => {
    if (!user) {
      setError('Please log in to book a service.');
      return;
    }

    setLoading(true);
    let orderData = {
      farmerId: user.uid,
      serviceType: selectedService || 'unknown',
      status: 'pending',
      createdAt: new Date(),
      address: address || '',
      fullAddress: address || '',
      contactNumber: contactNumber || '',
      paymentMethod: paymentMethod || 'unknown',
      additionalNote: additionalNote || '',
      numberOfDays: parseInt(numberOfDays) || 1,
      startDate: startDate || '',
      endDate: endDate || '',
      startTime: startTime || '',
      workerId: null,
      paymentStatus: { status: 'pending' },
    };

    try {
      const service = services.find(s => s.type === selectedService);
      if (!service) {
        throw new Error('Selected service not found.');
      }

      let workersCost = 0;
      const serviceFeeRate = 0.05;
      let serviceFee = 0;
      let totalCost = 0;
      let maleWorkersCount = 0;
      let femaleWorkersCount = 0;

      orderData.serviceId = service.id;

      if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
        if (selectedBundle) {
          const bundle = bundles.find(b => b.id === selectedBundle);
          if (!bundle) {
            throw new Error('Selected bundle not found.');
          }
          orderData.bundleDetails = {
            name: bundle.name,
            maleWorkers: bundle.maleWorkers,
            femaleWorkers: bundle.femaleWorkers,
            price: bundle.price,
          };
          maleWorkersCount = bundle.maleWorkers;
          femaleWorkersCount = bundle.femaleWorkers;
          orderData.totalWorkers = bundle.maleWorkers + bundle.femaleWorkers;
          workersCost = bundle.price * parseInt(numberOfDays);
          if (isNaN(workersCost) || workersCost <= 0) {
            throw new Error('Invalid workers cost for bundle.');
          }
          serviceFee = workersCost * serviceFeeRate;
          totalCost = workersCost * parseInt(numberOfDays) + serviceFee; // Exclude vehicleCost
        } else {
          orderData.maleWorkers = maleWorkers;
          orderData.femaleWorkers = femaleWorkers;
          maleWorkersCount = maleWorkers;
          femaleWorkersCount = femaleWorkers;
          orderData.totalWorkers = maleWorkers + femaleWorkers;
          workersCost = (maleWorkers * (service.maleCost || 0) + femaleWorkers * (service.femaleCost || 0)) * parseInt(numberOfDays);
          if (isNaN(workersCost) || workersCost <= 0) {
            throw new Error('Invalid workers cost for individual workers.');
          }
          serviceFee = workersCost * serviceFeeRate;
          totalCost = (workersCost + vehicleCost) * parseInt(numberOfDays) + serviceFee;
        }
        orderData.vehicleType = vehicleType;
        orderData.vehicleCost = vehicleCost;
      } else {
        orderData.totalWorkers = otherWorkers;
        if (selectedService === 'ownertc') {
          orderData.hours = parseInt(hours);
          workersCost = parseInt(hours) * (service.cost || 0) * otherWorkers * parseInt(numberOfDays);
          if (isNaN(workersCost) || workersCost <= 0) {
            throw new Error('Invalid workers cost for ownertc service.');
          }
          serviceFee = workersCost * serviceFeeRate;
          totalCost = workersCost + serviceFee;
        } else {
          workersCost = (service.cost || 0) * otherWorkers * parseInt(numberOfDays);
          if (isNaN(workersCost) || workersCost <= 0) {
            throw new Error('Invalid workers cost for other service.');
          }
          serviceFee = workersCost * serviceFeeRate;
          totalCost = workersCost + serviceFee;
        }
      }

      orderData.cost = workersCost;
      orderData.serviceFee = serviceFee;
      orderData.workersCost = workersCost;
      orderData.totalCost = totalCost;

      const paymentAmount = paymentMethod === 'cash' ? serviceFee : totalCost;

      if (paymentMethod === 'razorpay' || paymentMethod === 'cash') {
        const options = {
          key: 'rzp_live_2dmmin7Uu7tyRI',
          amount: Math.round(paymentAmount * 100),
          currency: 'INR',
          name: 'KhetiSathi',
          description: paymentMethod === 'cash' ? `Service fee payment for ${selectedService}` : `Payment for ${selectedService} with service fee`,
          handler: async (response) => {
            try {
              orderData.paymentStatus = {
                status: paymentMethod === 'cash' ? 'service_fee_paid' : 'paid',
                razorpay_payment_id: response.razorpay_payment_id,
              };
              await addDoc(collection(db, 'orders'), orderData);
              setSuccess('Service booked successfully!');
              setPaymentStatus(paymentMethod === 'cash' ? 'service_fee_paid' : 'paid');
              setError('');
              handleNext();

              // Send WhatsApp messages to admin and farmer
              await sendAdminWhatsAppMessage();
              await sendFarmerWhatsAppMessage();
            } catch (err) {
              setError(`Error saving order: ${err.message}`);
              setPaymentStatus('failed');
              orderData.paymentStatus = {
                status: 'failed',
                error: err.message,
              };
              await addDoc(collection(db, 'orders'), orderData);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user.displayName || 'Farmer',
            email: user.email || '',
            contact: contactNumber,
          },
          theme: {
            color: '#F59E0B',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', async (response) => {
          setError(`Payment failed: ${response.error.description}`);
          setPaymentStatus('failed');
          orderData.paymentStatus = {
            status: 'failed',
            error: response.error.description,
          };
          try {
            await addDoc(collection(db, 'orders'), orderData);
          } catch (err) {
            console.error('Error saving failed order:', err);
          }
          setLoading(false);
        });
        razorpay.open();
      }
    } catch (err) {
      setError(`Error booking service: ${err.message}`);
      setPaymentStatus('failed');
      orderData.paymentStatus = {
        status: 'failed',
        error: err.message,
      };
      try {
        await addDoc(collection(db, 'orders'), orderData);
      } catch (saveErr) {
        console.error('Error saving failed order:', saveErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setMaleWorkers(0);
    setFemaleWorkers(0);
    setOtherWorkers(0);
    setHours('1');
    setSelectedBundle('');
    setAddress('');
    setDistrict('');
    setTahsil('');
    setVillage('');
    setContactNumber('');
    setPaymentMethod('');
    setAdditionalNote('');
    setNumberOfDays('1');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setCurrentStep(0);
    setSuccess('');
    setError('');
    setPaymentStatus('');
    setVehicleType('');
    setVehicleCost(0);
    setShowCashModal(false);
    window.location.href = '/farmer-dashboard';
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 18; hour++) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour <= 12 ? hour : hour - 12;
      times.push(`${displayHour}:00 ${period}`);
      if (hour < 18) times.push(`${displayHour}:30 ${period}`);
    }
    return times;
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      setContactNumber(value);
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Bike':
        return 'fas fa-motorcycle';
      case 'UV Auto':
        return 'fas fa-taxi';
      case 'Omni':
        return 'fas fa-van-shuttle';
      case 'Tata Magic':
        return 'fas fa-bus';
      case 'Bolero':
        return 'fas fa-car';
      default:
        return '';
    }
  };

  const renderCostBreakdown = () => {
    const service = services.find(s => s.type === selectedService);
    const days = parseInt(numberOfDays || 0);
    let workersCost = 0;
    let serviceFee = 0;
    const serviceFeeRate = 0.05;
    let totalCost = 0;

    if (!service) {
      return <div className="cost-breakdown"><p>{t.noServiceSelected}</p></div>;
    }

    if (selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') {
      if (selectedBundle) {
        const bundle = bundles.find(b => b.id === selectedBundle);
        if (bundle) {
          workersCost = bundle.price * days;
          serviceFee = workersCost * serviceFeeRate;
          totalCost = workersCost * days + serviceFee; // Exclude vehicleCost
          return (
            <div className="cost-breakdown">
              <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost.toFixed(2)} ({t.bundle}: ₹{bundle.price}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day}) {paymentMethod === 'cash' && `(${t.payOffline})`}</p>
              <p><span className="review-label">{t.serviceFee} (5%):</span> ₹{serviceFee.toFixed(2)} {paymentMethod === 'cash' ? `(${t.payOnline})` : ''}</p>
              <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost.toFixed(2)}</p>
            </div>
          );
        }
      } else {
        workersCost = (maleWorkers * (service.maleCost || 0) + femaleWorkers * (service.femaleCost || 0)) * days;
        serviceFee = workersCost * serviceFeeRate;
        totalCost = (workersCost + vehicleCost) * days + serviceFee;
        return (
          <div className="cost-breakdown">
            <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost.toFixed(2)} ({maleWorkers} {t.maleWorkers} @ ₹{service.maleCost || 0}/{t.day} + {femaleWorkers} {t.femaleWorkers} @ ₹{service.femaleCost || 0}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day}) {paymentMethod === 'cash' && `(${t.payOffline})`}</p>
            <p><span className="review-label">{t.vehicleCost}:</span> ₹{(vehicleCost * days).toFixed(2)} ({vehicleType}: ₹{vehicleCost}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day}) {paymentMethod === 'cash' && `(${t.payOffline})`}</p>
            <p><span className="review-label">{t.serviceFee} (5%):</span> ₹{serviceFee.toFixed(2)} {paymentMethod === 'cash' ? `(${t.payOnline})` : ''}</p>
            <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost.toFixed(2)}</p>
          </div>
        );
      }
    } else if (selectedService === 'ownertc') {
      workersCost = parseInt(hours) * (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
      return (
        <div className="cost-breakdown">
          <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost.toFixed(2)} ({otherWorkers} {t.otherWorkers} @ ₹{service.cost || 0}/{t.hours.toLowerCase()} × {hours} {t.hours.toLowerCase()} × {days} {days > 1 ? t.daysPlural : t.day}) {paymentMethod === 'cash' && `(${t.payOffline})`}</p>
          <p><span className="review-label">{t.serviceFee} (5%):</span> ₹{serviceFee.toFixed(2)} {paymentMethod === 'cash' ? `(${t.payOnline})` : ''}</p>
          <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost.toFixed(2)}</p>
        </div>
      );
    } else {
      workersCost = (service.cost || 0) * otherWorkers * days;
      serviceFee = workersCost * serviceFeeRate;
      totalCost = workersCost + serviceFee;
      return (
        <div className="cost-breakdown">
          <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost.toFixed(2)} ({otherWorkers} {t.otherWorkers} @ ₹{service.cost || 0}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day}) {paymentMethod === 'cash' && `(${t.payOffline})`}</p>
          <p><span className="review-label">{t.serviceFee} (5%):</span> ₹{serviceFee.toFixed(2)} {paymentMethod === 'cash' ? `(${t.payOnline})` : ''}</p>
          <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost.toFixed(2)}</p>
        </div>
      );
    }
    return <div className="cost-breakdown"><p>{t.noServiceSelected}</p></div>;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">{t.serviceType}</label>
              <select
                className="select-field"
                value={selectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                required
              >
                <option value="">{t.selectService}</option>
                {services.map(s => (
                  <option key={s.id} value={s.type}>{language === 'english' ? s.name : language === 'hindi' ? s.nameHindi || s.name : s.nameMarathi || s.name}</option>
                ))}
              </select>
            </div>
            {(selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') && (
              <>
                <div className="input-wrapper">
                  <label className="input-label">{t.selectBundle}</label>
                  <select
                    className="select-field"
                    value={selectedBundle}
                    onChange={(e) => setSelectedBundle(e.target.value)}
                  >
                    <option value="">{t.noBundle}</option>
                    {bundles.map(b => (
                      <option key={b.id} value={b.id}>
                        ₹{b.price} - {language === 'english' ? b.name : language === 'hindi' ? b.nameHindi || b.name : b.nameMarathi || b.name} ({b.maleWorkers} {t.maleWorkers} पेंडकर + {b.femaleWorkers} {t.femaleWorkers})
                      </option>
                    ))}
                  </select>
                </div>
                {!selectedBundle && (
                  <>
                    <div className="input-wrapper">
                      <label className="input-label">
                        {t.maleWorkers} (₹{services.find(s => s.type === selectedService)?.maleCost || 0}/{t.day})
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={maleWorkers}
                        onChange={(e) => setMaleWorkers(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">
                        {t.femaleWorkers} (₹{services.find(s => s.type === selectedService)?.femaleCost || 0}/{t.day})
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={femaleWorkers}
                        onChange={(e) => setFemaleWorkers(Math.max(0, Number(e.target.value) || 0))}
                        min="0"
                      />
                    </div>
                    {vehicleType && (
                      <div className="input-wrapper">
                        <label className="input-label">{t.vehicleType}</label>
                        <div className="vehicle-info">
                          <i className={`${getVehicleIcon(vehicleType)} vehicle-icon`}></i>
                          <span>{vehicleType} (₹{vehicleCost}/{t.day})</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {selectedService && selectedService !== 'farm-workers' && selectedService !== 'ploughing-laborer' && (
              <div className="input-wrapper">
                <label className="input-label">
                  {t.otherWorkers}
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={otherWorkers}
                  onChange={(e) => setOtherWorkers(Math.max(0, Number(e.target.value) || 0))}
                  min="0"
                  required
                />
              </div>
            )}
            {selectedService === 'ownertc' && (
              <div className="input-wrapper">
                <label className="input-label">
                  {t.hours} (₹{services.find(s => s.type === selectedService)?.cost || 0}/{t.hours.toLowerCase()})
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={hours}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 1) {
                      setHours(value);
                    }
                  }}
                  min="1"
                  required
                />
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="input-group">
            <div className="input-wrapper">
              <label className="input-label">{t.numberOfDays}</label>
              <select
                className="select-field"
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(e.target.value)}
                required
              >
                {[...Array(7).keys()].map(i => (
                  <option key={i + 1} value={i + 1}>{i + 1} {i > 0 ? t.daysPlural : t.day}</option>
                ))}
              </select>
            </div>
            <div className="input-wrapper">
              <label className="input-label">{t.startDate}</label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min="2025-07-20"
                required
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">{t.endDate}</label>
              <input
                type="date"
                className="input-field readonly"
                value={endDate}
                readOnly
              />
            </div>
            <div className="input-wrapper">
              <label className="input-label">{t.startTime}</label>
              <select
                className="select-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              >
                <option value="">{t.selectTime}</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="input-group">
            <div>
              <h3 className="section-title">{t.locationDetails}</h3>
              <div className="input-group">
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div className="input-wrapper" style={{margin:'5px'}}>
                    <label className="input-label">{t.district}</label>
                    <select
                      className="select-field"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    >
                      <option value="">{t.selectDistrict}</option>
                      <option value="Bhandara">Bhandara</option>
                    </select>
                  </div>
                  <div className="input-wrapper" style={{margin:'5px'}}>
                    <label className="input-label">{t.tahsil}</label>
                    <select
                      className="select-field"
                      value={tahsil}
                      onChange={(e) => setTahsil(e.target.value)}
                      required
                    >
                      <option value="">{t.selectTahsil}</option>
                      <option value="Lakhani">Lakhani</option>
                    </select>
                  </div>
                  <div className="input-wrapper" style={{margin:'5px'}}>
                    <label className="input-label">{t.village}</label>
                    <select
                      className="select-field"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      required
                    >
                      <option value="">{t.selectVillage}</option>
                      <option value="Lakhori">Lakhori</option>
                    </select>
                  </div>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">{t.fullAddress}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">{t.contactNumber}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={contactNumber}
                    onChange={handleContactNumberChange}
                    maxLength="10"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="section-title">{t.paymentDetails}</h3>
              <div className="input-group">
                <div className="input-wrapper">
                  <label className="input-label">{t.paymentMethod}</label>
                  <select
                    className="select-field"
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    required
                  >
                    <option value="">{t.selectMethod}</option>
                    <option value="cash">{t.cash}</option>
                    <option value="razorpay">{t.online}</option>
                  </select>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">{t.additionalNote}</label>
                  <textarea
                    className="textarea-field"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </div>
            {renderCashModal()}
          </div>
        );
      case 3:
        return (
          <div className="input-group">
            <h3 className="review-title">{t.reviewOrder}</h3>
            <div className="review-details">
              <div className="review-grid">
                <p><span className="review-label">{t.service}:</span> {services.find(s => s.type === selectedService)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi'] || selectedService}</p>
                {(selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') && (
                  <>
                    {selectedBundle ? (
                      <p><span className="review-label">{t.bundle}:</span> {bundles.find(b => b.id === selectedBundle)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi']} ({bundles.find(b => b.id === selectedBundle)?.maleWorkers} {t.maleWorkers} + {bundles.find(b => b.id === selectedBundle)?.femaleWorkers} {t.femaleWorkers})</p>
                    ) : (
                      <>
                        <p><span className="review-label">{t.maleWorkers}:</span> {maleWorkers}</p>
                        <p><span className="review-label">{t.femaleWorkers}:</span> {femaleWorkers}</p>
                      </>
                    )}
                    {vehicleType && !selectedBundle && (
                      <p><span className="review-label">{t.vehicleType}:</span> <i className={`${getVehicleIcon(vehicleType)} vehicle-icon`}></i> {vehicleType}</p>
                    )}
                  </>
                )}
                {selectedService !== 'farm-workers' && selectedService !== 'ploughing-laborer' && (
                  <p><span className="review-label">{t.otherWorkers}:</span> {otherWorkers}</p>
                )}
                {selectedService === 'ownertc' && <p><span className="review-label">{t.hours}:</span> {hours}</p>}
                <p><span className="review-label">{t.days}:</span> {numberOfDays} {numberOfDays > 1 ? t.daysPlural : t.day}</p>
                <p><span className="review-label">{t.startDate}:</span> {startDate}</p>
                <p><span className="review-label">{t.endDate}:</span> {endDate}</p>
                <p><span className="review-label">{t.startTime}:</span> {startTime}</p>
                <p><span className="review-label">{t.address}:</span> {address}</p>
                <p><span className="review-label">{t.contact}:</span> {contactNumber}</p>
                <p><span className="review-label">{t.payment}:</span> {t[paymentMethod] || 'Razorpay'} {paymentMethod === 'cash' ? `(${t.serviceFee} ${t.payOnline}, ${t.workersCost} ${t.payOffline})` : ''}</p>
                <p><span className="review-label">{t.note}:</span> {additionalNote || 'None'}</p>
              </div>
              <div>{renderCostBreakdown()}</div>
            </div>
            <button
              className="submit-button"
              onClick={handleBookService}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <i className="fas fa-tractor"></i>
              )}
              {t.submitOrder}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="success-container">
            <div className="success-icon-container">
              <i className={`fas fa-check success-icon ${paymentStatus === 'failed' ? 'error-icon' : ''}`}></i>
            </div>
            <h3 className="success-title">{t.serviceBooked}</h3>
            <p className="success-message">{t.orderPlaced}</p>
            <p className={`payment-status ${paymentStatus === 'paid' || paymentStatus === 'service_fee_paid' ? 'success' : paymentStatus === 'failed' ? 'error' : ''}`}>
              {t.paymentStatus}: {paymentStatus === 'paid' ? t.paid : paymentStatus === 'service_fee_paid' ? t.serviceFeePaid : paymentStatus === 'failed' ? t.failed : t.pending}
            </p>
            <div className="success-details">
              <p><span className="review-label">{t.service}:</span> {services.find(s => s.type === selectedService)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi'] || selectedService}</p>
              {(selectedService === 'farm-workers' || selectedService === 'ploughing-laborer') && (
                <>
                  {selectedBundle ? (
                    <p><span className="review-label">{t.bundle}:</span> {bundles.find(b => b.id === selectedBundle)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi']} ({bundles.find(b => b.id === selectedBundle)?.maleWorkers} {t.maleWorkers} + {bundles.find(b => b.id === selectedBundle)?.femaleWorkers} {t.femaleWorkers})</p>
                  ) : (
                    <>
                      <p><span className="review-label">{t.maleWorkers}:</span> {maleWorkers}</p>
                      <p><span className="review-label">{t.femaleWorkers}:</span> {femaleWorkers}</p>
                    </>
                  )}
                  {vehicleType && !selectedBundle && (
                    <p><span className="review-label">{t.vehicleType}:</span> <i className={`${getVehicleIcon(vehicleType)} vehicle-icon`}></i> {vehicleType}</p>
                  )}
                </>
              )}
              {selectedService !== 'farm-workers' && selectedService !== 'ploughing-laborer' && (
                <p><span className="review-label">{t.otherWorkers}:</span> {otherWorkers}</p>
              )}
              <p><span className="review-label">{t.days}:</span> {numberOfDays} {numberOfDays > 1 ? t.daysPlural : t.day}</p>
              <p><span className="review-label">{t.startDate}:</span> {startDate}</p>
              <div>{renderCostBreakdown()}</div>
            </div>
            <button
              className="back-button"
              onClick={resetForm}
            >
              {t.backToHome}
            </button>
            <canvas className="confetti-canvas" id="confetti-canvas"></canvas>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (currentStep === 4 && paymentStatus !== 'failed') {
      const canvas = document.getElementById('confetti-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const confetti = [];
        const colors = ['#F59E0B', '#10B981', '#3B82F6'];

        for (let i = 0; i < 100; i++) {
          confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 4 + 2,
            d: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngle: Math.random() * Math.PI
          });
        }

        let animationFrame;
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          confetti.forEach(c => {
            c.tiltAngle += 0.1;
            c.y += c.d;
            c.x += Math.sin(c.tiltAngle) * 0.5;
            c.tilt = Math.sin(c.tiltAngle) * 15;

            if (c.y > canvas.height) {
              c.y = -c.r;
              c.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.lineWidth = c.r;
            ctx.strokeStyle = c.color;
            ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
            ctx.lineTo(c.x + c.tilt - c.r / 2, c.y + c.tilt);
            ctx.stroke();
          });
          animationFrame = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrame);
      }
    }
  }, [currentStep, paymentStatus]);

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <Carousel
          language={language}
          setLanguage={setLanguage}
          translations={translations}
        />
      </section>

      <section className="services-section">
        <h2 className="services-title">{t.ourServices}</h2>
        {isServicesLoading ? (
          <div className="services-loader-container">
            <div className="services-loader"></div>
          </div>
        ) : (
          <div className="services-grid">
            {services
              .slice()
              .sort((a, b) => {
                const isAPopular = a.type === 'farm-workers' || a.type === 'ploughing-laborer';
                const isBPopular = b.type === 'farm-workers' || b.type === 'ploughing-laborer';
                return isBPopular - isAPopular;
              })
              .map((s, index) => (
                <div
                  key={s.id}
                  onClick={() => handleServiceChange(s.type)}
                  className={`service-card ${index % 3 === 0 ? 'orange-border' : index % 3 === 1 ? 'green-border' : 'blue-border'}`}
                >
                  <div className="service-image-container">
                    <img
                      src={s.image || 'https://images.unsplash.com/photo-1592210454359-9047f8d00805?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                      alt={s.name}
                      className="service-image"
                    />
                    <div className="service-overlay"></div>
                  </div>
                  <div className="service-content">
                    <div className="service-tags">
                      <div className="service-pricing">
                        {(s.type === 'farm-workers' || s.type === 'ploughing-laborer') && (
                          <>
                            <span className="male-price">
                              <i className="fas fa-male"></i> ₹{s.maleCost || 'N/A'}/{t.day}
                            </span>
                            <span className="female-price">
                              <i className="fas fa-female"></i> ₹{s.femaleCost || 'N/A'}/{t.day}
                            </span>
                          </>
                        )}
                        <span className={`service-cost ${index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange'}`}>
                          {(s.type === 'farm-workers' || s.type === 'ploughing-laborer') ? t.custom : `₹${s.cost || 0}${s.type === 'ownertc' ? `/${t.hours.toLowerCase()}` : `/${t.day}`}`}
                        </span>
                        {s.type === 'farm-workers' && (
                          <span className={`service-cost ${index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange'}`}>
                            वेळ(स.९ ते सायं 5)
                          </span>
                        )}


                      </div>
                    </div>
                    {(s.type === 'farm-workers' || s.type === 'ploughing-laborer') && (
                      <div className="popular-tag-container">
                        <span className="popular-tag">
                          <i className="fas fa-star"></i> {t.popular}
                        </span>
                      </div>
                    )}
                    <div className="service-name-container">
                      <span className={`service-name ${index % 3 === 0 ? 'orange' : index % 3 === 1 ? 'green' : 'blue'}`}>
                        {language === 'english' ? s.name : language === 'hindi' ? s.nameHindi || s.name : s.nameMarathi || s.name}
                      </span>
                    </div>
                  </div>
                  <div className={`select-button ${index % 3 === 0 ? 'orange' : index % 3 === 1 ? 'green' : 'blue'}`}>
                    {t.select}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section id="order" className="order-section">
        <div className="order-container">
          <h2 className="order-title">
            <i className="fas fa-tractor"></i>
            {t.bookService}
          </h2>
          {error && <p className="error-message">{error}</p>}
          {success && currentStep < 4 && <p className="success-message">{success}</p>}

          <div className="stepper-container">
            <div className="stepper">
              {steps.map((step, index) => (
                <div key={index} className="step">
                  <div className={`step-icon ${index <= currentStep ? 'active' : ''}`}>
                    <i className={step.icon}></i>
                  </div>
                  <p className="step-label">{step.label}</p>
                </div>
              ))}
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="step-content">{renderStepContent()}</div>

          {currentStep < 4 && (
            <div className="button-group">
              {currentStep > 0 && (
                <button
                  className="back-button-nav"
                  onClick={handlePrevious}
                >
                  Back
                </button>
              )}
              {currentStep < 3 && (
                <button
                  className="next-button"
                  onClick={handleNext}
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <h2 className="testimonials-title">{t.whatFarmersSay}</h2>
        <div className="testimonials-grid">
          {[
            { quote: t.testimonial1, name: t.farmer1.split(', ')[0], role: t.farmer1.split(', ')[1], color: 'yellow' },
            { quote: t.testimonial2, name: t.farmer2.split(', ')[0], role: t.farmer2.split(', ')[1], color: 'green' },
            { quote: t.testimonial3, name: t.farmer3.split(', ')[0], role: t.farmer3.split(', ')[1], color: 'blue' }
          ].map((t, i) => (
            <div key={i} className={`testimonial-card ${t.color}`}>
              <p className="testimonial-quote">"{t.quote}"</p>
              <p className="testimonial-name">{t.name}</p>
              <p className="testimonial-role">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="app-download" className="app-download-section">
        <div style={{display:'flex',justifyContent:'center'}}><img src='https://i.ibb.co/4nxw7GR6/image-5-removebg-preview.png' height={50} width={150} alt='farmer'/></div>
        <h2 className="app-download-title">{t.downloadApp}</h2>
        <p className="app-download-description">{t.downloadAppDescription}</p>
        <div className="app-download-buttons">
          <a
            href="https://drive.google.com/uc?export=download&id=191sEwBUhbgjQyHT5LZ42ELtf8-Np3yNz"
            target="_blank"
            rel="noopener noreferrer"
            className="app-download-button google-play"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" />
          </a>
          <a
            href="https://drive.google.com/uc?export=download&id=191sEwBUhbgjQyHT5LZ42ELtf8-Np3yNz"
            target="_blank"
            rel="noopener noreferrer"
            className="app-download-button app-store"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
          </a>
        </div>
      </section>

      <Footer language={language} translations={translations} />
    </div>
  );
};

export default Home;
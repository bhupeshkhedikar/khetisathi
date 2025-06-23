import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged } from './firebaseConfig.js';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import Carousel from './Carousel';
import Footer from './Footer';
import './Home.css';

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
  const navigate = useNavigate();

  const translations = {
    english: {
      farmConnect: "KhetiSathi",
      tagline: "Seamlessly book farm workers and services to boost your harvest.",
      getStarted: "Get Started",
      ourServices: "Our Services",
      custom: "Custom",
      popular: "Popular",
      select: "Select",
      bookService: "Book a Service",
      serviceType: "Service Type",
      selectService: "Select Service",
      selectBundle: "Select Bundle",
      noBundle: "No Bundle (Custom)",
      maleWorkers: "Male Workers",
      femaleWorkers: "Female Workers",
      otherWorkers: "Number of Workers",
      hours: "Hours",
      numberOfDays: "Number of Days",
      startDate: "Start Date",
      endDate: "End Date",
      startTime: "Start Time",
      selectTime: "Select Time",
      locationDetails: "Location Details",
      fullAddress: "Full Address",
      contactNumber: "Contact Number",
      paymentDetails: "Payment Details",
      paymentMethod: "Payment Method",
      selectMethod: "Select Method",
      cash: "Cash",
      online: "Online",
      additionalNote: "Additional Note",
      reviewOrder: "Review Your Order",
      service: "Service",
      bundle: "Bundle",
      days: "Days",
      address: "Address",
      contact: "Contact",
      payment: "Payment",
      note: "Note",
      cost: "Cost",
      submitOrder: "Submit Order",
      serviceBooked: "Service Booked Successfully!",
      orderPlaced: "Your order has been placed. We'll confirm your booking soon.",
      backToHome: "Back to Home",
      whatFarmersSay: "What Farmers Say",
      testimonial1: "Hired 5 workers in minutes!",
      testimonial2: "Tractor drivers were punctual.",
      testimonial3: "Best service for irrigation setup!",
      farmer1: "Raj Sharma, Corn Farmer",
      farmer2: "Maria Lopez, Soybean Farmer",
      farmer3: "Ali Khan, Vegetable Farmer",
      trustedPartner: "Your trusted partner for farm services.",
      contactUs: "Contact us",
      email: "support@khetisathi.com",
      phone: "+91-800-FARM-123",
      day: "Day",
      daysPlural: "Days",
      vehicleType: "Vehicle Type",
      vehicleCost: "Vehicle Cost",
      workersCost: "Workers Cost",
      totalCost: "Total Cost",
    },
    hindi: {
      farmConnect: "KhetiSathi",
      tagline: "अपनी फसल बढ़ाने के लिए आसानी से खेत मजदूर और सेवाएं बुक करें।",
      getStarted: "शुरू करें",
      ourServices: "हमारी सेवाएं",
      custom: "कस्टम",
      popular: "लोकप्रिय",
      select: "चुनें",
      bookService: "सेवा बुक करें",
      serviceType: "सेवा का प्रकार",
      selectService: "सेवा चुनें",
      selectBundle: "बंडल चुनें",
      noBundle: "कोई बंडल नहीं (कस्टम)",
      maleWorkers: "पुरुष मजदूर",
      femaleWorkers: "महिला मजूर",
      otherWorkers: "कामगारों की संख्या",
      hours: "घंटे",
      numberOfDays: "दिनों की संख्या",
      startDate: "प्रारंभ तिथि",
      endDate: "समाप्ति तिथि",
      startTime: "प्रारंभ समय",
      selectTime: "समय चुनें",
      locationDetails: "स्थान विवरण",
      fullAddress: "पूरा पता",
      contactNumber: "संपर्क नंबर",
      paymentDetails: "भुगतान विवरण",
      paymentMethod: "भुगतान विधि",
      selectMethod: "विधि चुनें",
      cash: "नकद",
      online: "ऑनलाइन",
      additionalNote: "अतिरिक्त नोट",
      reviewOrder: "अपने ऑर्डर की समीक्षा करें",
      service: "सेवा",
      bundle: "बंडल",
      days: "दिन",
      address: "पता",
      contact: "संपर्क",
      payment: "भुगतान",
      note: "नोट",
      cost: "लागत",
      submitOrder: "ऑर्डर सबमिट करें",
      serviceBooked: "सेवा सफलतापूर्वक बुक की गई!",
      orderPlaced: "आपका ऑर्डर सबमिट हो गया है। हम जल्द ही आपकी बुकिंग की पुष्टि करेंगे।",
      backToHome: "होम पर वापस जाएं",
      whatFarmersSay: "किसान क्या कहते हैं",
      testimonial1: "मिनटों में 5 मजदूरों को काम पर रखा!",
      testimonial2: "ट्रैक्टर ड्राइवर समय पर थे।",
      testimonial3: "सिंचाई सेटअप के लिए सबसे अच्छी सेवा!",
      farmer1: "राज शर्मा, मक्का किसान",
      farmer2: "मारिया लोपेज, सोयाबीन किसान",
      farmer3: "अली खान, सब्जी किसान",
      trustedPartner: "खेत सेवाओं के लिए आपका भरोसेमंद साथी।",
      contactUs: "हमसे संपर्क करें",
      email: "support@khetisathi.com",
      phone: "+91-800-FARM-123",
      day: "दिन",
      daysPlural: "दिन",
      vehicleType: "वाहन प्रकार",
      vehicleCost: "वाहन लागत",
      workersCost: "कामगार लागत",
      totalCost: "कुल लागत",
    },
    marathi: {
      farmConnect: "KhetiSathi",
      tagline: "तुमच्या पिकाला चालना देण्यासाठी सहजपणे शेतमजूर आणि सेवा बुक करा.",
      getStarted: "सुरू करा",
      ourServices: "आमच्या सेवा",
      custom: "कस्टम",
      popular: "लोकप्रिय",
      select: "निवडा",
      bookService: "सेवा बुक करा",
      serviceType: "सेवा प्रकार",
      selectService: "सेवा निवडा",
      selectBundle: "बंडल निवडा",
      noBundle: "कोणताही बंडल नाही (कस्टम)",
      maleWorkers: "पुरुष मजूर",
      femaleWorkers: "महिला मजूर",
      otherWorkers: "कामगारांची संख्या",
      hours: "तास",
      numberOfDays: "दिवसांची संख्या",
      startDate: "प्रारंभ तारीख",
      endDate: "समाप्ती तारीख",
      startTime: "प्रारंभ वेळ",
      selectTime: "वेळ निवडा",
      locationDetails: "स्थान तपशील",
      fullAddress: "पूर्ण पत्ता",
      contactNumber: "संपर्क क्रमांक",
      paymentDetails: "पेमेंट तपशील",
      paymentMethod: "पेमेंट पद्धत",
      selectMethod: "पद्धत निवडा",
      cash: "रोख",
      online: "ऑनलाइन",
      additionalNote: "अतिरिक्त टीप",
      reviewOrder: "तुमच्या ऑर्डरची पुनरावलोकन करा",
      service: "सेवा",
      bundle: "बंडल",
      days: "दिवस",
      address: "पत्ता",
      contact: "संपर्क",
      payment: "पेमेंट",
      note: "टीप",
      cost: "खर्च",
      submitOrder: "ऑर्डर सबमिट करा",
      serviceBooked: "सेवा यशस्वीरित्या बुक झाली!",
      orderPlaced: "तुमचा ऑर्डर सबमिट झाला आहे. आम्ही लवकरच तुमच्या बुकिंगची पुष्टी करू.",
      backToHome: "होमवर परत जा",
      whatFarmersSay: "शेतकरी काय म्हणतात",
      testimonial1: "काही मिनिटांत 5 मजूर भाड्याने घेतले!",
      testimonial2: "ट्रॅक्टर ड्रायव्हर वेळेवर होते.",
      testimonial3: "सिंचन सेटअपसाठी सर्वोत्तम सेवा!",
      farmer1: "राज शर्मा, मका शेतकरी",
      farmer2: "मारिया लोपेज, सोयाबीन शेतकरी",
      farmer3: "अली खान, भाजीपाला शेतकरी",
      trustedPartner: "शेत सेवांसाठी तुमचा विश्वासू भागीदार.",
      contactUs: "आमच्याशी संपर्क साधा",
      email: "support@khetisathi.com",
      phone: "+91-800-FARM-123",
      day: "दिवस",
      daysPlural: "दिवस",
      vehicleType: "वाहन प्रकार",
      vehicleCost: "वाहन खर्च",
      workersCost: "कामगार खर्च",
      totalCost: "एकूण खर्च",
    },
  };

  const t = translations[language];

  const steps = [
    { label: t.service, icon: 'fas fa-briefcase' },
    { label: t.schedule || "Schedule", icon: 'fas fa-calendar-alt' },
    { label: t.details || "Details", icon: 'fas fa-map-marker-alt' },
    { label: t.review || "Review", icon: 'fas fa-check-circle' },
    { label: t.success || "Success", icon: 'fas fa-check-double' }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsServicesLoading(true);
      try {
        const servicesSnapshot = await getDocs(query(collection(db, 'services')));
        const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(servicesData);

        const farmWorkersService = servicesData.find(s => s.type === 'farm-workers');
        if (farmWorkersService) {
          const bundlesSnapshot = await getDocs(collection(db, `services/${farmWorkersService.id}/bundles`));
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
    if (selectedService === 'farm-workers') {
      const totalWorkers = selectedBundle
        ? bundles.find(b => b.id === selectedBundle)?.maleWorkers + bundles.find(b => b.id === selectedBundle)?.femaleWorkers
        : maleWorkers + femaleWorkers;

      if (totalWorkers >= 1 && totalWorkers <= 3) {
        setVehicleType('Bike');
        setVehicleCost(totalWorkers * 20);
      } else if (totalWorkers >= 5 && totalWorkers <= 6) {
        setVehicleType('UV Auto');
        setVehicleCost(500);
      } else if (totalWorkers >= 7 && totalWorkers <= 10) {
        setVehicleType('Omni');
        setVehicleCost(2000);
      } else if (totalWorkers >= 15 && totalWorkers <= 20) {
        setVehicleType('Tata Magic');
        setVehicleCost(2000);
      } else if (totalWorkers > 20) {
        setVehicleType('Bolero');
        setVehicleCost(3000);
      } else {
        setVehicleType('');
        setVehicleCost(0);
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
    setVehicleType('');
    setVehicleCost(0);

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
      if (selectedService === 'farm-workers') {
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
      if (selectedService === 'tractor-drivers' && parseInt(hours) < 1) {
        setError('Please specify at least hours.');
        return false;
      }
      return true;
    } else if (currentStep === 1) {
      if (!numberOfDays || !startDate || !endDate || !startTime) {
        setError('Please fill in all date and time fields.');
        return false;
      }
      if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
        setError('Start date cannot be in the past.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!address || !contactNumber) {
        setError('Please fill in address and contact number.');
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
    setCurrentStep(currentStep - 1);
  };

  const handleBookService = async () => {
    if (!user) {
      setError('Please log in to book a service.');
      return;
    }

    setLoading(true);
    try {
      const service = services.find(s => s.type === selectedService);
      let cost = 0;
      let orderData = {
        farmerId: user.uid,
        serviceId: service.id,
        serviceType: selectedService,
        status: 'pending',
        createdAt: new Date(),
        address,
        contactNumber,
        paymentMethod,
        additionalNote,
        numberOfDays: parseInt(numberOfDays),
        startDate,
        endDate,
        startTime,
        workerId: null,
      };

      let maleWorkersCount = 0;
      let femaleWorkersCount = 0;

      if (selectedService === 'farm-workers') {
        if (selectedBundle) {
          const bundle = bundles.find(b => b.id === selectedBundle);
          orderData.bundleDetails = {
            name: bundle.name,
            maleWorkers: bundle.maleWorkers,
            femaleWorkers: bundle.femaleWorkers,
            price: bundle.price,
          };
          maleWorkersCount = bundle.maleWorkers;
          femaleWorkersCount = bundle.femaleWorkers;
          orderData.totalWorkers = bundle.maleWorkers + bundle.femaleWorkers;
          cost = (bundle.price + vehicleCost) * parseInt(numberOfDays);
        } else {
          orderData.maleWorkers = maleWorkers;
          orderData.femaleWorkers = femaleWorkers;
          maleWorkersCount = maleWorkers;
          femaleWorkersCount = femaleWorkers;
          orderData.totalWorkers = maleWorkers + femaleWorkers;
          cost = ((maleWorkers * service.maleCost + femaleWorkers * service.femaleCost) + vehicleCost) * parseInt(numberOfDays);
        }
        orderData.vehicleType = vehicleType;
        orderData.vehicleCost = vehicleCost;
      } else {
        orderData.totalWorkers = otherWorkers;
        if (selectedService === 'tractor-drivers') {
          orderData.hours = parseInt(hours);
          cost = parseInt(hours) * service.cost * otherWorkers * parseInt(numberOfDays);
        } else {
          cost = service.cost * otherWorkers * parseInt(numberOfDays);
        }
      }

      orderData.cost = cost;
      await addDoc(collection(db, 'orders'), orderData);

      const pinCodeMatch = address.match(/\b\d{6}\b/);
      const pinCode = pinCodeMatch ? pinCodeMatch[0] : 'Not provided';

      const farmerName = user.displayName || 'Farmer';

      let totalWorkersMessage = `• 👥 Total Workers: ${orderData.totalWorkers}`;
      if (selectedService === 'farm-workers') {
        totalWorkersMessage += ` (👨 ${maleWorkersCount}, 👩 ${femaleWorkersCount})`;
        totalWorkersMessage += `\n• 🚗 Vehicle: ${vehicleType} (₹${vehicleCost})`;
      }

      const adminWhatsAppNumber = '+918788647637';
      const message = `🎉 New Order Booked on KhetiSathi! 🚜😀\n\n` +
                    `• 👨‍🌾 Farmer: ${farmerName}\n` +
                    `• 🛠️ Service: ${selectedService}\n` +
                    `${totalWorkersMessage}\n` +
                    `• 💰 Cost: ₹${cost}\n` +
                    `• 📅 Start Date: ${startDate}\n` +
                    `• 📍 Address: ${address}\n` +
                    `• 📮 Pin Code: ${pinCode}\n` +
                    `• 📞 Contact: ${contactNumber}\n\n` +
                    `🌟 Please review and assign workers!`;

      try {
        const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: adminWhatsAppNumber,
            message: message,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to send WhatsApp notification:', errorData);
          setError('Order booked, but failed to send WhatsApp notification to admin.');
        }
      } catch (notificationErr) {
        console.error('Error sending WhatsApp notification:', notificationErr);
        setError('Order booked, but failed to send WhatsApp notification to admin.');
      }

      setSuccess('Service booked successfully!');
      setError('');
      handleNext();
    } catch (err) {
      setError(`Error booking service: ${err.message}`);
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
    setVehicleType('');
    setVehicleCost(0);
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
    const days = parseInt(numberOfDays);
    let workersCost = 0;
    let totalCost = 0;

    if (selectedService === 'farm-workers') {
      if (selectedBundle) {
        const bundle = bundles.find(b => b.id === selectedBundle);
        workersCost = bundle.price * days;
        totalCost = (bundle.price + vehicleCost) * days;
        return (
          <div className="cost-breakdown">
            <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost} ({t.bundle}: ₹{bundle.price}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day})</p>
            <p><span className="review-label">{t.vehicleCost}:</span> ₹{vehicleCost * days} ({vehicleType}: ₹{vehicleCost}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day})</p>
            <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost}</p>
          </div>
        );
      } else {
        workersCost = (maleWorkers * service.maleCost + femaleWorkers * service.femaleCost) * days;
        totalCost = (workersCost / days + vehicleCost) * days;
        return (
          <div className="cost-breakdown">
            <p><span className="review-label">{t.workersCost}:</span> ₹{workersCost} ({maleWorkers} {t.maleWorkers} @ ₹{service.maleCost}/{t.day} + {femaleWorkers} {t.femaleWorkers} @ ₹{service.femaleCost}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day})</p>
            <p><span className="review-label">{t.vehicleCost}:</span> ₹{vehicleCost * days} ({vehicleType}: ₹{vehicleCost}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day})</p>
            <p className="total-cost"><span className="review-label">{t.totalCost}:</span> ₹{totalCost}</p>
          </div>
        );
      }
    } else if (selectedService === 'tractor-drivers') {
      totalCost = parseInt(hours) * service.cost * otherWorkers * days;
      return (
        <div className="cost-breakdown">
          <p><span className="review-label">{t.totalCost}:</span> ₹{totalCost} ({otherWorkers} {t.otherWorkers} @ ₹{service.cost}/{t.hours.toLowerCase()} × {hours} {t.hours.toLowerCase()} × {days} {days > 1 ? t.daysPlural : t.day})</p>
        </div>
      );
    } else {
      totalCost = service.cost * otherWorkers * days;
      return (
        <div className="cost-breakdown">
          <p><span className="review-label">{t.totalCost}:</span> ₹{totalCost} ({otherWorkers} {t.otherWorkers} @ ₹{service.cost}/{t.day} × {days} {days > 1 ? t.daysPlural : t.day})</p>
        </div>
      );
    }
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
            {selectedService === 'farm-workers' && (
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
                        ₹{b.price} - {language === 'english' ? b.name : language === 'hindi' ? b.nameHindi || b.name : b.nameMarathi || b.name} ({b.maleWorkers} {t.maleWorkers} + {b.femaleWorkers} {t.femaleWorkers})
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
                  </>
                )}
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
            {selectedService && selectedService !== 'farm-workers' && (
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
            {selectedService === 'tractor-drivers' && (
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
                min={new Date().toISOString().split('T')[0]}
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
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">{t.selectMethod}</option>
                    <option value="cash">{t.cash}</option>
                    <option value="online">{t.online}</option>
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
          </div>
        );
      case 3:
        return (
          <div className="input-group">
            <h3 className="review-title">{t.reviewOrder}</h3>
            <div className="review-details">
              <div className="review-grid">
                <p><span className="review-label">{t.service}:</span> {services.find(s => s.type === selectedService)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi'] || selectedService}</p>
                {selectedService === 'farm-workers' && (
                  <>
                    {selectedBundle ? (
                      <p><span className="review-label">{t.bundle}:</span> {bundles.find(b => b.id === selectedBundle)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi']} ({bundles.find(b => b.id === selectedBundle)?.maleWorkers} {t.maleWorkers} + {bundles.find(b => b.id === selectedBundle)?.femaleWorkers} {t.femaleWorkers})</p>
                    ) : (
                      <>
                        <p><span className="review-label">{t.maleWorkers}:</span> {maleWorkers}</p>
                        <p><span className="review-label">{t.femaleWorkers}:</span> {femaleWorkers}</p>
                      </>
                    )}
                    {vehicleType && (
                      <p><span className="review-label">{t.vehicleType}:</span> <i className={`${getVehicleIcon(vehicleType)} vehicle-icon`}></i> {vehicleType}</p>
                    )}
                  </>
                )}
                {selectedService !== 'farm-workers' && (
                  <p><span className="review-label">{t.otherWorkers}:</span> {otherWorkers}</p>
                )}
                {selectedService === 'tractor-drivers' && <p><span className="review-label">{t.hours}:</span> {hours}</p>}
                <p><span className="review-label">{t.days}:</span> {numberOfDays} {numberOfDays > 1 ? t.daysPlural : t.day}</p>
                <p><span className="review-label">{t.startDate}:</span> {startDate}</p>
                <p><span className="review-label">{t.endDate}:</span> {endDate}</p>
                <p><span className="review-label">{t.startTime}:</span> {startTime}</p>
                <p><span className="review-label">{t.address}:</span> {address}</p>
                <p><span className="review-label">{t.contact}:</span> {contactNumber}</p>
                <p><span className="review-label">{t.payment}:</span> {t[paymentMethod]}</p>
                <p><span className="review-label">{t.note}:</span> {additionalNote || 'None'}</p>
                {renderCostBreakdown()}
              </div>
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
              <i className="fas fa-check success-icon"></i>
            </div>
            <h3 className="success-title">{t.serviceBooked}</h3>
            <p className="success-message">{t.orderPlaced}</p>
            <div className="success-details">
              <p><span className="review-label">{t.service}:</span> {services.find(s => s.type === selectedService)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi'] || selectedService}</p>
              {selectedService === 'farm-workers' && (
                <>
                  {selectedBundle ? (
                    <p><span className="review-label">{t.bundle}:</span> {bundles.find(b => b.id === selectedBundle)?.[language === 'english' ? 'name' : language === 'hindi' ? 'nameHindi' : 'nameMarathi']} ({bundles.find(b => b.id === selectedBundle)?.maleWorkers} {t.maleWorkers} + {bundles.find(b => b.id === selectedBundle)?.femaleWorkers} {t.femaleWorkers})</p>
                    ) : (
                      <>
                        <p><span className="review-label">{t.maleWorkers}:</span> {maleWorkers}</p>
                        <p><span className="review-label">{t.femaleWorkers}:</span> {femaleWorkers}</p>
                      </>
                    )}
                    {vehicleType && (
                      <p><span className="review-label">{t.vehicleType}:</span> <i className={`${getVehicleIcon(vehicleType)} vehicle-icon`}></i> {vehicleType}</p>
                    )}
                  </>
                )}
                {selectedService !== 'farm-workers' && (
                  <p><span className="review-label">{t.otherWorkers}:</span> {otherWorkers}</p>
                )}
                <p><span className="review-label">{t.days}:</span> {numberOfDays} {numberOfDays > 1 ? t.daysPlural : t.day}</p>
                <p><span className="review-label">{t.startDate}:</span> {startDate}</p>
                {renderCostBreakdown()}
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
        if (currentStep === 4) {
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
      }, [currentStep]);
    
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
                {services.map((s, index) => (
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
                          {s.type === 'farm-workers' && (
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
                            {s.type === 'farm-workers' ? t.custom : `₹${s.cost || 0}${s.type === 'tractor-drivers' ? `/${t.hours.toLowerCase()}` : `/${t.day}`}`}
                          </span>
                        </div>
                      </div>
                      {s.type === 'farm-workers' && (
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
    
          <Footer language={language} translations={translations} />
        </div>
      );
    };
    
    export default Home;
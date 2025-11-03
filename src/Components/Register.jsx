import React, { useState } from 'react';
import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { SKILLS, SKILL_LABELS, VEHICLE_SKILLS, VEHICLE_SKILL_LABELS } from '../utils/skills.js';

const Register = () => {
  const [activeTab, setActiveTab] = useState('farmer');
  const [language, setLanguage] = useState('marathi');
  const [showPassword, setShowPassword] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'farmer',
    gender: '',
    pincode: '',
    mobile: '',
    district: '',
    tahsil: '',
    village: '',
    skills: [],
    vehicleSkills: [],
    readyToTravel: true,
    termsAccepted: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', type: 'error' });
  const navigate = useNavigate();

  const translations = {
    english: {
      register: "Register",
      farmer: "Farmer",
      worker: "Worker",
      driver: "Driver",
      email: "Email",
      password: "Password",
      name: "Full Name",
      gender: "Gender",
      selectGender: "Select Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      skills: "Skills",
      vehicleSkills: "Vehicle Skills",
      selectSkills: "Hold Ctrl (Cmd on Mac) to select multiple skills.",
      selectVehicleSkills: "Hold Ctrl (Cmd on Mac) to select multiple vehicle skills.",
      areYouReadyToTravel: "Are you ready to go out of town for work?",
      pincode: "Pincode",
      mobileNumber: "WhatsApp Number",
      district: "District",
      tahsil: "Tahsil",
      village: "Village",
      selectDistrict: "Select District",
      selectTahsil: "Select Tahsil",
      selectVillage: "Select Village",
      termsAndConditions: "By continuing, I accept the Terms and Conditions",
      registering: "Registering...",
      alreadyHaveAccount: "Already have an account?",
      login: "Login",
      allFieldsRequired: "All fields are required.",
      termsNotAccepted: "You must accept the Terms and Conditions to register.",
      genderAndSkillsRequired: "Gender and at least one skill are required for workers.",
      vehicleSkillsRequired: "At least one vehicle skill is required for drivers.",
      invalidPincode: "Pincode must be a 6-digit number.",
      invalidMobile: "Mobile number must be a 10-digit number.",
      passwordTooShort: "Password must be at least 6 characters.",
      registrationSuccessful: "Registration successful!",
      invalidCredential: "Invalid email or password.",
      termsAndConditionsLink: "Terms and Conditions",
      invalidEmail: "Invalid email format.",
      emailAlreadyInUse: "Email is already registered.",
      weakPassword: "Password is too weak.",
      show: "Show",
      hide: "Hide",
    },
    hindi: {
      register: "पंजीकरण करें",
      farmer: "किसान",
      worker: "मजदूर",
      driver: "ड्राइवर",
      email: "ईमेल",
      password: "पासवर्ड",
      name: "पुरा नाम",
      gender: "लिंग",
      selectGender: "लिंग चुनें",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      skills: "कौशल",
      vehicleSkills: "वाहन कौशल",
      selectSkills: "एक से अधिक कौशल चुनने के लिए Ctrl (Mac पर Cmd) दबाए रखें।",
      selectVehicleSkills: "एक से अधिक वाहन कौशल चुनने के लिए Ctrl (Mac पर Cmd) दबाए रखें।",
      areYouReadyToTravel: "क्या आप काम के लिए बाहर शहर जाने के लिए तैयार हैं?",
      pincode: "पिनकोड",
      mobileNumber: "व्हाट्सएप नंबर",
      district: "जिला",
      tahsil: "तहसील",
      village: "गाँव",
      selectDistrict: "जिला चुनें",
      selectTahsil: "तहसील चुनें",
      selectVillage: "गाँव चुनें",
      termsAndConditions: "जारी रखकर, मैं नियम और शर्तों को स्वीकार करता हूँ",
      registering: "पंजीकरण हो रहा है...",
      alreadyHaveAccount: "पहले से ही खाता है?",
      login: "लॉगिन करें",
      allFieldsRequired: "सभी फ़ील्ड आवश्यक हैं।",
      termsNotAccepted: "पंजीकरण के लिए आपको नियम और शर्तें स्वीकार करनी होंगी।",
      genderAndSkillsRequired: "मजदूरों के लिए लिंग और कम से कम एक कौशल आवश्यक है।",
      vehicleSkillsRequired: "ड्राइवरों के लिए कम से कम एक वाहन कौशल आवश्यक है।",
      invalidPincode: "पिनकोड 6 अंकों का होना चाहिए।",
      invalidMobile: "व्हाट्सएप नंबर 10 अंकों का होना चाहिए।",
      passwordTooShort: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
      registrationSuccessful: "पंजीकरण सफल!",
      invalidCredential: "ईमेल या पासवर्ड गलत है।",
      termsAndConditionsLink: "नियम और शर्तें",
      invalidEmail: "ईमेल प्रारूप गलत है।",
      emailAlreadyInUse: "ईमेल पहले से पंजीकृत है।",
      weakPassword: "पासवर्ड बहुत कमजोर है।",
      show: "दिखाएं",
      hide: "छिपाएं",
    },
    marathi: {
      register: "नोंदणी करा",
      farmer: "शेतकरी",
      worker: "कामगार",
      driver: "चालक",
      email: "ईमेल",
      password: "पासवर्ड",
      name: "पूर्ण नाव",
      gender: "लिंग",
      selectGender: "लिंग निवडा",
      male: "पुरुष",
      female: "महिला",
      other: "इतर",
      skills: "कौशल्ये",
      vehicleSkills: "वाहन कौशल्ये",
      selectSkills: "एकापेक्षा जास्त कौशल्ये निवडण्यासाठी Ctrl (Mac वर Cmd) दाबा.",
      selectVehicleSkills: "एकापेक्षा जास्त वाहन कौशल्ये निवडण्यासाठी Ctrl (Mac वर Cmd) दाबा.",
      areYouReadyToTravel: "तुम्ही कामासाठी बाहेरगावी जाण्यासाठी तयार आहात का?",
      pincode: "पिनकोड",
      mobileNumber: "व्हाट्सएप नंबर",
      district: "जिल्हा",
      tahsil: "तहसील",
      village: "गाव",
      selectDistrict: "जिल्हा निवडा",
      selectTahsil: "तहसील निवडा",
      selectVillage: "गाव निवडा",
      termsAndConditions: "पुढे चालू ठेवून, मी नियम आणि अटी स्वीकारतो.",
      registering: "नोंदणी होत आहे...",
      alreadyHaveAccount: "आधीच खाते आहे का?",
      login: "लॉगिन करा",
      allFieldsRequired: "सर्व फील्ड आवश्यक आहेत.",
      termsNotAccepted: "नोंदणी करण्यासाठी तुम्ही नियम आणि अटी स्वीकारणे आवश्यक आहे.",
      genderAndSkillsRequired: "कामगारांसाठी लिंग आणि किमान एक कौशल्य आवश्यक आहे.",
      vehicleSkillsRequired: "चालकांसाठी किमान एक वाहन कौशल्य आवश्यक आहे.",
      invalidPincode: "पिनकोड 6 अंकांचा असावा.",
      invalidMobile: "व्हाट्सएप नंबर 10 अंकांचा असावा.",
      passwordTooShort: "पासवर्ड किमान 6 अक्षरांचा असावा.",
      registrationSuccessful: "नोंदणी यशस्वी!",
      invalidCredential: "ईमेल किंवा पासवर्ड चुकीचा आहे.",
      termsAndConditionsLink: "नियम आणि अटी",
      invalidEmail: "ईमेल फॉर्मॅट चुकीचा आहे.",
      emailAlreadyInUse: "ईमेल आधीच नोंदणीकृत आहे.",
      weakPassword: "पासवर्ड खूप कमकुवत आहे.",
      show: "दाखवा",
      hide: "लपवा",
    },
  };

  const t = translations[language];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData({
      ...formData,
      role: tab,
      gender: '',
      skills: [],
      vehicleSkills: [],
      readyToTravel: true,
      district: '',
      tahsil: '',
      village: '',
      termsAccepted: true,
    });
    setError('');
  };

  const generateNext30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'skills' || name === 'vehicleSkills') {
      const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
      setFormData({ ...formData, [name]: selectedOptions });
    } else if (name === 'gender' && value === 'female') {
      // Filter skills to only allowed ones if switching to female
      const allowedSkills = ['farm-worker', 'harvester', 'grass-cutter', 'crop-sorter'];
      const filteredSkills = formData.skills.filter(skill => allowedSkills.includes(skill));
      setFormData({ ...formData, [name]: value, skills: filteredSkills });
    } else if (name === 'mobile') {
      // Only accept digits and limit to 10 characters
      const onlyDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: onlyDigits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // helper to show popup (auto-hide after 3s)
  const showPopup = (message, type = 'error') => {
    setPopup({ show: true, message, type });
    // auto hide after 3s
    setTimeout(() => setPopup({ show: false, message: '', type: 'error' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const {
      email,
      password,
      name,
      role,
      gender,
      pincode,
      mobile,
      district,
      tahsil,
      village,
      skills,
      vehicleSkills,
      readyToTravel,
      termsAccepted,
    } = formData;

    // Validate inputs
    if (!email || !password || !name || !role || !pincode || !mobile || !district || !tahsil || !village) {
      setError(t.allFieldsRequired);
      showPopup(t.allFieldsRequired, 'error');
      setLoading(false);
      return;
    }
    if (!termsAccepted) {
      setError(t.termsNotAccepted);
      showPopup(t.termsNotAccepted, 'error');
      setLoading(false);
      return;
    }
    if (role === 'worker' && (!gender || skills.length === 0)) {
      setError(t.genderAndSkillsRequired);
      showPopup(t.genderAndSkillsRequired, 'error');
      setLoading(false);
      return;
    }
    if (role === 'driver' && vehicleSkills.length === 0) {
      setError(t.vehicleSkillsRequired);
      showPopup(t.vehicleSkillsRequired, 'error');
      setLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setError(t.invalidPincode);
      showPopup(t.invalidPincode, 'error');
      setLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError(t.invalidMobile);
      showPopup(t.invalidMobile, 'error');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      showPopup(t.passwordTooShort, 'error');
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare user data
      const userData = {
        email,
        name,
        role,
        pincode,
        mobile,
        district,
        tahsil,
        village,
        password, // kept as original (not recommended in production)
        status: role === 'farmer' ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };

      if (role === 'worker') {
        userData.gender = gender;
        userData.skills = skills;
        userData.readyToTravel = readyToTravel;
        userData.workerStatus = 'ready';
        userData.availability = { workingDays: generateNext30Days(), offDays: [] };
      } else if (role === 'driver') {
        userData.vehicleSkills = vehicleSkills;
        userData.readyToTravel = readyToTravel;
        userData.driverStatus = 'available';
        userData.availability = { workingDays: generateNext30Days(), offDays: [] };
        if (gender) userData.gender = gender; // optional
      }

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), userData);

      // success popup + navigate
      showPopup(t.registrationSuccessful, 'success');
      setTimeout(() => {
        navigate(role === 'worker' ? '/worker-dashboard' : role === 'driver' ? '/driver-dashboard' : '/');
      }, 2000);
    } catch (err) {
      // Map firebase errors to friendly translated messages when possible
      let message = err.message;
      if (err.code === 'auth/invalid-email') message = t.invalidEmail;
      else if (err.code === 'auth/email-already-in-use') message = t.emailAlreadyInUse;
      else if (err.code === 'auth/weak-password') message = t.weakPassword;
      else if (err.code === 'auth/invalid-credential') message = t.invalidCredential;

      setError(message);
      showPopup(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter skills based on gender for worker tab
  const getFilteredSkills = () => {
    if (activeTab !== 'worker' || formData.gender !== 'female') {
      return SKILLS;
    }
    return ['farm-worker', 'harvester', 'grass-cutter', 'crop-sorter'];
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg z-20">
          <div className="w-14 h-14 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-4">
        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Select language"
        >
          <option value="marathi">मराठी</option>
          <option value="hindi">हिन्दी</option>
          <option value="english">English</option>
        </select>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-center text-green-800">{t.register}</h2>

      {/* Tabs */}
      <div className="flex mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('farmer')}
          className={`flex-1 py-3 text-center font-semibold rounded-l-lg transition duration-300 ${activeTab === 'farmer' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {t.farmer}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('worker')}
          className={`flex-1 py-3 text-center font-semibold transition duration-300 ${activeTab === 'worker' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {t.worker}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('driver')}
          className={`flex-1 py-3 text-center font-semibold rounded-r-lg transition duration-300 ${activeTab === 'driver' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {t.driver}
        </button>
      </div>

      {/* Inline error (keeps original behaviour) */}
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700">{t.email}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <label className="block text-gray-700">{t.password}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? t.hide : t.show}
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700">{t.name}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>

        {/* Gender (for worker/driver) */}
        {(activeTab === 'worker' || activeTab === 'driver') && (
          <div className="mb-4">
            <label className="block text-gray-700">{t.gender}</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
              required={activeTab === 'worker'}
            >
              <option value="">{t.selectGender}</option>
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
        )}

        {/* Worker skills */}
        {activeTab === 'worker' && (
          <div className="mb-4">
            <label className="block text-gray-700">{t.skills}</label>
            <select
              name="skills"
              multiple
              value={formData.skills}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
              required
            >
              {getFilteredSkills().map((skill) => (
                <option key={skill} value={skill}>
                  {SKILL_LABELS[skill]?.[language] || skill}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">{t.selectSkills}</p>
          </div>
        )}

        {/* Driver vehicle skills */}
        {activeTab === 'driver' && (
          <div className="mb-4">
            <label className="block text-gray-700">{t.vehicleSkills}</label>
            <select
              name="vehicleSkills"
              multiple
              value={formData.vehicleSkills}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
              required
            >
              {VEHICLE_SKILLS.map((skill) => (
                <option key={skill} value={skill}>
                  {VEHICLE_SKILL_LABELS[skill]?.[language] || skill}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">{t.selectVehicleSkills}</p>
          </div>
        )}

        {/* Ready to Travel Checkbox (for worker/driver) */}
        {(activeTab === 'worker' || activeTab === 'driver') && (
          <div className="mb-4">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name="readyToTravel"
                checked={formData.readyToTravel}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-600 border-gray-300 rounded"
              />
              <span>{t.areYouReadyToTravel}</span>
            </label>
          </div>
        )}

        {/* District / Tahsil / Village */}
        <div className="mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'nowrap' }}>
            {/* District */}
            <div style={{ flex: 1 }}>
              <label className="block text-gray-700">{t.district}</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">{t.selectDistrict}</option>
                <option value="Bhandara">
                  {language === 'marathi' ? 'भंडारा' : language === 'hindi' ? 'भंडारा' : 'Bhandara'}
                </option>
              </select>
            </div> 

            {/* Tahsil */}
            <div style={{ flex: 1 }}>
              <label className="block text-gray-700">{t.tahsil}</label>
              <select
                name="tahsil"
                value={formData.tahsil}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">{t.selectTahsil}</option>
                <option value="Lakhani">
                  {language === 'marathi' ? 'लाखनी' : language === 'hindi' ? 'लखनी' : 'Lakhani'}
                </option>
              </select>
            </div>

            {/* Village */}
            <div style={{ flex: 1 }}>
              <label className="block text-gray-700">{t.village}</label>
              <select
                name="village"
                value={formData.village}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">{t.selectVillage}</option>
                <option value="Lakhori">
                  {language === 'marathi' ? 'लाखोरी' : language === 'hindi' ? 'लखोरी' : 'Lakhori'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Pincode */}
        <div className="mb-4">
          <label className="block text-gray-700">{t.pincode}</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
            pattern="\d{6}"
            title={t.invalidPincode}
          />
        </div>

        {/* Mobile */}
        <div className="mb-4">
          <label className="block text-gray-700">{t.mobileNumber}</label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            maxLength={10}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
            pattern="\d{10}"
            title={t.invalidMobile}
          />
        </div>

        {/* Terms */}
        <div className="mb-4">
          <label className="flex items-center text-gray-700">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-green-600 focus:ring-green-600 border-gray-300 rounded"
            />
            <span>
              {t.termsAndConditions}{' '}
              <Link to="/terms" className="text-green-600 hover:underline">
                {t.termsAndConditionsLink}
              </Link>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? t.registering : t.register}
        </button>
      </form>

      <p className="mt-4 text-center">
        {t.alreadyHaveAccount} <Link to="/login" className="text-green-600 hover:underline">{t.login}</Link>
      </p>

      {/* Popup Modal */}
      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-30">
          <div className="bg-white p-5 rounded-lg shadow-lg w-11/12 max-w-sm text-center">
            <p className={`mb-4 font-medium ${popup.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {popup.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setPopup({ show: false, message: '', type: 'error' })}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
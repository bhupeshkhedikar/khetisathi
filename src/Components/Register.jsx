import React, { useState } from 'react';
import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { SKILLS, SKILL_LABELS, VEHICLE_SKILLS, VEHICLE_SKILL_LABELS } from '../utils/skills.js';

const Register = () => {
  const [activeTab, setActiveTab] = useState('farmer');
  const [language, setLanguage] = useState('marathi');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'farmer',
    gender: '',
    pincode: '',
    mobile: '',
    skills: [],
    vehicleSkills: [],
    termsAccepted: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      pincode: "Pincode",
      mobileNumber: "WhatsApp Number",
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
      termsAndConditionsLink:'Terms and Conditions'
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
      pincode: "पिनकोड",
      mobileNumber: "व्हाट्सएप नंबर",
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
      termsAndConditionsLink:'नियम और शर्तें'
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
      pincode: "पिनकोड",
      mobileNumber: "व्हाट्सएप नंबर",
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
      termsAndConditionsLink:'नियम आणि अटी'
    },
  };

  const t = translations[language];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData({ ...formData, role: tab, gender: '', skills: [], vehicleSkills: [], termsAccepted: false });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'skills' || name === 'vehicleSkills') {
      const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
      setFormData({ ...formData, [name]: selectedOptions });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, name, role, gender, pincode, mobile, skills, vehicleSkills, termsAccepted } = formData;

    // Validate inputs
    if (!email || !password || !name || !role || !pincode || !mobile) {
      setError(t.allFieldsRequired);
      setLoading(false);
      return;
    }
    if (!termsAccepted) {
      setError(t.termsNotAccepted);
      setLoading(false);
      return;
    }
    if (role === 'worker' && (!gender || skills.length === 0)) {
      setError(t.genderAndSkillsRequired);
      setLoading(false);
      return;
    }
    if (role === 'driver' && vehicleSkills.length === 0) {
      setError(t.vehicleSkillsRequired);
      setLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setError(t.invalidPincode);
      setLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError(t.invalidMobile);
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user data in Firestore
      const userData = {
        email,
        name,
        role,
        pincode,
        mobile,
        status: role === 'farmer' ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };
      if (role === 'worker') {
        userData.gender = gender;
        userData.skills = skills;
        userData.workerStatus = 'ready';
        userData.availability = { workingDays: [], offDays: [] };
      } else if (role === 'driver') {
        userData.vehicleSkills = vehicleSkills;
        userData.driverStatus = 'available';
        userData.availability = { workingDays: [], offDays: [] };
        if (gender) userData.gender = gender; // Optional gender for drivers
      }
      await setDoc(doc(db, 'users', user.uid), userData);

      alert(t.registrationSuccessful);
      navigate(role === 'worker' ? '/worker-dashboard' : role === 'driver' ? '/driver-dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <select
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label={t.selectLanguage}
        >
          <option value="marathi">मराठी </option>
          <option value="hindi">हिन्दी </option>
          <option value="english">English</option>
        </select>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center text-green-800">{t.register}</h2>
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('farmer')}
          className={`flex-1 py-3 text-center font-semibold rounded-l-lg transition duration-300 ${
            activeTab === 'farmer' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t.farmer}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('worker')}
          className={`flex-1 py-3 text-center font-semibold transition duration-300 ${
            activeTab === 'worker' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t.worker}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('driver')}
          className={`flex-1 py-3 text-center font-semibold rounded-r-lg transition duration-300 ${
            activeTab === 'driver' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t.driver}
        </button>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <div className="mb-4">
          <label className="block text-gray-700">{t.password}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
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
              {SKILLS.map((skill) => (
                <option key={skill} value={skill}>
                  {SKILL_LABELS[skill]?.[language] || skill}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">{t.selectSkills}</p>
          </div>
        )}
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
        <div className="mb-4">
          <label className="block text-gray-700">{t.mobileNumber}</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
            required
            pattern="\d{10}"
            title={t.invalidMobile}
          />
        </div>
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
          className="w-full bg-green-600 text-white p-3 rounded-full font-semibold hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? t.registering : t.register}
        </button>
      </form>
      <p className="mt-4 text-center">
        {t.alreadyHaveAccount} <Link to="/login" className="text-green-600 hover:underline">{t.login}</Link>
      </p>
    </div>
  );
};

export default Register;
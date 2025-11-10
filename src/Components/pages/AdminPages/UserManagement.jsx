import React, { useState } from 'react';

const UserManagement = ({
  farmers,
  workers,
  farmerSortConfig,
  workerSortConfig,
  handleFarmerSort,
  handleWorkerSort,
  handleApproveWorker,
  handleRejectWorker,
  loading,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState('marathi');

  // Translations for UI elements
  const translations = {
    english: {
      registeredUsers: 'Registered Users',
      farmers: 'Farmers',
      workers: 'Workers',
      noFarmersRegistered: 'No farmers registered.',
      noWorkersRegistered: 'No workers registered.',
      name: 'Name',
      village: 'Village',
      email: 'Email',
      phone: 'Phone',
      gender: 'Gender',
      skills: 'Skills',
      availability: 'Availability',
      pincode: 'Pincode',
      status: 'Status',
      workerStatus: 'Worker Status',
      registrationDate: 'Registration Date',
      actions: 'Actions',
      totalMaleWorkers: 'Total Male Workers',
      totalFemaleWorkers: 'Total Female Workers',
      totalWorkers: 'Total Workers',
      male: 'Male',
      female: 'Female',
      total: 'Total',
      availableToday: 'Available Today',
      notAvailableToday: 'Not Available Today',
      next: 'Next',
      none: 'None',
      pending: 'Pending',
      ready: 'Ready',
    },
    marathi: {
      registeredUsers: 'नोंदणीकृत वापरकर्ते',
      farmers: 'शेतकरी',
      workers: 'कामगार',
      noFarmersRegistered: 'कोणतेही शेतकरी नोंदणीकृत नाहीत.',
      noWorkersRegistered: 'कोणतेही कामगार नोंदणीकृत नाहीत.',
      name: 'नाव',
      village: 'गाव',
      email: 'ईमेल',
      phone: 'फोन',
      gender: 'लिंग',
      skills: 'कौशल्ये',
      availability: 'उपलब्धता',
      pincode: 'पिनकोड',
      status: 'स्थिती',
      workerStatus: 'कामगार स्थिती',
      registrationDate: 'नोंदणी तारीख',
      actions: 'क्रिया',
      totalMaleWorkers: 'एकूण पुरुष कामगार',
      totalFemaleWorkers: 'एकूण स्त्री कामगार',
      totalWorkers: 'एकूण कामगार',
      male: 'पुरुष',
      female: 'स्त्री',
      total: 'एकूण',
      availableToday: 'आज उपलब्ध',
      notAvailableToday: 'आज उपलब्ध नाही',
      next: 'पुढील',
      none: 'कोणतेही नाही',
      pending: 'प्रलंबित',
      ready: 'तयार',
    },
    hindi: {
      registeredUsers: 'पंजीकृत उपयोगकर्ता',
      farmers: 'किसान',
      workers: 'श्रमिक',
      noFarmersRegistered: 'कोई किसान पंजीकृत नहीं।',
      noWorkersRegistered: 'कोई श्रमिक पंजीकृत नहीं।',
      name: 'नाम',
      village: 'गांव',
      email: 'ईमेल',
      phone: 'फ़ोन',
      gender: 'लिंग',
      skills: 'कौशल',
      availability: 'उपलब्धता',
      pincode: 'पिन कोड',
      status: 'स्थिति',
      workerStatus: 'श्रमिक स्थिति',
      registrationDate: 'पंजीकरण तिथि',
      actions: 'क्रियाएँ',
      totalMaleWorkers: 'कुल पुरुष श्रमिक',
      totalFemaleWorkers: 'कुल महिला श्रमिक',
      totalWorkers: 'कुल श्रमिक',
      male: 'पुरुष',
      female: 'महिला',
      total: 'कुल',
      availableToday: 'आज उपलब्ध',
      notAvailableToday: 'आज उपलब्ध नहीं',
      next: 'अगला',
      none: 'कोई नहीं',
      pending: 'लंबित',
      ready: 'तैयार',
    },
  };

  const t = translations[currentLanguage];

  // Helper function to format timestamp to DD-MM-YYYY
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle Firebase Timestamp object or ISO string
      const date = timestamp.seconds
        ? new Date(timestamp.seconds * 1000) // Firebase Timestamp
        : new Date(timestamp); // ISO string
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).split('/').join('-');
    } catch {
      return 'N/A';
    }
  };

  const todayDateString = new Date().toISOString().split('T')[0];

  const formatDateString = (dateStr) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  // Skill labels
  const SKILL_LABELS = {
    'farm-worker': {
      english: 'Farm Worker',
      hindi: 'खेती मजदूर',
      marathi: 'शेतमजूर(सर्व शेती कामे)',
    },
    'tractor-driver': {
      english: 'Tractor Driver (Only)',
      hindi: 'सिर्फ ट्रैक्टर चालक',
      marathi: 'फक्त ट्रॅक्टर चालक',
    },
    'ownertc': {
      english: 'Tractor Owner (Driver + Tractor)',
      hindi: 'ट्रैक्टर मालिक (ड्राइवर सहित)',
      marathi: 'ट्रॅक्टर मालक (ड्रायव्हरसह सेवा)',
    },
    'sower': {
      english: 'Sower',
      hindi: 'पेंडकर',
      marathi: 'पेंडकर',
    },
    'irrigation-specialist': {
      english: 'Irrigation Specialist',
      hindi: 'सिंचाई विशेषज्ञ',
      marathi: 'सिंचन तज्ज्ञ',
    },
    'harvester-operator': {
      english: 'Harvester Operator (Only)',
      hindi: 'सिर्फ हार्वेस्टर चालक',
      marathi: 'फक्त हार्वेस्टर चालक',
    },
    'owner-harvester': {
      english: 'Harvester Owner (Machine + Driver)',
      hindi: 'हार्वेस्टर मालिक (मशीन + चालक)',
      marathi: 'हार्वेस्टर मालक (मशीन व चालकासह)',
    },
    'harvester': {
      english: 'Harvester',
      hindi: 'फसल काटने वाला',
      marathi: 'पीक कापणारा',
    },
    'pesticide-applicator': {
      english: 'Pesticide Applicator',
      hindi: 'कीटनाशक छिड़कने वाला',
      marathi: 'कीटकनाशक फवारणारा',
    },
    'ploughing-laborer': {
      english: 'Ploughing Laborer',
      hindi: 'जुताई मजदूर',
      marathi: 'रोवणी शेतमजूर',
    },
    'crop-sorter': {
      english: 'Crop Sorter',
      hindi: 'फसल छांटने वाला',
      marathi: 'निंदण करणारा',
    },
    'grass-cutter': {
      english: 'Grass Cutter',
      hindi: 'घास काटने वाला',
      marathi: 'गवत कापणारा',
    },
    'cow-milker': {
      english: 'Cow Milker',
      hindi: 'गाय दुहने वाला',
      marathi: 'गायीचे दूध काढणारा',
    },
    'fertilizer-applicator': {
      english: 'Fertilizer Applicator',
      hindi: 'खाद डालने वाला',
      marathi: 'खत मारणारा',
    },
    'watering-laborer': {
      english: 'Watering Laborer',
      hindi: 'पानी देने वाला',
      marathi: 'पाणी देणारा',
    },
    'paddy-spreader': {
      english: 'Paddy Spreader',
      hindi: 'धान फैलाने वाला (हाथ से)',
      marathi: 'परे फोकणारा',
    },
    'buffalo-milker': {
      english: 'Buffalo Milker',
      hindi: 'भैंस दुहने वाला',
      marathi: 'म्हशीचे दूध काढणारा',
    },
    'ploughman-with-bull': {
      english: 'Ploughman (with Bulls)',
      hindi: 'बैल से हल चलाने वाला',
      marathi: 'बैलासह नांगरणारा',
    },
    'dung-cleaner': {
      english: 'Cow Dung Cleaner',
      hindi: 'गोबर साफ करने वाला',
      marathi: 'शेण साफ करणारा',
    },
    'bullockcart-owner': {
      english: 'Bullock Cart Owner (with Driver)',
      hindi: 'बैलगाड़ी मालिक (चालक सहित)',
      marathi: 'बैलगाडी मालक (चालकासह)',
    },
    'bullock-cart-only': {
      english: 'Bullock Cart (Only)',
      hindi: 'सिर्फ बैलगाड़ी',
      marathi: 'फक्त बैल गाडी',
    },
    'bullock-cart-driver': {
      english: 'Bullock Cart Driver (Only)',
      hindi: 'सिर्फ बैलगाड़ी चालक',
      marathi: 'बैल गाडी चालक',
    },
    'e-crop-survey-assistant': {
      english: 'e-Crop Survey Assistant',
      hindi: 'ई-फसल सर्वेक्षण सहायक',
      marathi: 'ई-पीक पाहणी मदतनिस',
    },
    'paddy-bundling': {
      english: 'Paddy Bundling',
      hindi: 'धान बांधना',
      marathi: 'धान बांधणे',
    },
    'bag-lifting': {
      english: 'Bag Lifting',
      hindi: 'बोरी उठाना',
      marathi: 'धानाची पोती उचलणे',
    },
  };

  const VEHICLE_SKILL_LABELS = {
    bike: {
      english: 'Bike',
      hindi: 'बाइक',
      marathi: 'बाईक',
    },
    'uv-auto': {
      english: 'UV Auto',
      hindi: 'इलेक्ट्रिक ऑटो',
      marathi: 'इलेक्ट्रिक ऑटो',
    },
    omni: {
      english: 'Omni',
      hindi: 'ओमनी',
      marathi: 'ओमनी',
    },
    'tata-magic': {
      english: 'Tata Magic',
      hindi: 'टाटा मॅजिक',
      marathi: 'टाटा मॅजिक',
    },
    bolero: {
      english: 'Bolero',
      hindi: 'बोलेरो',
      marathi: 'बोलेरो',
    },
  };

  // Function to get skill label
  const getSkillLabel = (skill) => {
    return (
      SKILL_LABELS[skill]?.[currentLanguage] ||
      VEHICLE_SKILL_LABELS[skill]?.[currentLanguage] ||
      skill
    );
  };

  // Analytics computations for workers
  const totalMale = workers.filter(w => w.gender === 'male').length;
  const totalFemale = workers.filter(w => w.gender === 'female').length;
  const totalWorkers = workers.length;

  // Get unique skills with labels
  const allSkillsWithLabels = [
    ...new Set(workers.flatMap(w => w.skills || []))
  ].map(skill => ({
    key: skill,
    label: getSkillLabel(skill)
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Skills statistics: count male/female per skill
  const skillsStats = allSkillsWithLabels
    .map(({ key, label }) => ({
      skill: label,
      key,
      maleCount: workers.filter(w => w.gender === 'male' && w.skills?.includes(key)).length,
      femaleCount: workers.filter(w => w.gender === 'female' && w.skills?.includes(key)).length,
    }))
    .filter(stat => stat.maleCount + stat.femaleCount > 0); // Only include skills with at least one worker

  // Sort farmers
  const sortedFarmers = [...farmers].sort((a, b) => {
    if (farmerSortConfig.key === 'createdAt') {
      const dateA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0;
      return farmerSortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    const aValue = a[farmerSortConfig.key] || '';
    const bValue = b[farmerSortConfig.key] || '';
    return farmerSortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Sort workers
  const sortedWorkers = [...workers].sort((a, b) => {
    if (workerSortConfig.key === 'createdAt') {
      const dateA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : 0;
      return workerSortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    let aValue, bValue;
    if (workerSortConfig.key === 'skills') {
      aValue = (a.skills || []).map(s => getSkillLabel(s)).join(', ');
      bValue = (b.skills || []).map(s => getSkillLabel(s)).join(', ');
    } else {
      aValue = a[workerSortConfig.key] || '';
      bValue = b[workerSortConfig.key] || '';
    }
    return workerSortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Debugging: Log workers data to check createdAt values
  console.log('Workers Data:', workers.map(w => ({
    id: w.id,
    name: w.name,
    createdAt: w.createdAt,
    formattedDate: formatDate(w.createdAt),
  })));

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-green-700">{t.registeredUsers}</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
            {t.language || 'Language'}:
          </label>
          <select
            id="language-select"
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Male Workers Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5.197a9 9 0 01-18 0" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.totalMaleWorkers}</p>
              <p className="text-3xl font-bold text-gray-900">{totalMale}</p>
            </div>
          </div>
        </div>

        {/* Total Female Workers Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-pink-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.totalFemaleWorkers}</p>
              <p className="text-3xl font-bold text-gray-900">{totalFemale}</p>
            </div>
          </div>
        </div>

        {/* Total Workers Card (Optional summary) */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.totalWorkers}</p>
              <p className="text-3xl font-bold text-gray-900">{totalWorkers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills-Based Statistics Cards */}
      {skillsStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {skillsStats.map(({ skill, maleCount, femaleCount }) => (
            <div key={skill} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold text-gray-900">{skill}</h5>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.male}</span>
                  <span className="font-bold text-blue-600">{maleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.female}</span>
                  <span className="font-bold text-pink-600">{femaleCount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">{t.total}</span>
                  <span className="font-bold text-gray-900">{maleCount + femaleCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-4 text-gray-800">{t.farmers}</h4>
        {sortedFarmers.length === 0 ? (
          <p className="text-center text-gray-600">{t.noFarmersRegistered}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th onClick={() => handleFarmerSort('name')} className="py-3 px-6 text-left cursor-pointer">
                    {t.name} {farmerSortConfig.key === 'name' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleFarmerSort('village')} className="py-3 px-6 text-left cursor-pointer">
                    {t.village} {farmerSortConfig.key === 'village' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleFarmerSort('email')} className="py-3 px-6 text-left cursor-pointer">
                    {t.email} {farmerSortConfig.key === 'email' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleFarmerSort('phone')} className="py-3 px-6 text-left cursor-pointer">
                    {t.phone} {farmerSortConfig.key === 'phone' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleFarmerSort('pincode')} className="py-3 px-6 text-left cursor-pointer">
                    {t.pincode} {farmerSortConfig.key === 'pincode' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleFarmerSort('createdAt')} className="py-3 px-6 text-left cursor-pointer">
                    {t.registrationDate} {farmerSortConfig.key === 'createdAt' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFarmers.map((farmer) => (
                  <tr key={farmer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6">{farmer.name || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.village || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.email || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.mobile || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.pincode || 'N/A'}</td>
                    <td className="py-3 px-6">{formatDate(farmer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xl font-semibold mb-4 text-gray-800">{t.workers}</h4>
        {sortedWorkers.length === 0 ? (
          <p className="text-center text-gray-600">{t.noWorkersRegistered}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left">{t.actions}</th>
                  <th onClick={() => handleWorkerSort('name')} className="py-3 px-6 text-left cursor-pointer">
                    {t.name} {workerSortConfig.key === 'name' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('village')} className="py-3 px-6 text-left cursor-pointer">
                    {t.village} {workerSortConfig.key === 'village' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('email')} className="py-3 px-6 text-left cursor-pointer">
                    {t.email} {workerSortConfig.key === 'email' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('phone')} className="py-3 px-6 text-left cursor-pointer">
                    {t.phone} {workerSortConfig.key === 'phone' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('gender')} className="py-3 px-6 text-left cursor-pointer">
                    {t.gender} {workerSortConfig.key === 'gender' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('skills')} className="py-3 px-6 text-left cursor-pointer">
                    {t.skills} {workerSortConfig.key === 'skills' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('availability')} className="py-3 px-6 text-left cursor-pointer">
                    {t.availability} {workerSortConfig.key === 'availability' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('pincode')} className="py-3 px-6 text-left cursor-pointer">
                    {t.pincode} {workerSortConfig.key === 'pincode' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('status')} className="py-3 px-6 text-left cursor-pointer">
                    {t.status} {workerSortConfig.key === 'status' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('workerStatus')} className="py-3 px-6 text-left cursor-pointer">
                    {t.workerStatus} {workerSortConfig.key === 'workerStatus' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleWorkerSort('createdAt')} className="py-3 px-6 text-left cursor-pointer">
                    {t.registrationDate} {workerSortConfig.key === 'createdAt' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedWorkers.map((worker) => (
                  <tr key={worker.id} className="border-b hover:bg-gray-50">
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
                    <td className="py-3 px-6">{worker.name || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.village || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.email || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.mobile || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.gender || 'N/A'}</td>
                    <td className="py-3 px-6">{(worker.skills || []).map(s => getSkillLabel(s)).join(', ') || t.none}</td>
                    <td className="py-3 px-6">
                      {worker.availability && worker.availability.workingDays ? (
                        <>
                          {worker.availability.workingDays.includes(todayDateString) ? (
                            <span className="text-green-600 font-semibold">{t.availableToday}</span>
                          ) : (
                            <span className="text-red-600 font-semibold">{t.notAvailableToday}</span>
                          )}
                          <div className="text-xs text-gray-500">
                            {t.next}: {worker.availability.workingDays.slice(0, 10).map(formatDateString).join(', ')}
                          </div>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3 px-6">{worker.pincode || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.status || t.pending}</td>
                    <td className="py-3 px-6">{worker.workerStatus || t.ready}</td>
                    <td className="py-3 px-6">{formatDate(worker.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserManagement;
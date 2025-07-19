const translationsDriverDashboard = {
  english: {
    // General
    welcome: 'Welcome',
    none: 'N/A',
    selectLanguage: 'Select Language',
    english: 'English',
    hindi: 'Hindi',
    marathi: 'Marathi',
    driverInformation: 'Driver Information',
    profile: 'Profile',
    status: 'Status',
    totalEarnings: 'Total Earnings',
    activeTasks: 'Active Tasks',
    taskHistory: 'Task History',
    earnings: 'Earnings',
    availability: 'Availability',
    vehicleSkills: 'Vehicle Skills',
    noTasksAssigned: 'No active tasks assigned.',
    noTaskHistory: 'No task history available.',
    noEarningsRecorded: 'No earnings recorded yet.',
    noWorkingDays: 'No working days set.',
    noOffDays: 'No off days set.',
    noSkillsSelected: 'No skills selected.',
    sortedNewestFirst: 'Sorted: Newest First',
    skillsInstruction: 'Hold Ctrl (Cmd on Mac) to select multiple skills.',
    createBundle: "Create Bundle",
    bundleName: "Bundle Name",
    bundleNameHindi: "Bundle Name (Hindi)",
    bundleNameMarathi: "Bundle Name (Marathi)",
    driverName: "Driver Name",
    maleWorkers: "Male Workers",
    femaleWorkers: "Female Workers",
    price: "Price",
    availabilityStatus: "Availability Status",
    availabilityDate: "Availability Date",
    timeRange: "Time Range",
    location: "Location",
    addBundle: "Add Bundle",
    editBundle: "Edit Bundle",
    deleteBundle: "Delete Bundle",
    // Profile
    name: 'Name',
    mobile: 'Mobile',
    pincode: 'Pincode',
    driverStatusLabel: 'Status',
    enterName: 'Enter your name',
    enterMobileNumber: 'Enter 10-digit mobile number',
    enterPincode: 'Enter 6-digit pincode',
    selectDriverStatus: 'Select driver status',
    updateProfile: 'Update Profile',
    available: 'Available',
    busy: 'Busy',

    // Availability
    workingDays: 'Working Days',
    offDays: 'Off Days',
    addWorkingDay: 'Add Working Day',
    addOffDay: 'Add Off Day',
    selectWorkingDay: 'Select working day',
    selectOffDay: 'Select off day',
    removeWorkingDay: 'Remove working day',
    removeOffDay: 'Remove off day',

    // Vehicle Skills
    selectSkills: 'Select Vehicle Skills',
    updateSkills: 'Update Skills',
    currentSkills: 'Current Skills',

    // Earnings
    serviceFeeWallet: 'Service Fee Wallet',
    payServiceFee: 'Pay Service Fee',
    assignmentId: 'Assignment ID',
    vehicleType: 'Vehicle Type',
    serviceFee: 'Service Fee (2%)',
    paymentMethod: 'Payment Method',
    completed: 'Completed',
    paymentMethodCash: 'Cash',
    paymentMethodOnline: 'Online',
    selectPaymentMethod: 'Select Payment',

    // Task Details
    type: 'Type',
    date: 'Date',
    location: 'Location',
    workers: 'Workers',
    accept: 'Accept',
    reject: 'Reject',
    complete: 'Complete',
    timeLeft: 'Time Left',
    markAsCompleted: 'Mark task as completed',

    // Status
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    completed: 'Completed',

    // Error Messages
    errorFirebaseNotInitialized: 'Firebase not initialized.',
    errorPleaseLogIn: 'Please log in as a driver.',
    errorAccessRestricted: 'Access restricted to drivers.',
    errorFetchingAssignments: 'Failed to fetch assignments.',
    errorFetchingTaskHistory: 'Failed to fetch task history.',
    errorFetchingWorkerDetails: 'Failed to load worker details.',
    errorPaymentGatewayNotLoaded: 'Payment gateway not loaded. Please try again.',
    errorServiceFeeLow: 'Service fee wallet balance is less than ₹100. No payment required.',
    errorSelectPaymentMethod: 'Select a payment method.',
    errorInvalidAssignment: 'Invalid assignment details.',
    errorInvalidAssignmentCost: 'Invalid assignment cost.',
    errorHandlingTimeout: 'Failed to handle timeout.',
    errorAcceptingAssignment: 'Failed to accept assignment.',
    errorRejectingAssignment: 'Failed to reject assignment.',
    errorCompletingAssignment: 'Failed to complete assignment: {message}',
    errorSavingPayment: 'Error saving payment: {message}',
    errorInitiatingPayment: 'Error initiating payment: {message}',
    paymentFailed: 'Payment failed: {description}',
    paymentCancelled: 'Payment cancelled by user.',
    errorEmptyName: 'Name cannot be empty.',
    errorInvalidMobile: 'Mobile number must be a 10-digit number.',
    errorInvalidPincode: 'Pincode must be a 6-digit number.',
    errorInvalidDriverStatus: 'Invalid driver status selected.',
    errorUpdatingProfile: 'Failed to update profile.',
    errorSelectWorkingDay: 'Select a future date for working day.',
    errorSelectOffDay: 'Select a future date for off day.',
    errorUpdatingAvailability: 'Failed to update availability.',
    errorAddingOffDay: 'Failed to add off day.',
    errorRemovingWorkingDay: 'Failed to remove working day.',
    errorRemovingOffDay: 'Failed to remove off day.',
    errorSelectSkill: 'Select at least one vehicle skill.',
    errorUpdatingSkills: 'Failed to update vehicle skills.',
    serviceFeeWarning: 'Please pay your outstanding service fee of ₹{amount} to accept new assignments.',

    // Success Messages
    successAssignmentAccepted: 'Assignment accepted!',
    successAssignmentRejected: 'Assignment rejected.',
    successAssignmentCompleted: 'Task completed and payment recorded!',
    successServiceFeePaid: 'Service fee paid successfully!',
    successProfileUpdated: 'Profile updated successfully!',
    successWorkingDayAdded: 'Working day added!',
    successOffDayAdded: 'Off day added!',
    successWorkingDayRemoved: 'Working day removed!',
    successOffDayRemoved: 'Off day removed!',
    successSkillsUpdated: 'Vehicle skills updated!',
    

    // WhatsApp Messages
    workerMessage: `👋 Hello {workerName},

I am {driverName} ({driverMobile}), your assigned driver for today.

📍 I’ll be arriving soon at: {location}

📞 For any questions, feel free to contact me directly.

Regards,  
Khetisathi 🚜`,
    adminMessage: `🎉 Assignment Completed on KhetiSathi! 🚜

• 👷 Driver: {driverName} ({driverMobile})
• 🛠️ Vehicle Type: {vehicleType}
• 💰 Gross Earnings: ₹{grossEarnings}
• 💵 Service Fee (2%): ₹{serviceFee}
• 💳 Net Earnings: ₹{netEarnings}
• 📅 Completed Date: {completedDate}
• 📍 Location: {location}
• 💳 Payment Method: {paymentMethod}
• 🌟 Assignment ID: {assignmentId}`,
  },
  hindi: {
    // General
    welcome: 'स्वागत है',
    none: 'कोई नहीं',
    selectLanguage: 'भाषा चुनें',
    english: 'अंग्रेजी',
    hindi: 'हिन्दी',
    marathi: 'मराठी',
    driverInformation: 'ड्राइवर जानकारी',
    profile: 'प्रोफाइल',
    status: 'स्थिति',
    totalEarnings: 'कुल आय',
    activeTasks: 'सक्रिय कार्य',
    taskHistory: 'कार्य इतिहास',
    earnings: 'आय',
    availability: 'उपलब्धता',
    vehicleSkills: 'वाहन कौशल',
    noTasksAssigned: 'कोई सक्रिय कार्य नहीं सौंपा गया।',
    noTaskHistory: 'कोई कार्य इतिहास उपलब्ध नहीं।',
    noEarningsRecorded: 'अभी तक कोई आय दर्ज नहीं की गई।',
    noWorkingDays: 'कोई कार्य दिवस सेट नहीं।',
    noOffDays: 'कोई अवकाश दिवस सेट नहीं।',
    noSkillsSelected: 'कोई कौशल चयनित नहीं।',
    sortedNewestFirst: 'सॉर्ट किया गया: नवीनतम पहले',
    skillsInstruction: 'एकाधिक कौशल चुनने के लिए Ctrl (Mac पर Cmd) दबाए रखें।',

    // Profile
    name: 'नाम',
    mobile: 'मोबाइल',
    pincode: 'पिनकोड',
    driverStatusLabel: 'स्थिति',
    enterName: 'अपना नाम दर्ज करें',
    enterMobileNumber: '10 अंकों का मोबाइल नंबर दर्ज करें',
    enterPincode: '6 अंकों का पिनकोड दर्ज करें',
    selectDriverStatus: 'ड्राइवर स्थिति चुनें',
    updateProfile: 'प्रोफाइल अपडेट करें',
    available: 'उपलब्ध',
    busy: 'व्यस्त',
    createBundle: "बंडल बनाएं",
    bundleName: "बंडल का नाम",
    bundleNameHindi: "बंडल का नाम (हिंदी)",
    bundleNameMarathi: "बंडल का नाम (मराठी)",
    driverName: "ड्राइवर का नाम",
    maleWorkers: "पुरुष कामगार",
    femaleWorkers: "महिला कामगार",
    price: "मूल्य",
    availabilityStatus: "उपलब्धता स्थिति",
    availabilityDate: "उपलब्धता तिथि",
    timeRange: "समय सीमा",
    location: "स्थान",
    addBundle: "बंडल जोड़ें",
    editBundle: "बंडल संपादित करें",
    deleteBundle: "बंडल हटाएं",
    // Availability
    workingDays: 'कार्य दिवस',
    offDays: 'अवकाश दिवस',
    addWorkingDay: 'कार्य दिवस जोड़ें',
    addOffDay: 'अवकाश दिवस जोड़ें',
    selectWorkingDay: 'कार्य दिवस चुनें',
    selectOffDay: 'अवकाश दिवस चुनें',
    removeWorkingDay: 'कार्य दिवस हटाएं',
    removeOffDay: 'अवकाश दिवस हटाएं',

    // Vehicle Skills
    selectSkills: 'वाहन कौशल चुनें',
    updateSkills: 'कौशल अपडेट करें',
    currentSkills: 'वर्तमान कौशल',

    // Earnings
    serviceFeeWallet: 'सेवा शुल्क वॉलेट',
    payServiceFee: 'सेवा शुल्क भुगतान करें',
    assignmentId: 'असाइनमेंट आईडी',
    vehicleType: 'वाहन प्रकार',
    serviceFee: 'सेवा शुल्क (2%)',
    paymentMethod: 'भुगतान विधि',
    completed: 'पूरा हुआ',
    paymentMethodCash: 'नकद',
    paymentMethodOnline: 'ऑनलाइन',
    selectPaymentMethod: 'भुगतान विधि चुनें',

    // Task Details
    type: 'प्रकार',
    date: 'तारीख',
    location: 'स्थान',
    workers: 'कामगार',
    accept: 'स्वीकार करें',
    reject: 'अस्वीकार करें',
    complete: 'पूरा करें',
    timeLeft: 'बचा हुआ समय',
    markAsCompleted: 'कार्य को पूर्ण के रूप में चिह्नित करें',

    // Status
    pending: 'लंबित',
    accepted: 'स्वीकार किया गया',
    rejected: 'अस्वीकार किया गया',
    completed: 'पूरा हुआ',

    // Error Messages
    errorFirebaseNotInitialized: 'Firebase प्रारंभ नहीं हुआ।',
    errorPleaseLogIn: 'कृपया ड्राइवर के रूप में लॉग इन करें।',
    errorAccessRestricted: 'पहुंच केवल ड्राइवर्स तक सीमित है।',
    errorFetchingAssignments: 'असाइनमेंट प्राप्त करने में विफल।',
    errorFetchingTaskHistory: 'कार्य इतिहास प्राप्त करने में विफल।',
    errorFetchingWorkerDetails: 'कामगार विवरण लोड करने में विफल।',
    errorPaymentGatewayNotLoaded: 'भुगतान गेटवे लोड नहीं हुआ। कृपया फिर से प्रयास करें।',
    errorServiceFeeLow: 'सेवा शुल्क वॉलेट शेष ₹100 से कम है। कोई भुगतान आवश्यक नहीं।',
    errorSelectPaymentMethod: 'भुगतान विधि चुनें।',
    errorInvalidAssignment: 'अमान्य असाइनमेंट विवरण।',
    errorInvalidAssignmentCost: 'अमान्य असाइनमेंट लागत।',
    errorHandlingTimeout: 'टाइमआउट को संभालने में विफल।',
    errorAcceptingAssignment: 'असाइनमेंट स्वीकार करने में विफल।',
    errorRejectingAssignment: 'असाइनमेंट अस्वीकार करने में विफल।',
    errorCompletingAssignment: 'असाइनमेंट पूरा करने में विफल: {message}',
    errorSavingPayment: 'भुगतान सहेजने में त्रुटि: {message}',
    errorInitiatingPayment: 'भुगतान शुरू करने में त्रुटि: {message}',
    paymentFailed: 'भुगतान विफल: {description}',
    paymentCancelled: 'उपयोगकर्ता द्वारा भुगतान रद्द किया गया।',
    errorEmptyName: 'नाम खाली नहीं हो सकता।',
    errorInvalidMobile: 'मोबाइल नंबर 10 अंकों का होना चाहिए।',
    errorInvalidPincode: 'पिनकोड 6 अंकों का होना चाहिए।',
    errorInvalidDriverStatus: 'अमान्य ड्राइवर स्थिति चयनित।',
    errorUpdatingProfile: 'प्रोफाइल अपडेट करने में विफल।',
    errorSelectWorkingDay: 'कार्य दिवस के लिए भविष्य की तारीख चुनें।',
    errorSelectOffDay: 'अवकाश दिवस के लिए भविष्य की तारीख चुनें।',
    errorUpdatingAvailability: 'उपलब्धता अपडेट करने में विफल।',
    errorAddingOffDay: 'अवकाश दिवस जोड़ने में विफल।',
    errorRemovingWorkingDay: 'कार्य दिवस हटाने में विफल।',
    errorRemovingOffDay: 'अवकाश दिवस हटाने में विफल।',
    errorSelectSkill: 'कम से कम एक वाहन कौशल चुनें।',
    errorUpdatingSkills: 'वाहन कौशल अपडेट करने में विफल।',
    serviceFeeWarning: 'कृपया नए असाइनमेंट स्वीकार करने के लिए ₹{amount} का बकाया सेवा शुल्क भुगतान करें।',

    // Success Messages
    successAssignmentAccepted: 'असाइनमेंट स्वीकार किया गया!',
    successAssignmentRejected: 'असाइनमेंट अस्वीकार किया गया।',
    successAssignmentCompleted: 'कार्य पूरा हुआ और भुगतान दर्ज किया गया!',
    successServiceFeePaid: 'सेवा शुल्क सफलतापूर्वक भुगतान किया गया!',
    successProfileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट की गई!',
    successWorkingDayAdded: 'कार्य दिवस जोड़ा गया!',
    successOffDayAdded: 'अवकाश दिवस जोड़ा गया!',
    successWorkingDayRemoved: 'कार्य दिवस हटाया गया!',
    successOffDayRemoved: 'अवकाश दिवस हटाया गया!',
    successSkillsUpdated: 'वाहन कौशल अपडेट किए गए!',

    // WhatsApp Messages
    workerMessage: `👋 नमस्ते {workerName},

मैं {driverName} ({driverMobile}), आज का आपका असाइन किया गया ड्राइवर हूँ।

📍 मैं जल्द ही यहाँ पहुँच रहा हूँ: {location}

📞 किसी भी सवाल के लिए, कृपया मुझसे सीधे संपर्क करें।

नमस्ते,  
खेतिसाथी 🚜`,
    adminMessage: `🎉 खेतिसाथी पर असाइनमेंट पूरा हुआ! 🚜

• 👷 ड्राइवर: {driverName} ({driverMobile})
• 🛠️ वाहन प्रकार: {vehicleType}
• 💰 सकल आय: ₹{grossEarnings}
• 💵 सेवा शुल्क (2%): ₹{serviceFee}
• 💳 शुद्ध आय: ₹{netEarnings}
• 📅 पूर्ण तिथि: {completedDate}
• 📍 स्थान: {location}
• 💳 भुगतान विधि: {paymentMethod}
• 🌟 असाइनमेंट आईडी: {assignmentId}`,
  },
  marathi: {
    // General
    welcome: 'स्वागत आहे',
    none: 'काही नाही',
    selectLanguage: 'भाषा निवडा',
    english: 'इंग्रजी',
    hindi: 'हिंदी',
    marathi: 'मराठी',
    driverInformation: 'ड्रायव्हर माहिती',
    profile: 'प्रोफाइल',
    status: 'स्थिती',
    totalEarnings: 'एकूण कमाई',
    activeTasks: 'सक्रिय कार्ये',
    taskHistory: 'कार्य इतिहास',
    earnings: 'कमाई',
    availability: 'उपलब्धता',
    vehicleSkills: 'वाहन कौशल्ये',
    noTasksAssigned: 'कोणतीही सक्रिय कार्ये नियुक्त केलेली नाहीत.',
    noTaskHistory: 'कार्य इतिहास उपलब्ध नाही.',
    noEarningsRecorded: 'अजून कोणतीही कमाई नोंदवली गेली नाही.',
    noWorkingDays: 'कोणतेही कार्य दिवस सेट केलेले नाहीत.',
    noOffDays: 'कोणतेही सुट्टीचे दिवस सेट केलेले नाहीत.',
    noSkillsSelected: 'कोणतीही कौशल्ये निवडलेली नाहीत.',
    sortedNewestFirst: 'क्रमवारी: नवीनतम प्रथम',
    skillsInstruction: 'एकापेक्षा जास्त कौशल्ये निवडण्यासाठी Ctrl (Mac वर Cmd) दाबा.',

    // Profile
    name: 'नाव',
    mobile: 'मोबाइल',
    pincode: 'पिनकोड',
    driverStatusLabel: 'स्थिती',
    enterName: 'तुमचे नाव प्रविष्ट करा',
    enterMobileNumber: '10 अंकी मोबाइल नंबर प्रविष्ट करा',
    enterPincode: '6 अंकी पिनकोड प्रविष्ट करा',
    selectDriverStatus: 'ड्रायव्हर स्थिती निवडा',
    updateProfile: 'प्रोफाइल अपडेट करा',
    available: 'उपलब्ध',
    busy: 'व्यस्त',

    // Availability
    workingDays: 'कार्य दिवस',
    offDays: 'सुट्टीचे दिवस',
    addWorkingDay: 'कार्य दिवस जोडा',
    addOffDay: 'सुट्टीचा दिवस जोडा',
    selectWorkingDay: 'कार्य दिवस निवडा',
    selectOffDay: 'सुट्टीचा दिवस निवडा',
    removeWorkingDay: 'कार्य दिवस काढा',
    removeOffDay: 'सुट्टीचा दिवस काढा',

    // Vehicle Skills
    selectSkills: 'वाहन कौशल्ये निवडा',
    updateSkills: 'कौशल्ये अपडेट करा',
    currentSkills: 'वर्तमान कौशल्ये',

    // Earnings
    serviceFeeWallet: 'सेवा शुल्क वॉलेट',
    payServiceFee: 'सेवा शुल्क भरा',
    assignmentId: 'असाइनमेंट आयडी',
    vehicleType: 'वाहन प्रकार',
    serviceFee: 'सेवा शुल्क (2%)',
    paymentMethod: 'पेमेंट पद्धत',
    completed: 'पूर्ण झाले',
    paymentMethodCash: 'रोख',
    paymentMethodOnline: 'ऑनलाइन',
    selectPaymentMethod: 'पेमेंट पद्धत निवडा',
    createBundle: "बंडल तयार करा",
    bundleName: "बंडलचे नाव",
    bundleNameHindi: "बंडलचे नाव (हिंदी)",
    bundleNameMarathi: "बंडलचे नाव (मराठी)",
    driverName: "ड्रायव्हरचे नाव",
    maleWorkers: "पुरुष कामगार",
    femaleWorkers: "महिला कामगार",
    price: "किंमत",
    availabilityStatus: "उपलब्धता स्थिती",
    availabilityDate: "उपलब्धता तारीख",
    timeRange: "वेळेची श्रेणी",
    location: "स्थान",
    addBundle: "बंडल जोडा",
    editBundle: "बंडल संपादन करा",
    deleteBundle: "बंडल हटवा",
    // Task Details
    type: 'प्रकार',
    date: 'तारीख',
    location: 'स्थान',
    workers: 'कामगार',
    accept: 'स्वीकारा',
    reject: 'नाकारा',
    complete: 'पूर्ण करा',
    timeLeft: 'उरलेला वेळ',
    markAsCompleted: 'कार्य पूर्ण म्हणून चिन्हांकित करा',

    // Status
    pending: 'प्रलंबित',
    accepted: 'स्वीकारले',
    rejected: 'नाकारले',
    completed: 'पूर्ण झाले',

    // Error Messages
    errorFirebaseNotInitialized: 'Firebase सुरू झाले नाही.',
    errorPleaseLogIn: 'कृपया ड्रायव्हर म्हणून लॉग इन करा.',
    errorAccessRestricted: 'प्रवेश फक्त ड्रायव्हर्ससाठी मर्यादित आहे.',
    errorFetchingAssignments: 'असाइनमेंट्स मिळवण्यात अयशस्वी.',
    errorFetchingTaskHistory: 'कार्य इतिहास मिळवण्यात अयशस्वी.',
    errorFetchingWorkerDetails: 'कामगार तपशील लोड करण्यात अयशस्वी.',
    errorPaymentGatewayNotLoaded: 'पेमेंट गेटवे लोड झाले नाही. कृपया पुन्हा प्रयत्न करा.',
    errorServiceFeeLow: 'सेवा शुल्क वॉलेट शिल्लक ₹100 पेक्षा कमी आहे. पेमेंट आवश्यक नाही.',
    errorSelectPaymentMethod: 'पेमेंट पद्धत निवडा.',
    errorInvalidAssignment: 'अवैध असाइनमेंट तपशील.',
    errorInvalidAssignmentCost: 'अवैध असाइनमेंट खर्च.',
    errorHandlingTimeout: 'टाइमआउट हाताळण्यात अयशस्वी.',
    errorAcceptingAssignment: 'असाइनमेंट स्वीकारण्यात अयशस्वी.',
    errorRejectingAssignment: 'असाइनमेंट नाकारण्यात अयशस्वी.',
    errorCompletingAssignment: 'असाइनमेंट पूर्ण करण्यात अयशस्वी: {message}',
    errorSavingPayment: 'पेमेंट जतन करण्यात त्रुटी: {message}',
    errorInitiatingPayment: 'पेमेंट सुरू करण्यात त्रुटी: {message}',
    paymentFailed: 'पेमेंट अयशस्वी: {description}',
    paymentCancelled: 'वापरकर्त्याने पेमेंट रद्द केले.',
    errorEmptyName: 'नाव रिक्त असू शकत नाही.',
    errorInvalidMobile: 'मोबाइल नंबर 10 अंकी असणे आवश्यक आहे.',
    errorInvalidPincode: 'पिनकोड 6 अंकी असणे आवश्यक आहे.',
    errorInvalidDriverStatus: 'अवैध ड्रायव्हर स्थिती निवडली गेली.',
    errorUpdatingProfile: 'प्रोफाइल अपडेट करण्यात अयशस्वी.',
    errorSelectWorkingDay: 'कार्य दिवसासाठी भविष्यातील तारीख निवडा.',
    errorSelectOffDay: 'सुट्टीच्या दिवसासाठी भविष्यातील तारीख निवडा.',
    errorUpdatingAvailability: 'उपलब्धता अपडेट करण्यात अयशस्वी.',
    errorAddingOffDay: 'सुट्टीचा दिवस जोडण्यात अयशस्वी.',
    errorRemovingWorkingDay: 'कार्य दिवस काढण्यात अयशस्वी.',
    errorRemovingOffDay: 'सुट्टीचा दिवस काढण्यात अयशस्वी.',
    errorSelectSkill: 'किमान एक वाहन कौशल्य निवडा.',
    errorUpdatingSkills: 'वाहन कौशल्ये अपडेट करण्यात अयशस्वी.',
    serviceFeeWarning: 'कृपया नवीन असाइनमेंट्स स्वीकारण्यासाठी ₹{amount} चे बाकी सेवा शुल्क भरा.',

    // Success Messages
    successAssignmentAccepted: 'असाइनमेंट स्वीकारले!',
    successAssignmentRejected: 'असाइनमेंट नाकारले.',
    successAssignmentCompleted: 'कार्य पूर्ण झाले आणि पेमेंट नोंदवले गेले!',
    successServiceFeePaid: 'सेवा शुल्क यशस्वीरित्या भरले गेले!',
    successProfileUpdated: 'प्रोफाइल यशस्वीरित्या अपडेट केले!',
    successWorkingDayAdded: 'कार्य दिवस जोडला!',
    successOffDayAdded: 'सुट्टीचा दिवस जोडला!',
    successWorkingDayRemoved: 'कार्य दिवस काढला!',
    successOffDayRemoved: 'सुट्टीचा दिवस काढला!',
    successSkillsUpdated: 'वाहन कौशल्ये अपडेट केली!',

    // WhatsApp Messages
    workerMessage: `👋 नमस्कार {workerName},

मी {driverName} ({driverMobile}), आजचा तुमचा नियुक्त ड्रायव्हर आहे.

📍 मी लवकरच येथे पोहोचेन: {location}

📞 कोणत्याही प्रश्नांसाठी, कृपया माझ्याशी थेट संपर्क साधा.

नमस्कार,  
खेतिसाथी 🚜`,
    adminMessage: `🎉 खेतिसाथीवर असाइनमेंट पूर्ण झाले! 🚜

• 👷 ड्रायव्हर: {driverName} ({driverMobile})
• 🛠️ वाहन प्रकार: {vehicleType}
• 💰 एकूण कमाई: ₹{grossEarnings}
• 💵 सेवा शुल्क (2%): ₹{serviceFee}
• 💳 निव्वळ कमाई: ₹{netEarnings}
• 📅 पूर्ण तारीख: {completedDate}
• 📍 स्थान: {location}
• 💳 पेमेंट पद्धत: {paymentMethod}
• 🌟 असाइनमेंट आयडी: {assignmentId}`,
  },
};

export default translationsDriverDashboard;
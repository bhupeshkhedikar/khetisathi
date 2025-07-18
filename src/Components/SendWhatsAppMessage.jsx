import React, { useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const sendWhatsAppMessage = async (mobile, type, message, contentSid = '', contentVariables = {}) => {
  try {
    if (!mobile) return false;

    const body = type === 'content'
      ? {
          to: `+91${mobile.replace(/\s/g, '')}`,
          contentSid,
          contentVariables,
        }
      : {
          to: `+91${mobile.replace(/\s/g, '')}`,
          message,
        };

    const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.ok;
  } catch (err) {
    console.error(`Error sending WhatsApp message to ${mobile}`, err);
    return false;
  }
};

const contentTemplates = [
  {
    label: '🚜 Driver Profile Approved',
    value: 'driver_profile_approved',
    contentSid: 'HXbe3ea460565c1bd7750e5fe8d4554038',
    variables: ['1'],
    preview: `
🙏 नमस्कार {{1}}, 

तुमची प्रोफाईल KhetiSathi वर मंजूर झालेली आहे ✅

कृपया तुमच्याकडे असलेल्या **रोवणी शेतमजुरांची संख्या** व **पूर्ण गाडी भाडा (per day)** ह्याबद्दल माहिती खालील क्रमांकावर पाठवा:
📞 8788647637

KhetiSathi वापरल्याबद्दल धन्यवाद 🌾
    `,
  },
  {
    label: '🌾 Bundle Available for Farmer',
    value: 'bundle_available_notificationn',
    contentSid: 'HX215485454fb489a90f997a13a86f7f1d',
    variables: ['1', '2', '3', '4','5','6'],
    preview: `
🙏 नमस्कार {{1}} शेतकरी राजा,

 रोवणी शेतमजूर बंडल सध्या उपलब्ध आहे.

📦 बंडल नाव – {{2}}

👩‍🌾 महिला रोवणी शेतमजूर ₹{{3}} (प्रति दिवस): एकूण {{4}}  
👨‍🌾 पुरुष पेंडकर: एकूण {{5}}  
🚜 वाहतूक भाडा (प्रति दिवस): ₹{{6}}

कृपया तपशील पाहण्यासाठी किंवा पुढील कारवाईसाठी www.khetisathi.com वर लॉगिन करा.
    `,
  },
  {
  label: '✅ Booking Confirmation (Farmlabour)',
  value: 'booking_confirmation_farmlabour',
  contentSid: 'HX8a2c94b9401b393e315ff8c58dfb86b0',
  variables: ['1', '2', '3', '4', '5', '6', '7', '8'],
  preview: `
🙏 नमस्कार {{1}} शेतकरी राजा,

🌾 तुमची ऑर्डर रोवणी शेतमजूर बंडल: {{2}} यशस्वीरीत्या बुक झाली आहे ✅

📅 दिनांक: {{3}}  
⏰ वेळ: {{4}} 
📍 स्थान: {{5}}   
📞 संपर्क: {{6}} 

🚜 ड्रायव्हरचे नाव व संपर्क: {{7}}   
👩‍🌾 शेतमजुरांचे कॅप्टन संपर्क: {{8}} 

🧾 तुम्ही बुक केलेले शेतमजूर वेळेवर शेतावर पोहोचतील. निश्चिंत रहा 🙌

🙏 KhetiSathi वापरल्याबद्दल धन्यवाद!
  `.trim(),
},
{
  label: '❌ Order Cancelled + Refund (Farmer Friendly)',
  value: 'booking_cancelled_refunded_farmer',
  contentSid: 'HXbe0d7876ef230820304bdeec3e43d957',
  variables: ['1', '2', '3', '4'],
  preview: `
🙏 नमस्कार {{1}} शेतकरी राजा,

🙇‍♂️ क्षमस्व! तुमची रोवणी शेतमजूर बंडल: {{2}} ही ऑर्डर आम्हाला रद्द करावी लागली आहे ❌

😔 कारण: सध्या आपल्या भागात शेतमजूर उपलब्ध नाहीत. 

💰 तुमची भरलेली रक्कम ₹{{3}} ही आम्ही यशस्वीरित्या परत पाठवली आहे ✅  
🔖 परताव्याचा रेफ. क्रमांक: {{4}}

🌱 आमचं तुमच्याबद्दल विशेष प्रेम आहे, आणि आम्ही शेतकऱ्यांची अडचण टाळण्यासाठी सतत प्रयत्नशील आहोत. 

🧑‍🌾 पुढील वेळी अधिक चांगली सेवा देण्याचा आमचा वचनबद्ध प्रयत्न असेल 🙏

🌐 पुन्हा बुकिंगसाठी भेट द्या: www.khetisathi.com  
🚜 *KhetiSathi* — तुमच्या शेतात तुमच्यासोबत!

❤️ तुमचा विश्वास आमचं बळ आहे.
  `.trim(),
}


];

const SendWhatsAppMessage = () => {
  const [mobiles, setMobiles] = useState('');
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [status, setStatus] = useState('');
  const [messageType, setMessageType] = useState('content');
  const [contentSid, setContentSid] = useState('');
  const [contentVariables, setContentVariables] = useState({});

  const generateContentPreview = () => {
    const current = contentTemplates.find(t => t.value === selectedTemplate);
    if (!current || !current.preview) return '';

    let msg = current.preview;
    current.variables.forEach((v) => {
      const val = contentVariables[v] || '';
      msg = msg.replace(`{{${v}}}`, val);
    });

    return msg.trim();
  };

  const handleSend = async () => {
    const numbers = mobiles.split(',').map((num) => num.trim()).filter(Boolean);
    if (!numbers.length) {
      setStatus('Please enter mobile numbers.');
      return;
    }

    setStatus('Sending messages...');

    for (const mobile of numbers) {
      let ok = false;
      let messageSent = '';

      if (!contentSid || Object.keys(contentVariables).length === 0) {
        setStatus('Please provide content SID and all required variables.');
        return;
      }
      ok = await sendWhatsAppMessage(mobile, 'content', '', contentSid, contentVariables);
      messageSent = `[Content Message] SID: ${contentSid}, variables: ${JSON.stringify(contentVariables)}`;

      await addDoc(collection(db, 'whatsappMessages'), {
        name,
        mobile,
        message: messageSent,
        status: ok ? 'Sent' : 'Failed',
        timestamp: Timestamp.now(),
      });
    }

    setStatus('All messages processed.');
    setMobiles('');
    setName('');
    setSelectedTemplate('');
    setContentSid('');
    setContentVariables({});
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#fafafa', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#2e7d32', marginBottom: '20px' }}>📲 WhatsApp Message Sender (KhetiSathi)</h2>

      <input type="text" placeholder="Recipient's name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
      <textarea placeholder="Mobile numbers (comma separated)" value={mobiles} onChange={(e) => setMobiles(e.target.value)} rows={2} style={styles.textarea} />

      <select value={selectedTemplate} onChange={(e) => {
        const selected = contentTemplates.find(t => t.value === e.target.value);
        setSelectedTemplate(selected?.value || '');
        setContentSid(selected?.contentSid || '');
        setContentVariables({});
      }} style={styles.select}>
        <option value="">-- Select Twilio Content Template --</option>
        {contentTemplates.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {selectedTemplate && contentTemplates.find(t => t.value === selectedTemplate)?.variables.map((v) => (
        <input
          key={v}
          type="text"
          placeholder={`Value for {{${v}}}`}
          value={contentVariables[v] || ''}
          onChange={(e) => setContentVariables({ ...contentVariables, [v]: e.target.value })}
          style={styles.input}
        />
      ))}

      {Object.keys(contentVariables).length > 0 && (
        <div style={styles.previewBox}>
          <strong>📄 Preview:</strong>
          <pre style={styles.preview}>{generateContentPreview()}</pre>
        </div>
      )}

      <button onClick={handleSend} style={styles.button}>Send WhatsApp Messages</button>
      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
};

const styles = {
  input: { width: '100%', padding: '10px', borderRadius: '6px', fontSize: '16px', marginBottom: '10px', border: '1px solid #ccc' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', fontSize: '16px', marginBottom: '10px', border: '1px solid #ccc' },
  select: { width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '14px', backgroundColor: '#43a047', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
  status: { marginTop: '15px', textAlign: 'center', color: '#333', fontWeight: 'bold' },
  previewBox: { backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '6px', marginBottom: '10px', fontSize: '14px' },
  preview: { whiteSpace: 'pre-wrap', margin: 0 },
};

export default SendWhatsAppMessage;
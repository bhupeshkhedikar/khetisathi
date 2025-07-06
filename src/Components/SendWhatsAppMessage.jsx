import React, { useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const sendWhatsAppMessage = async (mobile, message) => {
  try {
    if (!mobile) return false;
    const response = await fetch('https://whatsapp-api-cyan-gamma.vercel.app/api/send-whatsapp.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: `+91${mobile.replace(/\s/g, '')}`, message }),
    });
    return response.ok;
  } catch (err) {
    console.error(`Error sending WhatsApp message to ${mobile}`, err);
    return false;
  }
};

const templates = [
  {
    label: 'Driver Assigned',
    value: 'driver_assigned',
    template: `🚜 ड्रायव्हर नेमणूक झाली आहे.\n👤 नाव: {driverName}\n📞 मोबाईल: {driverNumber}`,
    placeholders: ['driverName', 'driverNumber'],
  },
  {
    label: 'Worker Assigned',
    value: 'worker_assigned',
    template: `👷🏻 कामगार नेमणूक झाली आहे.\n👤 नाव: {workerName}\n📞 मोबाईल: {workerNumber}`,
    placeholders: ['workerName', 'workerNumber'],
  },
  {
    label: 'Worker Reaching Soon',
    value: 'worker_coming',
    template: `👷🏻 कामगार लवकरच पोहोचतील.\n👤 नाव: {workerName}\n🕒 वेळ: {eta}`,
    placeholders: ['workerName', 'eta'],
  },
];

const footer = '\n\n🙏 धन्यवाद! KhetiSathi वापरल्याबद्दल आभार.';

const SendWhatsAppMessage = () => {
  const [mobiles, setMobiles] = useState('');
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [placeholders, setPlaceholders] = useState({});
  const [customMessage, setCustomMessage] = useState('');
  const [status, setStatus] = useState('');

  const currentTemplate = templates.find((t) => t.value === selectedTemplate);

  const generateMessage = () => {
    let msg = '';

    if (currentTemplate) {
      msg = currentTemplate.template;
      currentTemplate.placeholders.forEach((ph) => {
        msg = msg.replace(`{${ph}}`, placeholders[ph] || '');
      });
    } else {
      msg = customMessage;
    }

    return name ? `Hi ${name},\n\n${msg}${footer}` : `${msg}${footer}`;
  };

  const handleSend = async () => {
    const numbers = mobiles.split(',').map((num) => num.trim()).filter(Boolean);
    const finalMessage = generateMessage();

    if (!numbers.length || !finalMessage) {
      setStatus('Please fill all required fields.');
      return;
    }

    setStatus('Sending messages...');

    for (const mobile of numbers) {
      const ok = await sendWhatsAppMessage(mobile, finalMessage);

      await addDoc(collection(db, 'whatsappMessages'), {
        name,
        mobile,
        message: finalMessage,
        status: ok ? 'Sent' : 'Failed',
        timestamp: Timestamp.now(),
      });
    }

    setStatus('All messages processed.');
    setMobiles('');
    setName('');
    setSelectedTemplate('');
    setPlaceholders({});
    setCustomMessage('');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📲 WhatsApp Message Sender (KhetiSathi)</h2>

      <input
        type="text"
        placeholder="Enter recipient's name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />

      <textarea
        placeholder="Mobile numbers (comma separated)"
        value={mobiles}
        onChange={(e) => setMobiles(e.target.value)}
        rows={2}
        style={styles.textarea}
      />

      <select
        value={selectedTemplate}
        onChange={(e) => {
          setSelectedTemplate(e.target.value);
          setCustomMessage('');
        }}
        style={styles.select}
      >
        <option value="">-- Select a Message Template --</option>
        {templates.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {currentTemplate && currentTemplate.placeholders.map((ph) => (
        <input
          key={ph}
          type="text"
          placeholder={`Enter ${ph}`}
          value={placeholders[ph] || ''}
          onChange={(e) => setPlaceholders({ ...placeholders, [ph]: e.target.value })}
          style={styles.input}
        />
      ))}

      {!selectedTemplate && (
        <textarea
          placeholder="Write custom message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={4}
          style={styles.textarea}
        />
      )}

      <div style={styles.previewBox}>
        <strong>📄 Preview:</strong>
        <pre style={styles.preview}>{generateMessage()}</pre>
      </div>

      <button onClick={handleSend} style={styles.button}>Send WhatsApp Messages</button>
      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '650px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#fafafa',
    fontFamily: 'sans-serif',
  },
  heading: {
    textAlign: 'center',
    color: '#2e7d32',
    marginBottom: '20px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '16px',
    marginBottom: '10px',
    border: '1px solid #ccc',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '16px',
    marginBottom: '10px',
    border: '1px solid #ccc',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#43a047',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  status: {
    marginTop: '15px',
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  previewBox: {
    backgroundColor: '#e8f5e9',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px',
  },
  preview: {
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
};

export default SendWhatsAppMessage;

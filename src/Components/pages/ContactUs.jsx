import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted! We will respond within 24 hours.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="font-poppins bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <header className="bg-green-600 text-white text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Contact KhetiSathi</h1>
        <p className="mt-4 text-lg">We’re here to support your farming journey!</p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Get in Touch */}
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-semibold text-green-700 mb-4">Get in Touch</h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            We’re here to assist with your farming needs. Reach out via the details below or use our contact form.
          </p>
        </section>

        {/* Contact Details */}
        <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-green-700 mb-6 text-center">Contact Details</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <i className="fas fa-map-marker-alt text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">At post Lakhori, PO:Lakhni, DIST: Bhandara, Maharashtra - 441804</p>
            </div>
            <div>
              <i className="fas fa-envelope text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">
                <a href="mailto:support@khetisathi.com" className="hover:text-green-700">support@khetisathi.com or bhupssspk@gmail.com</a>
              </p>
            </div>
            <div>
              <i className="fas fa-phone-alt text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">+91 7020258039</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-600">Business Hours: Monday to Saturday, 9:00 AM - 6:00 PM IST</p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-12 bg-green-50 p-8 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-green-700 mb-6 text-center">Contact Form</h3>
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your Email"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
                placeholder="Your Message"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors"
            >
              Submit
            </button>
          </form>
        </section>
      </main>

      {/* Footer */}
    </div>
  );
};

export default ContactUs;
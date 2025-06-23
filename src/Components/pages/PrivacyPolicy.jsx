import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="font-poppins bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <header className="bg-green-600 text-white text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-lg">Your Privacy Matters to KhetiSathi</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 leading-relaxed text-center">
            At KhetiSathi, we are committed to protecting your privacy. This policy explains how we handle your personal information.
          </p>
        </section>

        {/* Data Collection */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-database text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Data Collection</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">We collect: Name, email, phone number, address, and payment details during purchases.</p>
            <p className="text-gray-600">Optional: Feedback or inquiries submitted via forms.</p>
          </div>
        </section>

        {/* Data Usage */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-cogs text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Data Usage</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">
              To process orders, deliver products, provide support, and send promotional offers (with your consent).
            </p>
          </div>
        </section>

        {/* Data Storage */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-server text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Data Storage</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Data is stored securely on encrypted servers.</p>
            <p className="text-gray-600">We comply with India’s Information Technology Act, 2000.</p>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-share-alt text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Data Sharing</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Shared with trusted third parties (e.g., PayU for payments, logistics for delivery).</p>
            <p className="text-gray-600">We do not sell your data to third parties.</p>
          </div>
        </section>

        {/* User Consent */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">User Consent</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">By using our website, you consent to data processing as outlined.</p>
            <p className="text-gray-600">You can opt out of marketing emails at any time.</p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-user-shield text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Your Rights</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">
              Request access, correction, or deletion of your data by emailing{' '}
              <a href="mailto:support@khetisathi.com" className="text-blue-600 hover:text-blue-800">support@khetisathi.com</a>.
            </p>
          </div>
        </section>

        {/* Contact Queries */}
        <section className="mb-12 bg-green-50 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            For queries, contact us at{' '}
            <a href="mailto:support@khetisathi.com" className="text-blue-600 hover:text-blue-800">support@khetisathi.com</a>.
          </p>
        </section>
      </main>

      {/* Footer */}

    </div>
  );
};

export default PrivacyPolicy;
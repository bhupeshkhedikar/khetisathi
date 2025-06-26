import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="font-poppins bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <header className="bg-green-600 text-white text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Terms and Conditions</h1>
        <p className="mt-4 text-lg">Guidelines for Using KhetiSathi</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 leading-relaxed text-center">
            By using www.khetisathi.com, you agree to the following terms:
          </p>
        </section>

        {/* General */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-info-circle text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">General</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">This website is operated by Bhupesh Prakash Khedikar</p>
            <p className="text-gray-600">Users must be 18 years or older to make purchases.</p>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-credit-card text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Payment Terms</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Payments are processed securely via PayU India.</p>
            <p className="text-gray-600 mb-2">
              All transactions are subject to PayU’s Terms and Conditions (
              <a
                href="https://www.payu.in/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                PayU Terms
              </a>
              ).
            </p>
            <p className="text-gray-600">Accepted methods: Credit/Debit Cards, UPI, Net Banking, Wallets.</p>
          </div>
        </section>

        {/* Delivery Terms */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-truck text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Delivery Terms</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Products are delivered within 5-7 business days in India.</p>
            <p className="text-gray-600">Delivery times may vary based on location.</p>
          </div>
        </section>

        {/* Website Usage */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-globe text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Website Usage</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Users must not misuse the website or engage in unlawful activities.</p>
            <p className="text-gray-600">KhetiSathi reserves the right to terminate access for non-compliance.</p>
          </div>
        </section>

        {/* Liability */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-shield-alt text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Liability</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">
              KhetiSathi is not liable for delays due to unforeseen circumstances (e.g., natural disasters).
            </p>
          </div>
        </section>

        {/* Contact Queries */}
        <section className="mb-12 bg-green-50 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            For questions, contact us at{' '}
            <a href="mailto:support@khetisathi.com" className="text-blue-600 hover:text-blue-800">support@khetisathi.com</a>.
          </p>
        </section>
      </main>

      {/* Footer */}

    </div>
  );
};

export default Terms;
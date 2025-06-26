import React from 'react';
import { Link } from 'react-router-dom';

const RefundPolicy = () => {
  return (
    <div className="font-poppins bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <header className="bg-green-600 text-white text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Refund & Cancellation Policy</h1>
        <p className="mt-4 text-lg">Transparent Policies for Your Peace of Mind</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 leading-relaxed text-center">
            KhetiSathi ensures a transparent process for refunds and cancellations.
          </p>
        </section>

        {/* Cancellation Policy */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-times-circle text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Cancellation Policy</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Orders can be canceled within 24 hours of placement for a full refund.</p>
            <p className="text-gray-600 mb-2">
              To cancel, email{' '}
              <a href="mailto:support@khetisathi.com" className="text-blue-600 hover:text-blue-800">support@khetisathi.com</a>{' '}
              with your order ID.
            </p>
            <p className="text-gray-600">No cancellations are allowed after the order is shipped.</p>
          </div>
        </section>

        {/* Refund Policy */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-undo-alt text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Refund Policy</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">Eligible for:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-2">
              <li>Damaged or defective products (reported within 48 hours of delivery).</li>
              <li>Non-delivery due to our error.</li>
            </ul>
            <p className="text-gray-600 mb-2">Refunds are processed within 7-10 business days to the original payment method.</p>
            <p className="text-gray-600">Shipping charges are non-refundable.</p>
          </div>
        </section>

        {/* Non-Refundable Cases */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-ban text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Non-Refundable Cases</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">Products damaged due to misuse or customer error are not eligible for refunds.</p>
          </div>
        </section>

        {/* Shipping Policy */}
        <section className="mb-12">
          <div className="flex items-center mb-4">
            <i className="fas fa-shipping-fast text-green-600 text-2xl mr-3"></i>
            <h2 className="text-2xl font-semibold text-green-700">Shipping Policy</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-2">We deliver across India using reliable logistics partners.</p>
            <p className="text-gray-600 mb-2">Standard shipping duration: <strong>5-7 business days</strong>.</p>
            <p className="text-gray-600 mb-2">Orders are processed within 1-2 business days after confirmation.</p>
            <p className="text-gray-600">Tracking details will be shared once the order is dispatched.</p>
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
    </div>
  );
};

export default RefundPolicy;

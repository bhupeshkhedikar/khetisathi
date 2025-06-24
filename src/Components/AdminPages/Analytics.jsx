import React from 'react';

const Analytics = ({ orders, workers }) => {
  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 text-green-700">Analytics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Total Orders</h4>
          <p className="text-2xl text-green-600">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Active Workers</h4>
          <p className="text-2xl text-green-600">{workers.filter((w) => w.status === 'approved').length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-2">Total Revenue</h4>
          <p className="text-2xl text-green-600">₹{orders.reduce((sum, o) => sum + (o.cost || 0), 0).toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
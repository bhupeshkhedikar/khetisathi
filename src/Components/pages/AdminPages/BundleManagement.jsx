import React from 'react';
import './BundleManagement.css';

const BundleManagement = ({
  bundles,
  drivers,
  newBundleName,
  setNewBundleName,
  newBundleMaleWorkers,
  setNewBundleMaleWorkers,
  newBundleFemaleWorkers,
  setNewBundleFemaleWorkers,
  newBundlePrice,
  setNewBundlePrice,
  newBundleDriverId,
  setNewBundleDriverId,
  newBundleVehicleSkills,
  setNewBundleVehicleSkills,
  newBundleMaleWages,
  setNewBundleMaleWages,
  newBundleFemaleWages,
  setNewBundleFemaleWages,
  newBundleDriverWages,
  setNewBundleDriverWages,
  newBundleTimeRange,
  setNewBundleTimeRange,
  newBundleLocation,
  setNewBundleLocation,
  handleAddBundle,
  handleDeleteBundle,
  openEditBundleModal,
  showEditBundleModal,
  currentBundle,
  editBundleName,
  setEditBundleName,
  editBundleMaleWorkers,
  setEditBundleMaleWorkers,
  editBundleFemaleWorkers,
  setEditBundleFemaleWorkers,
  editBundlePrice,
  setEditBundlePrice,
  editBundleDriverId,
  setEditBundleDriverId,
  editBundleVehicleSkills,
  setEditBundleVehicleSkills,
  editBundleMaleWages,
  setEditBundleMaleWages,
  editBundleFemaleWages,
  setEditBundleFemaleWages,
  editBundleDriverWages,
  setEditBundleDriverWages,
  editBundleTimeRange,
  setEditBundleTimeRange,
  editBundleLocation,
  setEditBundleLocation,
  handleEditBundle,
  setShowEditBundleModal,
  loading,
}) => {
  const timeRangeOptions = [
    '09:45 AM - 04:45 PM',
    '9:00 AM - 5:00 PM',
    '8:00 AM - 5:00 PM',
    '7:00 AM - 5:00 PM',
    '10:00 AM - 5:00 PM',
  ];

  return (
    <section className="bundles-section">
      <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Bundles</h3>
      <div className="bundles-grid">
        {bundles.map((b) => (
          <div key={b.id} className="bundle-card">
            <div className="bundle-content">
              <h4 className="bundle-name">{b.name}</h4>
              <p className="bundle-details">
                Workers: {b.maleWorkers} male + {b.femaleWorkers} female
              </p>
              <p className="bundle-details">Male Wages: ₹{b.maleWages}/day</p>
              <p className="bundle-details">Female Wages: ₹{b.femaleWages}/day</p>
              {b.driverId && (
                <>
                  <p className="bundle-details">
                    Driver: {drivers.find((d) => d.id === b.driverId)?.name || 'Unknown'}
                  </p>
                  <p className="bundle-details">Driver Wages: ₹{b.driverWages}/day</p>
                </>
              )}
              {b.vehicleSkills?.length > 0 && (
                <p className="bundle-details">Skills: {b.vehicleSkills.join(', ')}</p>
              )}
              <p className="bundle-details">Time: {b.timeRange}</p>
              <p className="bundle-details">Location: {b.location}</p>
              <p className="bundle-price">₹{b.price.toFixed(2)}</p>
              <div className="bundle-actions">
                <button
                  type="button"
                  className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition text-sm"
                  onClick={() => openEditBundleModal(b)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 transition text-sm"
                  onClick={() => handleDeleteBundle(b.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddBundle} className="bg-white p-6 rounded-lg shadow-lg mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">Bundle Name:</label>
            <input
              type="text"
              value={newBundleName}
              onChange={(e) => setNewBundleName(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Male Workers:</label>
            <input
              type="number"
              value={newBundleMaleWorkers}
              onChange={(e) => setNewBundleMaleWorkers(e.target.value)}
              min="0"
              step="1"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Female Workers:</label>
            <input
              type="number"
              value={newBundleFemaleWorkers}
              onChange={(e) => setNewBundleFemaleWorkers(e.target.value)}
              min="0"
              step="1"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Price (₹):</label>
            <input
              type="number"
              value={newBundlePrice}
              onChange={(e) => setNewBundlePrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Male Wages (₹/day):</label>
            <input
              type="number"
              value={newBundleMaleWages}
              onChange={(e) => setNewBundleMaleWages(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Female Wages (₹/day):</label>
            <input
              type="number"
              value={newBundleFemaleWages}
              onChange={(e) => setNewBundleFemaleWages(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Driver Wages (₹/day):</label>
            <input
              type="number"
              value={newBundleDriverWages}
              onChange={(e) => setNewBundleDriverWages(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-gray-700">Time Range:</label>
            <select
              value={newBundleTimeRange}
              onChange={(e) => setNewBundleTimeRange(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">Select Time Range</option>
              {timeRangeOptions.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Location:</label>
            <input
              type="text"
              value={newBundleLocation}
              onChange={(e) => setNewBundleLocation(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Select Driver:</label>
            <select
              value={newBundleDriverId}
              onChange={(e) => {
                setNewBundleDriverId(e.target.value);
                const driver = drivers.find((d) => d.id === e.target.value);
                setNewBundleVehicleSkills(driver ? driver.vehicleSkills || [] : []);
              }}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            >
              <option value="">No Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} (
                  {driver.vehicleSkills && driver.vehicleSkills.length > 0
                    ? driver.vehicleSkills
                        .map((skill) => skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                        .join(', ')
                    : 'None'}
                  )
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-full font-semibold hover:bg-green-700 transition"
          disabled={loading}
        >
          <i className="fas fa-plus mr-2"></i> Add Bundle
        </button>
      </form>
      {showEditBundleModal && currentBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Edit Bundle: {currentBundle.name}</h3>
            <form onSubmit={handleEditBundle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700">Bundle Name:</label>
                  <input
                    type="text"
                    value={editBundleName}
                    onChange={(e) => setEditBundleName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Male Workers:</label>
                  <input
                    type="number"
                    value={editBundleMaleWorkers}
                    onChange={(e) => setEditBundleMaleWorkers(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Female Workers:</label>
                  <input
                    type="number"
                    value={editBundleFemaleWorkers}
                    onChange={(e) => setEditBundleFemaleWorkers(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Price (₹):</label>
                  <input
                    type="number"
                    value={editBundlePrice}
                    onChange={(e) => setEditBundlePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Male Wages (₹/day):</label>
                  <input
                    type="number"
                    value={editBundleMaleWages}
                    onChange={(e) => setEditBundleMaleWages(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Female Wages (₹/day):</label>
                  <input
                    type="number"
                    value={editBundleFemaleWages}
                    onChange={(e) => setEditBundleFemaleWages(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Driver Wages (₹/day):</label>
                  <input
                    type="number"
                    value={editBundleDriverWages}
                    onChange={(e) => setEditBundleDriverWages(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Time Range:</label>
                  <select
                    value={editBundleTimeRange}
                    onChange={(e) => setEditBundleTimeRange(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Select Time Range</option>
                    {timeRangeOptions.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700">Location:</label>
                  <input
                    type="text"
                    value={editBundleLocation}
                    onChange={(e) => setEditBundleLocation(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Select Driver:</label>
                  <select
                    value={editBundleDriverId}
                    onChange={(e) => {
                      setEditBundleDriverId(e.target.value);
                      const driver = drivers.find((d) => d.id === e.target.value);
                      setEditBundleVehicleSkills(driver ? driver.vehicleSkills || [] : []);
                    }}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">No Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} (
                        {driver.vehicleSkills && driver.vehicleSkills.length > 0
                          ? driver.vehicleSkills
                              .map((skill) => skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                              .join(', ')
                          : 'None'}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBundleModal(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default BundleManagement;
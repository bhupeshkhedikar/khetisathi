import React from 'react';

const BundleManagement = ({
  bundles,
  services,
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
  handleEditBundle,
  setShowEditBundleModal,
  loading,
}) => {
  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Bundles</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {bundles.map((b) => (
          <div key={b.id} className="bg-white rounded-lg shadow-lg p-4">
            <h4 className="text-lg font-semibold mb-2">{b.name}</h4>
            <p className="text-gray-600 mb-2">
              {b.maleWorkers} male + {b.femaleWorkers} female workers
            </p>
            <p className="text-green-600 font-bold">₹{b.price.toFixed(2)}</p>
            {b.driverId && (
              <p className="text-gray-600 mb-2">
                Driver: {drivers.find((d) => d.id === b.driverId)?.name || 'Unknown'}
              </p>
            )}
            {b.vehicleSkills?.length > 0 && (
              <p className="text-gray-600 mb-2">
                Vehicle Skills:{' '}
                {b.vehicleSkills
                  .map((skill) => skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                  .join(', ')}
              </p>
            )}
            <div className="mt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => openEditBundleModal(b)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                disabled={loading}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBundle(b.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddBundle} className="bg-white p-6 rounded-lg shadow-lg">
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
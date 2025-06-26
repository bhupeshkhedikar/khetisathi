import React from 'react';

const ServiceManagement = ({
  services,
  newServiceName,
  setNewServiceName,
  newServiceType,
  setNewServiceType,
  newServiceCost,
  setNewServiceCost,
  newMaleCost,
  setNewMaleCost,
  newFemaleCost,
  setNewFemaleCost,
  newServiceImage,
  setNewServiceImage,
  handleAddService,
  handleDeleteService,
  openEditServiceModal,
  showEditServiceModal,
  currentService,
  editServiceName,
  setEditServiceName,
  editServiceType,
  setEditServiceType,
  editServiceCost,
  setEditServiceCost,
  editMaleCost,
  setEditMaleCost,
  editFemaleCost,
  setEditFemaleCost,
  editServiceImage,
  setEditServiceImage,
  handleEditService,
  setShowEditServiceModal,
  loading,
}) => {
  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 text-green-700">Manage Services</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {services.map((s) => (
          <div key={s.id} className="bg-white rounded-lg shadow-lg">
            <img src={s.image} alt={s.name} className="w-full h-32 object-cover rounded-t-lg" />
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-2">{s.name}</h4>
              <p className="text-gray-600 mb-2">{s.type}</p>
              <p className={s.type === 'farm-workers' ? 'text-green-600 font-semibold' : 'text-green-600 font-bold'}>
                {s.type === 'farm-workers'
                  ? `Male: ₹${s.maleCost || 0}/day, Female: ₹${s.femaleCost || 0}/day`
                  : `₹${s.cost || 0}${s.type === 'tractor-drivers' ? '/hour' : ''}`}
              </p>
              <div className="flex space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => openEditServiceModal(s)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(s.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddService} className="bg-white p-6 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">Service Name:</label>
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Service Type:</label>
            <select
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
              required
            >
              <option value="">Select Type</option>
              <option value="farm-workers">Farm Workers</option>
              <option value="tractor-drivers">Tractor Drivers</option>
              <option value="plowing">Plowing</option>
              <option value="harvesting">Harvesting</option>
              <option value="irrigation">Irrigation</option>
            </select>
          </div>
          {newServiceType === 'farm-workers' ? (
            <>
              <div>
                <label className="block text-gray-700">Male Cost (₹/day):</label>
                <input
                  type="number"
                  value={newMaleCost}
                  onChange={(e) => setNewMaleCost(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Female Cost (₹/day):</label>
                <input
                  type="number"
                  value={newFemaleCost}
                  onChange={(e) => setNewFemaleCost(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-gray-700">Cost (₹/{newServiceType === 'tractor-drivers' ? 'hour' : 'job'}):</label>
              <input
                type="number"
                value={newServiceCost}
                onChange={(e) => setNewServiceCost(e.target.value)}
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-gray-700">Image URL (optional):</label>
            <input
              type="text"
              value={newServiceImage}
              onChange={(e) => setNewServiceImage(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-full font-semibold hover:bg-green-700 transition"
          disabled={loading}
        >
          <i className="fas fa-plus mr-2"></i> Add Service
        </button>
      </form>
      {showEditServiceModal && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Edit Service: {currentService.name}</h3>
            <form onSubmit={handleEditService}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700">Service Name:</label>
                  <input
                    type="text"
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Service Type:</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="farm-workers">Farm Workers</option>
                    <option value="tractor-drivers">Tractor Drivers</option>
                    <option value="plowing">Plowing</option>
                    <option value="harvesting">Harvesting</option>
                    <option value="irrigation">Irrigation</option>
                  </select>
                </div>
                {editServiceType === 'farm-workers' ? (
                  <>
                    <div>
                      <label className="block text-gray-700">Male Cost (₹/day):</label>
                      <input
                        type="number"
                        value={editMaleCost}
                        onChange={(e) => setEditMaleCost(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700">Female Cost (₹/day):</label>
                      <input
                        type="number"
                        value={editFemaleCost}
                        onChange={(e) => setEditFemaleCost(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-gray-700">
                      Cost (₹/{editServiceType === 'tractor-drivers' ? 'hour' : 'job'}):
                    </label>
                    <input
                      type="[number"
                      value={editServiceCost}
                      onChange={(e) => setEditServiceCost(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-gray-700">Image URL (optional):</label>
                  <input
                    type="text"
                    value={editServiceImage}
                    onChange={(e) => setEditServiceImage(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  />
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
                  onClick={() => setShowEditServiceModal(false)}
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

export default ServiceManagement;
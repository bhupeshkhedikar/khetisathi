import React from 'react';
import { SKILL_LABELS } from '../../../utils/skills';
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
  newPriceUnit,
  setNewPriceUnit,
  newActiveStatus,
  setNewActiveStatus,
  editPriceUnit,
  setEditPriceUnit,
  editActiveStatus,
  setEditActiveStatus,
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
                  : `₹${s.cost || 0} ${s.priceUnit || (s.type === 'ownertc' ? 'Per Hour' : s.type === 'fertilizer-applicator' ? 'Per Bag' : 'Per Acre')}`}
              </p>
              <p className="text-gray-600">Status: {s.activeStatus ? 'Active' : 'Inactive'}</p>
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
  onChange={(e) => {
    setNewServiceType(e.target.value);
    setNewPriceUnit(
      e.target.value === 'ownertc' ? 'Per Hour' :
      e.target.value === 'fertilizer-applicator' ? 'Per Bag' :
      e.target.value === 'farm-workers' ? 'Per Day' : 'Per Acre'
    );
  }}
  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
  required
>
  <option value="">Select Type</option>
  <option value="farm-workers">{SKILL_LABELS['farm-worker'].marathi} ({SKILL_LABELS['farm-worker'].english})</option>
  <option value="sower">{SKILL_LABELS.sower.marathi} ({SKILL_LABELS.sower.english})</option>
  <option value="paddy-spreader">{SKILL_LABELS['paddy-spreader'].marathi} ({SKILL_LABELS['paddy-spreader'].english})</option>
  <option value="tractor-driver">{SKILL_LABELS['tractor-driver'].marathi} ({SKILL_LABELS['tractor-driver'].english})</option>
  <option value="ownertc">{SKILL_LABELS.ownertc.marathi} ({SKILL_LABELS.ownertc.english})</option>
  <option value="harvester">{SKILL_LABELS.harvester.marathi} ({SKILL_LABELS.harvester.english})</option>
  <option value="harvester-operator">{SKILL_LABELS['harvester-operator'].marathi} ({SKILL_LABELS['harvester-operator'].english})</option>
  <option value="owner-harvester">{SKILL_LABELS['owner-harvester'].marathi} ({SKILL_LABELS['owner-harvester'].english})</option>
  <option value="pesticide-applicator">{SKILL_LABELS['pesticide-applicator'].marathi} ({SKILL_LABELS['pesticide-applicator'].english})</option>
  <option value="fertilizer-applicator">{SKILL_LABELS['fertilizer-applicator'].marathi} ({SKILL_LABELS['fertilizer-applicator'].english})</option>
  <option value="grass-cutter">{SKILL_LABELS['grass-cutter'].marathi} ({SKILL_LABELS['grass-cutter'].english})</option>
  <option value="cow-milker">{SKILL_LABELS['cow-milker'].marathi} ({SKILL_LABELS['cow-milker'].english})</option>
  <option value="buffalo-milker">{SKILL_LABELS['buffalo-milker'].marathi} ({SKILL_LABELS['buffalo-milker'].english})</option>
  <option value="ploughman-with-bull">{SKILL_LABELS['ploughman-with-bull'].marathi} ({SKILL_LABELS['ploughman-with-bull'].english})</option>
  <option value="crop-sorter">{SKILL_LABELS['crop-sorter'].marathi} ({SKILL_LABELS['crop-sorter'].english})</option>
  <option value="watering-laborer">{SKILL_LABELS['watering-laborer'].marathi} ({SKILL_LABELS['watering-laborer'].english})</option>
  <option value="dung-cleaner">{SKILL_LABELS['dung-cleaner'].marathi} ({SKILL_LABELS['dung-cleaner'].english})</option>
  <option value="bullockcart-owner">{SKILL_LABELS['bullockcart-owner'].marathi} ({SKILL_LABELS['bullockcart-owner'].english})</option>
  <option value="bullock-cart-only">{SKILL_LABELS['bullock-cart-only'].marathi} ({SKILL_LABELS['bullock-cart-only'].english})</option>
  <option value="bullock-cart-driver">{SKILL_LABELS['bullock-cart-driver'].marathi} ({SKILL_LABELS['bullock-cart-driver'].english})</option>
  <option value="irrigation">{SKILL_LABELS['irrigation-specialist'].marathi} ({SKILL_LABELS['irrigation-specialist'].english})</option>
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
              <label className="block text-gray-700">Base Price (₹):</label>
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
            <label className="block text-gray-700">Price Unit:</label>
            <select
              value={newPriceUnit}
              onChange={(e) => setNewPriceUnit(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            >
              <option value="Per Acre">Per Acre</option>
              <option value="Per Hour">Per Hour</option>
              <option value="Per Day">Per Day</option>
              <option value="Per Bag">Per Bag</option>
              <option value="Fixed Price">Fixed Price</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Image URL (optional):</label>
            <input
              type="text"
              value={newServiceImage}
              onChange={(e) => setNewServiceImage(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-gray-700">Active Status:</label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={newActiveStatus}
                onChange={(e) => setNewActiveStatus(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-600"
              />
              <span className="ml-2 text-gray-700">Toggle to make this service visible to farmers</span>
            </label>
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
  value={newServiceType}
  onChange={(e) => {
    setNewServiceType(e.target.value);
    setNewPriceUnit(
      e.target.value === 'ownertc' ? 'Per Hour' :
      e.target.value === 'fertilizer-applicator' ? 'Per Bag' :
      e.target.value === 'farm-workers' ? 'Per Day' : 'Per Acre'
    );
  }}
  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
  required
>
  <option value="">Select Type</option>
  <option value="farm-workers">{SKILL_LABELS['farm-worker'].marathi} ({SKILL_LABELS['farm-worker'].english})</option>
  <option value="sower">{SKILL_LABELS.sower.marathi} ({SKILL_LABELS.sower.english})</option>
  <option value="paddy-spreader">{SKILL_LABELS['paddy-spreader'].marathi} ({SKILL_LABELS['paddy-spreader'].english})</option>
  <option value="tractor-driver">{SKILL_LABELS['tractor-driver'].marathi} ({SKILL_LABELS['tractor-driver'].english})</option>
  <option value="ownertc">{SKILL_LABELS.ownertc.marathi} ({SKILL_LABELS.ownertc.english})</option>
  <option value="harvester">{SKILL_LABELS.harvester.marathi} ({SKILL_LABELS.harvester.english})</option>
  <option value="harvester-operator">{SKILL_LABELS['harvester-operator'].marathi} ({SKILL_LABELS['harvester-operator'].english})</option>
  <option value="owner-harvester">{SKILL_LABELS['owner-harvester'].marathi} ({SKILL_LABELS['owner-harvester'].english})</option>
  <option value="pesticide-applicator">{SKILL_LABELS['pesticide-applicator'].marathi} ({SKILL_LABELS['pesticide-applicator'].english})</option>
  <option value="fertilizer-applicator">{SKILL_LABELS['fertilizer-applicator'].marathi} ({SKILL_LABELS['fertilizer-applicator'].english})</option>
  <option value="grass-cutter">{SKILL_LABELS['grass-cutter'].marathi} ({SKILL_LABELS['grass-cutter'].english})</option>
  <option value="cow-milker">{SKILL_LABELS['cow-milker'].marathi} ({SKILL_LABELS['cow-milker'].english})</option>
  <option value="buffalo-milker">{SKILL_LABELS['buffalo-milker'].marathi} ({SKILL_LABELS['buffalo-milker'].english})</option>
  <option value="ploughman-with-bull">{SKILL_LABELS['ploughman-with-bull'].marathi} ({SKILL_LABELS['ploughman-with-bull'].english})</option>
  <option value="crop-sorter">{SKILL_LABELS['crop-sorter'].marathi} ({SKILL_LABELS['crop-sorter'].english})</option>
  <option value="watering-laborer">{SKILL_LABELS['watering-laborer'].marathi} ({SKILL_LABELS['watering-laborer'].english})</option>
  <option value="dung-cleaner">{SKILL_LABELS['dung-cleaner'].marathi} ({SKILL_LABELS['dung-cleaner'].english})</option>
  <option value="bullockcart-owner">{SKILL_LABELS['bullockcart-owner'].marathi} ({SKILL_LABELS['bullockcart-owner'].english})</option>
  <option value="bullock-cart-only">{SKILL_LABELS['bullock-cart-only'].marathi} ({SKILL_LABELS['bullock-cart-only'].english})</option>
  <option value="bullock-cart-driver">{SKILL_LABELS['bullock-cart-driver'].marathi} ({SKILL_LABELS['bullock-cart-driver'].english})</option>
  <option value="irrigation">{SKILL_LABELS['irrigation-specialist'].marathi} ({SKILL_LABELS['irrigation-specialist'].english})</option>
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
                    <label className="block text-gray-700">Base Price (₹):</label>
                    <input
                      type="number"
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
                  <label className="block text-gray-700">Price Unit:</label>
                  <select
                    value={editPriceUnit}
                    onChange={(e) => setEditPriceUnit(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  >
                    <option value="Per Acre">Per Acre</option>
                    <option value="Per Hour">Per Hour</option>
                    <option value="Per Day">Per Day</option>
                    <option value="Per Bag">Per Bag</option>
                    <option value="Fixed Price">Fixed Price</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700">Image URL (optional):</label>
                  <input
                    type="text"
                    value={editServiceImage}
                    onChange={(e) => setEditServiceImage(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Active Status:</label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={editActiveStatus}
                      onChange={(e) => setEditActiveStatus(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-green-600"
                    />
                    <span className="ml-2 text-gray-700">Toggle to make this service visible to farmers</span>
                  </label>
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
import React, { useState, useEffect } from 'react';

const AssignDriverModal = ({
  currentOrder,
  users,
  workers,
  setShowAssignDriverModal,
  isWorkerAvailable,
  handleAssignDriver,
  loading,
}) => {
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [error, setError] = useState('');

  // Calculate the number of workers assigned to the order
  const assignedWorkersCount = Array.isArray(currentOrder.workerId)
    ? currentOrder.workerId.filter((workerId) => {
        const workerStatusEntry = (currentOrder.workerAcceptances || []).find(
          (entry) => entry.workerId === workerId
        );
        return workerStatusEntry && workerStatusEntry.status === 'accepted';
      }).length
    : currentOrder.workerId && currentOrder.accepted === 'accepted'
    ? 1
    : 0;

  // Determine required driver type based on worker count
  const getRequiredDriverType = () => {
    if (assignedWorkersCount >= 1 && assignedWorkersCount <= 4) {
      return { type: 'bike', count: 2 }; // 2 bike drivers or 1 UV auto
    } else if (assignedWorkersCount <= 6) {
      return { type: 'uv-auto', count: 1 }; // 1 UV auto
    } else if (assignedWorkersCount <= 10) {
      return { type: 'omni', count: 1 }; // 1 Omni
    } else if (assignedWorkersCount <= 15) {
      return { type: 'tata-magic', count: 1 }; // 1 Tata Magic
    } else if (assignedWorkersCount > 15) { // Changed from > 20 to > 15 to align with previous ranges
      return { type: 'bolero', count: 1 }; // 1 Bolero
    }
    return { type: 'bike', count: 1 }; // Fallback to 1 bike driver
  };

  const requiredDriver = getRequiredDriverType();

  // Filter available drivers based on vehicle skills and availability
  const availableDrivers = workers
    .filter((worker) => {
      const isDriver = worker.role === 'driver';
      const isApproved = worker.status === 'approved';
      const isAvailable = worker.driverStatus === 'available';
      const hasVehicleSkill = Array.isArray(worker.vehicleSkills) && worker.vehicleSkills.includes(requiredDriver.type);
      // Relaxed pincode check: only enforce if farmerId and pincode exist
      const pincodeMatch =
        !currentOrder.farmerId ||
        !users[currentOrder.farmerId]?.pincode ||
        !worker.pincode ||
        worker.pincode === users[currentOrder.farmerId]?.pincode;
      const isDateAvailable = isWorkerAvailable(worker, currentOrder.startDate);

      // Debugging logs (comment out in production)
      // console.log(`Driver ${worker.name || worker.id}:`, {
      //   isDriver,
      //   isApproved,
      //   isAvailable,
      //   hasVehicleSkill,
      //   pincodeMatch,
      //   isDateAvailable,
      //   vehicleSkills: worker.vehicleSkills,
      //   requiredType: requiredDriver.type,
      // });

      return (
        isDriver &&
        isApproved &&
        isAvailable &&
        hasVehicleSkill &&
        pincodeMatch &&
        isDateAvailable
      );
    })
    .map((worker) => ({
      id: worker.id,
      name: worker.name || 'Unnamed Driver',
      mobile: worker.mobile || 'N/A',
      vehicleSkills: Array.isArray(worker.vehicleSkills) ? worker.vehicleSkills : [],
    }));

  // Auto-assign drivers based on required type and count
  const handleAutoAssign = async () => {
    setError('');
    if (availableDrivers.length === 0) {
      setError(`No available drivers with ${requiredDriver.type} skills. Please approve drivers or check availability.`);
      return;
    }
    try {
      let driverIds = [];
      const attemptedDrivers = currentOrder.attemptedDrivers || [];

      if (requiredDriver.type === 'bike' && requiredDriver.count === 2) {
        // Try to assign 2 bike drivers
        const bikeDrivers = availableDrivers.filter(
          (driver) =>
            driver.vehicleSkills.includes('bike') && !attemptedDrivers.includes(driver.id)
        );
        if (bikeDrivers.length >= 2) {
          driverIds = bikeDrivers.slice(0, 2).map((driver) => driver.id);
        } else {
          // Fallback to 1 UV auto driver
          const uvAutoDrivers = availableDrivers.filter(
            (driver) =>
              driver.vehicleSkills.includes('uv-auto') && !attemptedDrivers.includes(driver.id)
          );
          if (uvAutoDrivers.length >= 1) {
            driverIds = uvAutoDrivers.slice(0, 1).map((driver) => driver.id);
          } else {
            throw new Error('Not enough bike or UV auto drivers available.');
          }
        }
      } else {
        // Assign one driver of the required type
        const suitableDrivers = availableDrivers.filter(
          (driver) =>
            driver.vehicleSkills.includes(requiredDriver.type) && !attemptedDrivers.includes(driver.id)
        );
        if (suitableDrivers.length < requiredDriver.count) {
          throw new Error(`Not enough ${requiredDriver.type} drivers available.`);
        }
        driverIds = suitableDrivers.slice(0, requiredDriver.count).map((driver) => driver.id);
      }

      await handleAssignDriver(currentOrder.id, driverIds);
      setShowAssignDriverModal(false);
    } catch (err) {
      setError(`Error auto-assigning drivers: ${err.message}`);
    }
  };

  // Handle manual driver selection
  const handleDriverSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setSelectedDrivers(selectedOptions);
  };

  // Handle manual driver assignment
  const handleManualAssign = async () => {
    if (selectedDrivers.length === 0) {
      setError('Please select at least one driver.');
      return;
    }
    try {
      await handleAssignDriver(currentOrder.id, selectedDrivers);
      setShowAssignDriverModal(false);
    } catch (err) {
      setError(`Error assigning drivers: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-green-700">
          Assign Drivers for Order {currentOrder.id.slice(0, 6)}
        </h3>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <p className="text-gray-600 mb-4">
          Workers Assigned: {assignedWorkersCount} | Required: {requiredDriver.count}{' '}
          {requiredDriver.type === 'bike'
            ? 'Bike Drivers or 1 UV Auto'
            : requiredDriver.type.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Drivers</label>
          {availableDrivers.length === 0 ? (
            <p className="text-red-600 text-sm">
              No available drivers found. Ensure drivers are approved, available, and have the required vehicle skills ({requiredDriver.type}).
            </p>
          ) : (
            <>
              <select
                multiple
                value={selectedDrivers}
                onChange={handleDriverSelection}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-600"
                size={Math.min(5, availableDrivers.length)}
              >
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - 📲 {driver.mobile} ({driver.vehicleSkills
                      .map((skill) => skill.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                      .join(', ')})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Hold Ctrl (Cmd on Mac) to select multiple drivers.
              </p>
            </>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <button
            onClick={handleAutoAssign}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={loading || availableDrivers.length === 0}
          >
            Auto Assign
          </button>
          <button
            onClick={handleManualAssign}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
            disabled={loading || availableDrivers.length === 0}
          >
            Manual Assign
          </button>
          <button
            onClick={() => setShowAssignDriverModal(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDriverModal;
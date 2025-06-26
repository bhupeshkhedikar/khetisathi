import React from 'react';

const AssignWorkerModal = ({
  currentOrder,
  users,
  workers,
  calculateWorkersNeeded,
  isWorkerAvailable,
  selectedMaleWorkers,
  setSelectedMaleWorkers,
  selectedFemaleWorkers,
  setSelectedFemaleWorkers,
  selectedWorkers,
  setSelectedWorkers,
  handleAssignWorker,
  setShowAssignModal,
  loading,
}) => {
  const { maleNeeded, femaleNeeded, totalNeeded, rejections } = calculateWorkersNeeded(currentOrder);
  const farmerPincode = users[currentOrder.farmerId]?.pincode || '';
  const farmerName = users[currentOrder.farmerId]?.name || 'N/A';
  const farmerPhone = users[currentOrder.farmerId]?.mobile || 'N/A';
  const assignedWorkers = Array.isArray(currentOrder.workerId)
    ? currentOrder.workerId.filter((id) => {
        const wa = currentOrder.workerAcceptances?.find((wa) => wa.workerId === id);
        return wa?.status === 'accepted' || wa?.status === 'pending';
      })
    : currentOrder.workerId && currentOrder.accepted !== 'rejected'
    ? [currentOrder.workerId]
    : [];
  const rejectedWorkers = (currentOrder.workerAcceptances || [])
    .filter((wa) => wa.status === 'rejected')
    .map((wa) => wa.workerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
        <h3 className="text-lg font-semibold mb-4 text-green-600">
          {currentOrder.workerAcceptances?.some((wa) => wa.status === 'rejected')
            ? `Reassign Worker(s) to Order: ${currentOrder.id.slice(0, 6)}`
            : `Assign Worker(s) to Order: ${currentOrder.id.slice(0, 6)}`}
        </h3>
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="text-md font-semibold mb-2 text-gray-800">Order Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Order ID:</span> {currentOrder.id}
            </div>
            <div>
              <span className="font-medium">Service Type:</span> {currentOrder.serviceType.replace('-', ' ').toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Farmer Name:</span> {farmerName}
            </div>
            <div>
              <span className="font-medium">Farmer Phone:</span> {farmerPhone}
            </div>
            <div>
              <span className="font-medium">Pincode:</span> {farmerPincode || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {currentOrder.startDate}
            </div>
            <div>
              <span className="font-medium">Farmer Address:</span> {currentOrder.address}
            </div>
            <div>
              <span className="font-medium">Workers Requested:</span>
              {currentOrder.maleWorkers > 0 && ` ${currentOrder.maleWorkers} Male`}
              {currentOrder.femaleWorkers > 0 && ` ${currentOrder.femaleWorkers} Female`}
            </div>
            <div>
              <span className="font-medium">Workers Needed:</span>
              {maleNeeded > 0 && ` ${maleNeeded} Male`}
              {femaleNeeded > 0 && ` ${femaleNeeded} Female`}
            </div>
            <div>
              <span className="font-medium">Rejections:</span> {rejections} worker(s)
            </div>
            {rejectedWorkers.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Rejected By:</span>
                {rejectedWorkers.map((id) => workers.find((w) => w.id === id)?.name || id).join(', ')}
              </div>
            )}
          </div>
        </div>
        {rejections > 0 && (
          <p className="text-sm text-red-600 mb-4">
            {rejections} worker(s) rejected. Please assign {maleNeeded + femaleNeeded || totalNeeded} worker(s).
          </p>
        )}
        {currentOrder.serviceType === 'farm-workers' ? (
          <>
            {maleNeeded > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2">Select Male Workers</h4>
                <p className="text-sm text-gray-600 mb-2">Required: {maleNeeded}</p>
                {workers
                  .filter(
                    (w) =>
                      w.gender === 'male' &&
                      w.status === 'approved' &&
                      w.workerStatus === 'ready' &&
                      w.skills?.includes('farm-worker') &&
                      (farmerPincode ? w.pincode === farmerPincode : true) &&
                      !rejectedWorkers.includes(w.id) &&
                      !assignedWorkers.includes(w.id) &&
                      isWorkerAvailable(w, currentOrder.startDate)
                  )
                  .length === 0 ? (
                  <p className="text-sm text-red-600">No eligible male workers available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                    {workers
                      .filter(
                        (w) =>
                          w.gender === 'male' &&
                          w.status === 'approved' &&
                          w.workerStatus === 'ready' &&
                          w.skills?.includes('farm-worker') &&
                          (farmerPincode ? w.pincode === farmerPincode : true) &&
                          !rejectedWorkers.includes(w.id) &&
                          !assignedWorkers.includes(w.id) &&
                          isWorkerAvailable(w, currentOrder.startDate)
                      )
                      .map((worker) => (
                        <div key={worker.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`male-${worker.id}`}
                            value={worker.id}
                            checked={selectedMaleWorkers.includes(worker.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMaleWorkers([...selectedMaleWorkers, worker.id]);
                              } else {
                                setSelectedMaleWorkers(selectedMaleWorkers.filter((id) => id !== worker.id));
                              }
                            }}
                            className="mr-2"
                            disabled={
                              selectedMaleWorkers.length >= maleNeeded &&
                              !selectedMaleWorkers.includes(worker.id)
                            }
                          />
                          <label htmlFor={`male-${worker.id}`} className="text-sm">
                            {worker.name || 'N/A'} ({worker.pincode || 'No Pincode'})
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            {femaleNeeded > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2">Select Female Workers</h4>
                <p className="text-sm text-gray-600 mb-2">Required: {femaleNeeded}</p>
                {workers
                  .filter(
                    (w) =>
                      w.gender === 'female' &&
                      w.status === 'approved' &&
                      w.workerStatus === 'ready' &&
                      w.skills?.includes('farm-worker') &&
                      (farmerPincode ? w.pincode === farmerPincode : true) &&
                      !rejectedWorkers.includes(w.id) &&
                      !assignedWorkers.includes(w.id) &&
                      isWorkerAvailable(w, currentOrder.startDate)
                  )
                  .length === 0 ? (
                  <p className="text-sm text-red-600">No eligible female workers available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                    {workers
                      .filter(
                        (w) =>
                          w.gender === 'female' &&
                          w.status === 'approved' &&
                          w.workerStatus === 'ready' &&
                          w.skills?.includes('farm-worker') &&
                          (farmerPincode ? w.pincode === farmerPincode : true) &&
                          !rejectedWorkers.includes(w.id) &&
                          !assignedWorkers.includes(w.id) &&
                          isWorkerAvailable(w, currentOrder.startDate)
                      )
                      .map((worker) => (
                        <div key={worker.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`female-${worker.id}`}
                            value={worker.id}
                            checked={selectedFemaleWorkers.includes(worker.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFemaleWorkers([...selectedFemaleWorkers, worker.id]);
                              } else {
                                setSelectedFemaleWorkers(selectedFemaleWorkers.filter((id) => id !== worker.id));
                              }
                            }}
                            className="mr-2"
                            disabled={
                              selectedFemaleWorkers.length >= femaleNeeded &&
                              !selectedFemaleWorkers.includes(worker.id)
                            }
                          />
                          <label htmlFor={`female-${worker.id}`} className="text-sm">
                            {worker.name || 'N/A'} ({worker.pincode || 'No Pincode'})
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Select Worker(s)</h4>
            <p className="text-sm text-gray-600 mb-2">Required: {totalNeeded}</p>
            {workers
              .filter((w) => {
                const skill =
                  currentOrder.serviceType === 'tractor-drivers' ? 'tractor-driver' : currentOrder.serviceType;
                return (
                  w.status === 'approved' &&
                  w.workerStatus === 'ready' &&
                  w.skills?.includes(skill) &&
                  (farmerPincode ? w.pincode === farmerPincode : true) &&
                  !rejectedWorkers.includes(w.id) &&
                  !assignedWorkers.includes(w.id) &&
                  isWorkerAvailable(w, currentOrder.startDate)
                );
              })
              .length === 0 ? (
              <p className="text-sm text-red-600">No eligible workers available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                {workers
                  .filter((w) => {
                    const skill =
                      currentOrder.serviceType === 'tractor-drivers' ? 'tractor-driver' : currentOrder.serviceType;
                    return (
                      w.status === 'approved' &&
                      w.workerStatus === 'ready' &&
                      w.skills?.includes(skill) &&
                      (farmerPincode ? w.pincode === farmerPincode : true) &&
                      !rejectedWorkers.includes(w.id) &&
                      !assignedWorkers.includes(w.id) &&
                      isWorkerAvailable(w, currentOrder.startDate)
                    );
                  })
                  .map((worker) => (
                    <div key={worker.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`worker-${worker.id}`}
                        value={worker.id}
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkers([...selectedWorkers, worker.id]);
                          } else {
                            setSelectedWorkers(selectedWorkers.filter((id) => id !== worker.id));
                          }
                        }}
                        className="mr-2"
                        disabled={
                          selectedWorkers.length >= totalNeeded &&
                          !selectedWorkers.includes(worker.id)
                        }
                      />
                      <label htmlFor={`worker-${worker.id}`} className="text-sm">
                        {worker.name || 'N/A'} ({worker.pincode || 'No Pincode'})
                      </label>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        <div className="flex space-x-2">
          <button
            onClick={() =>
              handleAssignWorker(
                currentOrder.id,
                currentOrder.serviceType === 'farm-workers'
                  ? [...selectedMaleWorkers, ...selectedFemaleWorkers]
                  : selectedWorkers
              )
            }
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition text-sm"
            disabled={loading}
          >
            Assign
          </button>
          <button
            onClick={() => {
              setShowAssignModal(false);
              setSelectedMaleWorkers([]);
              setSelectedFemaleWorkers([]);
              setSelectedWorkers([]);
            }}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition text-sm"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkerModal;
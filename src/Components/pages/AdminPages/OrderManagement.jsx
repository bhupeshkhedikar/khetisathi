import React from 'react';
import AssignWorkerModal from './AssignWorkerModal';
import AssignDriverModal from './AssignDriverModal';

const OrderManagement = ({
  orders,
  services,
  users,
  workers,
  sortConfig,
  handleSort,
  calculateWorkersNeeded,
  handleAcceptOrder,
  handleRejectOrder,
  autoAssignWorkers,
  handleProcessPayment,
  openAssignModal,
  showAssignModal,
  currentOrder,
  setShowAssignModal,
  selectedMaleWorkers,
  setSelectedMaleWorkers,
  selectedFemaleWorkers,
  setSelectedFemaleWorkers,
  selectedWorkers,
  setSelectedWorkers,
  handleAssignWorker,
  isWorkerAvailable,
  openAssignDriverModal,
  showAssignDriverModal,
  currentOrderForDriver,
  setShowAssignDriverModal,
  handleAssignDriver,
  loading,
}) => {
  // Sort orders based on sortConfig
  const sortedOrders = [...orders].sort((a, b) => {
    const key = sortConfig.key;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (key === 'id') {
      return direction * a.id.localeCompare(b.id);
    } else if (key === 'farmerName') {
      const aName = users[a.farmerId]?.name || '';
      const bName = users[b.farmerId]?.name || '';
      return direction * aName.localeCompare(bName);
    } else if (key === 'workerName') {
      const aWorkerNames = Array.isArray(a.workerId)
        ? a.workerId.map((id) => users[id]?.name || '').join(', ')
        : users[a.workerId]?.name || '';
      const bWorkerNames = Array.isArray(b.workerId)
        ? b.workerId.map((id) => users[id]?.name || '').join(', ')
        : users[b.workerId]?.name || '';
      return direction * aWorkerNames.localeCompare(bWorkerNames);
    } else if (key === 'serviceType') {
      const aService = services.find((s) => s.id === a.serviceId)?.name || a.serviceType || '';
      const bService = services.find((s) => s.id === b.serviceId)?.name || b.serviceType || '';
      return direction * aService.localeCompare(bService);
    } else if (key === 'cost') {
      return direction * ((a.cost || 0) - (b.cost || 0));
    } else if (key === 'status') {
      return direction * (a.status || '').localeCompare(b.status || '');
    } else if (key === 'createdAt') {
      const aTime = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return direction * (aTime - bTime);
    } else if (key === 'completedAt') {
      const aTime = a.completedAt ? a.completedAt.toDate().getTime() : 0;
      const bTime = b.completedAt ? b.completedAt.toDate().getTime() : 0;
      return direction * (aTime - bTime);
    } else if (key === 'paymentStatus') {
      const aStatus = a.paymentStatus?.status || 'Not Paid';
      const bStatus = b.paymentStatus?.status || 'Not Paid';
      return direction * aStatus.localeCompare(bStatus);
    }
    return 0;
  });

  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">All Orders</h3>
      {sortedOrders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-lg" style={{ fontSize: '13px' }}>
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('id')}>
                  Order ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('farmerName')}>
                  Farmer Name {sortConfig.key === 'farmerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('workerName')}>
                  Worker Name(s) {sortConfig.key === 'workerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('serviceType')}>
                  Service Type {sortConfig.key === 'serviceType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('cost')}>
                  Cost {sortConfig.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('completedAt')}>
                  Completed At {sortConfig.key === 'completedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left cursor-pointer" onClick={() => handleSort('paymentStatus')}>
                  Payment Status {sortConfig.key === 'paymentStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-4 text-left">Order Approval</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const { totalNeeded, maleNeeded, femaleNeeded, rejections } = calculateWorkersNeeded(order);
                const needsReassignment = rejections > 0 && (totalNeeded > 0 || maleNeeded > 0 || femaleNeeded > 0);
                const hasAssignedWorkers = Array.isArray(order.workerId)
                  ? order.workerId.some((workerId) => {
                      const workerStatusEntry = (order.workerAcceptances || []).find(
                        (entry) => entry.workerId === workerId
                      );
                      return workerStatusEntry && workerStatusEntry.status === 'accepted';
                    })
                  : order.workerId && order.accepted === 'accepted';

                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{order.id.slice(0, 6)}</td>
                    <td className="py-2 px-4">
                      {users[order.farmerId]?.name || 'N/A'} - 📲 {users[order.farmerId]?.mobile || 'N/A'}<br />
                      <b>Address:</b> {order.address}
                    </td>
                    <td className="py-2 px-4">
                      {Array.isArray(order.workerId) && order.workerId.length > 0 ? (
                        order.workerId.map((workerId, index) => {
                          const workerStatusEntry = (order.workerAcceptances || []).find(
                            (entry) => entry.workerId === workerId
                          );
                          const workerStatus = workerStatusEntry ? workerStatusEntry.status : 'pending';
                          const statusText =
                            workerStatus === 'accepted'
                              ? '✅ Accepted'
                              : workerStatus === 'rejected'
                              ? '❌ Rejected'
                              : workerStatus === 'completed'
                              ? '✅ Completed'
                              : '⏰ Pending';
                          const completionText =
                            workerStatus === 'completed' ? '✅ Completed' : '⏳ Not Completed';
                          const workerPhone = users[workerId]?.mobile || 'N/A';
                          return (
                            <div key={workerId} className="mb-1 text-sm">
                              {users[workerId]?.name || 'N/A'} - 📲 {workerPhone}, {statusText}, {completionText}
                              {index < order.workerId.length - 1 && <br />}
                            </div>
                          );
                        })
                      ) : order.workerId ? (
                        (() => {
                          const workerStatus = order.accepted || 'pending';
                          const statusText =
                            workerStatus === 'accepted'
                              ? '✅ Accepted'
                              : workerStatus === 'rejected'
                              ? '❌ Rejected'
                              : workerStatus === 'completed'
                              ? '✅ Completed'
                              : '⏰ Pending';
                          const completionText =
                            workerStatus === 'completed' ? '✅ Completed' : '⏳ Not Completed';
                          const workerPhone = users[order.workerId]?.mobile || 'N/A';
                          return (
                            <div className="text-sm">
                              {users[order.workerId]?.name || 'N/A'} - 📲 {workerPhone}, {statusText}, {completionText}
                            </div>
                          );
                        })()
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {services.find((s) => s.id === order.serviceId)?.name || order.serviceType || 'N/A'}
                      {order.serviceType === 'farm-workers' && (
                        <span className="block text-xs text-gray-600">
                          {order.orderType === 'bundle'
                            ? `Bundle: ${order.bundleDetails?.name || 'N/A'} (${order.bundleDetails?.maleWorkers || 0} Male, ${order.bundleDetails?.femaleWorkers || 0} Female)`
                            : `(${order.maleWorkers || 0} Male, ${order.femaleWorkers || 0} Female)`}
                        </span>
                      )}
                      {order.serviceType === 'tractor-drivers' && (
                        <span className="block text-xs text-gray-600">{order.hours || 0} hours</span>
                      )}
                      {order.serviceType !== 'farm-workers' && (
                        <span className="block text-xs text-gray-600">{order.totalWorkers || 1} Worker(s)</span>
                      )}
                    </td>
                    <td className="py-2 px-4">₹{(order.cost || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'assigned'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1) || 'N/A'}
                      </span>
                      {needsReassignment && (
                        <span className="block text-xs text-red-600 mt-1">
                          {rejections} worker(s) rejected. Please assign {maleNeeded + femaleNeeded || totalNeeded} worker(s).
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4">
                      {order.completedAt ? new Date(order.completedAt.toDate()).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4">{order.paymentStatus?.status || 'Not Paid'}</td>
                    <td className="py-2 px-4">
                      {order.status === 'pending' && !order.workerId && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                            disabled={loading}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {order.status === 'pending' && needsReassignment && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openAssignModal(order)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                            disabled={loading}
                          >
                            Reassign Worker
                          </button>
                        </div>
                      )}
                      {order.status === 'pending' && !needsReassignment && !order.workerId && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => autoAssignWorkers(order.id, order)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                            disabled={loading}
                          >
                            Auto Assign Workers
                          </button>
                          <button
                            onClick={() => openAssignModal(order)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                            disabled={loading}
                          >
                            Manual Assign Workers
                          </button>
                        </div>
                      )}
                      {(order.status === 'accepted' || order.status === 'assigned') && hasAssignedWorkers && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openAssignDriverModal(order)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-xs"
                            disabled={loading}
                          >
                            Assign Drivers
                          </button>
                          <button
                            onClick={() => handleProcessPayment(order.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs"
                            disabled={loading}
                          >
                            Process Payment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showAssignModal && currentOrder && (
        <AssignWorkerModal
          currentOrder={currentOrder}
          users={users}
          workers={workers}
          calculateWorkersNeeded={calculateWorkersNeeded}
          isWorkerAvailable={isWorkerAvailable}
          selectedMaleWorkers={selectedMaleWorkers}
          setSelectedMaleWorkers={setSelectedMaleWorkers}
          selectedFemaleWorkers={selectedFemaleWorkers}
          setSelectedFemaleWorkers={setSelectedFemaleWorkers}
          selectedWorkers={selectedWorkers}
          setSelectedWorkers={setSelectedWorkers}
          handleAssignWorker={handleAssignWorker}
          setShowAssignModal={setShowAssignModal}
          loading={loading}
        />
      )}
      {showAssignDriverModal && currentOrderForDriver && (
        <AssignDriverModal
          currentOrder={currentOrderForDriver}
          users={users}
          workers={workers}
          isWorkerAvailable={isWorkerAvailable}
          handleAssignDriver={handleAssignDriver}
          setShowAssignDriverModal={setShowAssignDriverModal}
          loading={loading}
        />
      )}
    </section>
  );
};

export default OrderManagement;
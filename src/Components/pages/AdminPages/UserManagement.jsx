import React from 'react';

const UserManagement = ({
  farmers,
  workers,
  farmerSortConfig,
  workerSortConfig,
  handleFarmerSort,
  handleWorkerSort,
  handleApproveWorker,
  handleRejectWorker,
  loading,
}) => {
  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 text-green-700">Registered Users</h3>
      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-4 text-gray-800">Farmers</h4>
        {farmers.length === 0 ? (
          <p className="text-center text-gray-600">No farmers registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('name')}>
                    Name {farmerSortConfig.key === 'name' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('email')}>
                    Email {farmerSortConfig.key === 'email' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('phone')}>
                    Phone {farmerSortConfig.key === 'phone' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleFarmerSort('pincode')}>
                    Pincode {farmerSortConfig.key === 'pincode' && (farmerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6">{farmer.name || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.email || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.mobile || 'N/A'}</td>
                    <td className="py-3 px-6">{farmer.pincode || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xl font-semibold mb-4 text-gray-800">Workers</h4>
        {workers.length === 0 ? (
          <p className="text-center text-gray-600">No workers registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('name')}>
                    Name {workerSortConfig.key === 'name' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('email')}>
                    Email {workerSortConfig.key === 'email' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('phone')}>
                    Phone {workerSortConfig.key === 'phone' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('gender')}>
                    Gender {workerSortConfig.key === 'gender' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('skills')}>
                    Skills {workerSortConfig.key === 'skills' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('pincode')}>
                    Pincode {workerSortConfig.key === 'pincode' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('status')}>
                    Status {workerSortConfig.key === 'status' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleWorkerSort('workerStatus')}>
                    Worker Status {workerSortConfig.key === 'workerStatus' && (workerSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-6 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6">{worker.name || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.email || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.mobile || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.gender || 'N/A'}</td>
                    <td className="py-3 px-6">{(worker.skills || []).join(', ') || 'None'}</td>
                    <td className="py-3 px-6">{worker.pincode || 'N/A'}</td>
                    <td className="py-3 px-6">{worker.status || 'Pending'}</td>
                    <td className="py-3 px-6">{worker.workerStatus || 'Ready'}</td>
                    <td className="py-3 px-6">
                      {worker.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveWorker(worker.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWorker(worker.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserManagement;
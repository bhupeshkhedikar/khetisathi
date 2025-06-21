import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

initializeApp();
const db = getFirestore();

export const reassignOrder = onDocumentUpdated('orders/{orderId}', async (event) => {
  const order = event.data.after.data();
  const previousData = event.data.before.data();

  // Check if order was rejected or timeout expired
  if ((order.accepted === 'rejected' && previousData.accepted !== 'rejected') ||
      (order.status === 'pending' && order.timeout && new Date() > new Date(order.timeout))) {
    logger.info(`Reassigning order ${event.params.orderId}`);

    try {
      // Fetch available workers
      const today = new Date().toISOString().split('T')[0];
      let workersQuery = [];
      if (order.serviceType === 'farm-workers') {
        const gender = order.maleWorkers > 0 ? 'male' : 'female';
        const numWorkers = order.maleWorkers || order.femaleWorkers;
        workersQuery = await db.collection('users')
          .where('role', '==', 'worker')
          .where('status', '==', 'approved')
          .where('pincode', '==', order.farmerId) // Match farmer's pincode
          .where('gender', '==', gender)
          .where('skills', 'array-contains', 'farm-worker')
          .get();
        const availableWorkers = workersQuery.docs
          .filter(doc => {
            const worker = doc.data();
            return (
              !order.attemptedWorkers.includes(doc.id) &&
              (worker.availability?.workingDays?.includes(today) || !worker.availability)
            );
          })
          .map(doc => doc.id);

        if (availableWorkers.length < numWorkers) {
          await event.data.after.ref.update({ status: 'error', error: 'No available workers' });
          return;
        }

        const nextWorker = availableWorkers = availableWorkers.slice(0, numWorkers);
        const timeout = new Date(Date.now() + 2 * 60 * 1000);
        await event.dataDoc.ref.update({
          workerId: nextWorker[0],
          assignedAt: new Date(),
          timeout: timeout.toISOString(),
          attemptedWorkers: [...order.attemptedWorkers, ...nextWorker],
          accepted: 'pending'
        });
      } else {
        workersQuery = await db.collection('users')
          .where('role', '==', 'worker')
          .where('status', '==', 'approved')
          .where('pincode', '==', order.farmerId)
          .where('skills', 'array-contains', order.serviceType)
          .get();
        const availableWorkers = workersQuery.docs
          .filter(doc => !order.attemptedWorkers.includes(doc.id))
          .map(doc => doc.id);

        if (availableWorkers.length === 0) {
          await event.dataDoc.ref.update({ status: 'error', error: 'No available workers' });
          return;
        }

        const timeout = new Date(Date.now() + 2 * 60 * 1000);
        await event.dataDoc.ref.update({
          workerId: availableWorkers[0],
          assignedAt: new Date(),
          timeout: timeout.toISOString(),
          attemptedWorkers: [...order.attemptedWorkers, availableWorkers[0]],
          accepted: 'pending'
        });
      }
    } catch (err) {
      logger.error('Error reassigning order:', err);
      await event.dataDoc.ref.update({ status: 'error', error: err.message });
    }
  }
});
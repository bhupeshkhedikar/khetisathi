export const VEHICLE_SKILLS = ['bike', 'uv-auto'];
export const EARNINGS_CONFIG = {
  smallGroup: { maxWorkers: 2, cost: 200 },
  mediumGroup: { maxWorkers: 4, cost: 300 },
  largeGroup: { maxWorkers: 6, cost: 400 },
};

export const MAX_GROUP_SIZE = 6;
export const ASSIGNMENT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
export const MOBILE_REGEX = /^\+?91?\s*(\d{10})$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-600',
  accepted: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-600',
  available: 'bg-green-100 text-green-800',
  busy: 'bg-blue-100 text-blue-800',
};
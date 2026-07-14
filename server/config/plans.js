const PLANS = {
  ONE_PHOTO: { amount: 200, limit: 1, packageId: 'pkg-1', name: 'Starter (1 Photograph)' },
  TWO_PHOTO: { amount: 300, limit: 2, packageId: 'pkg-2', name: 'Amateur (Up to 2 Photographs)' },
  FIVE_PHOTO: { amount: 400, limit: 5, packageId: 'pkg-3', name: 'Pro (Up to 5 Photographs)' },
  'pkg-1': { amount: 200, limit: 1, packageId: 'pkg-1', name: 'Starter (1 Photograph)' },
  'pkg-2': { amount: 300, limit: 2, packageId: 'pkg-2', name: 'Amateur (Up to 2 Photographs)' },
  'pkg-3': { amount: 400, limit: 5, packageId: 'pkg-3', name: 'Pro (Up to 5 Photographs)' }
};

const getPlan = (planId) => {
  return PLANS[planId] || null;
};

module.exports = {
  PLANS,
  getPlan
};

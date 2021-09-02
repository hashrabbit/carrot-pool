const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['findOrNew', `${__dirname}/../utils`],
  ['lostShares', `${__dirname}/lost_shares`]
];

const _sharedRoundTotal = (deps) => ({ workers, shared, times, maxTime }) => {
  const { findOrNew, lostShares } = deps;
  let totalShares = 0;

  Object.entries(shared).forEach(([addr, shares]) => {
    shares = parseFloat((shares || 0));
    const worker = findOrNew(workers, addr);

    // Calculate this worker's adjusted shares, for the current round, reduced by
    // their percentage of share contribution time in the block.
    const lostCount = lostShares(shares, times[addr], maxTime);
    const shareCount = maxTime > 0 ? Math.max(shares - lostCount, 0) : 0;

    // Update the worker's data with their adjusted shares.
    worker.roundShares = shareCount;

    totalShares += shareCount;
  });
  return totalShares;
};

module.exports = {
  _sharedRoundTotal,
  sharedRoundTotal: _sharedRoundTotal(requireDeps(defaultDeps))
};

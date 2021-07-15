const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['shareMultiplier', `${__dirname}/../utils`],
];

const objectSize = (obj) => Object.keys(obj).length;

// Computes pool and worker roundShares and adjusted hashrates, from entries in
// stats.shares.roundShares. Also computes pool-wide worker-related stats. This
// sub-function essentially does *three* things, but all of them are directly
// related to entries in stats.workers.workers.
const _computeHashrates = ({ shareMultiplier }) => ({ statsConfig, stats }) => {
  // Accumulate roundShares for workers with matching shares.roundShares entries.
  const { workers } = stats.workers;
  const shareEntries = stats.shares.roundShares;
  Object.entries(shareEntries).filter(([w]) => w in workers)
    .forEach(([w, c]) => { workers[w].roundShares += parseFloat(c); });

  // Calculate the adjusted hashrate for each worker entry. Accumulate adjusted
  // hashrates pool-wide, and by their mining type. Copy worker entries to their
  // mining type sub-object.
  Object.entries(stats.workers.workers).forEach(([address, worker]) => {
    const type = worker.soloMining ? 'Solo' : 'Shared';
    const multi = shareMultiplier(stats.algorithm);
    const adjustedRate = (multi * worker.validShares) / statsConfig.hashrateWindow;

    worker.hashrate = adjustedRate;
    stats.workers[`workers${type}`][address] = worker;
    stats.hashrate.hashrate += adjustedRate;
    stats.hashrate[`hashrate${type}`] += adjustedRate;
  });

  // Compute the various workers "count" entries
  stats.workers = {
    ...stats.workers,
    workersCount: objectSize(stats.workers.workers),
    workersSharedCount: objectSize(stats.workers.workersShared),
    workersSoloCount: objectSize(stats.workers.workersSolo)
  };
};

module.exports = {
  _computeHashrates,
  computeHashrates: _computeHashrates(requireDeps(defaultDeps))
};

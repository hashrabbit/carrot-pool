const { requireDeps } = require('../../../utils/require_deps');

const defaultDeps = [
  ['findOrNew', `${__dirname}/../../utils`],
  ['lostShares', `${__dirname}/../lost_shares`]
];

// Adjust the amount of shares credited to each worker in a confirmed block, under
// shared mining. Returns the total shares for the shared round.
const _sharedRoundTotal = (deps) => (env) => (args) => {
  const { findOrNew, lostShares } = deps;
  const { logger } = env;
  const { workers, round, shared, times, maxTime } = args;

  let totalShares = 0;

  Object.entries(shared).forEach(([addr, shares]) => {
    const worker = findOrNew(workers, addr);
    shares = parseFloat(shares || 0);
    worker.records = (worker.records || {});
    worker.records[round.height] = { shares, amounts: 0, times: 0 };
    const record = worker.records[round.height];
    const lostCount = lostShares(shares, times[addr], maxTime, record);
    let shareCount = maxTime > 0 ? Math.max(shares - lostCount, 0) : 0;

    // worker.records[round.height].times is the percentage of the time period
    // this worker is being credited for. If this % > 100%, they are credited with
    // zero shares, and an error message is logged.
    if (record.times > 1.0) {
      logger.error(`Worker: ${addr} time share > 1.0 in round: ${
        round.height} blockHash: ${round.blockHash}`);
      shareCount = 0;
    }

    worker.roundShares = shareCount;
    worker.totalShares = parseFloat(worker.totalShares || 0) + shareCount;
    totalShares += shareCount;
  });
  return totalShares;
};

module.exports = {
  _sharedRoundTotal,
  sharedRoundTotal: _sharedRoundTotal(requireDeps(defaultDeps))
};

const { requireDeps } = require('../../../utils/require_deps');

const defaultDeps = [
  ['findOrNew', `${__dirname}/../../utils`],
  ['sharedRoundTotal', `${__dirname}/shared_round_total`]
];

// Calulate the total Immature block reward, for workers that contributed "shares".
// For soloMined blocks, the full reward is assigned to the worker.
// For blocks with multiple workers, each worker is assinged their percentage of the
// reward, based on the percentage of the share "work" they contributed.
const _immatureBlock = (deps) => (env) => (args) => {
  const { findOrNew, sharedRoundTotal } = deps;
  const { coinUtils, feeSatoshi } = env;
  const { workers, round, shared, solo, times, maxTime } = args;
  const reward = Math.round(coinUtils.coinsToSatoshies(round.reward) - feeSatoshi);

  // Check if Solo Mined
  if (round.soloMined) {
    const worker = findOrNew(workers, round.workerAddress);
    const shares = parseFloat((solo[round.workerAddress] || 0));
    worker.roundShares = shares;
    worker.immature = (worker.immature || 0) + reward;
  } else {
    const totalShared = sharedRoundTotal({
      workers, shared, times, maxTime
    });

    // Calculate adjusted immature reward for all workers, by shared entry address.
    Object.keys(shared).forEach((addr) => {
      const worker = workers[addr];
      const percent = worker.roundShares / totalShared;
      worker.immature = (worker.immature || 0) + Math.round(reward * percent);
    });
  }
};

module.exports = {
  _immatureBlock,
  immatureBlock: _immatureBlock(requireDeps(defaultDeps))
};

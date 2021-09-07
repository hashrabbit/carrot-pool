const { requireDeps } = require('../../../utils/require_deps');

const defaultDeps = [
  ['findOrNew', `${__dirname}/../../utils`]
];

// For "shared" worker shares, compute the % of the round reward they receive,
// based on their portion of shares contributed. If a worker's % is > 1.0, log
// an error, and that worker receives no payout.
const _computeSharedPayouts = ({ findOrNew }) => (env) => (args) => {
  const { logger, workers, coinUtils } = env;
  const { shared, round, totalShares, reward } = args;

  Object.keys(shared).forEach((addr) => {
    const worker = findOrNew(workers, addr);
    const percent = parseFloat(worker.roundShares) / totalShares;

    if (percent > 1.0) {
      const msg = `${addr} share % > 100% in round: ${round.height} blockHash: ${round.blockHash}`;
      logger.error(msg);
      return;
    }
    const rewardInSatoshis = Math.round(reward * percent);
    const rewardInCoins = coinUtils.satoshisToCoins(rewardInSatoshis);
    worker.records[round.height].amounts = rewardInCoins;
    worker.reward = (worker.reward || 0) + rewardInSatoshis;
  });
};

module.exports = {
  _computeSharedPayouts,
  computeSharedPayouts: _computeSharedPayouts(requireDeps(defaultDeps))
};

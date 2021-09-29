const { requireDeps } = require('../../../utils/require_deps');

const defaultDeps = [
  ['findOrNew', `${__dirname}/../../utils`],
  ['adjustRoundTimes', `${__dirname}/adjust_round_times`],
  ['sharedRoundTotal', `${__dirname}/shared_round_total`],
  ['computeSharedPayouts', `${__dirname}/compute_shared_payouts`]
];

const _confirmedBlock = (deps) => (env) => (args) => {
  const { findOrNew, adjustRoundTimes, sharedRoundTotal, computeSharedPayouts } = deps;
  const { coinUtils, feeSatoshi } = env;
  const { coinsToSatoshies, satoshisToCoins } = coinUtils;
  const { workers, round, shared, solo, times, maxTime } = args;

  // NOTE: worker.reward is in units of SATOSHIS
  // NOTE: record.amounts is in units of COINS
  const reward = Math.round(coinsToSatoshies(round.reward) - feeSatoshi);

  // Check if Solo Mined
  if (round.soloMined) {
    const addr = round.workerAddress;
    const worker = findOrNew(workers, addr);
    worker.records = (worker.records || {});

    const shares = parseFloat((solo[addr] || 0));
    const amounts = satoshisToCoins(reward);
    worker.records[round.height] = { shares, amounts, times: 1 };
    worker.roundShares = shares;
    worker.totalShares = parseFloat(worker.totalShares || 0) + shares;
    worker.reward = (worker.reward || 0) + reward;
  } else {
    // Otherwise, calculate payout amounts for all workers that contributed to the block
    const workerTimes = adjustRoundTimes(times, maxTime);
    const totalArgs = {
      workers, round, shared, times: workerTimes, maxTime
    };
    const totalShares = sharedRoundTotal(env)(totalArgs);
    const payoutsArgs = {
      workers, round, shared, totalShares, reward
    };
    computeSharedPayouts(env)(payoutsArgs);
  }
};

module.exports = {
  _confirmedBlock,
  confirmedBlock: _confirmedBlock(requireDeps(defaultDeps))
};

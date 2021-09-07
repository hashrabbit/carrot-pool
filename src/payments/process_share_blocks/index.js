const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchRoundTimes', `${__dirname}/fetch_round_times`],
  ['fetchRoundShares', `${__dirname}/fetch_round_shares`],
  ['checkPaymentFunds', `${__dirname}/check_payment_funds`],
  ['separateRounds', `${__dirname}/separate_rounds`],
  ['moveManualRounds', `${__dirname}/move_manual_rounds`],
  ['processAutoRounds', `${__dirname}/process_auto_rounds`]
];

// Creates a local copy of the env object, with the pool fee and the minimum #
// of confirmations needed to process payouts for a round. Keeps the passed-in
// free of any modifications.
const buildLocalEnv = (env) => {
  const { poolOptions, logger, coin, coinUtils: { coinsToSatoshies } } = env;
  const fee = parseFloat(poolOptions.coin.txfee) || parseFloat(0.0004);
  const feeSatoshi = coinsToSatoshies(fee);
  const minConfPayout = Math.max((poolOptions.paymentProcessing.minConf || 10), 1);
  if (minConfPayout < 3) {
    logger.warning(`${coin} minConf of 3 is recommended.`);
  }
  return { ...env, feeSatoshi, minConfPayout };
};

// A processPayments promise chain function. Takes the workers and rounds from
// the previous chain function, evaluates the submitted shares, and the % of time
// each worker was contributing, to compute the PPLNT-adjusted payout award owed
// to each worker.
const _processShareBlocks = (deps) => (env) => async (args) => {
  const { fetchRoundTimes, fetchRoundShares, checkPaymentFunds } = deps;
  const { separateRounds, processAutoRounds, moveManualRounds } = deps;
  const { workers, rounds, addressAccount } = args;
  const localEnv = buildLocalEnv(env);

  // Fetch the individual time durations, and the submitted share difficulty
  // ratings collected during the round(s).
  const times = await fetchRoundTimes(localEnv)(rounds);
  const { solo, shared } = await fetchRoundShares(localEnv)(rounds);

  // Determine if we have enough funds available to process all potential payouts.
  await checkPaymentFunds(localEnv)({ workers, rounds });

  // Separate the rounds into those that the pool can automatically payout, from those
  // that need to be manually processed. Move the "manual" rounds to a holding location
  // so they won't be picked up in later round processing.
  const { autoRounds, manualRounds } = separateRounds({ rounds, solo, shared });
  await moveManualRounds(localEnv)(manualRounds);

  // Compute the PPLNT-adjusted payout amounts, for each worker that contributed work.
  // Update the worker entries with their adjusted payout.
  processAutoRounds(localEnv)({
    workers, rounds: autoRounds, times, solo, shared
  });

  // Pass the adjusted workers and rounds objects on to the next function in the
  // promise chain.
  return { workers, rounds, addressAccount };
};

module.exports = {
  _defaultDeps: defaultDeps,
  _processShareBlocks,
  processShareBlocks: _processShareBlocks(requireDeps(defaultDeps))
};

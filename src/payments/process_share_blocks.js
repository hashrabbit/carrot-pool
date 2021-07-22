const { fetchRoundTimes } = require('./fetch_round_times');
const { fetchRoundShares } = require('./fetch_round_shares');
const { calculateTotalOwed } = require('./utils');
const { checkPaymentFunds } = require('./check_payment_funds');
const { prepareRounds } = require('./prepare_rounds');

const processShareBlocks = (env) => {
  const { poolOptions, logger, coin } = env;

  const fee = parseFloat(poolOptions.coin.txfee) || parseFloat(0.0004);
  env.feeSatoshi = env.coinUtils.coinsToSatoshies(fee);
  env.minConfPayout = Math.max((poolOptions.paymentProcessing.minConf || 10), 1);
  if (env.minConfPayout < 3) {
    logger.warning(`${coin} minConf of 3 is recommended.`);
  }

  return ({ workers, rounds, addressAccount }) => {
    env = { workers, rounds, ...env };

    return fetchRoundTimes(env)
      .then(fetchRoundShares(env))
      .then(calculateTotalOwed(env))
      .then(checkPaymentFunds(env))
      .then(prepareRounds(env))
      .then(() => ({ workers, rounds, addressAccount }));
  };
};

module.exports = { processShareBlocks };

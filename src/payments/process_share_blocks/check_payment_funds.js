const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['listUnspent', `${__dirname}/list_unspent`]
];

// Simple wrapper for calling listUnspent, to contain the try..catch block
const fetchUnspent = (listUnspent) => async (env) => {
  const { logger } = env;
  try {
    return await listUnspent(env)(false);
  } catch (e) {
    logger.error('Error checking pool balance before processing payments.');
    throw e;
  }
};

const _checkPaymentFunds = (deps) => (env) => async ({ workers, rounds }) => {
  const { listUnspent } = deps;
  const { logger, feeSatoshi } = env;
  const { satoshisToCoins, coinsToSatoshies } = env.coinUtils;

  // Calculate the total amount of "owed" payouts.
  const roundsOwed = rounds.filter((r) => (r.category === 'generate'))
    .reduce((sum, r) => sum + coinsToSatoshies(r.reward) - feeSatoshi, 0);
  const workersOwed = Object.values(workers)
    .reduce((sum, w) => sum + (w.balance || 0), 0);
  const owed = roundsOwed + workersOwed;

  // Check the owed amount against the unspent balance
  const balance = await fetchUnspent(listUnspent)(env);
  const insufficient = (balance < owed);
  const cantPay = (owed <= 0) || insufficient;
  // Produce an error log message if we don't have sufficient funds
  if (insufficient) {
    const funds = satoshisToCoins(balance);
    const amount = satoshisToCoins(owed);
    logger.error(`Insufficient funds: (${funds}) < (${amount}); possibly waiting for txs.`);
  }

  // If we can't payout the current shares, change all 'generate' (aka. confirmed) shares
  // to 'immature', to defer full payment.
  if (cantPay) {
    rounds.forEach((r) => {
      if (r.category === 'generate') r.category = 'immature';
    });
  }
};

module.exports = {
  _checkPaymentFunds,
  checkPaymentFunds: _checkPaymentFunds(requireDeps(defaultDeps))
};

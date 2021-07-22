const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['listUnspent', `${__dirname}/list_unspent`]
];

const baseCheckPaymentFunds = ({ listUnspent }) => (env) => {
  const { logger, coinUtils, minConfPayout, rounds } = env;
  const { satoshisToCoins } = coinUtils;
  return ({ owed, ...args }) => (
    listUnspent(env)(null, null, minConfPayout, false)
      .catch((err) => {
        logger.error('Error checking pool balance before processing payments.');
        throw err;
      })
      .then((balance) => {
        const insufficient = (balance < owed);
        const cantPay = (owed <= 0) || insufficient;
        if (insufficient) {
          const funds = satoshisToCoins(balance);
          const amount = satoshisToCoins(owed);
          logger.error(`Insufficient funds: (${funds}) < (${amount}); possibly waiting for txs.`);
        }
        if (cantPay) {
          rounds.forEach((r) => {
            if (r.category === 'generate') r.category = 'immature';
          });
        }
        return args;
      })
  );
};

module.exports = {
  _checkPaymentFunds: baseCheckPaymentFunds,
  checkPaymentFunds: baseCheckPaymentFunds(requireDeps(defaultDeps))
};

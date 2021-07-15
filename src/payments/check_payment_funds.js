const checkPaymentFunds = (env, { listUnspent } = require('./utils')) => {
  const { logger, satoshisToCoins, minConfPayout, rounds } = env;

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

module.exports = { checkPaymentFunds };

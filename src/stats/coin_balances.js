const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../utils/promised_redis`],
  ['sumScanValues', `${__dirname}/utils`]
];

const _coinBalances = (deps) => (env) => (address) => {
  const { promiseExec, sumScanValues } = deps;
  const { client, logger, coin } = env;
  const scanArgs = [0, 'match', `${address}*`, 'count', 10000];
  const keys = ['totalBalance', 'totalImmature', 'totalPaid', 'totalUnpaid'];
  const commands = [
    ['hscan', `${coin}:payments:balances`, ...scanArgs],
    ['hscan', `${coin}:payments:immature`, ...scanArgs],
    ['hscan', `${coin}:payments:payouts`, ...scanArgs],
    ['hscan', `${coin}:payments:unpaid`, ...scanArgs],
  ];
  const failMsg = 'Stats.getBalanceByAddress';

  return promiseExec({ client, logger })({ commands, failMsg })
    .then((results) => {
      const pairs = results.map((r) => sumScanValues(r[1]))
        // Zip keys with their summed values
        .map((sum, i) => [keys[i], sum]);
      return Object.fromEntries(pairs);
    });
};

module.exports = {
  _coinBalances,
  coinBalances: _coinBalances(requireDeps(defaultDeps))
};

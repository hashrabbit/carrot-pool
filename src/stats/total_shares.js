const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseCmd', `${__dirname}/../utils/promised_redis`],
  ['sumScanValues', `${__dirname}/utils`]
];

const _totalShares = (deps) => (env) => (address) => {
  const { promiseCmd, sumScanValues } = deps;
  const { client, logger, coin } = env;
  const promiseHscan = promiseCmd('hscan')({ client, logger });

  const scanKey = `${coin}:shares:roundCurrent`;
  const args = [scanKey, 0, 'match', `${address}*`, 'count', 10000];
  const failMsg = 'Stats.getTotalSharesByAddress';

  return promiseHscan({ args, failMsg })
    .then((results) => sumScanValues(results[1]));
};

module.exports = {
  _totalShares,
  totalShares: _totalShares(requireDeps(defaultDeps)),
};

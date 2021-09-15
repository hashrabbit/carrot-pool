const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseCmd', `${__dirname}/../../utils/promised_redis`]
];

const _fetchUnpaidWorkers = ({ promiseCmd }) => async (env) => {
  const { coin, coinUtils } = env;
  const hgetall = promiseCmd('hgetall')(env);
  const failMsg = 'fetchUnpaidWorkers: Error retrieving unpaid payments';
  const unpaid = await hgetall({ args: [`${coin}:payments:unpaid`], failMsg });

  const workers = {};
  Object.entries(unpaid || {}).forEach(([addr, bal]) => {
    workers[addr] = { balance: coinUtils.coinsToSatoshies(parseFloat(bal)) };
  });

  return workers;
};

module.exports = {
  _fetchUnpaidWorkers,
  fetchUnpaidWorkers: _fetchUnpaidWorkers(requireDeps(defaultDeps))
};

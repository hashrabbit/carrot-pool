const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../../utils/promised_redis`],
];

// Fetches the full range of statistics assiciated with our coin/pool. Returns an
// object, with each retrieved "stat", matched to its appropriate key name.
const _fetchRawStats = ({ promiseExec }) => (env) => {
  const { statsConfig, coin, timestamp } = env;
  const offsetTime = (timestamp - statsConfig.hashrateWindow).toString();
  const keys = [
    'hashrates', 'roundCurrent', 'timesCurrent', 'pendingCount', 'pendingBlocks',
    'confirmedCount', 'confirmedBlocks', 'pendingConfirms', 'orphanedCount',
    'basicStats', 'history', 'payments'
  ];
  const commands = [
    ['zrangebyscore', `${coin}:statistics:hashrate`, offsetTime, '+inf'],
    ['hgetall', `${coin}:shares:roundCurrent`],
    ['hgetall', `${coin}:times:timesCurrent`],
    ['scard', `${coin}:blocks:pending`],
    ['smembers', `${coin}:blocks:pending`],
    ['scard', `${coin}:blocks:confirmed`],
    ['smembers', `${coin}:blocks:confirmed`],
    ['hgetall', `${coin}:blocks:pendingConfirms`],
    ['scard', `${coin}:blocks:kicked`],
    ['hgetall', `${coin}:statistics:basic`],
    ['hgetall', `${coin}:statistics:history`],
    ['zrange', `${coin}:payments:payments`, -100, -1],
  ];
  const failMsg = `coinStats: Error fetching stats for ${coin}`;
  return promiseExec(env)({ commands, failMsg })
    .then((results) => {
      // Ensure that any null values are converted to empty objects. Map over the
      // new values, combining with key name, in a nested array. Convert nested
      // array into an object and return.
      const entries = results.map((r) => (r !== null ? r : {}))
        .map((val, i) => [keys[i], val]);
      return Object.fromEntries(entries);
    });
};

module.exports = {
  _fetchRawStats,
  fetchRawStats: _fetchRawStats(requireDeps(defaultDeps))
};

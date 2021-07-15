const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../utils/promised_redis`]
];

// PoolShares.handleShare() process function. Retrieves all existing times and
// data shares.
const _fetchTimesShares = ({ promiseExec }) => ({ client, logger, coin }) => {
  const commands = [
    ['hgetall', `${coin}:times:timesStart`],
    ['hgetall', `${coin}:times:timesShare`],
    ['hgetall', `${coin}:shares:roundCurrent`],
    ['hgetall', `${coin}:times:timesCurrent`],
  ];
  const failMsg = 'fetchTimesShares: Error retrieving times/shares data';

  return promiseExec({ client, logger })({ commands, failMsg })
    .then((results) => {
      const rVals = results.map((r) => (r === null ? {} : r));
      const [startTimes, shareTimes, currentShares, currentTimes] = rVals;
      return {
        startTimes, shareTimes, currentShares, currentTimes
      };
    });
};

module.exports = {
  _fetchTimesShares,
  fetchTimesShares: _fetchTimesShares(requireDeps(defaultDeps)),
};

const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../utils/promised_redis`]
];

// Builds a 'hashrate' representation of the submitted share. Persists this
// data to statistics:hashrate, using the time, in seconds, as the key.
// Only a single conditional, with no computational logic. No associated tests.
const _persistHashrateData = ({ promiseExec }) => (env) => {
  const { coin, client, logger, timestamp, shareData,
    isValidShare, isSoloMining } = env;

  const difficulty = (isValidShare ? shareData.difficulty : -shareData.difficulty);

  const data = JSON.stringify({
    time: timestamp, difficulty, worker: shareData.worker, soloMined: isSoloMining
  });

  const cmd = ['zadd', `${coin}:statistics:hashrate`, timestamp / 1000, data];
  const failMsg = 'persistHashrateData: Error persisting block data';

  return promiseExec({ client, logger })({ commands: [cmd], failMsg });
};

module.exports = {
  _persistHashrateData,
  persistHashrateData: _persistHashrateData(requireDeps(defaultDeps))
};

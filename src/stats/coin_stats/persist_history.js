const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseCmd', `${__dirname}/../../utils/promised_redis`],
];

const _persistHistory = ({ promiseCmd }) => async (env) => {
  const promiseHset = promiseCmd('hset')(env);
  const { stats, statsConfig, timestamp } = env;
  const oldestTime = timestamp - statsConfig.historicalRetention;
  const interval = timestamp - statsConfig.historicalInterval;

  const history = {
    time: timestamp,
    hashrateSolo: stats.hashrate.hashrateSolo,
    hashrateShared: stats.hashrate.hashrateShared,
    workersSolo: stats.workers.workersSoloCount,
    workersShared: stats.workers.workersSharedCount,
  };
  stats.history.push(history);

  // Filter out history entries whose time is too old (default is 30 days).
  const hists = stats.history.filter((h) => h.time >= oldestTime);

  // TODO: why is this entry is named 'history' and not 'counts'? Having an entry
  // at statistics:history:counts seems better than statistics:history:history.
  const args = [`${stats.name}:statistics:history`, 'history', JSON.stringify(hists)];
  const failMsg = 'coinStats: Error persisting history data';

  // If this is our only history entry, or the previous "last" entry is within the
  // interval time (default is 10 minutes), we persist the updated history data.
  //
  // TODO: Based on the setInterval command in src/server/index.js, the pool
  // stats are cached ever 60 seconds. That's how frequently our hashrate and worker
  // counts are caluclated (and persisted). Why would we care that the earliest, previous
  // history entry is from more than 10 minutes ago?
  if (hists.length === 1 || interval > hists[hists.length - 2].time) {
    await promiseHset({ args, failMsg });
    return true;
  }
  return false;
};

module.exports = {
  _persistHistory,
  persistHistory: _persistHistory(requireDeps(defaultDeps))
};

const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../utils/promised_redis`]
];

// PoolShares.handleShare() process function. Determines which block-related data,
// associated with the submitted share, needs to be persisted.
const _processBlockData = ({ promiseExec }) => (env) => {
  const { coin, client, logger, timestamp, shareData,
    isValidBlock, isSoloMining } = env;

  return (args) => {
    const failMsg = 'processBlockData: Error persisting block data';
    const cmds = [];

    // For invalid blocks, we increment the count of invalidBlocks in the pool statistics
    if (!isValidBlock) {
      cmds.push(['hincrby', `${coin}:statistics:basic`, 'invalidBlocks', 1]);
      return promiseExec({ client, logger })({ commands: cmds, failMsg });
    }

    const { currentShares, currentTimes, isCluster } = args;
    const { height } = shareData;

    // These deletion commands remove entries added in processShareData.
    // Seems pretty wasteful. Maybe there's a cleaner solution?
    cmds.push(['del', `${coin}:times:timesStart`]);
    cmds.push(['del', `${coin}:times:timesShare`]);

    // Handle Redis Shares/Times Updates
    // TODO: Why does running in cluster mode completely change the persistence commands?
    // I haven't seen this behavior with any other persistence interactions.
    if (isCluster) {
      cmds.push(['del', `${coin}:shares:roundCurrent`]);
      cmds.push(['del', `${coin}:times:timesCurrent`]);
      Object.entries(currentShares).forEach(([key, share]) => {
        cmds.push(['hset', `${coin}:shares:round${height}`, key, share]);
      });
      Object.entries(currentTimes).forEach(([key, worker]) => {
        cmds.push(['hset', `${coin}:times:times${height}`, key, worker]);
      });
    } else {
      cmds.push(['rename', `${coin}:shares:roundCurrent`, `${coin}:shares:round${height}`]);
      cmds.push(['rename', `${coin}:times:timesCurrent`, `${coin}:times:times${height}`]);
    }

    // Persist blockData to blocks:pending set, for processing by PoolPayments.
    // Increment the validBlocks count.
    const blockData = JSON.stringify(
      { time: timestamp, soloMined: isSoloMining, ...shareData }
    );

    cmds.push(['sadd', `${coin}:blocks:pending`, blockData]);
    cmds.push(['hincrby', `${coin}:statistics:basic`, 'validBlocks', 1]);

    return promiseExec({ client, logger })({ commands: cmds, failMsg });
  };
};

module.exports = {
  _processBlockData,
  processBlockData: _processBlockData(requireDeps(defaultDeps))
};

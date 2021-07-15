const { requireDeps } = require('../utils/require_deps');

const _defaultDeps = [
  ['fetchTimesShares', `${__dirname}/fetch_times_shares`],
  ['processShareData', `${__dirname}/process_share_data`],
  ['processBlockData', `${__dirname}/process_block_data`],
  ['persistHashrateData', `${__dirname}/persist_hashrate_data`],
];

// Process submitted share data.
const _handleShare = (deps) => (env) => async (args) => {
  const { fetchTimesShares,
    processShareData, processBlockData, persistHashrateData } = deps;
  const { poolConfig, isCluster } = env;
  const { isValidShare, isValidBlock, shareData } = args;
  const timestamp = Date.now();

  // Check to see if Solo Mining
  const portInfo = poolConfig.ports[shareData.port];
  const isSoloMining = !!portInfo && !!portInfo.soloMining;

  const shareEnv = {
    ...env, timestamp, shareData, isValidShare, isValidBlock, isSoloMining
  };

  // fetchTimesShares returns an object with 4 data entries. All 4 of them are
  // consumed by processShareData, but only currentTimes and currentShares are
  // consumed by processBlockData.
  const { currentTimes, currentShares } = await fetchTimesShares(env)
    .then((timesShares) => {
      // processShareData add entries to currentTimes and currentShares, so we
      // need to explicitly return the timesShares object, after this call.
      processShareData(shareEnv)(timesShares);
      return timesShares;
    });
  await processBlockData(shareEnv)({ isCluster, currentShares, currentTimes });
  await persistHashrateData(shareEnv);
  return true;
};

module.exports = {
  _defaultDeps,
  _handleShare,
  handleShare: _handleShare(requireDeps(_defaultDeps)),
};

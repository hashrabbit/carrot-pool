const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['roundTo', `${__dirname}/../payments/utils`],
  ['promiseExec', `${__dirname}/../utils/promised_redis`]
];

// PoolShares.handleShare() process function. Evaluates the submitted share data
// to determine which data needs to be persisted. Also does some prep-work if the
// share does not represent a valid block.
const _processShareData = (deps) => (env) => (args) => {
  const { roundTo, promiseExec } = deps;
  // The env object really contains too many entries. Not sure how to reduce it, other
  // than including sub-env objects, which doesn't reduce the size.
  const { coin, client, logger, timestamp, shareData } = env;
  const { isValidShare, isValidBlock, isSoloMining } = env;
  const { worker: address, difficulty } = shareData;

  const { startTimes, shareTimes, currentShares, currentTimes } = args;
  const failMsg = 'processShareData: Error persisting share data';
  const cmds = [];

  // For invalid shares, we increment the count of invalidShares in the pool statistics
  if (!isValidShare) {
    cmds.push(['hincrby', `${coin}:statistics:basic`, 'invalidShares', 1]);
    return promiseExec({ client, logger })({ commands: cmds, failMsg });
  }

  // TODO: The original or clause makes no sense (see shares.js). It's pretty clear it
  // should be checking for the worker address key in both shareTimes and startTimes,
  // but I'm not making any changes to the behavior, yet. Just cleaning up.

  // Add an entry for the current share worker, if not already present.
  if (!startTimes[address]) {
    shareTimes[address] = timestamp;
    startTimes[address] = timestamp;
  }

  // Set the current shareTime and startTime, based on whether the current worker
  // is present in the shareTimes object. The entries for shareTimes[address] and
  // startTimes[address] look to always be identical, but in the rare change that's
  // not the case, I'm leaving these assignments as they were.
  const inShareTimes = !!shareTimes[address] && shareTimes[address] > 0;
  const shareTime = inShareTimes ? shareTimes[address] : timestamp;
  const startTime = inShareTimes ? startTimes[address] : timestamp;

  // Compute the duration between now, and the last shareTime.
  const duration = roundTo(Math.max(timestamp - shareTime, 0) / 1000, 4);

  // Add an entry for the current time duration, keyed to the worker's address
  currentTimes[address] = duration;

  // If the duration < 15 minutes, add a times:timesCurrent entry for this worker
  if (duration < 900) {
    cmds.push(['hincrbyfloat', `${coin}:times:timesCurrent`, address, duration]);
  }

  // Configure a JSON "key object" for the current share
  const shareKey = JSON.stringify({
    time: timestamp,
    worker: address,
    soloMined: isSoloMining,
  });

  // Add an entry for the current share's difficulty, keyed to the shareKey json
  currentShares[shareKey] = difficulty;

  // If the current share doesn't represent a found block, persist new timesStart and
  // timesShare entries, keyed to the worker's address.
  if (!isValidBlock) {
    cmds.push(['hset', `${coin}:times:timesStart`, address, startTime]);
    cmds.push(['hset', `${coin}:times:timesShare`, address, shareTime]);
  }

  // Persist the share difficulty, in shares:roundCurrent, keyed to the shareKey json
  // This is done using the "hash increment by", I guess to cover the theoretically
  // impossible case of this share's json key somehow already having an entry?
  cmds.push(['hincrby', `${coin}:shares:roundCurrent`, shareKey, difficulty]);
  // Increment the count of validShares in the pool statistics
  cmds.push(['hincrby', `${coin}:statistics:basic`, 'validShares', 1]);

  return promiseExec({ client, logger })({ commands: cmds, failMsg });
};

module.exports = {
  _processShareData,
  processShareData: _processShareData(requireDeps(defaultDeps))
};

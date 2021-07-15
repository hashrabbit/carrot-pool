const { roundTo } = require('./utils.js');

// Calculate the amount of "lost" shares, is there's a specified timestamp for
// when the worker either started or stopped providing work to the current block.
const lostShares = (share, time, maxTime) => {
  time = parseFloat((time || 0));
  const timePeriod = roundTo(time / maxTime, 2);
  if (time === 0) return 0;
  if (timePeriod <= 0 || timePeriod >= 0.51) return 0;
  return share - (share * timePeriod);
};

// Adjust the amount of shares credited to the worker, if some amount of the
// shares they provided were deemed "lost".
const adjustedShare = (worker = {}, shares, time, maxTime) => {
  shares = parseFloat((shares || 0));
  if (maxTime > 0) shares = Math.max(shares - lostShares(shares, time, maxTime), 0);
  worker.roundShares = shares;
  return shares;
};

// Adjust the total reward amount owed to the worker, based on their percentage
// of the work they contributed to the block.
const adjustedReward = (worker, reward, totalShares) => {
  const percent = parseFloat(worker.roundShares) / totalShares;
  return Math.round(reward * percent);
};

// Calulate the total Immature block reward, for workers that contributed "shares".
// For soloMined blocks, the full reward is assigned to the worker.
// For blocks with multiple workers, each worker is assinged their percentage of the
// reward, based on the percentage of the share "work" they contributed.
const immatureBlock = (env) => {
  const { workers, coinsToSatoshies, feeSatoshi } = env;

  return ({ round, shared, solo, times, maxTime }) => {
    const reward = Math.round(coinsToSatoshies(round.reward) - feeSatoshi);

    // Check if Solo Mined
    if (round.soloMined) {
      const worker = (workers[round.workerAddress] || {});
      const shares = parseFloat((solo[round.workerAddress] || 0));
      worker.roundShares = shares;
      worker.immature = (worker.immature || 0) + reward;
    } else {
      // adjustedShares entries represent adjusted "shared" shares. These values
      // are based on found share difficulty, which cannot be 0 for sha265 coins.
      const adjustedShares = Object.entries(shared).map(([addr, shares]) => (
        adjustedShare(workers[addr], shares, times[addr], maxTime)
      ));
      const totalShares = adjustedShares.reduce((acc, s) => acc + s, 0);

      // Calculate adjusted immature reward for all workers, by shared entry address.
      Object.keys(shared).forEach((addr) => {
        const worker = (workers[addr] || {});
        worker.immature = (worker.immature || 0)
          + adjustedReward(workers[addr], reward, totalShares);
      });
    }
  };
};

module.exports = { immatureBlock };

const { roundTo, findOrNew } = require('./utils.js');

// Callback to Object.entries(times).reduce()
// Calculates the adjusted time value, associated with each worker address.
// Handles the case where the same worker has 2 associated times. Not sure if
// this is actually possible, as times are stored in a Redis hash table, keyed
// off the worker address. This function can likely be simplified…
const adjustedTime = (times, maxTime) => (acc, [addr, time]) => {
  time = parseFloat(time);
  if (!(addr in acc)) return { ...acc, [addr]: time };
  if (acc[addr] < time) acc[addr] = acc[addr] * 0.5 + time;
  else acc[addr] += time * 0.5;
  if (acc[addr] > maxTime) acc[addr] = maxTime;
  return acc;
};

// Calculate the amount of "lost" shares used to reduce the amount shares credited
// to a worker address. Reduction is proportional to the amount of work provided
// as a % of the maximum time period, when the % is 50% or under.
const lostShares = (shares, record, time, maxTime) => {
  time = parseFloat((time || 0));
  const timePeriod = roundTo(time / maxTime, 2);
  if (time === 0) return 0;
  if (timePeriod <= 0 || timePeriod >= 0.51) return 0;
  record.times = timePeriod;
  return shares - (shares * timePeriod);
};

// Callback to Object.entries(shared).map().
// Adjust the amount of shares credited to the worker, if some amount of the
// shares they provided were deemed "lost".
const adjustedShare = (env) => {
  const { logger, round, workers, times, maxTime } = env;

  return ([addr, shares]) => {
    const worker = findOrNew(workers, addr);
    shares = parseFloat((shares || 0));
    worker.records = (worker.records || {});
    worker.records[round.height] = { shares, amounts: 0, times: 0 };
    if (maxTime > 0) {
      const lost = lostShares(shares, worker.records[round.height], times[addr], maxTime);
      shares = Math.max(shares - lost, 0);
      if (worker.records[round.height].times > 1.0) {
        logger.error(`Time share period is greater than 1.0 for ${addr} round:${round.height} blockHash:${round.blockHash}`);
        return 0;
      }
    }
    worker.roundShares = shares;
    worker.totalShares = parseFloat(worker.totalShares || 0) + shares;
    return shares;
  };
};

// Callback to Object.keys(shared).forEach().
// Adjust the worker's payout amount by the percentage of the total shares they
// contributed. If the percentage for a worker is greater than 1.0, that's considered
// an error, and that worker receives no payout.
const adjustedAmount = (env) => {
  const { logger, workers, round, totalShares, reward, satoshisToCoins } = env;

  return (addr) => {
    const worker = findOrNew(workers, addr);
    const percent = parseFloat(worker.roundShares) / totalShares;
    if (percent > 1.0) {
      logger.error(`Share percent is greater than 1.0 for ${addr} round:${round.height} blockHash:${round.blockHash}`);
      return;
    }
    const totalAmount = Math.round(reward * percent);
    worker.records[round.height].amounts = satoshisToCoins(totalAmount);
  };
};

const confirmedBlock = (env) => {
  const { logger, coinUtils, feeSatoshi, workers } = env;
  const { coinsToSatoshies, satoshisToCoins } = coinUtils;

  return ({ round, shared, solo, times, maxTime }) => {
    const reward = Math.round(coinsToSatoshies(round.reward) - feeSatoshi);

    // Check if Solo Mined
    if (round.soloMined) {
      const addr = round.workerAddress;
      const worker = findOrNew(workers, addr);
      const shares = parseFloat((solo[addr] || 0));
      const amounts = satoshisToCoins(reward);
      worker.records = (worker.records || {});
      worker.records[round.height] = { shares, amounts, times: 1 };
      worker.roundShares = shares;
      worker.totalShares = parseFloat(worker.totalShares || 0) + shares;
      worker.reward = (worker.reward || 0) + amounts;
    } else {
      // Otherwise, calculate payout amounts for all workers that contributed to the block

      // Compute worker time offsets, used to adjust their contributed shares amount
      const workerTimes = Object.entries(times).reduce(adjustedTime(times, maxTime), {});

      // Adjust worker shares, based on the amount of time the worker contributed to the block.
      const sharesEnv = {
        logger, round, workers, times: workerTimes, maxTime
      };
      const adjustedShares = Object.entries(shared).map(adjustedShare(sharesEnv));

      // Compute total shares, for the block, across all contributing workers.
      const totalShares = adjustedShares.reduce((acc, s) => acc + s, 0);

      // Adjust worker rewards, based on their percentage of roundShares to the totalShares
      const amountsEnv = {
        logger, round, workers, totalShares, reward, satoshisToCoins
      };
      Object.keys(shared).forEach(adjustedAmount(amountsEnv));
    }
  };
};

module.exports = { confirmedBlock };

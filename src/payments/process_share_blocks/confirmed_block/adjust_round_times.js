// TODO: I have no idea why this offset is being calculated. It only happens with
// a duplicate address entry in the times object, but that can't happen. In fact
// I can't think of a way to write a test that covers this bit of logic.
const calculateOffset = ({ workerTimes, addr, time }) => {
  if (workerTimes[addr] < time) workerTimes[addr] = workerTimes[addr] * 0.5 + time;
  else workerTimes[addr] += time * 0.5;
};

// Calculates the adjusted time each worker will be credited with, for the round.
const adjustRoundTimes = (times, maxTime) => {
  const workerTimes = {};
  Object.entries(times).forEach(([addr, time]) => {
    time = parseFloat(time);
    if (!(addr in workerTimes)) workerTimes[addr] = time;
    else calculateOffset({ workerTimes, addr, time });

    // If the worker's time is greater than the round's maxTime, adjust down.
    if (workerTimes[addr] > maxTime) workerTimes[addr] = maxTime;
  });
  return workerTimes;
};

module.exports = { adjustRoundTimes };

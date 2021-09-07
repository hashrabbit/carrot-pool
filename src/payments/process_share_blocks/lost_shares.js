const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['roundTo', `${__dirname}/../utils`]
];

// Calculate the amount of "lost" shares, is there's a specified timestamp for
// when the worker either started or stopped providing work to the current block.
const _lostShares = ({ roundTo }) => (shares, time, maxTime, record) => {
  time = parseFloat((time || 0));
  if (time === 0) return 0;

  const timePeriod = roundTo(time / maxTime, 2);
  if (record) record.times = timePeriod;
  if (timePeriod <= 0 || timePeriod >= 0.51) return 0;

  return shares - (shares * timePeriod);
};

module.exports = {
  _lostShares,
  lostShares: _lostShares(requireDeps(defaultDeps))
};

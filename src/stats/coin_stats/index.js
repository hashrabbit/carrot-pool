const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchRawStats', `${__dirname}/fetch_raw_stats`],
  ['parseStats', `${__dirname}/parse_stats`],
  ['processStats', `${__dirname}/process_stats`],
];

// A very simple wrapper function, that coordinates the individual steps in
// fetching and producing the current stats breakdown for the coin.
// No tests needed, since the individual steps are fully tested.
const _coinStats = (deps) => (env) => {
  const { fetchRawStats, parseStats, processStats } = deps;

  return fetchRawStats(env)
    .then(parseStats(env))
    .then(processStats(env));
};

module.exports = {
  _coinStats,
  coinStats: _coinStats(requireDeps(defaultDeps)),
};

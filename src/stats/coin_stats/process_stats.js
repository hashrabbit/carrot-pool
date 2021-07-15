const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['initializeWorkers', `${__dirname}/initialize_workers`],
  ['computeHashrates', `${__dirname}/compute_hashrates`],
  ['persistHistory', `${__dirname}/persist_history`],
];

// Takes the parsed stats data and processes it into more specific worker and
// hashrate values. Also, creates a new "history" entry that should be persisted.
const _processStats = (deps) => (env) => async (stats) => {
  const { initializeWorkers, computeHashrates, persistHistory } = deps;
  const subEnv = { ...env, stats };

  initializeWorkers(subEnv);
  computeHashrates(subEnv);
  await persistHistory(subEnv);
  return stats;
};

module.exports = {
  _processStats,
  processStats: _processStats(requireDeps(defaultDeps)),
};

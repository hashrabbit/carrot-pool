const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['utils', `${__dirname}/utils`, false]
];

// History route handler
const _history = (deps) => ({ poolStats }) => (req, res) => {
  const { isInvalidPool, invalidPoolError } = deps.utils;
  const { pool } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'history';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  res.status(200);
  return res.json({ endpoint, history: stats.history });
};

module.exports = {
  _history,
  history: _history(requireDeps(defaultDeps)),
};

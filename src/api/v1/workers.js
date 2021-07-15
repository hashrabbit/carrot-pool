const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectWorkersData', `${__dirname}/../collect_workers_data`],
  ['utils', `${__dirname}/utils`, false]
];

// /v1/workers route handler
const _workers = (deps) => ({ poolStats }) => (req, res) => {
  const { collectWorkersData } = deps;
  const { isInvalidPool, invalidPoolError } = deps.utils;
  const { pool } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'workers';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  const { workers } = collectWorkersData({ stats });
  res.status(200);
  return res.json({ endpoint, workers });
};

module.exports = {
  _workers,
  workers: _workers(requireDeps(defaultDeps))
};

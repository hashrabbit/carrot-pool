const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectBlocksData', `${__dirname}/../collect_blocks_data`],
  ['utils', `${__dirname}/utils`, false],
];

// Combined stats route handler
const _statistics = (deps) => ({ poolStats }) => (req, res) => {
  const { collectBlocksData } = deps;
  const { isInvalidPool, invalidPoolError, renderStatistics } = deps.utils;
  const { pool } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'statistics';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  const { statistics } = collectBlocksData({ stats });
  const data = renderStatistics({ stats, statistics });

  res.status(200);
  return res.json({ endpoint, statistics: data });
};

module.exports = {
  _statistics,
  statistics: _statistics(requireDeps(defaultDeps))
};

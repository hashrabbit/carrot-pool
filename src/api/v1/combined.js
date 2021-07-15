const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectBlocksData', `${__dirname}/../collect_blocks_data`],
  ['collectPaymentsData', `${__dirname}/../collect_payments_data`],
  ['collectWorkersData', `${__dirname}/../collect_workers_data`],
  ['utils', `${__dirname}/utils`, false],
];

// Combined stats route handler
const _combined = (deps) => ({ poolStats }) => (req, res) => {
  const { collectBlocksData, collectPaymentsData, collectWorkersData } = deps;
  const { isInvalidPool, invalidPoolError, renderStatistics } = deps.utils;
  const { pool } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'combined';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  const { blocks, statistics } = collectBlocksData({ stats });
  const { payments } = collectPaymentsData({ stats });
  const { workers } = collectWorkersData({ stats });
  const combined = {
    ...renderStatistics({ stats, statistics }),
    history: stats.history,
    blocks,
    payments,
    workers
  };

  res.status(200);
  return res.json({ endpoint, combined });
};

module.exports = {
  _combined,
  combined: _combined(requireDeps(defaultDeps))
};

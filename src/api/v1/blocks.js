const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectBlocksData', `${__dirname}/../collect_blocks_data`],
  ['utils', `${__dirname}/utils`, false]
];

// Blocks route handler
const _blocks = (deps) => ({ poolStats }) => (req, res) => {
  const { collectBlocksData } = deps;
  const { isInvalidPool, invalidPoolError } = deps.utils;
  const { pool, worker } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'blocks';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  const { blocks } = collectBlocksData({ pool, address: worker });
  res.status(200);
  return res.json({ endpoint, blocks });
};

module.exports = {
  _blocks,
  blocks: _blocks(requireDeps(defaultDeps))
};

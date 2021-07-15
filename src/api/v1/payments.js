const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectPaymentsData', `${__dirname}/../collect_payments_data`],
  ['utils', `${__dirname}/utils`, false]
];

// Payments route handler
const _payments = (deps) => ({ poolStats }) => (req, res) => {
  const { collectPaymentsData } = deps;
  const { isInvalidPool, invalidPoolError } = deps.utils;
  const { pool, worker } = req.query;
  const { stats } = poolStats;
  const isInvalid = isInvalidPool({ pool, stats });
  const endpoint = 'payments';

  if (isInvalid) return invalidPoolError({ res, pool, endpoint });

  const { payments } = collectPaymentsData({ pool, address: worker });
  res.status(200);
  return res.json({ endpoint, payments });
};

module.exports = {
  _payments,
  payments: _payments(requireDeps(defaultDeps))
};

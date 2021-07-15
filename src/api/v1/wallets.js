const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['collectBlocksData', `${__dirname}/../collect_blocks_data`],
  ['collectPaymentsData', `${__dirname}/../collect_payments_data`],
  ['collectWorkersData', `${__dirname}/../collect_workers_data`],
];

// /v1/wallets route handler. This function returns a promise due to the reliance
// upon poolStats.getBalanceByAddress.
const _wallets = (deps) => ({ poolStats }) => async (req, res) => {
  const endpoint = 'wallets';
  const { worker } = req.query;

  if (!worker || worker.length === 0) {
    const error = 'Invalid "worker" parameter. Verify inputs and try again.';
    res.status(400);
    return res.json({ endpoint, error });
  }

  const { collectBlocksData, collectPaymentsData, collectWorkersData } = deps;
  const { stats } = poolStats;

  const { balances } = await poolStats.getBalanceByAddress(worker);
  const combined = Object.values(balances).reduce((acc, s) => acc + s, 0);

  const { blocks } = collectBlocksData({ stats, address: worker });
  const { payments } = collectPaymentsData({ stats, address: worker });
  const { workers } = collectWorkersData({ stats, address: worker });

  const wallets = {
    pool: stats.name,
    symbol: stats.symbol,
    algorithm: stats.algorithm,
    worker,
    balance: balances.totalBalance.toFixed(8),
    immature: balances.totalImmature.toFixed(8),
    paid: balances.totalPaid.toFixed(8),
    unpaid: balances.totalUnpaid.toFixed(8),
    total: combined.toFixed(8),
    blocks,
    payments,
    workers
  };

  res.status(200);
  return res.json({ endpoint, wallets });
};

module.exports = {
  _wallets,
  wallets: _wallets(requireDeps(defaultDeps))
};

const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['updateWorkerPayoutBalances', `${__dirname}/update_worker_payout_balances`],
  ['updateWorkerShares', `${__dirname}/update_worker_shares`],
  ['sendRedisCommands', `${__dirname}/send_redis_commands`]
];

// Manage Sent Payments
const baseManageSentPayments = (deps) => (env) => async (args) => {
  const { updateWorkerPayoutBalances, updateWorkerShares, sendRedisCommands } = deps;
  const { paymentMode, coin, lastInterval } = env;
  const { workers, rounds, paymentsUpdate } = args;

  const [
    totalPaid,
    workerPayoutsCommand,
    balanceUpdateCommands,
    immatureUpdateCommands
  ] = updateWorkerPayoutBalances(env)(workers);

  const [
    movePendingCommands,
    orphanMergeCommands,
    roundsToDelete,
    confirmsUpdate,
    confirmsToDelete
  ] = updateWorkerShares(env)(rounds);

  const deleteCmds = [];
  if (roundsToDelete.length > 0) {
    deleteCmds.push(['del'].concat(roundsToDelete));
  }

  const totalPaidCmds = [];
  if (totalPaid !== 0) {
    totalPaidCmds.push(['hincrbyfloat', `${coin}:statistics:basic`, 'totalPaid', totalPaid]);
  }

  const lastPaidCmds = [];
  if ((paymentMode === 'start') || (paymentMode === 'payment')) {
    lastPaidCmds.push(['hset', `${coin}:statistics:basic`, 'lastPaid', lastInterval]);
  }

  // Update Main Database
  const finalRedisCommands = [
    ...movePendingCommands, ...orphanMergeCommands, ...immatureUpdateCommands,
    ...balanceUpdateCommands, ...workerPayoutsCommand, ...deleteCmds, ...confirmsUpdate,
    ...confirmsToDelete, ...paymentsUpdate, ...totalPaidCmds, ...lastPaidCmds
  ];

  return sendRedisCommands(env)(finalRedisCommands);
};

module.exports = {
  _manageSentPayments: baseManageSentPayments,
  manageSentPayments: baseManageSentPayments(requireDeps(defaultDeps))
};

// Update Worker Payouts/Balances
const updateWorkerShares = (env) => (rounds) => {
  const { logger, paymentMode, coin } = env;
  const movePendingCommands = [];
  const orphanMergeCommands = [];
  const roundsToDelete = [];
  const confirmsUpdate = [];
  const confirmsToDelete = [];

  // Update Worker Shares
  const moveSharesToCurrent = function (round) {
    const { workerShares } = round;
    if (workerShares != null) {
      logger.warning(`Moving shares from orphaned block ${round.height} to current round.`);
      Object.keys(workerShares).forEach((worker) => {
        orphanMergeCommands.push(['hincrby', `${coin}:shares:roundCurrent`,
          worker, workerShares[worker]]);
      });
    }
  };

  // Update Worker Shares in Database
  Object.values(rounds).forEach((r) => {
    switch (r.category) {
      case 'kicked':
      case 'orphan':
        confirmsToDelete.push(['hdel', `${coin}:blocks:pendingConfirms`, r.blockHash]);
        movePendingCommands.push(['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, r.serialized]);
        if (r.canDeleteShares) {
          moveSharesToCurrent(r);
          roundsToDelete.push(`${coin}:shares:round${r.height}`);
          roundsToDelete.push(`${coin}:times:times${r.height}`);
        }
        return;
      case 'immature':
        confirmsUpdate.push(['hset', `${coin}:blocks:pendingConfirms`, r.blockHash, (r.confirmations || 0)]);
        return;
      case 'generate':
        if (paymentMode === 'payment') {
          confirmsToDelete.push(['hdel', `${coin}:blocks:pendingConfirms`, r.blockHash]);
          movePendingCommands.push(['smove', `${coin}:blocks:pending`, `${coin}:blocks:confirmed`, r.serialized]);
          roundsToDelete.push(`${coin}:shares:round${r.height}`);
          roundsToDelete.push(`${coin}:times:times${r.height}`);
        }
    }
  });

  return [
    movePendingCommands,
    orphanMergeCommands,
    roundsToDelete,
    confirmsUpdate,
    confirmsToDelete
  ];
};

module.exports = { updateWorkerShares };

// Update Worker Payouts/Balances
const updateWorkerPayoutBalances = (env) => (workers) => {
  const { paymentMode, coin, coinUtils } = env;
  const { coinsRound, satoshisToCoins } = coinUtils;

  let totalPaid = 0;
  const workerPayoutsCommand = [];
  const balanceUpdateCommands = [];
  const immatureUpdateCommands = [];

  Object.entries(workers).forEach((pair) => {
    const [w, worker] = pair;
    if (paymentMode === 'payment') {
      if (worker.balanceChange !== 0) {
        balanceUpdateCommands.push([
          'hincrbyfloat',
          `${coin}:payments:unpaid`,
          w,
          satoshisToCoins(worker.balanceChange),
        ]);
      }
      if ((worker.sent || 0) > 0) {
        workerPayoutsCommand.push(['hincrbyfloat', `${coin}:payments:payouts`, w, coinsRound(worker.sent)]);
        totalPaid = coinsRound(totalPaid + worker.sent);
      }
    } else if ((worker.reward || 0) > 0) {
      worker.reward = satoshisToCoins(worker.reward);
      balanceUpdateCommands.push(['hset', `${coin}:payments:balances`, w, coinsRound(worker.reward)]);
    } else {
      balanceUpdateCommands.push(['hset', `${coin}:payments:balances`, w, 0]);
    }

    if ((worker.immature || 0) > 0) {
      worker.immature = satoshisToCoins(worker.immature);
      immatureUpdateCommands.push(['hset', `${coin}:payments:immature`, w, coinsRound(worker.immature)]);
    } else {
      immatureUpdateCommands.push(['hset', `${coin}:payments:immature`, w, 0]);
    }
  });

  return [totalPaid, workerPayoutsCommand, balanceUpdateCommands, immatureUpdateCommands];
};

module.exports = { updateWorkerPayoutBalances };

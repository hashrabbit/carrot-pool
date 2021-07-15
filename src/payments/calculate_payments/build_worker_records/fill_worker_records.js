const fillWorkerRecords = (...args) => {
  const [worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address] = args;
  const { amountsRecords, unpaidRecords, shareRecords } = workerRecords;
  const { minPaymentSatoshis, satoshisToCoins, coinsRound } = coinUtils;

  if (workerTotals[address] >= minPaymentSatoshis) {
    workerRecords.totalSent += toSendSatoshis;
    worker.sent = satoshisToCoins(toSendSatoshis);
    worker.balanceChange = Math.min(worker.balance, toSendSatoshis) * -1;
    if (amountsRecords[address] != null && amountsRecords[address] > 0) {
      amountsRecords[address] = coinsRound(amountsRecords[address] + worker.sent);
    } else {
      amountsRecords[address] = worker.sent;
    }
  } else {
    worker.sent = 0;
    // TODO(rschifflin): Doesn't the withholding pct need to be factored back out
    //                   so the balance change is merely +rewards
    //                   rather than +(balance+rewards * withhold) - balance?
    worker.balanceChange = Math.max(toSendSatoshis - worker.balance, 0);
    if (worker.balanceChange > 0) {
      if (unpaidRecords[address] != null && unpaidRecords[address] > 0) {
        unpaidRecords[address] = coinsRound(unpaidRecords[address]
          + satoshisToCoins(worker.balanceChange));
      } else {
        unpaidRecords[address] = satoshisToCoins(worker.balanceChange);
      }
    }
  }

  if (worker.totalShares > 0) {
    if (shareRecords[address] != null && shareRecords[address] > 0) {
      shareRecords[address] += worker.totalShares;
    } else {
      shareRecords[address] = worker.totalShares;
    }
  }
};

module.exports = { fillWorkerRecords };

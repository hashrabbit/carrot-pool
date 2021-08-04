const checkBase58 = (address) => {
  // Valid alphanumeric characters are:
  // 123456789
  // ABCDEFGHJKLMNPQRSTUVWXYZ
  // abcdefghijkmnopqrstuvwxyz

  // Invalid alphanumeric characters are:
  // 0,O,I,l

  // Regex character ranges:
  // 1-9           excludes 0
  // A-H, J-N, P-Z excludes I, O
  // a-k, m-z      excludes l
  const regex = /^[1-9A-HJ-NP-Za-km-z]*$/;
  return regex.test(address);
};

const softValidateAddress = (address) => (
  address.length >= 26
    && address.length <= 35
    && checkBase58(address)
);

const fillWorkerRecords = (...args) => {
  const [worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address] = args;
  const { amountsRecords, unpaidRecords, shareRecords } = workerRecords;
  const { minPaymentSatoshis, satoshisToCoins, coinsRound } = coinUtils;

  const isLegalSendAddress = softValidateAddress(address);
  const isAboveMinPayment = workerTotals[address] >= minPaymentSatoshis;
  if (isLegalSendAddress && isAboveMinPayment) {
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

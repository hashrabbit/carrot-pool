// Builds an object of accumulated values:
//
// totalShares: The sum of each worker's shares found
//
// totalSent: The amount of satoshis to send in total to all workers
//
// NOTE: Since multiple workers can use the same address,
//         the records objects below sum all workers of the same address
// workerTotals: worker_address =>
//               worker's balance+reward (subject to a withholding pct), in satoshis
//
// amountsRecords: worker_address =>
//                 amount of payment sent to worker, in coins
//
// unpaidRecords: worker_address =>
//                amount of rewards to send to address
//                that doesn't yet meet the minimum payout, in coins
//
// shareRecords: worker_address =>
//               amount of shares found by address
const sanitizeWorker = (worker) => {
  worker.balance = worker.balance || 0;
  worker.reward = worker.reward || 0;
};

const getProperAddress = (poolOptions, address, util) => {
  if (address.length === 40) {
    return util.addressFromEx(poolOptions.addresses.address, address);
  }
  return address;
};

const sumWorkerTotals = (workerTotals, toSendSatoshis, address) => {
  if (workerTotals[address] != null && workerTotals[address] > 0) {
    workerTotals[address] += toSendSatoshis;
  } else {
    workerTotals[address] = toSendSatoshis;
  }
};

// NOTE: Sets worker.sent and worker.balanceChange when all workers for its address have
// accumulated enough satoshis to qualify for a payment
const _buildWorkerRecords = (deps) => (env) => (workers) => {
  const { fillWorkerRecords, util } = deps;
  const { coinUtils, withholdPercent, poolOptions } = env;
  const workerRecords = {
    amountsRecords: {},
    unpaidRecords: {},
    shareRecords: {},
    totalSent: 0,
    totalShares: 0,
  };
  const workerTotals = {};

  Object.entries(workers).forEach(([w, worker]) => {
    sanitizeWorker(worker);
    const toSendSatoshis = Math.round(
      (worker.balance + worker.reward) * (1 - withholdPercent)
    );
    const address = (worker.address || getProperAddress(poolOptions, w.split('.')[0], util)).trim();

    workerRecords.totalShares += (worker.totalShares || 0);
    sumWorkerTotals(workerTotals, toSendSatoshis, address);
  });

  Object.entries(workers).forEach(([w, worker]) => {
    // TODO: These values are duplicated between the totaling pass
    // and the filling records pass, but are relatively cheap to calculate.
    // Should we memoize them for the entire list of workers (10s? thousands? millions?)
    // or continue building them on the fly?
    const toSendSatoshis = Math.round(
      (worker.balance + worker.reward) * (1 - withholdPercent)
    );
    const address = (worker.address || getProperAddress(poolOptions, w.split('.')[0], util)).trim();
    fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
  });

  return workerRecords;
};

const deps = {
  fillWorkerRecords: require('./fill_worker_records').fillWorkerRecords,
  util: require('stratum-pool/scripts/util.js')
};

module.exports = {
  buildWorkerRecords: _buildWorkerRecords(deps),
  _buildWorkerRecords
};

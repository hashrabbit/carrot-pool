// Worker address filter test
const isWorkerAddress = (address) => (worker) => {
  if (!address || address.length === 0) return true;
  return worker.address === address;
};

// Collect Workers Data from Pool Stats and filter by worker address, if supplied.
const collectWorkersData = ({ stats, address }) => {
  const { workersShared, workersSolo } = stats.workers;
  const entries = [...Object.entries(workersShared), ...Object.entries(workersSolo)];
  const workers = entries.map(([addr, entry]) => (
    {
      pool: stats.name,
      symbol: stats.symbol,
      algorithm: stats.algorithm,
      address: addr,
      difficulty: entry.difficulty,
      validShares: entry.validShares,
      invalidShares: entry.invalidShares,
      hashrate: entry.hashrate,
      hashrateType: entry.hashrateType,
      soloMining: entry.soloMining,
    }
  )).filter(isWorkerAddress(address));
  return { workers };
};

module.exports = { collectWorkersData };

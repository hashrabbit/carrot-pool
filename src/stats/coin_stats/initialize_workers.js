const baseWorker = ({ soloMining, hashrateType }) => (
  {
    validShares: 0, invalidShares: 0, roundShares: 0, hashrateType, soloMining
  }
);

// Intitalize worker records, from JSON entries in stats.hashrate.hashrates. If
// any workers have multiple entries, we accumulate their valid/invalid shares.
// After all JSON entries are processed, we remove stats.hashrate.hashrates.
const initializeWorkers = ({ poolConfig, stats }) => {
  const { hashrateType } = poolConfig.coin;
  const { workers } = stats.workers;

  stats.hashrate.hashrates.forEach((rateJson) => {
    const rate = JSON.parse(rateJson);
    const { worker: addr, soloMined: soloMining } = rate;
    const shares = parseFloat(rate.difficulty || 0);
    const hasShares = (shares || 0) > 0;

    // Accumulate a pool-wide total of shares found.
    stats.shares.shares += shares;

    if (!workers[addr]) workers[addr] = baseWorker({ soloMining, hashrateType });

    workers[addr].difficulty = Math.round(rate.difficulty || 0);
    workers[addr].validShares += hasShares ? shares : 0;
    workers[addr].invalidShares -= !hasShares ? shares : 0;
  });

  // Remove the raw hashrates entry from the global stats, after processing.
  delete stats.hashrate.hashrates;
};

module.exports = { initializeWorkers };

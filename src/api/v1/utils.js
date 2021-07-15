const isInvalidPool = ({ pool, stats }) => (
  pool && pool.toLowerCase() !== stats.name.toLowerCase()
);

const invalidPoolError = ({ res, pool, endpoint }) => {
  const error = `Invalid pool name: ${pool}`;
  res.status(400);
  return res.json({ endpoint, error });
};

const renderStatistics = ({ stats, statistics }) => (
  {
    pool: stats.name,
    symbol: stats.symbol,
    algorithm: stats.algorithm,
    featured: stats.featured,
    ports: stats.ports,
    statistics: {
      hashrateType: stats.statistics.hashrateType,
      invalidShares: stats.statistics.invalidShares,
      lastPaid: stats.statistics.lastPaid,
      paymentFees: stats.fees,
      paymentTime: stats.statistics.paymentTime,
      paymentMinimum: stats.statistics.paymentMinimum,
      totalPaid: stats.statistics.totalPaid,
      validShares: stats.statistics.validShares,
      validBlocks: stats.statistics.validBlocks,
      blocks: statistics,
      hashrate: {
        hashrate: stats.hashrate.hashrate,
        hashrateShared: stats.hashrate.hashrateShared,
        hashrateSolo: stats.hashrate.hashrateSolo,
      },
      workers: {
        workers: stats.workers.workersCount,
        workersShared: stats.workers.workersSharedCount,
        workersSolo: stats.workers.workersSoloCount,
      }
    }
  }
);

module.exports = { isInvalidPool, invalidPoolError, renderStatistics };

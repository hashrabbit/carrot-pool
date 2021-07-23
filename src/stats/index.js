const { requireDeps } = require('../utils/require_deps');

const _defaultDeps = [
  ['Redis', `${__dirname}/../redis`],
  ['coinBalances', `${__dirname}/coin_balances`],
  ['totalShares', `${__dirname}/total_shares`],
  ['coinStats', `${__dirname}/coin_stats/`],
];

// Function constructor that encloses the statistics generating functions.
// Each function is a thin wrapper around extracted functions performing the
// stats generations. Also containes a cached version of the coin's full
// stats breakdown.
const _poolStats = (deps) => function (env) {
  const { Redis, coinBalances, totalShares, coinStats } = deps;
  const { baseLogger, poolConfig, portalConfig } = env;
  const coin = poolConfig.coin.name;
  const redis = new Redis(portalConfig.redis);

  redis.attachEvents(baseLogger.cached('Stats', 'Redis'));

  const subEnv = { client: redis.client, coin, poolConfig };

  this.stats = {};
  const _this = this;

  // Return coin balances for the supplied address
  this.getBalanceByAddress = async (address) => {
    const logger = baseLogger.cached('Stats', 'Balances');
    const balances = await coinBalances({ ...subEnv, logger })(address);
    return balances;
  };

  // Return total shares for the supplied address
  this.getTotalSharesByAddress = async (address) => {
    const logger = baseLogger.cached('Stats', 'Shares');
    const total = await totalShares({ ...subEnv, logger })(address);
    return total;
  };

  // Cache coin stats from Pool/Database
  this.getGlobalStats = async () => {
    const logger = baseLogger.cached('Stats', 'Global');
    // Converts the current milliseconds time to seconds, with no remainder.
    const timestamp = Math.trunc(Date.now() / 1000);
    const statsEnv = {
      ...subEnv, logger, timestamp, statsConfig: portalConfig.stats
    };
    _this.stats = await coinStats(statsEnv);
  };
};

module.exports = {
  _defaultDeps,
  _poolStats,
  PoolStats: _poolStats(requireDeps(_defaultDeps)),
};

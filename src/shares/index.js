const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['Redis', `${__dirname}/../redis`],
  ['handleShare', `${__dirname}/handle_share`],
];

// PoolShares share processing module
const _poolShares = (deps) => function (env) {
  const { Redis, handleShare } = deps;
  const { logger: baseLogger, poolConfig, portalConfig } = env;

  const redis = new Redis(portalConfig.redis);
  const isCluster = !!portalConfig.redis.cluster;
  const coin = poolConfig.coin.name;
  const subcat = `Thread ${parseInt(process.env.forkId, 10) + 1}`;
  const logger = baseLogger.cached('Pool', coin, subcat);
  redis.attachEvents(logger);

  const shareEnv = {
    client: redis.client, logger, coin, poolConfig, isCluster
  };

  this.handleShare = handleShare(shareEnv);
};

module.exports = {
  _poolShares,
  PoolShares: _poolShares(requireDeps(defaultDeps))
};

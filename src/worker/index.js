/*
 *
 * PoolWorker (Updated)
 *
 */

// Import Required Modules
const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['Stratum', 'stratum-pool', false],
  ['PoolShares', `${__dirname}/../shares/`],
  ['poolAuthCallback', `${__dirname}/pool_auth_callback`],
  ['logShare', `${__dirname}/log_share`]
];

// Pool Worker Main Function
/* eslint no-unused-vars: ["error", { "args": "none" }] */
const basePoolWorker = (deps) => function (env) {
  const { Stratum, PoolShares, poolAuthCallback, logShare } = deps;
  const {
    baseLogger,
    poolConfig: config,
    portalConfig
  } = env;
  const poolConfigs = { [config.coin.name]: config };

  // Load Useful Data from Process
  const { forkId } = process.env;

  // Establish Log Variables
  const logSystem = 'Pool';
  const logSubCat = `Thread ${parseInt(forkId, 10) + 1}`;

  // Establsh Helper Variables
  const pools = {};

  // Handle IPC Messages
  process.on('message', (message) => {
    switch (message.type) {
      case 'banIP':
        Object.keys(pools).forEach((p) => {
          if (pools[p].stratumServer) pools[p].stratumServer.addBannedIP(message.ip);
        });
        break;
    }
  });

  // Manage Pool Configs for Each Coin
  Object.keys(poolConfigs).forEach((coinName) => {
    const poolConfig = poolConfigs[coinName];
    const logger = baseLogger.cached(logSystem, coinName, logSubCat);
    const sharesProcessor = new PoolShares({ logger: baseLogger, poolConfig, portalConfig });

    const handleShare = (...args) => {
      const [isValidShare, isValidBlock, shareData] = args;
      sharesProcessor.handleShare({ isValidShare, isValidBlock, shareData })
        .catch((e) => {
          logger.error(`Share handling event failed.\nEvent args: ${args}\nEvent err: ${e}`);
        });
    };

    // Establish Pool Share Handling
    const initialPool = {};
    const authCallback = poolAuthCallback({ logger, pool: initialPool, poolConfig });
    const pool = Stratum.createPool(poolConfig, authCallback, baseLogger);
    Object.setPrototypeOf(initialPool, pool);

    pool.on('share', logShare({ logger }))
      .on('share', handleShare)
      .on('difficultyUpdate', (workerName, diff) => {
        logger.debug(`Difficulty update to diff ${diff} workerName=${JSON.stringify(workerName)}`);
      })
      .on('log', (severity, text) => { logger[severity](text); })
      .on('banIP', (ip, worker) => { process.send({ type: 'banIP', ip }); });

    // Start Pool from Server
    pool.start();
    pools[coinName] = pool;
  });
};

// Export Pool Worker
module.exports = {
  _PoolWorker: basePoolWorker,
  PoolWorker: basePoolWorker(requireDeps(defaultDeps))
};

const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['Daemon', `${__dirname}/../daemon/`],
  ['Redis', `${__dirname}/../redis`],
  ['CoinUtils', `${__dirname}/coin_utils`],
  ['startPayments', `${__dirname}/start_payments`]
];

// Intitialize our daemon/node connection and our Redis client connection.
// Verify that our configured pool wallet address is "ours", which is required
// to process payments. If valid, setup the payments process env, and start the
// payment processes.
const _initPayments = (deps) => (env) => {
  const { Daemon, Redis, CoinUtils, startPayments } = deps;
  const { logger, poolConfig, portalConfig } = env;

  const { address } = poolConfig.addresses;
  const { daemon: daemonConfig, minimumPayment } = poolConfig.paymentProcessing;

  // Connect to coin/node daemon(s) from daemon config.
  const daemon = new Daemon({ configs: [daemonConfig], logger });

  return daemon.isValidAddress(address).then((isValid) => {
    // If validating our wallet address fails, log the invalid
    // address and warn the user.
    if (!isValid) {
      const msg = `initPayments: Could not validate pool address "${address}" - Ensure the pool owns this address!`;
      logger.warning(msg);
    }

    const coin = poolConfig.coin.name;
    const redis = new Redis(portalConfig.redis);
    const coinPrecision = poolConfig.satoshiPrecision || 8;
    const magnitude = 10 ** coinPrecision;
    const minPaymentSatoshis = minimumPayment * magnitude;
    const coinUtils = new CoinUtils({ coinPrecision, magnitude, minPaymentSatoshis });
    const startEnv = {
      logger,
      coin,
      client: redis.client,
      daemon,
      coinUtils,
      // Todo: poolOptions is a holdover from multi-coin days. This should be poolConfig,
      // but requires changing many downstream functions. That will happen later.
      poolOptions: poolConfig
    };

    startPayments(startEnv);
    return true;
  });
};

module.exports = {
  _initPayments,
  initPayments: _initPayments(requireDeps(defaultDeps))
};

const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['initPayments', `${__dirname}/init_payments`]
];

// Uses initPayments to start the payment process background timers
const _poolPayments = ({ initPayments }) => function (env) {
  const { baseLogger, poolConfig, portalConfig } = env;
  const coin = poolConfig.coin.name;
  const logger = baseLogger.cached('Payments', coin);

  this.start = () => (
    initPayments({ logger, poolConfig, portalConfig })
      .then((didStart) => {
        if (!didStart) return;

        const { paymentInterval: secs,
          daemon: { user, host, port } } = poolConfig.paymentProcessing;
        const daemonUrl = `${user}@${host}:${port}`;
        const redisUrl = `${portalConfig.redis.host}:${portalConfig.redis.port}`;
        const msg = `Payment processing running every ${secs} second(s) with daemon (${
          daemonUrl}) and redis (${redisUrl})`;
        logger.debug(msg);
      })
  );
};

// Export Pool Payments
module.exports = {
  _poolPayments,
  PoolPayments: _poolPayments(requireDeps(defaultDeps))
};

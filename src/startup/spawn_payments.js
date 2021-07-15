const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['spawnProcess', `${__dirname}/spawn_process`],
  ['PoolPayments', `${__dirname}/../payments/`]
];

// Handles forking, and launching the PoolPayments service.
const _spawnPayments = (deps) => (env) => {
  const { spawnProcess, PoolPayments } = deps;
  const { cluster, baseLogger, poolConfig } = env;
  const logger = baseLogger.cached('Startup', 'Payments');

  // We only spawn a Payments process if both the coin, and the coin's
  // paymentProcessing config are enabled.
  const { enabled = false, paymentProcessing = {} } = poolConfig;
  if (!(enabled && paymentProcessing.enabled)) {
    logger.warning('Payment processing not enabled.');
    return false;
  }

  // When called within a sub-process, construct PoolPayments and start listening.
  if (cluster.isWorker) {
    const poolPayments = new PoolPayments(env);
    poolPayments.start();
    return false;
  }

  // When called in the primary process, spawn our sub-process.
  const processOpts = {
    type: 'payments',
    failMsg: 'PoolPayments process died, re-spawning...',
  };
  const worker = spawnProcess({ cluster, logger })(processOpts);

  return worker;
};

module.exports = {
  _spawnPayments,
  spawnPayments: _spawnPayments(requireDeps(defaultDeps))
};

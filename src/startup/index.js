const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['startCnC', `${__dirname}/start_cnc`],
  ['spawnAPI', `${__dirname}/spawn_api`],
  ['spawnPayments', `${__dirname}/spawn_payments`],
  ['spawnWorkers', `${__dirname}/spawn_workers`],
];

const _poolStartup = (deps) => (env) => {
  const { startCnC, spawnAPI, spawnPayments, spawnWorkers } = deps;
  const { cluster } = env;

  // Hand-off to the service-launching branch for the current sub-process.
  if (cluster.isWorker) {
    const services = { api: spawnAPI, payments: spawnPayments, worker: spawnWorkers };
    const { workerType } = cluster.worker.process.env;
    const service = services[workerType];
    // Throw an error if the sub-process is an unknown type.
    if (!service) throw new Error('Pool Startup: unknown sub-process type.');
    service(env);
    return;
  }

  // Initialize the CLI server and spawn the service sub-processes.
  startCnC(env);
  spawnAPI(env);
  spawnPayments(env);
  spawnWorkers(env);
};

module.exports = {
  _poolStartup,
  PoolStartup: _poolStartup(requireDeps(defaultDeps))
};

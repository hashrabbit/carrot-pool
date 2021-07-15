const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['utils', `${__dirname}/utils`, false],
  ['spawnProcess', `${__dirname}/spawn_process`],
  ['PoolWorker', `${__dirname}/../worker/`]
];

// Handles forking, and launching the PoolWorkers services cluster.
const _spawnWorkers = (deps) => (env) => {
  const { utils, spawnProcess, PoolWorker } = deps;
  const { cluster, baseLogger, portalConfig, poolConfig } = env;
  const logger = baseLogger.cached('Startup', 'Worker');

  // Spawn worker listeners only if we have a valid coin daemon configuration.
  const { daemons = [] } = poolConfig;
  if (!Array.isArray(daemons) || daemons.length === 0) {
    logger.error('No daemons configured. No worker listeners started.');
    return false;
  }

  // In a 'worker' sub-process. Construct a PoolWorker and start listening.
  if (cluster.isWorker) {
    new PoolWorker(env);
    return false;
  }

  // In the primary process. Spawn our cluster of 'worker' sub-processes.
  const numForks = utils.workerForks(portalConfig.clustering);
  const processOpts = {
    type: 'worker',
    failMsg: 'Worker process died, re-spawning...',
    // Attach a 'message' event handler for 'banIP' message payloads.
    events: { message: utils.messageHandler }
  };
  const spawnProc = spawnProcess({ cluster, logger });
  const workers = [...Array(numForks)].map((_, i) => (spawnProc({ ...processOpts, forkId: i })));
  logger.debug(`Started ${numForks} PoolWorker thread(s)`);

  return workers;
};

module.exports = {
  _spawnWorkers,
  spawnWorkers: _spawnWorkers(requireDeps(defaultDeps))
};

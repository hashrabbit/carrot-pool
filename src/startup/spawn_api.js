const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['spawnProcess', `${__dirname}/spawn_process`],
  ['PoolApi', `${__dirname}/../api/`]
];

// Handles forking, and launching the PoolApi service.
const _spawnAPI = (deps) => (env) => {
  const { spawnProcess, PoolApi } = deps;
  const { cluster, baseLogger } = env;

  const logger = baseLogger.cached('Startup', 'API');

  // When called within a sub-process, construct PoolApi and start listening.
  if (cluster.isWorker) {
    const poolApi = new PoolApi(env);
    poolApi.listen();
    return false;
  }

  // When called in the primary process, spawn our sub-process.
  const processOpts = {
    type: 'api',
    failMsg: 'API server process died, re-spawning...',
  };
  const worker = spawnProcess({ cluster, logger })(processOpts);
  return worker;
};

module.exports = {
  _spawnAPI,
  spawnAPI: _spawnAPI(requireDeps(defaultDeps))
};

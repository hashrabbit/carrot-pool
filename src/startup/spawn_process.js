const spawnProcess = (env) => (opts) => {
  const { cluster, logger } = env;
  const { type, events = {}, forkId = 0 } = opts;
  const failMsg = opts.failMsg || 'Spawned process failed, re-spawning';

  const worker = cluster.fork({ workerType: type, forkId });
  worker.type = type;

  // Attach the standard re-spawn event handler.
  worker.on('exit', () => {
    logger.error(failMsg);
    setTimeout(() => { spawnProcess(env)(opts); }, 2000);
  });

  // Attach additional event handlers.
  Object.entries(events).forEach(([name, callback]) => {
    worker.on(name, callback);
  });

  return worker;
};

module.exports = { spawnProcess };

const { requireDeps } = require('../utils/require_deps');

const _defaultDeps = [
  ['express', 'express', false],
  ['apicache', 'apicache', false],
  ['compression', 'compression', false],
  ['cors', 'cors', false],
  ['PoolStats', `${__dirname}/../stats/`],
  ['v1', `${__dirname}/v1`]
];

// Express HTTP server constructor function, for managing the pool API.
const _PoolApi = (deps) => function (env) {
  const { express, apicache, compression, cors, PoolStats, v1 } = deps;
  const { baseLogger, poolConfig, portalConfig } = env;
  const logger = baseLogger.cached('Api', 'Server');
  const cache = apicache.middleware;
  let intervalId;

  const poolStats = new PoolStats({ baseLogger, poolConfig, portalConfig });

  const app = express();
  app.use(express.json());
  app.use(cache('2 minutes'));
  app.use(compression());
  app.use(cors());

  // Configure and mount v1 routes
  v1({ logger, poolStats })({ app, prefix: '/api' });

  // Handle server errors
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    logger.error(err.stack);
    return res.status(500).json({ error: 'API Server Error' });
  });

  // External properties
  this.app = app;
  this.intervalId = intervalId;
  this.listen = () => {
    const { port, host } = portalConfig.server;
    const { updateInterval } = portalConfig.stats;

    // Cache PoolStats data
    poolStats.getGlobalStats();

    // Establish Global Statistics Interval
    intervalId = setInterval(async () => {
      try {
        await poolStats.getGlobalStats();
      } catch (e) {
        logger.error(e.to_string());
      }
    }, updateInterval * 1000);

    app.listen(port, () => {
      logger.debug(`API server listening on ${host}:${port}`);
    }).on('error', (err) => {
      clearInterval(intervalId);
      logger.error(`API server error: ${err.toString()}`);
    });
  };
};

module.exports = {
  _defaultDeps,
  _PoolApi,
  PoolApi: _PoolApi(requireDeps(_defaultDeps))
};

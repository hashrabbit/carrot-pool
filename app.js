const fs = require('fs');
const cluster = require('cluster');

const { PoolLogger } = require('./src/logger');
const { PoolStartup } = require('./src/startup');

const { setPosixLimit } = require('./src/utils/set_posix_limit');
const { finalizePoolConfig } = require('./src/utils/finalize_pool_config');

// Intialize our base config environments.
const loadConfigJson = (name, env) => {
  path = !!env ? env : `${__dirname}/${name}`;
  return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
};

const portalConfig = loadConfigJson('server_config.json', process.env.SERVER_CONFIG_PATH);
const poolConfig = loadConfigJson('pool_config.json', process.env.POOL_CONFIG_PATH);
const baseLogger = new PoolLogger(portalConfig);

finalizePoolConfig({ poolConfig, baseLogger });

// Ensure our process has an expanded file handle limit.
setPosixLimit({ baseLogger, isMaster: cluster.isMaster });

// Intitialize Pool startup.
PoolStartup({
  cluster, baseLogger, poolConfig, portalConfig
});

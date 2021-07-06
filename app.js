const fs = require('fs');
const cluster = require('cluster');

const { PoolLogger } = require('./src/logger');
const { PoolStartup } = require('./src/startup');

const { setPosixLimit } = require('./src/utils/set_posix_limit');
const { finalizePoolConfig } = require('./src/utils/finalize_pool_config');

// Intialize our base config environments.
const loadConfigJson = (name) => {
  const path = `${__dirname}/${name}`;
  return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
};

const portalConfig = loadConfigJson('server_config.json');
const baseLogger = new PoolLogger(portalConfig);
let poolConfig = loadConfigJson('pool_config.json');
poolConfig = finalizePoolConfig({ portalConfig, poolConfig, baseLogger });

// Ensure our process has an expanded file handle limit.
setPosixLimit({ baseLogger, isMaster: cluster.isMaster });

// Intitialize Pool startup.
PoolStartup({
  cluster, baseLogger, poolConfig, portalConfig
});

const { requireDeps } = require('./require_deps');

const defaultDeps = [
  ['algorithms', 'stratum-pool/scripts/algorithms.js', false],
];

// Read and Combine ALL Pool Configurations
const _finalizePoolConfig = ({ algorithms }) => (env) => {
  let { poolConfig } = env;
  const { baseLogger, portalConfig } = env;
  const logger = baseLogger.cached('Startup', 'Finalize Config');
  const { algorithm } = poolConfig.coin;

  // Check to Ensure Algorithm is Supported
  if (!Object.keys(algorithms).includes(algorithm)) {
    const msg = `Pool Startup: Unsupported algorithm "${algorithm}"`;
    logger.error(msg);
    throw new Error(msg);
  }

  // Copy default configs into pool config
  poolConfig = { ...portalConfig.defaultPoolConfigs, ...poolConfig };

  const toBuffer = (value) => Buffer.from(value, 'hex');
  const initNetwork = (network) => {
    network.bip32.public = toBuffer(network.bip32.public).readUInt32LE(0);
    network.pubKeyHash = toBuffer(network.pubKeyHash).readUInt8(0);
    network.scriptHash = toBuffer(network.scriptHash).readUInt8(0);
  };

  // Establish Mainnet/Testnet
  if (poolConfig.coin.mainnet) initNetwork(poolConfig.coin.mainnet);
  if (poolConfig.coin.testnet) initNetwork(poolConfig.coin.testnet);

  return poolConfig;
};

module.exports = {
  _finalizePoolConfig,
  finalizePoolConfig: _finalizePoolConfig(requireDeps(defaultDeps))
};

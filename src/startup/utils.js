const cluster = require('cluster');
const os = require('os');

const messageHandler = (msg) => {
  // Only handle type: 'banIP' message payloads.
  if (msg.type !== 'banIP') return;
  // Relay the 'banIP' command to each of our PoolWorker sub-processes
  Object.keys(cluster.workers).filter((w) => w.type === 'worker')
    .forEach((w) => w.send({ type: 'banIP', ip: msg.ip }));
};

// Calculate the size of the PoolWorker process cluster, based off the clustering
// config setting and the numner of available CPUs.
const workerForks = (config = {}) => {
  const { enabled = false, forks = 1 } = config;

  if (!enabled) return 1;
  if (forks === 'auto') return os.cpus().length;
  return (forks > 0 ? forks : 1);
};

module.exports = {
  messageHandler,
  workerForks
};

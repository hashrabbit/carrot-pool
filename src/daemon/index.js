const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promisify', 'util'],
  ['Interface', 'stratum-pool/scripts/daemon.js'],
  ['validateAddress', `${__dirname}/validate_address`]
];

const _daemonWrapper = (deps) => function (daemon, logger) {
  const { promisify, validateAddress } = deps;
  this.rpcBatch = promisify(daemon.batchCmd);

  daemon.cmd[promisify.custom] = (method, params, streamResults, returnRawData) => (
    new Promise((resolve, reject) => {
      daemon.cmd(method, params, (result) => {
        if (result.error) {
          reject(new Error(result.error.message));
        } else {
          resolve(result);
        }
      }, streamResults, returnRawData);
    })
  );
  this.rpcCmd = promisify(daemon.cmd);

  const _this = this;
  this.isValidAddress = (address) => validateAddress({ daemon: _this, logger })(address);
};

// Module wrapper providing promisify-ed versions of DaemonIterface module.
// Need for this should go away, once DaemonIterface is converted to natively
// support Promises.
const _daemon = (deps) => function ({ configs, logger }) {
  const { Interface } = deps;
  // Instantiate Stratum Coin Daemon Interface.
  const callback = (severity, message) => { logger[severity](message); };
  const daemon = new Interface(configs, callback);
  const DaemonWrapper = _daemonWrapper(deps);

  return new DaemonWrapper(daemon, logger);
};

module.exports = {
  _daemonWrapper,
  DaemonWrapper: _daemonWrapper(requireDeps(defaultDeps)),
  _daemon,
  Daemon: _daemon(requireDeps(defaultDeps)),
};

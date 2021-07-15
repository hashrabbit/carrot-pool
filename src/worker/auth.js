// Establish Worker Authentication
// Returns a promise resolving True when auth succeeds and false otherwise
// Takes a constructor to wrap a daemon in a Promise interface
const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['DaemonWrapper', `${__dirname}/../daemon/`]
];

// TODO(rschifflin): Remove daemon wrapper once the pool daemons in the codebase get promisified
// NOTE(rschifflin): The `pool` environment arg is initially null and is initialized later,
// due to the mutually recursive nature of the auth callback
// (a pool requires an auth callback which requires a pool which requires...)
const baseAuth = (deps) => (env) => async (port, workerName, _password) => {
  const { DaemonWrapper } = deps;
  const { pool, poolConfig } = env;
  const daemon = new DaemonWrapper(pool.daemon);

  if (poolConfig.validateWorkerUsername !== true) {
    return true;
  }

  if (workerName.length === 40) {
    try {
      // TODO(rschifflin): So as long as the worker name is the right format it's valid?
      // I assume port/password/etc are for integration with different pluggable auths
      const validName = Buffer.from(workerName, 'hex').toString('hex') === workerName;
      return validName;
    } catch (e) {
      return false;
    }
  }

  return daemon.rpcCmd('validateaddress', [workerName]).then((results) => {
    const isValid = results.filter((r) => r.response.isvalid).length > 0;
    return isValid;
  });
};

module.exports = {
  _auth: baseAuth,
  auth: baseAuth(requireDeps(defaultDeps))
};

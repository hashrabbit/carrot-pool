// Glue between callback interface and promise interface
// TODO(rschifflin): Remove this callback layer once the stratum side also becomes promise-ified
// Eventually we will simply pass a promise-producing function and the callbacks will be localized.

const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['auth', `${__dirname}/auth`]
];

const basePoolAuthCallback = ({ auth }) => (env) => (ip, port, workerName, password, callback) => {
  const { logger, ...authEnv } = env;
  return auth(authEnv)(port, workerName, password).then((authorized) => {
    const authString = authorized ? 'Authorized' : 'Unauthorized';
    logger.debug(`${authString} ${workerName}:${password} [${ip}]`);
    callback({
      error: null,
      authorized,
      disconnect: false,
    });
  });
};

module.exports = {
  poolAuthCallback: basePoolAuthCallback(requireDeps(defaultDeps)),
  _poolAuthCallback: basePoolAuthCallback
};

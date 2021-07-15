const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['fetchVersionNum', `${__dirname}/fetch_version_num`],
];

const _isValidVersion = (deps) => (env) => async (num) => {
  const { fetchVersionNum } = deps;
  const { client, logger } = env;

  const version = await fetchVersionNum({ client, logger })
    .catch((err) => {
      const msg = `Redis version check failed: ${err.toString()}`;
      logger.error(msg);
      throw new Error(msg);
    });
  if (!version || version < num) {
    const msg = `Redis version invalid: v${num} or later required to operate pool.`;
    logger.error(msg);
    throw new Error(msg);
  }
  return true;
};

module.exports = {
  _isValidVersion,
  isValidVersion: _isValidVersion(requireDeps(defaultDeps))
};

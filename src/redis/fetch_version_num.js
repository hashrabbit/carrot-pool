const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['promiseCmd', `${__dirname}/../utils/promised_redis`]
];

const _fetchVersionNum = ({ promiseCmd }) => async ({ client, logger }) => {
  const args = ['server'];
  const infoCmd = promiseCmd('info')({ client, logger });
  const response = await infoCmd({ args });
  const version = response.split('\r\n').filter((r) => r.match(/^redis_version:/));
  if (version.length !== 1) return false;
  return parseFloat(version[0].split(':')[1]);
};

module.exports = {
  _fetchVersionNum,
  fetchVersionNum: _fetchVersionNum(requireDeps(defaultDeps))
};

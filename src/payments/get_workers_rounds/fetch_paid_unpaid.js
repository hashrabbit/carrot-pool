const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../../utils/promised_redis`]
];

const _fetchPaidUnpaid = ({ promiseExec }) => ({ coin, client, logger }) => {
  const commands = [
    ['hgetall', `${coin}:payments:unpaid`],
    ['smembers', `${coin}:blocks:pending`]
  ];
  const failMsg = 'fetchPaidUnpaid: Error retrieving payment blocks';

  return promiseExec({ client, logger })({ commands, failMsg });
};

module.exports = {
  _fetchPaidUnpaid,
  fetchPaidUnpaid: _fetchPaidUnpaid(requireDeps(defaultDeps))
};

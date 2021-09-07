const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../../utils/promised_redis`]
];

// rounds.forEach callback function. Currently logs manual round notices as an
// error. TODO: Upgrade this to a proper notification to an external channel.
const logManualRound = (logger) => (r) => {
  const msg = `No worker shares for round: ${r.height} blockHash: ${r.blockHash}.`;
  logger.error(`${msg} Manual payout required.`);
};

// Moves the pending blocks for all rounds that have no shared or solo work
// recorded. These blocks need to be evaluated for possible manual payout.
// After resolving, an error message is logged for each block moved.
const _moveManualRounds = ({ promiseExec }) => (env) => async (rounds) => {
  const { client, logger, coin } = env;
  const cmdArr = ['smove', `${coin}:blocks:pending`, `${coin}:blocks:manual`];
  const commands = rounds.map((r) => [...cmdArr, r.serialized]);
  const failMsg = 'moveManualRounds: Error';

  const result = await promiseExec({ client, logger })({ commands, failMsg });
  rounds.forEach(logManualRound(logger));
  return result;
};

module.exports = {
  _moveManualRounds,
  moveManualRounds: _moveManualRounds(requireDeps(defaultDeps))
};

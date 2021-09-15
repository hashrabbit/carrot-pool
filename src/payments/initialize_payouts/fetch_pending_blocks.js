const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseCmd', `${__dirname}/../../utils/promised_redis`]
];

const _fetchPendingBlocks = ({ promiseCmd }) => async (env) => {
  const smembers = promiseCmd('smembers')(env);
  const failMsg = 'fetchUnpaidPending: Error retrieving pending blocks';
  const pending = await smembers({ args: [`${env.coin}:blocks:pending`], failMsg });

  // Pending is Redis SET of JSON encoded strings, containing block-finding shares.
  // Each share represents a payment "round". We parse the entries into an array of
  // "round" objects, preserving the original JSON in the "serialized" key.
  // TODO(bh): Why do we replace/rename the "worker" key to "workerAddress"?
  const rounds = pending.map((entry) => {
    const round = JSON.parse(entry);
    round.serialized = entry;
    round.workerAddress = round.worker;
    delete round.worker;
    return round;
  });
  // Sort Rounds by Block Height
  rounds.sort((a, b) => a.height - b.height);

  return rounds;
};

module.exports = {
  _fetchPendingBlocks,
  fetchPendingBlocks: _fetchPendingBlocks(requireDeps(defaultDeps))
};

const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../../utils/promised_redis`]
];

// Redis stores all numberic values as strings. We need those time values to be
// floating point numbers, for all downstream consumers. On the outside chance
// that we fetch a null entry, we catch errors during parsing.
const parseTimes = (times, logger) => {
  try {
    times.forEach((t) => {
      Object.entries(t).forEach(([k, v]) => { t[k] = parseFloat(v); });
    });
  } catch (e) {
    const msg = `fetchRoundTimes: Invalid round times format ${e}`;
    logger.error(msg);
    throw new Error(msg);
  }
};

const _fetchRoundTimes = ({ promiseExec }) => (env) => async (rounds) => {
  const { client, logger, coin } = env;
  const commands = rounds.map((r) => ['hgetall', `${coin}:times:times${r.height}`]);
  const failMsg = 'fetchRoundTimes: Error retrieving round times';

  const roundTimes = await promiseExec({ client, logger })({ commands, failMsg });
  parseTimes(roundTimes, logger);
  return roundTimes;
};

module.exports = {
  _fetchRoundTimes,
  fetchRoundTimes: _fetchRoundTimes(requireDeps(defaultDeps))
};

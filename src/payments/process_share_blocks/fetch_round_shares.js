const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['promiseExec', `${__dirname}/../../utils/promised_redis`]
];

// For each set of round share data, extract the worker address and the total
// difficulty they contributed to the round, keeping the soloMined entries separate
// from the non-soloMined entries.
const accumulateRoundDiffs = (round, logger) => {
  const data = { soloDiffs: {}, sharedDiffs: {} };
  try {
    Object.entries(round).forEach(([json, value]) => {
      const { worker, soloMined } = JSON.parse(json);
      const type = soloMined ? 'soloDiffs' : 'sharedDiffs';
      data[type][worker] = (data[type][worker] || 0) + parseFloat(value);
    });
  } catch (e) {
    const msg = `fetchRoundShares: Invalid round shares format ${e}`;
    logger.error(msg);
    throw new Error(msg);
  }
  return data;
};

const _fetchRoundShares = ({ promiseExec }) => (env) => async (rounds) => {
  const { client, logger, coin } = env;
  const solo = [];
  const shared = [];

  const commands = rounds.map((r) => ['hgetall', `${coin}:shares:round${r.height}`]);
  const failMsg = 'fetchRoundShares: Error retrieving round shares';
  const roundShares = await promiseExec({ client, logger })({ commands, failMsg });

  roundShares.forEach((round) => {
    const { soloDiffs, sharedDiffs } = accumulateRoundDiffs(round, logger);
    solo.push(soloDiffs);
    shared.push(sharedDiffs);
  });
  return { solo, shared };
};

module.exports = {
  _fetchRoundShares,
  fetchRoundShares: _fetchRoundShares(requireDeps(defaultDeps))
};

const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchPaidUnpaid', `${__dirname}/fetch_paid_unpaid`],
  ['buildWorkersRounds', `${__dirname}/build_workers_rounds`],
  ['findDuplicates', `${__dirname}/find_duplicates`],
  ['processDups', `${__dirname}/process_dups`]
];

const _getWorkersRounds = (deps) => (env) => {
  const { fetchPaidUnpaid, buildWorkersRounds, findDuplicates, processDups } = deps;
  return fetchPaidUnpaid(env)
    .then(buildWorkersRounds(env))
    .then(findDuplicates)
    .then(processDups(env));
};

module.exports = {
  _getWorkersRounds,
  getWorkersRounds: _getWorkersRounds(requireDeps(defaultDeps))
};

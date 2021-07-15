const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchBlocks', `${__dirname}/fetch_blocks`],
  ['findInvalid', `${__dirname}/find_invalid`],
  ['moveInvalid', `${__dirname}/move_invalid`]
];

// Process duplicate blocks found in the payment round
const baseDupsInvalidator = (deps) => (env) => (dups) => {
  const { fetchBlocks, findInvalid, moveInvalid } = deps;
  env.logger.warning(`Duplicate pending blocks found: ${JSON.stringify(dups)}`);

  return fetchBlocks(env)(dups)
    .then(findInvalid(env)(dups))
    .then(moveInvalid(env));
};

// Process duplicate blocks found in the payment round
module.exports = {
  _dupsInvalidator: baseDupsInvalidator,
  dupsInvalidator: baseDupsInvalidator(requireDeps(defaultDeps))
};

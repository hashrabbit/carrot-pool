const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['confirmedBlock', `${__dirname}/confirmed_block`],
  ['immatureBlock', `${__dirname}/immature_block`]
];

// Delegate 'immature', and 'generate' category rounds to their respective
// sub-functions, to calculate worker payout amounts.
const _processAutoRounds = (deps) => (env) => (args) => {
  const { immatureBlock, confirmedBlock } = deps;
  const { workers, rounds, times, solo, shared } = args;
  const categoryProcessors = {
    generate: confirmedBlock(env),
    immature: immatureBlock(env),
    kicked: () => {},
    orphan: () => {}
  };

  rounds.forEach((round, i) => {
    const maxTime = Math.max(...Object.values(times[i]).map(parseFloat));
    const processor = categoryProcessors[round.category];
    const roundArgs = {
      workers, round, shared: shared[i], solo: solo[i], times: times[i], maxTime
    };
    processor(roundArgs);
  });
};

module.exports = {
  _processAutoRounds,
  processAutoRounds: _processAutoRounds(requireDeps(defaultDeps))
};

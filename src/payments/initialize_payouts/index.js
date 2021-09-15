const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchUnpaidWorkers', `${__dirname}/fetch_unpaid_workers`],
  ['fetchPendingBlocks', `${__dirname}/fetch_pending_blocks`],
  ['findDuplicateBlocks', `${__dirname}/find_duplicate_blocks`],
  ['findInvalidBlocks', `${__dirname}/find_invalid_blocks`],
  ['moveInvalidBlocks', `${__dirname}/move_invalid_blocks`]
];

// Initial step of the paymentProcessing pipeline. Retrieves, and parses, the
// current set of payable entities, for the rest of the pipeline to process.
const _initializePayouts = (deps) => async (env) => {
  const { fetchUnpaidWorkers, fetchPendingBlocks, findDuplicateBlocks } = deps;
  const { findInvalidBlocks, moveInvalidBlocks } = deps;

  // Get the entries that repesent potential payouts from the database: unpaid
  // worker balances, from previous paymentProcessing runs, and the current,
  // pending blocks that haven't been paid (aka. "rounds").
  const workers = await fetchUnpaidWorkers(env);
  const rounds = await fetchPendingBlocks(env);

  // Identify and invalidate any duplicate entries in "rounds".
  const duplicteBlocks = findDuplicateBlocks(rounds);
  const invalidBlocks = await findInvalidBlocks(env)(duplicteBlocks);
  await moveInvalidBlocks(env)(invalidBlocks);

  // Pass the workers and non-duplicate rounds to the next paymentProcessing step.
  const uniqueRounds = rounds.filter((round) => !round.duplicate);
  return { workers, rounds: uniqueRounds };
};

module.exports = {
  _initializePayouts,
  initializePayouts: _initializePayouts(requireDeps(defaultDeps))
};

const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['fetchTransactions', `${__dirname}/fetch_transactions`],
  ['convertTransaction', `${__dirname}/convert_transaction`],
  ['flagDeletableRounds', `${__dirname}/flag_deletable_rounds`]
];

const _updateRounds = (deps) => (env) => async (rounds) => {
  const { fetchTransactions, convertTransaction, flagDeletableRounds } = deps;

  const transactions = await fetchTransactions(env)(rounds);
  const updaters = transactions.map((tx) => convertTransaction(env)(tx));
  updaters.forEach((updater, idx) => updater(rounds[idx]));

  flagDeletableRounds(rounds);
};

module.exports = {
  _updateRounds,
  updateRounds: _updateRounds(requireDeps(defaultDeps))
};

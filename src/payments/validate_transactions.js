const { fetchTransactions } = require('./fetch_transactions');
const { processTransaction } = require('./process_transaction');
const { flagDeletableRounds } = require('./flag_deletable_rounds');

const validateTransactions = (env) => (
  ({ workers, rounds }) => (
    fetchTransactions({ rounds, ...env })
      .then(({ transactions, addressAccount }) => {
        const processor = processTransaction({ rounds, ...env });
        transactions.forEach(processor);
        flagDeletableRounds(rounds);
        return { workers, rounds, addressAccount };
      })
  )
);

module.exports = { validateTransactions };

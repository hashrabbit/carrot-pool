const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['initializePayouts', `${__dirname}/initialize_payouts`],
  ['validateTransactions', `${__dirname}/validate_transactions`],
  ['processShareBlocks', `${__dirname}/process_share_blocks`],
  ['calculatePayments', `${__dirname}/calculate_payments`],
  ['manageSentPayments', `${__dirname}/manage_sent_payments`],
  ['fixFailedPayments', `${__dirname}/fix_failed_payments`]
];

// Periodic background process that processes all share and worker data
// to determine payment amounts and produce payout transactions for the
// blockchain.
const baseProcessPayments = (deps) => (env) => (paymentMode, lastInterval) => {
  const { initializePayouts, validateTransactions, processShareBlocks } = deps;
  const { calculatePayments, manageSentPayments, fixFailedPayments } = deps;

  const subEnv = { ...env, paymentMode, lastInterval };

  return initializePayouts(subEnv)
    .then(validateTransactions(subEnv))
    .then(processShareBlocks(subEnv))
    .then(calculatePayments(subEnv))
    .then(manageSentPayments(subEnv))
    .then(fixFailedPayments(subEnv));
};

module.exports = {
  _processPayments: baseProcessPayments,
  processPayments: baseProcessPayments(requireDeps(defaultDeps))
};

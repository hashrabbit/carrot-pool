const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['buildWorkerRecords', `${__dirname}/build_worker_records`],
  ['sendPayments', `${__dirname}/send_payments`],
  ['preparePaymentsUpdate', `${__dirname}/prepare_payments_update`],
  ['retrier', `${__dirname}/../../utils/retry`]
];

const roundAmountsRecords = (amountsRecords, coinUtils) => {
  Object.keys(amountsRecords).forEach((a) => {
    amountsRecords[a] = coinUtils.coinsRound(amountsRecords[a]);
  });
};

// Check to Ensure Payments are Being Made
const baseCalculatePayments = (deps) => (env) => async (args) => {
  const { buildWorkerRecords, sendPayments, preparePaymentsUpdate, retrier } = deps;
  const { retry, RetryError } = retrier;
  const { coinUtils, logger, paymentMode } = env;
  const { workers, rounds, addressAccount } = args;

  const calculateWithheldPayment = async (withholdPercent) => {
    const localEnv = { ...env, withholdPercent };
    const workerRecords = buildWorkerRecords(localEnv)(workers);
    const { amountsRecords, totalSent } = workerRecords;
    if (Object.keys(amountsRecords).length === 0) {
      // TODO(rschifflin): This is missing the third payments arg and I think only works by accident
      return { workers, rounds };
    }
    roundAmountsRecords(amountsRecords, coinUtils);
    return sendPayments(localEnv)({ addressAccount, amountsRecords, totalSent })
      .then(preparePaymentsUpdate(localEnv)({
        workers,
        rounds,
        workerRecords
      }));
  };

  if (paymentMode === 'payment') {
    // Send Any Owed Payments, with retries for insufficent funds
    const basePct = 0;
    return retry(5,
      (n) => calculateWithheldPayment(basePct + (0.001 * n)),
      // TODO(rschifflin): use instanceof InsufficientFundsError or similar
      (e) => e.message.includes('Retry!')).catch((e) => {
      if (e instanceof RetryError) {
        logger.error('Error sending payments, retrying has decreased rewards by too much!!!');
        throw new Error('Error sending payments, retrying has decreased rewards by too much!!!');
      } else {
        throw e;
      }
    });
  }

  return { workers, rounds, paymentsUpdate: [] };
};

module.exports = {
  _calculatePayments: baseCalculatePayments,
  calculatePayments: baseCalculatePayments(requireDeps(defaultDeps))
};

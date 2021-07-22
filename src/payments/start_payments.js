const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['processPayments', `${__dirname}/process_payments`]
];

// Extracted from initPayments. Using processPayments, we start the async timers
// that manage payment processing.
const _startPayments = ({ processPayments }) => (env) => {
  const { logger, poolOptions } = env;
  const { checkInterval, paymentInterval } = poolOptions.paymentProcessing;

  let checkTimerId;
  let paymentTimerId;
  const signalStop = () => {
    clearInterval(checkTimerId);
    clearInterval(paymentTimerId);
  };

  const process = processPayments({ ...env, signalStop });

  const startTimerId = setTimeout(async () => {
    try {
      await process('start', Date.now());
    } catch (e) {
      logger.error(e.message);
    }
  }, 100);

  checkTimerId = setInterval(async () => {
    try {
      await process('check', Date.now());
    } catch (e) {
      logger.error(e.to_string());
    }
  }, checkInterval * 1000);

  paymentTimerId = setInterval(async () => {
    try {
      await process('payment', Date.now());
    } catch (e) {
      logger.error(e.message);
    }
  }, paymentInterval * 1000);

  return { startTimerId, checkTimerId, paymentTimerId };
};

module.exports = {
  _startPayments,
  startPayments: _startPayments(requireDeps(defaultDeps))
};

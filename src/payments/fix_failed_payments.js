// Check for Failed Payments
// Appears to check for double-spends that would invalidate payout transactions in the mempool
// Note that it only checks confirmations === -1, but _any_ negative n represents an invalid n-spend
// See https://bitcoin.org/en/release/v0.12.0#wallet-negative-confirmations-and-conflict-detection

const { promisify } = require('util');

// For the purpose of our control flow logic, undefined transactions are not orphaned
const isNotOrphaned = (tx) => (typeof tx === 'undefined') || (tx.confirmations !== -1);

// Note: Takes no args, everything needed was available in the existing env
const fixFailedPayments = (env) => async () => {
  const { paymentMode, redisClient, daemon, logger, coin } = env;

  // NOTE: zrange operates on sorted sets with distinct indices,
  // so the index range (-5, -5) will only cover at most 1 element
  const getFirstZRangeResult = async () => {
    const redisZrange = promisify(redisClient.zrange).bind(redisClient);
    return redisZrange(`${coin}:payments:payments`, -5, -5).then((lst) => lst[0]);
  };

  const getTransactionForResult = async (result) => {
    if (typeof result === 'undefined') { return []; }

    const payment = JSON.parse(result);
    return daemon.cmd(
      'gettransaction',
      [payment.txid],
      ([rpcResult]) => [payment, rpcResult.response]
    );
  };

  const resendOrphanedPayment = async (payment) => {
    const rpccallTracking = `sendmany "" ${JSON.stringify(payment.amounts)}`;
    return daemon.cmd('sendmany', ['', payment.amounts], (sendResult) => {
      if (sendResult.error) {
        logger.warning(rpccallTracking);
        logger.error(`Error sending payments ${JSON.stringify(sendResult.error)}`);
        throw new Error(`Error sending payments ${JSON.stringify(sendResult.error)}`);
      }
      if (!sendResult.response) {
        logger.warning(rpccallTracking);
        logger.error(`Error sending payments ${JSON.stringify(sendResult)}`);
        throw new Error(`Error sending payments ${JSON.stringify(sendResult)}`);
      }
      logger.special(`Resent payment to ${Object.keys(payment.amounts).length} miners; ${payment.txid} -> ${sendResult.response}`);
      return [payment, sendResult.response];
    }, true, true);
  };

  const redisAddNewPayment = async ([oldPayment, newTx]) => {
    const payment = { ...oldPayment, ...{ txid: newTx, time: Date.now() } };
    const redisZadd = promisify(redisClient.zadd).bind(redisClient);
    return redisZadd(`${coin}:payments:payments`, Date.now(), JSON.stringify(payment));
  };

  const redisRemoveOldPayment = async (oldPayment) => {
    const redisZrem = promisify(redisClient.zremrangebyscore).bind(redisClient);
    return redisZrem(`${coin}:payments:payments`, oldPayment.time, oldPayment.time);
  };

  if (paymentMode !== 'payment') { return null; }
  return getFirstZRangeResult()
    .then(getTransactionForResult)
    .then(async ([payment, tx]) => {
      if (isNotOrphaned(tx)) { return null; }

      logger.warning(`Error with payment, ${payment.txid} has ${tx.confirmations} confirmations.`);
      return resendOrphanedPayment(payment)
        .then(redisAddNewPayment)
        .then(() => redisRemoveOldPayment(payment));
    });
};

module.exports = { fixFailedPayments };

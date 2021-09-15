// Round to # of Digits Given
const roundTo = (n, digits) => {
  if (digits === undefined) {
    digits = 0;
  }
  const multiplicator = 10 ** digits;
  n = parseFloat((n * multiplicator).toFixed(11));
  const test = (Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
};

// Returns the value at the given key from the given object if present.
// Otherwise mutates the given object by inserting an empty object with the missing key,
// and returns the newly-inserted empty object.
const findOrNew = (obj, key) => {
  let value = obj[key];
  if (typeof value === 'undefined') {
    value = {};
    obj[key] = value;
  }
  return value;
};

// Check for Failed Payments
const fixFailedPayments = (redisClient, daemon, logger, coin) => {
  redisClient.zrange(`${coin}:payments:payments`, -5, -5, (err, results) => {
    results.forEach((result) => {
      const payment = JSON.parse(result);
      daemon.cmd('gettransaction', [payment.txid], (result1) => {
        const transaction = result1[0].response;
        if (transaction === null) {
          return;
        }

        // Payment was Orphaned
        if (transaction.confirmations === -1) {
          logger.warning(`Error with payment, ${payment.txid} has ${transaction.confirmations} confirmations.`);
          const rpccallTracking = `sendmany "" ${JSON.stringify(payment.amounts)}`;
          daemon.cmd('sendmany', ['', payment.amounts], (result2) => {
            if (result2.error) {
              logger.warning(rpccallTracking);
              logger.error(`Error sending payments ${JSON.stringify(result2.error)}`);
              return;
            }
            if (!result2.response) {
              logger.warning(rpccallTracking);
              logger.error(`Error sending payments ${JSON.stringify(result2)}`);
              return;
            }
            logger.special(`Resent payment to ${Object.keys(payment.amounts).length} miners; ${payment.txid} -> ${result2.response}`);

            // Update Redis with New Payment
            const oldPaymentTime = payment.time;
            payment.txid = result2.response;
            payment.time = Date.now();

            // Push Payments to Redis
            redisClient.zadd(`${coin}:payments:payments`, Date.now(), JSON.stringify(payment));
            redisClient.zremrangebyscore(`${coin}:payments:payments`, oldPaymentTime, oldPaymentTime, () => {});
          }, true, true);
        }
      });
    });
  });
};

const calculateTotalOwed = (env) => {
  const { feeSatoshi, coinUtils, workers, rounds } = env;

  return (args) => {
    let owed = rounds
      .filter((r) => (r.category === 'generate'))
      .reduce((acc, r) => acc + coinUtils.coinsToSatoshies(r.reward) - feeSatoshi, 0);

    Object.values(workers).forEach((worker) => {
      owed += (worker.balance || 0);
    });
    return { owed, ...args };
  };
};

module.exports = {
  roundTo,
  findOrNew,
  fixFailedPayments,
  calculateTotalOwed
};

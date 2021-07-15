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

// Check for Block Duplicates
const isDuplicateBlockHeight = (rounds, height) => {
  const dups = rounds.filter((round) => round.height === height);
  return dups.length > 1;
};

// Validate Address from Daemon
const validateAddress = async (daemon, address, command, logger, callback) => {
  daemon.cmd(command, [address], (result) => {
    if (result.error) {
      logger.error(`Error with payment processing daemon ${JSON.stringify(result.error)}`);
      callback(true);
    } else if (!result.response || !result.response.ismine) {
      daemon.cmd('getaddressinfo', [address], (innerRes) => {
        if (innerRes.error) {
          logger.error(`Error with payment processing daemon, getaddressinfo failed ... ${JSON.stringify(innerRes.error)}`);
          callback(true);
        } else if (!innerRes.response || !innerRes.response.ismine) {
          logger.error(
            `Daemon does not own pool address - payment processing can not be done with this daemon, ${
              JSON.stringify(innerRes.response)}`
          );
          callback(true);
        } else {
          callback();
        }
      }, true);
    } else {
      callback();
    }
  }, true);
};

// Validate Balance from Daemon
const getBalance = async (daemon, logger, minimumPayment, callback) => {
  let minPaymentSatoshis;
  let magnitude;
  let coinPrecision;

  daemon.cmd('getbalance', [], (result) => {
    if (result.error) {
      callback(true);
      return;
    }
    try {
      const d = result.data.split('result":')[1].split(',')[0].split('.')[1];
      magnitude = parseInt(`10${new Array(d.length).join('0')}`, 10);
      minPaymentSatoshis = parseInt(minimumPayment * magnitude, 10);
      coinPrecision = magnitude.toString().length - 1;
      callback(false, { minPaymentSatoshis, magnitude, coinPrecision });
    } catch (e) {
      logger.error(`Error detecting number of satoshis in a coin, cannot do payment processing. Tried parsing: ${result.data}`);
      callback(true);
    }
  }, true, true);
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
  const { feeSatoshi, coinsToSatoshies, workers, rounds } = env;

  return (args) => {
    let owed = rounds
      .filter((r) => (r.category === 'generate'))
      .reduce((acc, r) => acc + coinsToSatoshies(r.reward) - feeSatoshi, 0);

    Object.values(workers).forEach((worker) => {
      owed += (worker.balance || 0);
    });
    return { owed, ...args };
  };
};

module.exports = {
  roundTo,
  isDuplicateBlockHeight,
  validateAddress,
  getBalance,
  fixFailedPayments,
  calculateTotalOwed
};

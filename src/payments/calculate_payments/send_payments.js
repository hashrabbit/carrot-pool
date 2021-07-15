const sendPayments = (env) => (args) => {
  const { daemon, logger, coinUtils, withholdPercent } = env;
  const { addressAccount, amountsRecords, totalSent } = args;
  const { satoshisToCoins } = coinUtils;

  // Send Payments Through Daemon
  const rpccallTracking = `sendmany "" ${JSON.stringify(amountsRecords)}`;
  const hasInsufficientFunds = (result) => result.error
    && result.error.code === -6
    && result.error.message
    && result.error.message.includes('insufficient funds');

  return new Promise((resolve, reject) => {
    daemon.cmd('sendmany', [addressAccount || '', amountsRecords], (result) => {
      if (hasInsufficientFunds(result)) {
        const higherPercent = withholdPercent + 0.001;
        logger.warning(rpccallTracking);
        logger.warning(`Insufficient funds (??) for payments (${satoshisToCoins(totalSent)}), decreasing rewards by ${(higherPercent * 100).toFixed(1)}% and retrying`);
        // TODO: Use custom error class signalling insufficient funds instead
        reject(new Error('Retry!'));
      } else if (result.error) {
        logger.warning(rpccallTracking);
        logger.error(`Error sending payments ${JSON.stringify(result.error)}`);
        reject(new Error(`Error sending payments ${JSON.stringify(result.error)}`));
      } else {
        resolve(result);
      }
    }, true, true);
  });
};

module.exports = { sendPayments };

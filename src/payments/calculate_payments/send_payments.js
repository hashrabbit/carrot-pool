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

  return daemon.rpcCmd('sendmany', [addressAccount || '', amountsRecords], true, true).then((result) => {
    if (hasInsufficientFunds(result)) {
      const higherPercent = withholdPercent + 0.001;
      logger.warning(rpccallTracking);
      logger.warning(`Insufficient funds (??) for payments (${satoshisToCoins(totalSent)}), decreasing rewards by ${(higherPercent * 100).toFixed(1)}% and retrying`);
      // TODO: Use custom error class signalling insufficient funds instead
      throw new Error('Retry!');
    } else if (result.error) {
      logger.warning(rpccallTracking);
      logger.error(`Error sending payments ${JSON.stringify(result.error)}`);
      throw new Error(`Error sending payments ${JSON.stringify(result.error)}`);
    }

    return result;
  });
};

module.exports = { sendPayments };

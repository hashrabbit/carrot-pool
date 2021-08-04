const fetchTransactions = ({ rounds, daemon, poolOptions, logger }) => {
  const batchRPCCommand = rounds.map((r) => ['gettransaction', [r.txHash]]);
  const poolAddress = poolOptions.addresses.address;
  batchRPCCommand.push(['getaccount', [poolAddress]]);

  return daemon.rpcBatch(batchRPCCommand)
    .catch((err) => {
      logger.error(`Error with batch gettransaction call ${JSON.stringify(err)}`);
      throw err;
    })
    .then((responses) => {
      const account = responses.pop();
      const transactions = responses;
      let addressAccount = '';
      if (account.error != null) {
        logger.warning(`Could not fetch account for pool address ${poolAddress}. Using default account for pool`);
      } else {
        addressAccount = account.result;
      }

      return { transactions, addressAccount };
    });
};

module.exports = { fetchTransactions };

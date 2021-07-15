const fetchTransactions = ({ rounds, daemon, poolOptions, logger }) => {
  const batchRPCCommand = rounds.map((r) => ['gettransaction', [r.txHash]]);
  batchRPCCommand.push(['getaccount', [poolOptions.addresses.address]]);

  return daemon.rpcBatch(batchRPCCommand)
    .catch((err) => {
      logger.error(`Error with batch gettransaction call ${JSON.stringify(err)}`);
      throw err;
    })
    .then((transactions) => {
      const addressAccount = transactions.pop();
      return { transactions, addressAccount };
    });
};

module.exports = { fetchTransactions };

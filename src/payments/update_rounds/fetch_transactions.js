// Simple wrapper to handle retrieving block transaction details from the
// coin Daemon.
const fetchTransactions = (env) => async (rounds) => {
  const { daemon, logger } = env;
  const batchRPCCommand = rounds.map((r) => ['gettransaction', [r.txHash]]);
  const transactions = await daemon.rpcBatch(batchRPCCommand)
    .catch((err) => {
      logger.error(`Error with batch gettransaction call ${JSON.stringify(err)}`);
      throw err;
    });

  return transactions;
};

module.exports = { fetchTransactions };

// Returns the total unspent amount, across all matching transactions, from
// the pool's daemon account.
const listUnspent = (env) => async (displayBool = false) => {
  const { daemon, logger, coinUtils, minConfPayout } = env;
  const { coinsRound, coinsToSatoshies } = coinUtils;
  const addr = 'Payout Wallet';

  // Fetch all unspent transactions with at least minConfPayout confirmations.
  const [data] = await daemon.rpcCmd('listunspent', [minConfPayout, 99999999])
    .catch((error) => {
      logger.error(`Daemon RPC error: listunspent, ${addr}: ${error.message}`);
      throw error;
    });

  // Sum all of the transaction amounts and round to the nearest "satoshi".
  const balance = coinsRound(
    data.responses.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  );

  if (displayBool) { logger.special(`${addr} balance of ${balance}`); }
  return coinsToSatoshies(balance);
};

module.exports = { listUnspent };

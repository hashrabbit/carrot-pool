const isTxInvalid = (tx, round, logger) => {
  if (tx.error && tx.error.code === -5) {
    logger.warning(`Invalid transaction: ${round.txHash}`);
    round.category = 'kicked';
    return true;
  } if (!tx.result.details || (tx.result.details && tx.result.details.length === 0)) {
    logger.warning(`Invalid transaction details: ${round.txHash}`);
    round.category = 'kicked';
    return true;
  } if (tx.error || !tx.result) {
    logger.error(`Unknown transaction error: ${round.txHash} ${JSON.stringify(tx)}`);
    return true;
  }
  return false;
};

// Callback function, for the transactions.forEach() step in validateTransactions.
// Ensures the transaction details are valid, and sets the corresponding round
// confirmations, and category fields.
const processTransaction = ({ rounds, coinUtils, logger, poolOptions }) => (
  (tx, idx) => {
    const round = rounds[idx];
    // Update Confirmations
    if (tx && tx.result) round.confirmations = parseInt((tx.result.confirmations || 0), 10);

    // Check for invalid transaction
    if (isTxInvalid(tx, round, logger)) return;

    // TODO: Try to understand what this block of code is attempting to verify
    // Validate transaction details
    const addr = poolOptions.addresses.address;
    const { details } = tx.result;
    let detailForAddr = details.filter((d) => d.address === addr)[0];
    if (!detailForAddr && details.length === 1) [detailForAddr] = details;
    if (!detailForAddr) {
      logger.error(`Missing output details to pool address for transaction ${round.txHash}`);
      return;
    }

    // Update Round Category/Reward
    // NOTE: round.reward is in units of COINS
    round.category = detailForAddr.category;
    if ((round.category === 'generate') || (round.category === 'immature')) {
      round.reward = coinUtils.coinsRound(parseFloat(detailForAddr.amount || detailForAddr.value));
    }
  }
);

module.exports = { processTransaction };

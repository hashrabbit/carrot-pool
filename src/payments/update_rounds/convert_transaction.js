// Given a transaction, find the detail entry that matches our Pool address.
const addrDetail = ({ poolOptions }) => (tx) => {
  const { address } = poolOptions.addresses;
  let { details } = tx.result || {};
  details = Array.isArray(details) ? details : [];

  // If the details array contains just 1 entry, we always use it.
  if (details.length === 1) return details[0];

  // Otherwise, we look for an entry that matches our pool address. If multiple
  // entries match, we use the first. If no entry matches, we return undefined.
  return details.filter((d) => d.address === address)[0];
};

// An Invalid Tx has an error entry, whose code sub-entry is -5. Log that this
// round is invalid and set its category to "kicked", for pruning later in the
// processPayments workflow.
const invalidTx = ({ logger }) => (tx) => {
  // Early return if not invalid.
  if (!(tx.error && tx.error.code === -5)) return null;
  return (round) => {
    logger.warning(`Invalid transaction: ${round.txHash}`);
    round.category = 'kicked';
  };
};

// An Unknown Tx either has an error entry, with a code other than -5, or does
// not have a result entry. TODO (bh): Shouldn't this type of "bad" transaction
// result in a "kicked" category setting?
const unknownTx = ({ logger }) => (tx) => {
  // Early return if not unknown.
  if (!(tx.error || !tx.result)) return null;
  return (round) => {
    logger.error(`Unknown transaction error: ${round.txHash} ${JSON.stringify(tx)}`);
  };
};

// An Incomplete Tx has a result entry, but an empty or missing details sub-entry.
// Sets the "kicked" category, like invalidTx.
const incompleteTx = ({ logger }) => (tx) => {
  const { details } = tx.result || {};
  const { length } = Array.isArray(details) ? details : [];

  // Early return if not incomplete.
  if (!(!details || length === 0)) return null;
  return (round) => {
    logger.warning(`Invalid transaction details: ${round.txHash}`);
    round.category = 'kicked';
  };
};

// Contains a result sub-entry, with a details sub-array, but none of the detail
// entries are correct for our pool's address.
const missingTx = ({ logger }) => (detail) => {
  if (detail) return null;
  return (round) => {
    logger.error(`Missing output details to pool address for transaction ${round.txHash}`);
  };
};

// A fully valid transaction. When called with a round will update the confirmations
// and reward (if the round is to be paid).
const completeTx = ({ coinUtils }) => ({ detail, tx }) => (round) => {
  round.confirmations = parseInt((tx.result.confirmations || 0), 10);
  round.category = detail.category;
  if (['generate', 'immature'].includes(round.category)) {
    round.reward = coinUtils.coinsRound(parseFloat(detail.amount));
  }
};

// Each of the above <something>Tx functions contained here are designed to return
// round "updater" functions. Each type matches on a specific condition, which we
// match against, in a specific order, to ensure we receive the most appropriate
// round "updater" function. If none "bad" types match, we assign the "complete"
// type, by default.
const convertTransaction = (env) => (tx) => {
  const detail = addrDetail(env)(tx);
  return invalidTx(env)(tx) || unknownTx(env)(tx) || incompleteTx(env)(tx)
    || missingTx(env)(detail) || completeTx(env)({ detail, tx });
};

module.exports = { convertTransaction };

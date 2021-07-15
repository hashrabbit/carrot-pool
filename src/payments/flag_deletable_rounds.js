// Compare to original code in payments.js
const canDeleteShares = function (compR, rounds) {
  const cats = ['kicked', 'orphan'];
  return !rounds.some((r) => (
    (r.height === compR.height)
      && (!cats.includes(r.category))
      && (compR.serialized !== r.serialized)
  ));
};

const flagDeletableRounds = ({ rounds }) => {
  // Manage Immature Rounds
  rounds.filter((r) => {
    if (['orphan', 'kicked'].includes(r.category)) {
      r.canDeleteShares = canDeleteShares(r, rounds);
      return true;
    }
    if (['immature', 'generate'].includes(r.category)) return true;
    return false;
  });
};

module.exports = { flagDeletableRounds };

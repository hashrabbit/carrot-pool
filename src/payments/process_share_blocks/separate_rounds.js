// Evaluates all pending rounds and separates them in those that can be processed
// for automatic payout, and those that require manual payout (likely an error).
const separateRounds = ({ rounds, solo, shared }) => {
  const objectSize = (obj) => Object.keys(obj).length;
  const autoRounds = [];
  const manualRounds = [];

  // Separate the automatically payable rounds, from those requiring manual payout.
  rounds.forEach((round, i) => {
    const sum = objectSize(solo[i]) + objectSize(shared[i]);
    if (sum > 0) { autoRounds.push(round); } else { manualRounds.push(round); }
  });
  return { autoRounds, manualRounds };
};

module.exports = { separateRounds };

const { isDuplicateBlockHeight } = require('../utils');

const findDuplicates = ({ workers, rounds }) => {
  const dups = rounds.filter((round) => {
    if (isDuplicateBlockHeight(rounds, round.height)) {
      round.duplicate = true;
      return true;
    }
    return false;
  });
  return { workers, rounds, dups };
};

module.exports = { findDuplicates };

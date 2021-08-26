const processDups = ({ invalidateDups }) => ({ workers, rounds, dups }) => {
  if (dups.length === 0) return { workers, rounds };

  return invalidateDups(dups)
    .then(() => {
      // We are removing all rounds where their height matches another height.
      // Is this what we want? Or should we remove only the duplicate copies?
      const uniqueRounds = rounds.filter((round) => !round.duplicate);
      return { workers, rounds: uniqueRounds };
    });
};

module.exports = { processDups };

const buildDeleteLookup = (deleteCats, rounds) => {
  const lookup = {};
  rounds.forEach((r) => {
    if (!deleteCats.includes(r.category)) lookup[r.height] = r.serialized;
  });
  return lookup;
};

// 'orphan' and 'kicked' rounds should be flagged for deletion. But, there's
// a special case where we don't flag it: a 'generate' or 'immature' round,
// with the same height, but a different serialized value.
const flagDeletableRounds = (rounds) => {
  const deleteCats = ['orphan', 'kicked'];
  const lookup = buildDeleteLookup(deleteCats, rounds);
  rounds.forEach((r) => {
    if (deleteCats.includes(r.category)) {
      const inLookup = Object.keys(lookup).includes(r.height.toString());
      r.canDeleteShares = inLookup ? lookup[r.height] === r.serialized : true;
    }
  });
};

module.exports = { flagDeletableRounds };

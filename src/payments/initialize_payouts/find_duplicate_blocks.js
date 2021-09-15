const findDuplicateBlocks = (blocks) => {
  // Count the occurences of each block height. They should be unique, within
  // a payment processing run.
  const heights = {};
  blocks.forEach((b) => {
    if (!heights[b.height]) heights[b.height] = 0;
    heights[b.height] += 1;
  });

  // Use the height counts to flag "duplicate" blocks, while collecting them
  // into a separate array, for further processing.
  const duplicteBlocks = blocks.filter((b) => {
    b.duplicate = heights[b.height] > 1;
    return heights[b.height] > 1;
  });

  return duplicteBlocks;
};

module.exports = { findDuplicateBlocks };

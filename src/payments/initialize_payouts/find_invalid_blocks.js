// Take the set of duplicate round blocks and verify each of them against the
// blockchain. If the blockchain verifies them as "invalid", prep those rounds
// to be removed from payment processing.
const findInvalidBlocks = (env) => async (dups) => {
  if (dups.length === 0) return [];

  const { daemon, logger } = env;
  const rpcArgs = dups.map((r) => ['getblock', [r.blockHash]]);
  // Retrieve the on-chain block data for each "duplicate" block's blockHash.
  const blocks = await daemon.rpcBatch(rpcArgs)
    .catch((dupError) => {
      const msg = `findInvalidBlocks: Error fetching 'getblock' data: ${dupError.message}`;
      logger.error(msg);
      throw new Error(msg);
    });

  // Use the on-chain block data to determine which "duplicate" blocks are invalid.
  const validBlocks = [];
  const invalidBlocks = [];
  blocks.forEach((block, i) => {
    if (block && block.result) {
      const r = block.result;
      const msg = `findInvalidBlocks: Duplicate block ${r.height}(${r.hash})`;
      if (r.confirmations < 0) {
        logger.warning(`${msg} is invalid.`);
        invalidBlocks.push(dups[i].serialized);
      } else if (validBlocks.includes(dups[i].blockHash)) {
        logger.warning(`${msg} is non-unique.`);
        invalidBlocks.push(dups[i].serialized);
      } else {
        validBlocks.push(dups[i].blockHash);
        logger.debug(`${msg}) is *valid*.`);
      }
    }
  });
  return invalidBlocks;
};

module.exports = { findInvalidBlocks };

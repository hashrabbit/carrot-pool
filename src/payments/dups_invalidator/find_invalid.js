const findInvalid = ({ coin, logger }) => (dups) => {
  const validBlocks = {};
  const invalidBlocks = [];

  return (blocks) => {
    blocks.forEach((block, i) => {
      if (block && block.result) {
        if (block.result.confirmations < 0) {
          logger.warning(`Remove invalid duplicate block ${block.result.height} > ${block.result.hash}`);
          invalidBlocks.push(['smove', `${coin}:blocks:pending`, `${coin}:blocks:duplicate`, dups[i].serialized]);
        } else if (Object.prototype.hasOwnProperty.call(validBlocks, dups[i].blockHash)) {
          logger.warning(`Remove non-unique duplicate block ${block.result.height} > ${block.result.hash}`);
          invalidBlocks.push(['smove', `${coin}:blocks:pending`, `${coin}:blocks:duplicate`, dups[i].serialized]);
        } else {
          validBlocks[dups[i].blockHash] = dups[i].serialized;
          logger.debug(`Keep valid duplicate block ${block.result.height} > ${block.result.hash}`);
        }
      }
    });
    return invalidBlocks;
  };
};

module.exports = { findInvalid };

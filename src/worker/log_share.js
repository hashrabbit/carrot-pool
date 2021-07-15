const logShare = ({ logger }) => (isValidShare, isValidBlock, data) => {
  const shareData = JSON.stringify(data);
  // Checks for Block Data
  if (data.blockHash && !isValidBlock) logger.debug(`We thought a block was found but it was rejected by the daemon, share data: ${shareData}`);
  else if (isValidBlock) logger.debug(`Block found: ${data.blockHash} by ${data.worker}`);

  // Checks for Share Data
  if (isValidShare) {
    if (data.shareDiff > 1000000000) logger.debug('Share was found with diff higher than 1.000.000.000!');
    else if (data.shareDiff > 1000000) logger.debug('Share was found with diff higher than 1.000.000!');
    logger.debug(`Share accepted at diff ${data.difficulty}/${data.shareDiff} by ${data.worker} [${data.ip}]`);
  } else {
    logger.debug(`Share rejected: ${shareData}`);
  }
};

module.exports = { logShare };

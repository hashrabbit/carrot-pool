const { promiseExec } = require('../../utils/promised_redis');

const moveInvalidBlocks = ({ client, logger, coin }) => async (invalidBlocks) => {
  if (invalidBlocks.length === 0) {
    // TODO(bh): Why is this being logged. We should expect no duplicate blocks.
    logger.error('Unable to detect invalid duplicate blocks, duplicate block payments on hold.');
    return;
  }

  const commands = invalidBlocks.map((b) => (
    ['smove', `${coin}:blocks:pending`, `${coin}:blocks:duplicate`, b]
  ));
  const failMsg = 'moveInvalidBlocks: Error moving invalid blocks.';

  await promiseExec({ client, logger })({ commands, failMsg });
};

module.exports = { moveInvalidBlocks };

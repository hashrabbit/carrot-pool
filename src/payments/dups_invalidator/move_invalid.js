const { promiseExec } = require('../../utils/promised_redis');

const moveInvalid = (env) => async (invalidBlocks) => {
  if (invalidBlocks.length === 0) {
    env.logger.error('Unable to detect invalid duplicate blocks, duplicate block payments on hold.');
    return true;
  }

  const redisArgs = {
    commands: invalidBlocks,
    failMsg: 'Could not move invalid duplicate blocks in redis.'
  };

  return promiseExec(env)(redisArgs).then(() => invalidBlocks.length);
};

module.exports = { moveInvalid };

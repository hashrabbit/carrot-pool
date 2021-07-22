const { promisify } = require('util');
const { promiseExec } = require('../../utils/promised_redis');

const sendRedisCommands = (env) => async (commands) => {
  if (commands.length === 0) { return null; }
  const { coin,
    logger,
    signalStop,
    client,
    fs } = env;

  const redisEnv = { client, logger };
  const redisArgs = {
    commands,
    failMsg: `Payments sent but could not update redis.
      Disabling payment processing to prevent possible double-payouts. The redis commands in
      ${coin}_finalRedisCommands.txt must be ran manually`
  };

  return promiseExec(redisEnv)(redisArgs).catch((redisErr) => {
    // TODO: This should instead return a semantic error that bubbles up
    // to the interval to stop rescheduling
    signalStop(); // Single cb to clear both intervals
    const fsWriteFile = promisify(fs.writeFile).bind(fs);
    return fsWriteFile(`${coin}_finalRedisCommands.txt`, JSON.stringify(commands)).catch((fsErr) => {
      const fsErrString = `${fsErr}: Could not write finalRedisCommands.txt, you are fucked.`;
      logger.error(fsErrString);
      throw new Error(fsErrString);
    }).then(() => { throw redisErr; });
  }).then(() => logger.debug('Finished sending all confirmed payments to users'));
};

module.exports = { sendRedisCommands };

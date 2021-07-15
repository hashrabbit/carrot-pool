const { promisify } = require('util');

const fetchRoundTimes = ({ client, logger, coin, rounds }) => {
  const cmds = rounds.map((r) => ['hgetall', `${coin}:times:times${r.height}`]);
  const multi = client.multi(cmds);
  const execAsync = promisify(multi.exec).bind(multi);

  return execAsync()
    .catch((err) => {
      const msg = `fetchRoundTimes: Error retrieving round times ${err}`;
      logger.error(msg);
      throw new Error(msg);
    })
    .then((results) => {
      const times = results.map((t) => (
        Object.entries(t).reduce((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) }), {})
      ));
      return { times };
    })
    .catch((err) => {
      const msg = `fetchRoundTimes: Invalid round times format ${err}`;
      logger.error(msg);
      throw new Error(msg);
    });
};

module.exports = { fetchRoundTimes };

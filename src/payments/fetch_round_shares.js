const { promisify } = require('util');

const parseShareData = (share) => {
  const data = { solo: {}, shared: {} };

  // Format Shared/Solo Shares Data
  Object.entries(share).forEach(([entry, value]) => {
    const details = JSON.parse(entry);
    const type = details.soloMined ? 'solo' : 'shared';
    data[type][details.worker] = (data[type][details.worker] || 0) + parseFloat(value);
  });
  return data;
};

const fetchRoundShares = (env) => {
  const { client, logger, coin, rounds } = env;

  return ({ times }) => {
    const cmds = rounds.map((r) => ['hgetall', `${coin}:shares:round${r.height}`]);
    const multi = client.multi(cmds);
    const execAsync = promisify(multi.exec).bind(multi);

    return execAsync()
      .catch((err) => {
        const msg = `fetchRoundShares: Error retrieving round shares ${err}`;
        logger.error(msg);
        throw new Error(msg);
      })
      .then((shares) => {
        const solo = [];
        const shared = [];
        shares.forEach((share) => {
          const parsedShare = parseShareData(share);
          solo.push(parsedShare.solo);
          shared.push(parsedShare.shared);
        });
        return { times, solo, shared };
      })
      .catch((err) => {
        const msg = `fetchRoundShares: Invalid round shares format ${err}`;
        logger.error(msg);
        throw new Error(msg);
      });
  };
};

module.exports = { fetchRoundShares };

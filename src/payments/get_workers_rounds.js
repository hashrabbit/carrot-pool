const { promisify } = require('util');
const { isDuplicateBlockHeight } = require('./utils.js');

const fetchPaidUnpaid = ({ coin, client, logger }) => {
  const multi = client.multi([
    ['hgetall', `${coin}:payments:unpaid`],
    ['smembers', `${coin}:blocks:pending`],
  ]);
  const execAsync = promisify(multi.exec).bind(multi);
  return execAsync()
    .catch((err) => {
      const msg = `getWorkersRounds: Could not get blocks from database: ${JSON.stringify(err)}`;
      logger.error(msg);
      throw new Error(msg);
    });
};

const buildWorkersRounds = ({ coinUtils }) => (
  ([unpaid, pending]) => {
    const workers = {};

    if (unpaid) {
      Object.entries(unpaid).forEach((pair) => {
        const [w, bal] = pair;
        workers[w] = { balance: coinUtils.coinsToSatoshies(parseFloat(bal)) };
      });
    }

    // Convert pending entries into block rounds
    const rounds = pending.map((r) => {
      const details = JSON.parse(r);
      return {
        time: details.time,
        blockHash: details.blockHash,
        txHash: details.txHash,
        height: details.height,
        workerAddress: details.worker,
        soloMined: details.soloMined,
        duplicate: false,
        serialized: r,
      };
    });
    // Sort Rounds by Block Height
    rounds.sort((a, b) => a.height - b.height);
    return { workers, rounds };
  }
);

const findDuplicates = ({ workers, rounds }) => {
  const dups = rounds.filter((round) => {
    if (isDuplicateBlockHeight(rounds, round.height)) {
      round.duplicate = true;
      return true;
    }
    return false;
  });
  return { workers, rounds, dups };
};

const processDups = ({ invalidateDups }) => (
  ({ workers, rounds, dups }) => {
    if (dups.length === 0) return { workers, rounds };

    return invalidateDups(dups)
      .then(() => {
        // We are removing all rounds where their height matches another height.
        // Is this what we want? Or should we remove only the duplicate copies?
        const uniqueRounds = rounds.filter((round) => !round.duplicate);
        return { workers, rounds: uniqueRounds };
      });
  }
);

const getWorkersRounds = (env) => (
  fetchPaidUnpaid(env)
    .then(buildWorkersRounds(env))
    .then(findDuplicates)
    .then(processDups(env))
);

module.exports = { getWorkersRounds };

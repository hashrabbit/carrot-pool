const { promisify } = require('util');

// Delegate 'immature', and 'generate' category rounds to their respective
// sub-functions, to calculate worker payout amounts.
const prepareAutoBlocks = (env) => {
  const { allTimes, allSolo, allShared, immatureBlock, confirmedBlock } = env;

  return (auto) => {
    auto.forEach(({ round, i }) => {
      const maxTime = Math.max(...Object.values(allTimes[i]).map(parseFloat));
      const blockArgs = {
        round, shared: allShared[i], solo: allSolo[i], times: allTimes[i], maxTime
      };

      ({
        kicked: () => {},
        orphan: () => {},
        immature: (args) => { immatureBlock(env)(args); },
        generate: (args) => { confirmedBlock(env)(args); },
      })[round.category](blockArgs);
    });
  };
};

const logManualRound = (logger) => (r) => {
  const msg = `No worker shares for round: ${r.height} blockHash: ${r.blockHash}.`;
  logger.error(`${msg} Manual payout required.`);
};

// Returns a promise that moves the pending blocks for all rounds that have no shared
// or solo work recorded. These blocks need to be evaluated for possible manual payout.
// After resolving, an error message is logged for each block moved.
const moveManualBlocks = ({ client, logger, coin }) => {
  const cmdArr = ['smove', `${coin}:blocks:pending`, `${coin}:blocks:manual`];

  return (rounds) => {
    const cmds = rounds.map((r) => [...cmdArr, r.serialized]);
    const multi = client.multi(cmds);
    const execAsync = promisify(multi.exec).bind(multi);

    return execAsync().then(() => {
      rounds.forEach(logManualRound(logger));
      return rounds.length;
    });
  };
};

// Length of object keys array
const objectSize = (obj) => Object.keys(obj).length;

// A processShareBlocks pipeline promise-returning function. Evaluates all pending rounds
// to determine which ones require payout, prepares the automatically payable rounds
// for the payout process, further down the processPayments pipeline.
const prepareRounds = (
  env,
  immatureBlock = require('./immature_block').immatureBlock,
  confirmedBlock = require('./confirmed_block').confirmedBlock
) => {
  const { rounds } = env;

  return (args) => {
    const { times: allTimes, solo: allSolo, shared: allShared } = args;
    const manual = [];
    const auto = [];

    // Separate the automatically payable rounds, from those requiring manual payout.
    rounds.forEach((round, i) => {
      const totalShares = objectSize(allSolo[i]) + objectSize(allShared[i]);
      if (totalShares <= 0) { manual.push(round); } else { auto.push({ round, i }); }
    });

    prepareAutoBlocks({
      allTimes,
      allSolo,
      allShared,
      immatureBlock,
      confirmedBlock,
      ...env
    })(auto);
    return moveManualBlocks(env)(manual);
  };
};

module.exports = { prepareRounds };

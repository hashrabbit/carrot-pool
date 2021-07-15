const { requireDeps } = require('../../utils/require_deps');

const defaultDeps = [
  ['sortBlocks', `${__dirname}/../utils`],
];

// If the supplied value fails to partse as JSON, we return false.
const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return false;
  }
};

const _parseStats = ({ sortBlocks }) => ({ poolConfig }) => (rawStats) => {
  const { coin, fees, ports, featured, paymentProcessing } = poolConfig;
  const { basicStats } = rawStats;

  const stats = {
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    algorithm: coin.algorithm,
    featured,
    fees,
    ports,
    hashrate: {
      hashrate: 0,
      hashrateShared: 0,
      hashrateSolo: 0,
      hashrates: rawStats.hashrates,
    },
    shares: {
      shares: 0,
      roundShares: rawStats.roundCurrent,
      roundTimes: rawStats.timesCurrent,
    },
    blocks: {
      pendingCount: rawStats.pendingCount,
      pending: rawStats.pendingBlocks.sort(sortBlocks),
      confirmedCount: rawStats.confirmedCount,
      confirmed: rawStats.confirmedBlocks.sort(sortBlocks),
      confirmations: rawStats.pendingConfirms,
      orphanedCount: rawStats.orphanedCount,
    },
    statistics: {
      hashrateType: coin.hashrateType,
      validShares: basicStats.validShares || 0,
      validBlocks: basicStats.validBlocks || 0,
      invalidShares: basicStats.invalidShares || 0,
      lastPaid: basicStats.lastPaid || 0,
      totalPaid: basicStats.totalPaid || 0,
      paymentTime: paymentProcessing.paymentInterval,
      paymentMinimum: paymentProcessing.minimumPayment,
    },
    workers: {
      workers: {},
      workersShared: {},
      workersSolo: {},
      workersCount: 0,
      workersSharedCount: 0,
      workersSoloCount: 0,
    },
    history: [],
    payments: [],
  };

  // Parse History
  // History is stored as hash entry in stats.history whose value is an JSON-ed
  // array of objects. I think using a Sorted Set is a better option, and easier
  // to work with the elements, since we can use their timestamp as their "score".
  const histJson = safeParseJson(rawStats.history.history);
  if (histJson) stats.history.push(...histJson);

  // Parse Payments
  const parsedPayments = rawStats.payments
    .map((p) => safeParseJson(p)).filter((p) => !!p);
  stats.payments.push(...parsedPayments);

  return stats;
};

module.exports = {
  _parseStats,
  parseStats: _parseStats(requireDeps(defaultDeps))
};

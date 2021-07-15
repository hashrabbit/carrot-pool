const { describe, it } = require('mocha');

const { expect } = require('../../chai-local');

const { initializeWorkers } = require('../../../src/stats/coin_stats/initialize_workers');

describe('initializeWorkers() - initialize stats workers from JSON hashrates', () => {
  const poolConfig = { coin: { hashrateType: 'sols' } };
  const worker = 'AAAAAA';

  describe('for a hashrate entry, with > 0 difficulty', () => {
    const hashrates = [JSON.stringify(
      { worker, difficulty: 10.2, soloMined: false }
    )];
    const stats = {
      hashrate: { hashrates },
      shares: { shares: 0 },
      workers: { workers: {} },
    };

    it('populates shares.shares and workers.workers', () => {
      initializeWorkers({ poolConfig, stats });

      expect(stats.shares.shares).to.eql(10.2);
      expect(stats.workers.workers[worker]).to.include({ validShares: 10.2 });
    });
  });

  describe('for 2 hashrates, for the same worker', () => {
    const hashrates = [
      { worker, difficulty: 10.2, soloMined: false },
      { worker, difficulty: 4.8, soloMined: false }
    ].map(JSON.stringify);
    const stats = {
      hashrate: { hashrates },
      shares: { shares: 0 },
      workers: { workers: {} },
    };

    it('combines diffs for shares and selects last diff for worker', () => {
      initializeWorkers({ poolConfig, stats });

      expect(stats.shares.shares).to.eql(15);
      expect(stats.workers.workers[worker]).to.include({ difficulty: 5 });
    });
  });
});

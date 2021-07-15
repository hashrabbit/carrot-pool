const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _computeHashrates } = require('../../../src/stats/coin_stats/compute_hashrates');

describe('computeHashrates() - processStats sub-function', () => {
  const shareMultiplier = sinon.stub().returns(0.1);
  const statsConfig = { hashrateWindow: 1 };
  const computeHashrates = _computeHashrates({ shareMultiplier });

  describe('for a matching shared-mining worker entry', () => {
    const addr = 'AAAAAA';
    const worker = { validShares: 10, roundShares: 0, soloMining: false };
    const stats = {
      algorithm: 'scrypt',
      hashrate: { hashrate: 0, hashrateShared: 0, hashrateSolo: 0 },
      shares: { roundShares: { [addr]: 5 } },
      workers: { workers: { [addr]: worker }, workersShared: {}, workersSolo: {} },
    };

    it('updates the worker-related stats', () => {
      computeHashrates({ statsConfig, stats });

      expect(worker.roundShares).to.eql(5);
      expect(stats.hashrate.hashrateShared).to.eql(1);
      expect(Object.keys(stats.workers.workersShared)).to.eql([addr]);
      expect(Object.keys(stats.workers.workersSolo)).to.eql([]);
    });
  });
});

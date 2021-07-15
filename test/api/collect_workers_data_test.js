const { describe, it } = require('mocha');

const { expect } = require('../chai-local');

const { collectWorkersData } = require('../../src/api/collect_workers_data');

describe('collectWorkersData()', () => {
  const stats = {
    name: 'carrot',
    symbol: 'CRRT',
    algorithm: 'scrypt',
    workers: {
      workersShared: {},
      workersSolo: {},
    }
  };
  const addr = 'AABB';
  const shared = {
    difficulty: 10,
    validShares: 0,
    invalidShares: 0,
    hashrate: 1111,
    hashrateType: 'sols',
    soloMining: false,
  };
  const solo = {
    difficulty: 10,
    validShares: 0,
    invalidShares: 0,
    hashrate: 2222,
    hashrateType: 'sols',
    soloMining: true,
  };

  describe('with no "shared" and no "solo" workers', () => {
    it('retuns an empty workers array', () => {
      const result = collectWorkersData({ stats });

      expect(result.workers).to.eql([]);
    });
  });

  describe('with 1 "shared" worker', () => {
    it('retuns 1 entry in the workers array', () => {
      stats.workers.workersShared[addr] = shared;
      const result = collectWorkersData({ stats });

      expect(result.workers.length).to.eql(1);
      expect(result.workers[0].address).to.eql(addr);
    });
  });

  describe('with 1 "shared" and 1 "solo" workers, filtered by address', () => {
    it('retuns the filtered entry in the workers array', () => {
      const addr2 = 'BBCC';
      stats.workers.workersShared[addr] = shared;
      stats.workers.workersSolo[addr2] = solo;
      const result = collectWorkersData({ stats, address: addr2 });

      expect(result.workers.length).to.eql(1);
      expect(result.workers[0].address).to.eql(addr2);
    });
  });
});

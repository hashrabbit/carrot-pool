const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _persistHistory } = require('../../../src/stats/coin_stats/persist_history');

describe('persistHistory() - processes stats history and persist to Redis', () => {
  const statsConfig = { historicalRetention: 20, historicalInterval: 10 };
  const stats = {
    hashrate: { hashrateShared: 0, hashrateSolo: 0 },
    workers: { workersSharedCount: 0, workersSoloCount: 0 },
  };
  const timestamp = Math.trunc(Date.now() / 1000);

  describe('with no existing entries', () => {
    const hset = sinon.stub().resolvesArg(0);
    const persistHistory = _persistHistory({ promiseCmd: () => () => hset });
    const env = { stats: { ...stats, history: [] }, statsConfig, timestamp };

    it('persists the generated history object', async () => {
      const result = await persistHistory(env);

      expect(result).to.eql(true);
      expect(hset).to.have.callCount(1);
    });
  });

  describe('with an existing entry, outside retention range', () => {
    const hset = sinon.stub().returnsArg(0);
    const persistHistory = _persistHistory({ promiseCmd: () => () => hset });
    const history = [{ time: timestamp - 21 }];
    const env = { stats: { ...stats, history }, statsConfig, timestamp };

    it('persists the generated history object', async () => {
      const result = await persistHistory(env);

      expect(result).to.eql(true);
      expect(hset).to.have.callCount(1);
    });
  });

  describe('with an existing entry, inside interval range', () => {
    const hset = sinon.stub().returnsArg(0);
    const persistHistory = _persistHistory({ promiseCmd: () => () => hset });
    const history = [{ time: timestamp - 15 }];
    const env = { stats: { ...stats, history }, statsConfig, timestamp };

    it('persists the exiting and generated history objects', async () => {
      const result = await persistHistory(env);
      expect(result).to.eql(true);

      const entries = JSON.parse(hset.args[0][0].args[2]);
      expect(entries.length).to.eql(2);
    });
  });

  describe('with an existing entry, outside interval range', () => {
    const hset = sinon.stub().returnsArg(0);
    const persistHistory = _persistHistory({ promiseCmd: () => () => hset });
    const history = [{ time: timestamp - 5 }];
    const env = { stats: { ...stats, history }, statsConfig, timestamp };

    it('does not persist any history objects', async () => {
      const result = await persistHistory(env);
      expect(result).to.eql(false);
    });
  });
});

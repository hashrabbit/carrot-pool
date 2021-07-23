const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { createClient } = require('../helpers');

const { requireDeps } = require('../../src/utils/require_deps');
const { _defaultDeps, _poolStats } = require('../../src/stats');

describe('PoolStats -- pool stats calulation container', () => {
  const baseLogger = { cached: () => {} };
  const client = createClient();
  const redisStub = {
    client,
    attachEvents: () => {},
  };
  const deps = requireDeps(_defaultDeps);
  deps.Redis = sinon.stub().returns(redisStub);

  const coin = 'Carrot';
  const portalConfig = {
    redis: {},
    stats: {
      updateInterval: 60,
      historicalInterval: 600,
      historicalRetention: 43200,
      hashrateWindow: 300
    }
  };
  const address = 'AABBCCDD';
  const poolConfig = {
    coin: { name: coin, symbol: 'CRT' },
    fees: {},
    ports: {},
    featured: {},
    paymentProcessing: {}
  };

  after(() => { client.quit(); });

  describe('getBalanceByAddress(address)', () => {
    describe('for an address with at least one balance', () => {
      beforeEach(() => {
        client.flushall(() => {});
        client.hincrbyfloat(`${coin}:payments:balances`, address, 0.111);
        client.hincrbyfloat(`${coin}:payments:immature`, address, 0);
        client.hincrbyfloat(`${coin}:payments:payouts`, address, 0);
        client.hincrbyfloat(`${coin}:payments:unpaid`, address, 0);
      });

      it('returns the balances object with the correct totals', async () => {
        const PoolStats = _poolStats(deps);
        const poolStats = new PoolStats({ baseLogger, poolConfig, portalConfig });
        const balances = await poolStats.getBalanceByAddress(address);
        expect(balances.totalBalance).to.eql(0.111);
      });
    });
  });

  describe('getTotalSharesByAddress(address)', () => {
    describe('when the address contains shares', () => {
      beforeEach(() => {
        client.flushall(() => {});
        client.hincrbyfloat(`${coin}:shares:roundCurrent`, address, 0.111);
      });

      it('returns the shares total', async () => {
        const PoolStats = _poolStats(deps);
        const poolStats = new PoolStats({ baseLogger, poolConfig, portalConfig });
        const total = await poolStats.getTotalSharesByAddress(address);
        expect(total).to.eql(0.111);
      });
    });
  });

  describe('getGlobalStats(callback)', () => {
    it('fetches, parses, and caches the global stats', async () => {
      const PoolStats = _poolStats(deps);
      const poolStats = new PoolStats({ baseLogger, poolConfig, portalConfig });
      await poolStats.getGlobalStats();
      expect(poolStats.stats.history.length).to.eql(1);
    });
  });
});

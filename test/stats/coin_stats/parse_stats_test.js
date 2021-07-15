const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _parseStats } = require('../../../src/stats/coin_stats/parse_stats');

describe('parseStats() - converts the raw stats object into a "full" stats object ', () => {
  const sortBlocks = sinon.stub().returns(0);
  const poolConfig = {
    coin: { name: 'coin', symbol: 'coin', algorithm: 'scrypt' },
    fees: 0,
    enabled: true,
    featured: true,
    paymentProcessing: { paymentInterval: 0, minimumPayment: 0 },
    ports: {},
  };
  const parseStats = _parseStats({ sortBlocks })({ poolConfig });

  describe('with a "normal" rawStats', () => {
    const rawStats = {
      hashrates: [],
      roundCurrent: {},
      timesCurrent: {},
      pendingCount: 2,
      pendingBlocks: ['111', '222'],
      confirmedCount: 0,
      confirmedBlocks: [],
      pendingConfirms: {},
      orphanedCount: 0,
      basicStats: { validBlocks: 1 },
      history: { history: JSON.stringify([{ foo: 'bar' }]) },
      payments: [JSON.stringify({ foo: 'bar' })]
    };

    it('retuns the correct "full" stats object', () => {
      const result = parseStats(rawStats);

      expect(result.statistics.validBlocks).to.eql(1);
      expect(result.history[0].foo).to.eql('bar');
    });
  });
});

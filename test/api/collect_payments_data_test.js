const { describe, it, before } = require('mocha');

const { expect } = require('../chai-local');

const { collectPaymentsData } = require('../../src/api/collect_payments_data');

describe('collectPaymentsData()', () => {
  const stats = {
    name: 'carrot',
    symbol: 'CRRT',
    algorithm: 'scrypt',
    payments: []
  };

  describe('with no payments in the pool stats', () => {
    it('retuns an empty array', () => {
      const result = collectPaymentsData({ stats });

      expect(result.payments).to.eql([]);
    });
  });

  describe('with 1 payment in the pool stats', () => {
    const payment = {
      time: Date.now(),
      txid: '',
      paid: 6.25,
      shares: 1,
      workers: 1,
      records: {},
      unpaid: {},
      totals: {
        amounts: { AABB: 0 },
        shares: {}
      }
    };

    before(() => stats.payments.push(JSON.stringify(payment)));

    describe('with no address to filter', () => {
      it('retuns arrary of just the payment object', () => {
        const result = collectPaymentsData({ stats });

        expect(result.payments.length).to.eql(1);
        expect(result.payments[0].paid).to.eql(6.25);
      });
    });

    describe('with a filter address', () => {
      it('retuns an empty arrary', () => {
        const result = collectPaymentsData({ stats, address: 'AABB' });

        expect(result.payments.length).to.eql(1);
        expect(result.payments[0].paid).to.eql(6.25);
      });
    });
  });
});

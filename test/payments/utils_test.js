const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { calculateTotalOwed } = require('../../src/payments/utils');

describe('calculateTotalOwed() - processShareBlocks pipeline function', () => {
  const feeSatoshi = 3;
  const coinsToSatoshies = sinon.stub().returnsArg(0);
  const coinUtils = { coinsToSatoshies };

  describe('for 1 round and no workers', () => {
    const rounds = [{ category: 'generate', reward: 5 }];
    const env = {
      feeSatoshi, coinUtils, rounds, workers: {}
    };

    it('retuns owed == 2', () => {
      const { owed } = calculateTotalOwed(env)({});
      expect(owed).to.eql(2);
    });
  });

  describe('for 1 round and 1 worker balance', () => {
    const rounds = [{ category: 'generate', reward: 5 }];
    const env = {
      feeSatoshi, coinUtils, rounds, workers: { a: { balance: 1 } }
    };

    it('retuns owed == 3', () => {
      const { owed } = calculateTotalOwed(env)({});
      expect(owed).to.eql(3);
    });
  });
});

const { describe, it } = require('mocha');

const { expect } = require('../../chai-local');

const { lostShares } = require('../../../src/payments/immature_block/lost_shares');

describe('lostShares() - based on time mining, calculate amount contributed shares "lost"', () => {
  const shares = 10;
  const maxTime = 10;

  describe('when shares were contributed for >= 51% of round time', () => {
    const time = 6;

    it('returns zero "lost" shares adjustment', () => {
      const result = lostShares(shares, time, maxTime);
      expect(result).to.eql(0);
    });
  });

  describe('when shares were contributed for only 40% of round time', () => {
    const time = 4;

    it('returns a "lost" shares amount of 60%', () => {
      const result = lostShares(shares, time, maxTime);
      expect(result).to.eql(6);
    });
  });
});

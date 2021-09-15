const { describe, it } = require('mocha');
const { expect } = require('../../chai-local');

const { findDuplicateBlocks } = require(
  '../../../src/payments/initialize_payouts/find_duplicate_blocks'
);

describe('findDuplicateBlocks() - identify and flag duplicate records in rounds', () => {
  describe('with no dulicate rounds', () => {
    const rounds = [{ height: 1 }, { height: 2 }];

    it('retuns an empty set of duplicates', () => {
      const dups = findDuplicateBlocks(rounds);
      expect(dups.length).to.eql(0);
    });
  });

  describe('with at least one pair of dulicate rounds', () => {
    const rounds = [{ height: 1 }, { height: 2 }, { height: 1 }];

    it('retuns a set of 2 correctly flagged duplicates', () => {
      const dups = findDuplicateBlocks(rounds);
      expect(dups.length).to.eql(2);
      expect(dups[0].duplicate).to.eql(true);
    });
  });
});

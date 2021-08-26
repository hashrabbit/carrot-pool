const { describe, it } = require('mocha');
const { expect } = require('../../chai-local');

const { findDuplicates } = require('../../../src/payments/get_workers_rounds/find_duplicates');

describe('findDuplicates() - identify and flag duplicate records in rounds', () => {
  describe('with no dulicate rounds', () => {
    const rounds = [
      { height: 1, duplicate: false },
      { height: 2, duplicate: false }
    ];
    const workers = {};

    it('retuns an empty set of duplicates', () => {
      const { dups } = findDuplicates({ workers, rounds });
      expect(dups.length).to.eql(0);
    });
  });

  describe('with at least one pair of dulicate rounds', () => {
    const rounds = [
      { height: 1, duplicate: false },
      { height: 2, duplicate: false },
      { height: 1, duplicate: false }
    ];
    const workers = {};

    it('retuns a set of 2 correctly flagged duplicates', () => {
      const { dups } = findDuplicates({ workers, rounds });
      expect(dups.length).to.eql(2);
      expect(dups[0].duplicate).to.eql(true);
    });
  });
});

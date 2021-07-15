const { describe, it } = require('mocha');

const { expect } = require('../chai-local');

const { flagDeletableRounds } = require('../../src/payments/flag_deletable_rounds');

describe('flagDeletableRounds() - validateTransactions sub-function', () => {
  describe('orphan round without a duplicate height', () => {
    const rounds = [
      { category: 'orphan', height: 0, serialized: 'foo' },
      { category: 'generate', height: 1, serialized: 'bar' }
    ];

    it('flags the round for deleting', () => {
      flagDeletableRounds({ rounds });
      expect(rounds[0].canDeleteShares).to.eql(true);
    });
  });

  describe('orphan round with duplicate height, same serialized', () => {
    const rounds = [
      { category: 'orphan', height: 0, serialized: 'foo' },
      { category: 'generate', height: 0, serialized: 'foo' }
    ];

    it('flags the round for deleting', () => {
      flagDeletableRounds({ rounds });
      expect(rounds[0].canDeleteShares).to.eql(true);
    });
  });

  describe('orphan round with duplicate height, diff serialized', () => {
    const rounds = [
      { category: 'orphan', height: 0, serialized: 'foo' },
      { category: 'generate', height: 0, serialized: 'bar' }
    ];

    it('does not flag the round for deleting', () => {
      flagDeletableRounds({ rounds });
      expect(rounds[0].canDeleteShares).to.eql(false);
    });
  });
});

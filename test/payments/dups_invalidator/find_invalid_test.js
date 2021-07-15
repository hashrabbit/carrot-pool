const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { findInvalid } = require('../../../src/payments/dups_invalidator/find_invalid');

describe('findInvalid()', () => {
  let dups;
  const logger = { debug: sinon.stub(), warning: sinon.stub() };
  const env = { coin: 'coin', logger };

  beforeEach(() => {
    dups = [
      { blockHash: 'hash1', serialized: 's1' },
      { blockHash: 'hash2', serialized: 's2' },
      { blockHash: 'hash3', serialized: 's3' },
      { blockHash: 'hash4', serialized: 's4' }
    ];
  });

  describe('when dups contains no invalid blocks', () => {
    const blocks = [
      { result: { confirmations: 1 } },
      { result: { confirmations: 2 } },
      { result: { confirmations: 0 } },
      { result: { confirmations: 3 } }
    ];

    it('retuns an empty array', () => {
      expect(findInvalid(env)(dups)(blocks)).to.be.empty;
    });
  });

  describe('when dups contains an invalid block ', () => {
    const validConfirmations = { confirmations: 0 };
    const invalidConfirmations = { confirmations: -1 };
    const blocks = [
      { result: validConfirmations },
      { result: invalidConfirmations },
      { result: validConfirmations },
      { result: invalidConfirmations }
    ];

    it('returns an array containing the invalid blocks', () => {
      expect(findInvalid(env)(dups)(blocks)).to.deep.include.members([
        ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's2'],
        ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's4']
      ]);
    });
  });

  describe('when dups contains non-unique blocks', () => {
    beforeEach(() => {
      dups = [
        { blockHash: 'hash1', serialized: 's1' },
        { blockHash: 'hash2', serialized: 's2' },
        { blockHash: 'hash2', serialized: 's2' },
        { blockHash: 'hash3', serialized: 's3' },
        { blockHash: 'hash4', serialized: 's4' },
        { blockHash: 'hash4', serialized: 's4' },
        { blockHash: 'hash4', serialized: 's4' },
        { blockHash: 'hash5', serialized: 's5' }
      ];
    });

    const blocks = [
      { result: { confirmations: 1, height: 10, hash: 'resulthash1' } },
      { result: { confirmations: 2, height: 201, hash: 'resulthash2' } },
      { result: { confirmations: 2, height: 201, hash: 'resulthash2' } },
      { result: { confirmations: 7, height: 99, hash: 'resulthash3' } },
      { result: { confirmations: 3, height: 0, hash: 'resulthash4' } },
      { result: { confirmations: 3, height: 0, hash: 'resulthash4' } },
      { result: { confirmations: 3, height: 0, hash: 'resulthash4' } },
      { result: { confirmations: 11, height: 33, hash: 'resulthash5' } }
    ];

    it('returns an array containing the non-unique blocks', () => {
      const actual = findInvalid(env)(dups)(blocks);
      expect(actual).to.have.length(3);
      expect(actual).to.deep.include.members([
        ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's2'],
        ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's4']
      ]);
    });
  });
});

const { describe, it } = require('mocha');

const { expect } = require('../chai-local');

const { collectBlocksData } = require('../../src/api/collect_blocks_data');

describe('collectBlocksData()', () => {
  const stats = {
    name: 'carrot',
    symbol: 'CRRT',
    algorithm: 'scrypt',
    blocks: {
      pending: [],
      confirmed: [],
      confirmations: {},
      pendingCount: 0,
      confirmedCount: 0,
      orphanedCount: 0
    }
  };

  describe('with no "pending" and no "confirmed" blocks', () => {
    it('retuns a data object with an empty blocks array', () => {
      const result = collectBlocksData({ stats });

      expect(result.blocks).to.eql([]);
    });
  });

  describe('with 1 "pending" block', () => {
    const pending = {
      time: Date.now(),
      height: 10,
      blockHash: 'AABB',
      blockReward: 6.25,
      txHash: '',
      difficulty: 1,
      worker: 'CCDD',
      soloMined: false,
    };

    it('retuns a data object with 1 pending entry in the blocks array', () => {
      stats.blocks.pending.push(JSON.stringify(pending));
      stats.blocks.confirmations.AABB = 5;
      const result = collectBlocksData({ stats });

      expect(result.blocks.length).to.eql(1);
      expect(result.blocks[0].confirmed).to.eql(false);
    });
  });
});

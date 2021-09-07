const { describe, it } = require('mocha');

const { expect } = require('../../../chai-local');

const { findOrNew } = require('../../../../src/payments/utils');
const { _sharedRoundTotal } = require(
  '../../../../src/payments/process_share_blocks/immature_block/shared_round_total'
);

describe('sharedRoundTotal() - calculate adjusted shares for workers in a round', () => {
  const addrs = ['AAAAAA', 'BBBBBB'];
  const lostShares = () => 0;
  const sharedRoundTotal = _sharedRoundTotal({ findOrNew, lostShares });

  describe('for a round with 1 worker and no maxTime', () => {
    const shared = { [addrs[0]]: 10 };
    const workers = {};
    const args = {
      workers, shared, times: {}, maxTime: 0
    };

    it('returns zero for total shares and worker.roundShares', () => {
      const total = sharedRoundTotal(args);
      expect(total).to.eql(0);
      expect(workers[addrs[0]].roundShares).to.eql(0);
    });
  });

  describe('for a round with 2 workers', () => {
    const shared = { [addrs[0]]: 10, [addrs[1]]: 5 };
    const workers = { [addrs[0]]: {} };
    const args = {
      workers, shared, times: {}, maxTime: 1
    };

    it('returns the total round shares and sets worker.roundShares', () => {
      const total = sharedRoundTotal(args);
      expect(total).to.eql(15);
      expect(Object.keys(workers).length).to.eql(2);
      expect(workers[addrs[0]].roundShares).to.eql(10);
    });
  });
});

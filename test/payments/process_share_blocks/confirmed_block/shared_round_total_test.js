const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../../chai-local');

const { sharedRoundTotal } = require(
  '../../../../src/payments/process_share_blocks/confirmed_block/shared_round_total'
);

describe('sharedRoundTotal() - calculate adjusted shares for workers in a round', () => {
  const round = { height: 11 };
  const addrs = ['AAAAAA', 'BBBBBB'];
  const logger = { error: sinon.stub().returnsArg(0) };
  const workers = {};
  const env = { logger };

  describe('for a round with 1 worker and no maxTime', () => {
    const shared = { [addrs[0]]: 10 };
    const args = {
      workers, round, shared, times: {}, maxTime: 0
    };

    it('returns zero for total shares and worker.roundShares', () => {
      const total = sharedRoundTotal(env)(args);
      expect(total).to.eql(0);
      expect(workers[addrs[0]].roundShares).to.eql(0);
    });
  });

  describe('for a round with 2 workers getting partial credit', () => {
    const shared = { [addrs[0]]: 10, [addrs[1]]: 10 };
    const times = { [addrs[0]]: 40, [addrs[1]]: 50 };
    const args = {
      workers, round, shared, times, maxTime: 100
    };

    it('returns the adjusted total shares and sets worker.roundShares', () => {
      const total = sharedRoundTotal(env)(args);
      expect(total).to.eql(9);
      expect(Object.keys(workers).length).to.eql(2);
      expect(workers[addrs[0]].roundShares).to.eql(4);
    });
  });

  describe('for a round with 1 worker, with an invalid time', () => {
    const shared = { [addrs[0]]: 10 };
    const times = { [addrs[0]]: 101 };
    const args = {
      workers, round, shared, times, maxTime: 100
    };

    it('returns 0 total shares and logs an error message', () => {
      const total = sharedRoundTotal(env)(args);
      expect(total).to.eql(0);
      expect(logger.error).to.have.been.calledOnce;
    });
  });
});

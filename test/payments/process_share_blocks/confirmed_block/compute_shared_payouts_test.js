const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../../chai-local');

const { computeSharedPayouts } = require(
  '../../../../src/payments/process_share_blocks/confirmed_block/compute_shared_payouts'
);

describe('computeSharedPayouts() - confirmedBlock support function', () => {
  const coinUtils = { satoshisToCoins: sinon.stub().returnsArg(0) };
  const round = { height: 3, blockHash: 'HASH' };
  const addr = 'AAAAAA';
  const totalShares = 100;
  const reward = 10.0;

  describe('for a worker who contributed 60% of the total shares', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const worker = { roundShares: 60, records: { [round.height]: {} } };
    const env = { logger, workers: { [addr]: worker }, coinUtils };
    const args = {
      shared: { [addr]: 1 }, round, totalShares, reward
    };

    it('sets a reward amount reduced by 60%', () => {
      computeSharedPayouts(env)(args);
      expect(worker.reward).to.eql(6);
    });
  });

  describe('for a worker who contributed > 100% of the total shares', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const worker = { roundShares: 101 };
    const env = { logger, workers: { [addr]: worker }, coinUtils };
    const args = {
      shared: { [addr]: 1 }, round, totalShares, reward
    };

    it('logs an error', () => {
      computeSharedPayouts(env)(args);
      expect(logger.error).to.have.been.calledOnce;
    });
  });
});

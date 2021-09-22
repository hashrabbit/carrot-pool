const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { updateRounds } = require(
  '../../../src/payments/update_rounds'
);

// Using the coin Daemon, determine which round blocks are valid for payout.
// Updates the reward amount for valid/complete blocks, flag invalid blocks
// with 'kicked' category. Then flag invalid blocks for possible deletion.
describe('updateRounds() - processPayments sub-process function', () => {
  const poolOptions = { addresses: { address: 'AAAAAA' } };
  const coinUtils = { coinsRound: (c) => c };

  describe('with 1 complete round to update', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const detail = { category: 'generate', address: 'AAAAAA', amount: 5 };
    const tx = {
      result: {
        confirmations: 10,
        details: [detail]
      }
    };
    const daemon = { rpcBatch: sinon.stub().resolves([tx]) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = {
      daemon, logger, poolOptions, coinUtils
    };

    it('updates the round reward', async () => {
      await updateRounds(env)([round]);
      expect(round.reward).to.eql(5);
    });
  });
});

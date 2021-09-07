const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient } = require('../../helpers');

const { moveManualRounds } = require(
  '../../../src/payments/process_share_blocks/move_manual_rounds'
);

describe('moveManualRounds() - processShareBlocks pipeline function', () => {
  const client = createClient();
  const promised = promisedClient();
  const coin = 'carrot';

  after(() => { client.quit(); });

  describe('with a pending manual round', () => {
    const rounds = [{ height: 111, serialized: 'round_1' }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };

    beforeEach(async () => {
      await promised.flushall();
      await promised.sadd(`${coin}:blocks:pending`, rounds[0].serialized);
    });

    it('moves the round to the "manual" location', async () => {
      await moveManualRounds(env)(rounds);
      const moved = await promised.smembers(`${coin}:blocks:manual`);
      expect(moved).to.eql(['round_1']);
      expect(logger.error).to.have.been.calledOnce;
    });
  });
});

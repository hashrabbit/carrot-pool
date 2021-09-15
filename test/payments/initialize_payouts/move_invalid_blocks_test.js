const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient } = require('../../helpers');

const { moveInvalidBlocks } = require(
  '../../../src/payments/initialize_payouts/move_invalid_blocks'
);

describe('moveInvalidBlocks() - initializePayouts pipeline function', () => {
  const client = createClient();
  const promised = promisedClient();
  const coin = 'carrot';

  after(() => { client.quit(); });

  beforeEach(async () => {
    await promised.flushall();
  });

  describe('with an invalid block', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };
    const pending = { worker: 'AAAAAA' };
    const json = JSON.stringify(pending);

    beforeEach(async () => {
      await promised.sadd(`${coin}:blocks:pending`, json);
    });

    it('moves the blocks:pending entry to blocks:duplicate', async () => {
      await moveInvalidBlocks(env)([json]);
      const dups = await promised.smembers(`${coin}:blocks:duplicate`);
      expect(dups).to.eql([json]);
    });
  });
});

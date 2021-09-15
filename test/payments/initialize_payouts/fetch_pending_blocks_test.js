const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient } = require('../../helpers');

const { fetchPendingBlocks } = require(
  '../../../src/payments/initialize_payouts/fetch_pending_blocks'
);

describe('fetchPendingBlocks() - initializePayouts pipeline function', () => {
  const client = createClient();
  const promised = promisedClient();
  const coin = 'carrot';

  after(() => { client.quit(); });

  beforeEach(async () => {
    await promised.flushall();
  });

  describe('with 0 pending blocks', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };

    it('returns an empty array of rounds', async () => {
      const rounds = await fetchPendingBlocks(env);
      expect(rounds).to.eql([]);
    });
  });

  describe('with 1 pending block', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };
    const pending = { worker: 'AAAAAA' };
    const json = JSON.stringify(pending);

    beforeEach(async () => {
      await promised.sadd(`${coin}:blocks:pending`, json);
    });

    it('returns the correct rounds array', async () => {
      const rounds = await fetchPendingBlocks(env);
      expect(rounds.length).to.eql(1);
      expect(rounds[0]).to.eql({ workerAddress: 'AAAAAA', serialized: json });
    });
  });
});

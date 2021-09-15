const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient } = require('../../helpers');

const { fetchUnpaidWorkers } = require(
  '../../../src/payments/initialize_payouts/fetch_unpaid_workers'
);

describe('fetchUnpaidWorkers() - initializePayouts pipeline function', () => {
  const client = createClient();
  const promised = promisedClient();
  const coin = 'carrot';
  const coinsToSatoshies = (coins) => coins;

  after(() => { client.quit(); });

  beforeEach(async () => {
    await promised.flushall();
  });

  describe('with 0 unpaid workers', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client, logger, coinUtils: { coinsToSatoshies }
    };

    it('returns an empty set of workers', async () => {
      const workers = await fetchUnpaidWorkers(env);
      expect(workers).to.eql({});
    });
  });

  describe('with 1 unpaid worker', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client, logger, coinUtils: { coinsToSatoshies }
    };
    const unpaid = ['addr', '1.111'];

    beforeEach(async () => {
      await promised.hincrbyfloat(`${coin}:payments:unpaid`, ...unpaid);
    });

    it('returns 1 worker object, with the correct balance', async () => {
      const workers = await fetchUnpaidWorkers(env);
      expect(workers).to.eql({ addr: { balance: 1.111 } });
    });
  });
});

const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient } = require('../../helpers');

const { initializePayouts } = require('../../../src/payments/initialize_payouts');

describe('initializePayouts() - processPayments pipeline function', () => {
  const client = createClient();
  const promised = promisedClient();
  const daemon = { rpcBatch: sinon.stub().resolves([]) };
  const logger = { error: sinon.stub().returnsArg(0) };
  const coinsToSatoshies = (coins) => coins;
  const coin = 'carrot';
  const env = {
    coin, client, daemon, logger, coinUtils: { coinsToSatoshies }
  };

  after(() => { client.quit(); });

  describe('with 1 unpaid, 1 pending, and no duplicates', () => {
    const address = 'AAAAAA';
    const unpaid = [address, '1.111'];
    const pending = { height: 1, worker: address };
    const json = JSON.stringify(pending);

    beforeEach(async () => {
      await promised.flushall();
      await promised.hincrbyfloat(`${coin}:payments:unpaid`, ...unpaid);
      await promised.sadd(`${coin}:blocks:pending`, json);
    });

    it('retuns the correct workers and rounds', async () => {
      const { workers, rounds } = await initializePayouts(env);
      expect(workers[address].balance).to.eql(1.111);
      expect(rounds.length).to.eql(1);
      expect(rounds[0].workerAddress).to.eql(address);
      expect(rounds[0].duplicate).to.eql(false);
    });
  });
});

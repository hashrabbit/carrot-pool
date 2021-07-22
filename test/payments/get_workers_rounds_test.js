const { promisify } = require('util');
const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { createClient } = require('../helpers');

const { getWorkersRounds } = require('../../src/payments/get_workers_rounds');

describe('getWorkersRounds() - processPayments pipeline function', () => {
  const client = createClient();
  const sadd = promisify(client.sadd).bind(client);
  const logger = { error: sinon.stub().returnsArg(0) };
  const invalidateDups = sinon.stub().resolves(true);
  const coinsToSatoshies = (coins) => coins;
  const coin = 'carrot';
  const address = 'AAAAAA';
  const env = {
    coin, client, logger, coinUtils: { coinsToSatoshies }, invalidateDups
  };

  beforeEach(() => {
    client.flushall(() => {});
    client.hincrbyfloat(`${coin}:payments:unpaid`, address, 0.111);
  });

  after(() => { client.quit(); });

  describe('when there are no duplicate blocks', () => {
    const blocks = [
      JSON.stringify({ height: 1, worker: address })
    ];

    it('retuns the correct workers and rounds', () => {
      sadd(`${coin}:blocks:pending`, ...blocks).then(() => {});
      return getWorkersRounds(env)
        .then(({ workers, rounds }) => {
          expect(Object.keys(workers)).to.eql([address]);
          expect(rounds.length).to.eql(1);
          expect(rounds[0].workerAddress).to.eql(address);
        });
    });
  });

  describe('when there is a duplicate block', () => {
    const blocks = [
      JSON.stringify({ height: 1, blockHash: 0 }),
      JSON.stringify({ height: 1, blockHash: 1 })
    ];

    it('retuns rounds with all "duplicate" blocks removed', () => {
      sadd(`${coin}:blocks:pending`, ...blocks).then(() => {});
      return getWorkersRounds(env)
        .then(({ rounds }) => {
          // Should all duplicate rounds be removed?
          expect(rounds.length).to.eql(0);
        });
    });
  });
});

const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient, promisedClient, metricCoinInfo } = require('../../helpers');

const { CoinUtils } = require('../../../src/payments/coin_utils');
const { processShareBlocks } = require(
  '../../../src/payments/process_share_blocks/index'
);

// Integration test to ensure we're coordinating all of the module's sub-functions
// correctly. Due to the amount of setup, and the sub-function tests, we're only
// testing a single happy-path scenario.
describe('processShareBlocks() - A processPayments promise chain function', () => {
  const client = createClient();
  const promised = promisedClient();
  const coin = 'carrot';
  const poolOptions = {
    coin: { name: coin, txfee: 0.0004 },
    paymentProcessing: { minConf: 3 }
  };
  const coinUtils = new CoinUtils(metricCoinInfo);
  const logger = {
    error: sinon.stub().returnsArg(0),
    warning: sinon.stub().returnsArg(0),
    special: sinon.stub().returnsArg(0)
  };

  after(() => { client.quit(); });

  describe('for a confirmed round, with 1 solo miner, that can be paid', () => {
    const height = 111;
    const addr = 'AAAAAA';
    const rounds = [{
      height, category: 'generate', workerAddress: addr, reward: 0.6, soloMined: true
    }];
    const workers = { [addr]: { balance: 3 } };
    const shareJSON = JSON.stringify({ time: height, worker: addr, soloMined: true });
    const unspent = { address: addr, amount: 1.5 };
    const data = { responses: [unspent] };
    const daemon = { rpcCmd: sinon.stub().resolves([data]) };

    const env = {
      coin, client, logger, poolOptions, coinUtils, daemon
    };

    beforeEach(async () => {
      await promised.flushall();
      await promised.hincrbyfloat(`${coin}:times:times${height}`, addr, 0.111);
      await promised.hincrby(`${coin}:shares:round${height}`, shareJSON, 101);
    });

    it('computes the reward for the worker', async () => {
      await processShareBlocks(env)({ workers, rounds });
      expect(workers[addr].reward).to.eql(6);
    });
  });
});

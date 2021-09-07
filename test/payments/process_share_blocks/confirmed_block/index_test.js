const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../../chai-local');

const { CoinUtils } = require('../../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../../helpers');
const { confirmedBlock } = require(
  '../../../../src/payments/process_share_blocks/confirmed_block'
);

// Integation tests to verify that confirmed_block/index collaborates with its
// utility functions properly.
describe('confirmedBlock() - prepareRounds category function', () => {
  const feeSatoshi = 1;
  const coinUtils = new CoinUtils(metricCoinInfo);
  const reward = 0.5;
  const addr = 'AAAAAA';

  describe('for a solo round, with 1 worker', () => {
    const round = {
      soloMined: true, workerAddress: addr, reward, height: 1
    };
    const solo = { [addr]: 1 };
    const workers = { [addr]: {} };
    const env = { coinUtils, feeSatoshi };
    const args = { workers, round, solo };

    it('correctly updates the worker object', () => {
      confirmedBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(1);
      expect(workers[addr].reward).to.eql(4);
    });
  });

  describe('for a shared round, with 1 worker', () => {
    const round = { reward: 0.5, height: 1 };
    const shared = { [addr]: 10 };
    const workers = { [addr]: {} };
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      logger, workers, coinUtils, feeSatoshi
    };
    const args = {
      round, shared, times: {}, maxTime: 1
    };

    it('correctly updates the worker object', () => {
      confirmedBlock(env)(args);
      expect(workers[addr].reward).to.eql(4);
      expect(workers[addr].records[1].amounts).to.eql(0.4);
    });
  });
});

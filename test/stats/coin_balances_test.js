const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { createClient } = require('../helpers');

const { coinBalances } = require('../../src/stats/coin_balances');

describe('coinBalances() -- calculate recorded balances for an address', () => {
  const client = createClient();
  const coin = 'carrot';
  const logger = { error: sinon.stub().returnsArg(0) };
  const address = 'AABBCCDD';

  after(() => { client.quit(); });

  describe('with multiple entries for "balances" key', () => {
    beforeEach(() => {
      client.flushall(() => {});
      client.hincrbyfloat(`${coin}:payments:balances`, address, 0.111);
      client.hincrbyfloat(`${coin}:payments:immature`, address, 0);
      client.hincrbyfloat(`${coin}:payments:payouts`, address, 0);
      client.hincrbyfloat(`${coin}:payments:unpaid`, address, 0);
      client.hincrbyfloat(`${coin}:payments:balances`, `${address}.foo`, 0.222);
    });

    it('retuns all balances for the address', async () => {
      const result = await coinBalances({ client, logger, coin })(address);
      expect(result.totalBalance).to.eql(0.333);
    });
  });
});

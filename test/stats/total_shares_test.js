const { describe, it, beforeEach, after } = require('mocha');

const { expect } = require('../chai-local');
const { createClient, logger } = require('../helpers');

const { totalShares } = require('../../src/stats/total_shares');

describe('totalShares() -- calculate total shares for an address', () => {
  const client = createClient();
  const coin = 'carrot';
  const address = 'AABBCCDD';
  const redisKey = `${coin}:shares:roundCurrent`;

  after(() => { client.quit(); });

  describe('with multiple entries under "roundCurrent" key', () => {
    beforeEach(() => {
      client.flushall(() => {});
      client.hincrbyfloat(redisKey, address, 0.111);
      client.hincrbyfloat(redisKey, `${address}.foo`, 0.222);
    });

    it('retuns share total associated with address', async () => {
      const total = await totalShares({ client, logger, coin })(address);
      expect(total).to.eql(0.333);
    });
  });
});

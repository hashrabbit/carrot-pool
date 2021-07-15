const { describe, it, after, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient } = require('../../helpers');

const { fetchRawStats } = require('../../../src/stats/coin_stats/fetch_raw_stats');

describe('fetchRawStats()', () => {
  const coin = 'coin';
  const client = createClient();
  const statsConfig = { hashrateWindow: 60000 };
  const env = { coin, client, statsConfig };

  after(() => { client.quit(); });

  describe('with 2 entries in the "blocks:pending" table', () => {
    const logger = { error: sinon.stub().returnsArg(0) };

    beforeEach(() => {
      client.flushall(() => {});
      client.sadd(`${coin}:blocks:pending`, [111, 222], () => {});
    });

    it('retuns a results object with no data', async () => {
      const result = await fetchRawStats({ ...env, logger });

      expect(result.pendingCount).to.eql(2);
      expect(result.pendingBlocks[0]).to.eql('111');
    });
  });
});

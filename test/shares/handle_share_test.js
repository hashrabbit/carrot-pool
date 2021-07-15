const { describe, it, beforeEach, afterEach } = require('mocha');

const { expect } = require('../chai-local');
const { createClient, logger } = require('../helpers');

const { promiseCmd } = require('../../src/utils/promised_redis');
const { handleShare } = require('../../src/shares/handle_share');

describe('handleShare() - handles the processing of shares sent by stratum', () => {
  const coin = 'coin';
  const poolConfig = { ports: {} };
  const isCluster = false;
  const client = createClient();
  const env = {
    client, coin, poolConfig, logger, isCluster
  };

  beforeEach(() => { client.flushall(); });
  afterEach(() => { client.quit(); });

  describe('when processing a valid share, for a valid block', () => {
    const key = ['coin:statistics:basic'];
    const isValidShare = true;
    const isValidBlock = true;
    const shareData = {
      worker: 'AAAAAA', difficulty: 0.5, height: 1, port: 0
    };
    const args = { isValidBlock, isValidShare, shareData };

    it('persists the correct share and block-related values', async () => {
      const result = await handleShare(env)(args);
      expect(result).to.eql(true);
      const hgetAll = promiseCmd('hgetall')({ client, logger });
      const basicStats = await hgetAll({ args: key });
      expect(basicStats.validShares).to.eql('1');
      expect(basicStats.validBlocks).to.eql('1');
    });
  });
});

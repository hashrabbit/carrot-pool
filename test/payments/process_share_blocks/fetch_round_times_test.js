const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient } = require('../../helpers');

const { fetchRoundTimes } = require(
  '../../../src/payments/process_share_blocks/fetch_round_times'
);

describe('fetchRoundTimes() - processShareBlocks pipeline function', () => {
  const client = createClient();
  const coin = 'carrot';
  const addrs = ['AAAAAA', 'BBBBBB'];

  after(() => { client.quit(); });

  describe('with multiple round times entries', () => {
    const rounds = [{ height: 111 }, { height: 112 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };

    beforeEach(() => {
      client.flushall(() => {});
      client.hincrbyfloat(`${coin}:times:times111`, addrs[0], 0.111);
      client.hincrbyfloat(`${coin}:times:times111`, addrs[1], 0.222);
      client.hincrbyfloat(`${coin}:times:times112`, addrs[1], 0.333);
    });

    it('retuns the parsed times for the round addresses', async () => {
      const times = await fetchRoundTimes(env)(rounds);
      expect(times.length).to.eql(2);
      expect(times[0].AAAAAA).to.eql(0.111);
    });
  });

  describe('with an invalid round time entry', () => {
    const rounds = [{ height: 111 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client, logger, rounds
    };

    beforeEach(() => client.flushall(() => {}));

    it('throws an "Invalid round times" error', () => {
      expect(fetchRoundTimes(env)(rounds)).to.be.rejectedWith(Error, /Invalid round/);
    });
  });
});

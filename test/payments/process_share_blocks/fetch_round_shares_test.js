const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient } = require('../../helpers');

const { fetchRoundShares } = require(
  '../../../src/payments/process_share_blocks/fetch_round_shares'
);

describe('fetchRoundShares() - processShareBlocks pipeline function', () => {
  const client = createClient();
  const coin = 'carrot';

  after(() => { client.quit(); });

  describe('for a round with 2 shares, 1 that is soloMined', () => {
    const rounds = [{ height: 111 }];
    const shares = [
      JSON.stringify({ time: 111, worker: 'AAAAAA' }),
      JSON.stringify({ time: 222, worker: 'BBBBBB', soloMined: true }),
    ];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };

    beforeEach(() => {
      client.flushall(() => {});
      client.hincrby(`${coin}:shares:round111`, shares[0], 101);
      client.hincrby(`${coin}:shares:round111`, shares[1], 222);
      client.hincrby(`${coin}:shares:round112`, shares[2], 333);
    });

    it('retuns the solo and shared lists', () => (
      fetchRoundShares(env)(rounds)
        .then(({ solo, shared }) => {
          expect(shared.length).to.eql(1);
          expect(Object.keys(solo[0])).to.eql(['BBBBBB']);
        })
    ));
  });

  describe('for a round with 0 shares', () => {
    const rounds = [{ height: 111 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { coin, client, logger };

    beforeEach(() => client.flushall(() => {}));

    it('throws an "Invalid round shares" error', () => {
      expect(fetchRoundShares(env)(rounds))
        .to.be.rejectedWith(Error, /Invalid round shares/);
    });
  });
});

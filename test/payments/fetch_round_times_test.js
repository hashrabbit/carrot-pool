const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { createClient } = require('../helpers');

const { fetchRoundTimes } = require('../../src/payments/fetch_round_times');

describe('fetchRoundTimes() - processShareBlocks pipeline function', () => {
  const client = createClient();
  const coin = 'carrot';
  const addrs = ['AAAAAA', 'BBBBBB'];

  after(() => { client.quit(); });

  describe('for a round with 2 time entries', () => {
    const rounds = [{ height: 111 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client, logger, rounds
    };

    beforeEach(() => {
      client.flushall(() => {});
      client.hincrbyfloat(`${coin}:times:times111`, addrs[0], 0.111);
      client.hincrbyfloat(`${coin}:times:times111`, addrs[1], 0.222);
    });

    it('retuns the parsed times for the round addresses', () => (
      fetchRoundTimes(env)
        .then(({ times }) => {
          expect(times.length).to.eql(1);
        })
    ));
  });

  describe('for a round with 0 time entries', () => {
    const rounds = [{ height: 111 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client, logger, rounds
    };

    beforeEach(() => client.flushall(() => {}));

    it('throws an "Invalid round times" error', () => {
      expect(fetchRoundTimes(env)).to.be.rejectedWith(Error, /Invalid round/);
    });
  });

  describe('when retrieving round times throws an error', () => {
    const error = new Error('Test failed');
    const multi = () => ({ exec: (callback) => callback(error) });
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      coin, client: { multi }, logger, rounds: []
    };
    const errPat = /Error retrieving round times/;

    beforeEach(() => client.flushall(() => {}));

    it('throws an "Error retrieving round times" error', () => {
      expect(fetchRoundTimes(env)).to.be.rejectedWith(Error, errPat);
    });
  });
});

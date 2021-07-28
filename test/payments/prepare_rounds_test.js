const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { createClient } = require('../helpers');

const { prepareRounds } = require('../../src/payments/prepare_rounds');

describe('prepareRounds() - processShareBlocks pipeline function', () => {
  const client = createClient();
  const coin = 'carrot';
  const objectSize = (obj) => Object.keys(obj).length;
  const immatureStub = sinon.stub().returnsArg(0);
  const confirmedStub = sinon.stub().returnsArg(0);
  const immatureBlock = () => immatureStub;
  const confirmedBlock = () => confirmedStub;

  after(() => { client.quit(); });

  describe('for a single, "immature" round, that can be auto-payed', () => {
    const rounds = [{ height: 111, category: 'immature' }];
    const solo = [[1]];
    const shared = [[]];
    const times = [{ AAAAAA: 0 }];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      client, coin, objectSize, immatureBlock, confirmedBlock, logger, rounds
    };
    const args = { solo, shared, times };

    beforeEach(() => client.flushall(() => {}));

    it('only delegates to round to immatureBlock', () => (
      prepareRounds(env, immatureBlock, confirmedBlock)(args)
        .then((manualRounds) => {
          expect(manualRounds).to.eql(0);
          expect(immatureStub).to.have.callCount(1);
          expect(confirmedStub).to.have.callCount(0);
        })
    ));
  });

  describe('for a single round, needing manual payout', () => {
    const rounds = [{ height: 111, serialized: 'round_1' }];
    const solo = [[]];
    const shared = [[]];
    const times = [];
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      client, coin, objectSize, immatureBlock, confirmedBlock, logger, rounds
    };
    const args = { solo, shared, times };

    beforeEach(() => {
      client.flushall(() => {});
      client.sadd(`${coin}:blocks:pending`, rounds[0].serialized);
    });

    it('sets the round for manual payout', () => (
      prepareRounds(env, immatureBlock, confirmedBlock)(args)
        .then((manualRounds) => {
          expect(manualRounds).to.eql(1);
          expect(logger.error).to.have.callCount(1);
        })
    ));
  });
});

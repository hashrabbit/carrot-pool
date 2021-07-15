const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { checkPaymentFunds } = require('../../src/payments/check_payment_funds');

describe('checkPaymentFunds() - processShareBlocks pipeline function', () => {
  const balance = 1;
  const minConfPayout = 0;
  const satoshisToCoins = sinon.stub().returnsArg(0);

  describe('when listUnspent resolves with a balance', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { logger, satoshisToCoins, minConfPayout };
    const listUnspent = () => sinon.stub().resolves(balance);

    describe('with balance > owed and owed > 0', () => {
      const owed = 1;
      const rounds = [{ category: 'generate' }];

      it('only passes through the additional args', async () => {
        const checkFunds = checkPaymentFunds({ ...env, rounds }, { listUnspent });
        const result = await checkFunds({ owed, times: [] });
        expect(Object.keys(result)).to.eql(['times']);
        expect(logger.error.called).to.eql(false);
        expect(rounds[0].category).to.eql('generate');
      });
    });

    describe('with balance > owed and owed <= 0', () => {
      const owed = 0;
      const rounds = [{ category: 'generate' }];

      it('sets all "generated" rounds to "immature"', async () => {
        const checkFunds = checkPaymentFunds({ ...env, rounds }, { listUnspent });
        await checkFunds({ owed });
        expect(rounds[0].category).to.eql('immature');
      });
    });

    describe('with balance < owed', () => {
      const owed = 2;
      const rounds = [];

      it('logs an Insufficient Funds error message', async () => {
        const checkFunds = checkPaymentFunds({ ...env, rounds }, { listUnspent });
        await checkFunds({ owed });
        expect(logger.error).to.have.callCount(1);
      });
    });
  });

  describe('when listUnspent rejects with an error', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { logger, satoshisToCoins, minConfPayout };
    const error = new Error('Test failed');
    const listUnspent = () => sinon.stub().rejects(error);
    const owed = 1;
    const rounds = [];

    it('catches the error and logs it', async () => {
      const checkFunds = checkPaymentFunds({ ...env, rounds }, { listUnspent });
      try {
        await checkFunds({ owed });
      } catch (err) {
        expect(err).to.eql(error);
        expect(logger.error).to.have.callCount(1);
      }
    });
  });
});

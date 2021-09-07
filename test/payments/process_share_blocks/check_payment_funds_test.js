const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _checkPaymentFunds } = require(
  '../../../src/payments/process_share_blocks/check_payment_funds'
);

describe('checkPaymentFunds() - processShareBlocks pipeline function', () => {
  const balance = 2;
  const feeSatoshi = 0;
  const coinsToSatoshies = sinon.stub().returnsArg(0);
  const satoshisToCoins = sinon.stub().returnsArg(0);
  const coinUtils = { coinsToSatoshies, satoshisToCoins };

  describe('when listUnspent returns a balance', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { logger, coinUtils, feeSatoshi };
    const listUnspent = () => sinon.stub().resolves(balance);
    const checkPaymentFunds = _checkPaymentFunds({ listUnspent });

    describe('with balance > owed and owed > 0', () => {
      const rounds = [{ category: 'generate', reward: 1 }];
      const workers = {};

      it('does not change round.category or send error log message', async () => {
        await checkPaymentFunds(env)({ rounds, workers });
        expect(logger.error.called).to.eql(false);
        expect(rounds[0].category).to.eql('generate');
      });
    });

    describe('with balance > owed and owed <= 0', () => {
      const rounds = [{ category: 'generate', reward: 0 }];
      const workers = {};

      it('sets all "generated" rounds to "immature"', async () => {
        await checkPaymentFunds(env)({ rounds, workers });
        expect(rounds[0].category).to.eql('immature');
      });
    });

    describe('with balance < owed', () => {
      const rounds = [];
      const workers = { AAAAAA: { balance: 3 } };

      it('logs an Insufficient Funds error message', async () => {
        await checkPaymentFunds(env)({ rounds, workers });
        expect(logger.error).to.have.callCount(1);
      });
    });
  });

  describe('when listUnspent fails', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = { logger, coinUtils, feeSatoshi };
    const error = new Error('Test failed');
    const listUnspent = () => sinon.stub().rejects(error);
    const checkPaymentFunds = _checkPaymentFunds({ listUnspent });
    const rounds = [];
    const workers = {};

    it('catches the error and logs it', async () => {
      await checkPaymentFunds(env)({ rounds, workers })
        .catch((err) => {
          expect(err).to.eql(error);
          expect(logger.error).to.have.callCount(1);
        });
    });
  });
});

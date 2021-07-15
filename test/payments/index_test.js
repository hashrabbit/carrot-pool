const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _poolPayments } = require('../../src/payments');

describe('PoolPayments() - starts payment processing background timers', () => {
  const poolConfig = {
    coin: { name: 'coin' },
    paymentProcessing: { daemon: {}, paymentInterval: 0 }
  };
  const portalConfig = { redis: {} };

  describe('when initPayments returns true', () => {
    const initPayments = sinon.stub().resolves(true);
    const PoolPayments = _poolPayments({ initPayments });
    const logger = { debug: sinon.stub() };
    const baseLogger = { cached: () => logger };
    const env = { baseLogger, poolConfig, portalConfig };

    it('logs the payment processing started message', async () => {
      const poolPayments = new PoolPayments(env);
      await poolPayments.start();
      expect(logger.debug).to.have.been.calledOnce;
    });
  });

  describe('when initPayments returns false', () => {
    const initPayments = sinon.stub().resolves(false);
    const PoolPayments = _poolPayments({ initPayments });
    const logger = { debug: sinon.stub() };
    const baseLogger = { cached: () => logger };
    const env = { baseLogger, poolConfig, portalConfig };

    it('does not log payment processing started message', async () => {
      const poolPayments = new PoolPayments(env);
      await poolPayments.start();
      expect(logger.debug).not.to.been.called;
    });
  });
});

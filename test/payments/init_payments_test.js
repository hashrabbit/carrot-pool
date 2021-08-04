const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _initPayments } = require('../../src/payments/init_payments');

describe('initPayments() - start the async payment processing timers', () => {
  const client = sinon.stub();
  const Redis = function () { return { client }; };
  const coinUtils = sinon.stub().returns(0);
  const CoinUtils = function () { return coinUtils; };
  const startPayments = sinon.stub();
  const deps = { Redis, CoinUtils, startPayments };

  const logger = { warning: sinon.stub() };
  const poolConfig = {
    coin: { name: 'coin' },
    addresses: { address: 'AAAAAA' },
    satoshiPrecision: 1,
    paymentProcessing: { daemon: {}, minimumPayment: 0 }
  };
  const portalConfig = { redis: {} };
  const env = { logger, poolConfig, portalConfig };

  describe('when the pool address is valid', () => {
    const daemon = { isValidAddress: sinon.stub().resolves(true) };
    const Daemon = function () { return daemon; };
    const initPayments = _initPayments({ ...deps, Daemon });
    const startEnv = {
      logger, coin: 'coin', client, daemon, coinUtils, poolOptions: poolConfig
    };

    it('starts payment processing and resolves to true', () => (
      expect(initPayments(env)).to.eventually.eql(true).then(() => (
        expect(startPayments).to.have.been.calledOnceWith(startEnv)
      ))
    ));
  });

  describe('when the pool address is invalid', () => {
    const daemon = { isValidAddress: sinon.stub().resolves(false) };
    const Daemon = function () { return daemon; };
    const initPayments = _initPayments({ ...deps, Daemon });

    it('warns the user, but continues payment processing', () => (
      expect(initPayments(env)).to.eventually.eql(true).then(() => (
        expect(logger.warning).to.have.been.calledOnce
      ))
    ));
  });
});

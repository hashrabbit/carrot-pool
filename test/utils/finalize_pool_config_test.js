const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _finalizePoolConfig } = require('../../src/utils/finalize_pool_config');

describe('finalizePoolConfig -- validate and finish pool connfiguration', () => {
  describe('when the supplied algorithm is supported', () => {
    const algo = 'test';
    const algorithms = { [algo]: true };
    const finalizePoolConfig = _finalizePoolConfig({ algorithms });

    describe('with no configured coin nets', () => {
      const baseLogger = { cached: () => {} };
      const poolConfig = { coin: { algorithm: algo } };
      const env = { baseLogger, poolConfig };

      it('returns with no poolConfig changes', () => {
        finalizePoolConfig(env);
        expect(Object.keys(poolConfig.coin)).to.eql(['algorithm']);
      });
    });

    describe('with a testnet connfiguration', () => {
      const baseLogger = { cached: () => {} };
      const pubKeyHash = '19';
      const poolConfig = {
        coin: {
          algorithm: algo,
          testnet: { pubKeyHash, scriptHash: 'C4', bip32: { public: '043587CF' } }
        }
      };
      const env = { baseLogger, poolConfig };

      it('replaces the testnet settings with their converted values', () => {
        finalizePoolConfig(env);
        expect(poolConfig.coin.testnet.pubKeyHash).not.to.eql(pubKeyHash);
      });
    });
  });

  describe('when the supplied algorithm is not supported', () => {
    const algo = 'test';
    const algorithms = {};
    const finalizePoolConfig = _finalizePoolConfig({ algorithms });
    const logger = { error: sinon.spy() };
    const baseLogger = { cached: () => logger };
    const poolConfig = { coin: { algorithm: algo } };
    const env = { baseLogger, poolConfig };

    it('logs an errpr and throws', () => {
      const finalizeFunc = () => finalizePoolConfig(env);
      expect(finalizeFunc).to.throw('Unsupported algorithm');
      expect(logger.error).to.have.been.calledOnce;
    });
  });
});

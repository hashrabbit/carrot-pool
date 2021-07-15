const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _spawnPayments } = require('../../src/startup/spawn_payments');

describe('spawnPayments -- forks a worker process for payemt processing', () => {
  const logger = { warning: sinon.spy() };
  const baseLogger = { cached: () => logger };
  const portalConfig = {};

  describe('when pool payments are enabled', () => {
    const poolConfig = { enabled: true, paymentProcessing: { enabled: true } };

    describe('when called from the primary process', () => {
      const cluster = { isWorker: false };
      const spawnSpy = sinon.stub().returns({});
      const spawnProcess = () => spawnSpy;
      const spawnPayments = _spawnPayments({ cluster, spawnProcess });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('spawns a sub-process with the correct args', () => {
        spawnPayments(env);
        expect(spawnSpy.args[0][0]).to.include({ type: 'payments' });
      });
    });

    describe('when called from the "payments" sub-process', () => {
      const cluster = { isWorker: true };
      const server = { start: sinon.stub() };
      const PoolPayments = function () { return server; };
      const spawnPayments = _spawnPayments({ cluster, PoolPayments });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('constructs a PoolPayments instance and starts the listener', () => {
        const result = spawnPayments(env);
        expect(result).to.eql(false);
        expect(server.start).to.have.callCount(1);
      });
    });
  });

  describe('when pool payments are not enabled', () => {
    const poolConfig = { enabled: true, paymentProcessing: {} };

    describe('when called from the primary process', () => {
      const cluster = { isWorker: false };
      const spawnPayments = _spawnPayments({ cluster });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('logs a warning message and returns false', () => {
        const result = spawnPayments(env);
        expect(result).to.eql(false);
        expect(logger.warning).to.have.callCount(1);
      });
    });
  });
});

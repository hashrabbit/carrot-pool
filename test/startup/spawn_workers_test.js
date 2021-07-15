const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _spawnWorkers } = require('../../src/startup/spawn_workers');

describe('spawnWorkers -- forks multiple "worker" sub-processe listeners', () => {
  const logger = {
    error: sinon.spy(),
    debug: sinon.spy()
  };
  const baseLogger = { cached: () => logger };
  const portalConfig = {};

  describe('when daemon connections have been defined', () => {
    const poolConfig = { daemons: [true] };
    const utils = {
      workerForks: () => 2,
      messageHandler: () => {}
    };

    describe('when called from the primary process', () => {
      const cluster = { isWorker: false };
      const spawnSpy = sinon.stub().returns({});
      const spawnProcess = () => spawnSpy;
      const spawnWorkers = _spawnWorkers({ cluster, utils, spawnProcess });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('spawns multiple "worker" sub-process', () => {
        const result = spawnWorkers(env);
        expect(result.length).to.eql(2);
        expect(spawnSpy.args[1][0]).to.include({ type: 'worker' });
      });
    });

    describe('when called from a "worker" sub-process', () => {
      const cluster = { isWorker: true };
      const server = { start: sinon.stub() };
      const PoolWorker = function () { server.start(); return server; };
      const spawnWorkers = _spawnWorkers({ cluster, PoolWorker });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('constructs and starts a PoolWorker instance', () => {
        const result = spawnWorkers(env);
        expect(result).to.eql(false);
        expect(server.start).to.have.callCount(1);
      });
    });
  });

  describe('when daemon connections are not defined', () => {
    const poolConfig = { daemons: [] };

    describe('when called from the primary process', () => {
      const cluster = { isWorker: false };
      const spawnWorkers = _spawnWorkers({ cluster });
      const env = {
        cluster, baseLogger, poolConfig, portalConfig
      };

      it('logs a warning message and returns false', () => {
        const result = spawnWorkers(env);
        expect(result).to.eql(false);
        expect(logger.error).to.have.callCount(1);
      });
    });
  });
});

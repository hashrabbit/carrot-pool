const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _spawnAPI } = require('../../src/startup/spawn_api');

describe('spawnAPI -- forks a worker process for API requests', () => {
  const baseLogger = { cached: () => {} };
  const portalConfig = {};
  const poolConfig = {};

  describe('when called from the primary process', () => {
    const cluster = { isWorker: false };
    const spawnSpy = sinon.stub().returns({});
    const spawnProcess = () => spawnSpy;
    const spawnAPI = _spawnAPI({ spawnProcess });
    const env = {
      cluster, baseLogger, poolConfig, portalConfig
    };

    it('spawns a sub-process with the correct args', () => {
      spawnAPI(env);
      expect(spawnSpy.args[0][0]).to.include({ type: 'api' });
    });
  });

  describe('when called from the "api" spawned sub-process', () => {
    const cluster = { isWorker: true };
    const server = { listen: sinon.stub() };
    const PoolApi = function () { return server; };
    const spawnAPI = _spawnAPI({ PoolApi });
    const env = {
      cluster, baseLogger, poolConfig, portalConfig
    };

    it('constructs a PoolApi instance and starts the listener', () => {
      const result = spawnAPI(env);
      expect(result).to.eql(false);
      expect(server.listen).to.have.callCount(1);
    });
  });
});

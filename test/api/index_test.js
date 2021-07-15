const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { requireDeps } = require('../../src/utils/require_deps');
const { _defaultDeps, _PoolApi } = require('../../src/api/index');

describe('PoolApi -- express HTTP server for API', () => {
  const logger = {
    debug: sinon.stub().returnsArg(0),
    error: sinon.stub().returnsArg(0),
  };
  const baseLogger = { cached: () => logger };
  const getGlobalStats = sinon.stub().resolves(true);
  const PoolStats = function () { return { getGlobalStats }; };
  const v1 = () => sinon.stub();
  const deps = requireDeps(_defaultDeps);
  deps.PoolStats = PoolStats;
  deps.v1 = v1;
  const PoolApi = _PoolApi(deps);
  const poolConfig = {};

  describe('when constructed', () => {
    const portalConfig = {};
    const env = { baseLogger, portalConfig, poolConfig };

    it('configures the express app', () => {
      const poolApi = new PoolApi(env);
      expect(poolApi.app).to.have.property('mountpath', '/');
    });
  });

  describe('.listen()', () => {
    const portalConfig = {
      stats: { updateInterval: 1 },
      server: {}
    };

    describe('with a valid port', () => {
      portalConfig.server.port = 8080;
      // const env = { baseLogger, portalConfig, poolConfig };

      it('starts the getGlobalStats interval, and starts listening', () => {
        // Not sure how to test this, if necessary. Would like to verify that
        // the server and the interval starts up.
      });
    });

    describe('with an invalid port', () => {
      portalConfig.server.port = 80;
      // const env = { baseLogger, portalConfig, poolConfig };

      it('throws an error', () => {
        // Would like to verify that the `error` event is caught and the interval
        // is cleared.
      });
    });
  });
});

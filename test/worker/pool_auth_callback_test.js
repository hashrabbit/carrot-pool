const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const { expect } = require('../chai-local');

const { _poolAuthCallback } = require('../../src/worker/pool_auth_callback');

describe("poolAuthCallback - authenticating workers against the pool's daemon", () => {
  let logger;
  let env;
  let authStub;
  let authEnvStub;

  let ip;
  let port;
  let workerName;
  let password;
  let responseCallback;
  let poolAuthCallback;

  beforeEach(() => {
    logger = { debug: sinon.stub() };
    env = { logger, pool: {}, poolConfig: {} };
    authStub = sinon.stub().resolves(true);
    authEnvStub = sinon.stub().returns(authStub);

    ip = '<some IP>';
    port = '<some port>';
    workerName = '<some worker name>';
    password = '<some password>';
    responseCallback = sinon.stub();

    poolAuthCallback = _poolAuthCallback({ auth: authEnvStub });
  });

  describe('on auth', () => {
    it('passes the auth environment down', () => {
      const { logger: _, ...authEnv } = env;

      const promise = poolAuthCallback(env)(ip, port, workerName, password, responseCallback);
      return expect(promise).to.have.eventually.been.fulfilled.then(() => {
        expect(authEnvStub).to.have.been.calledWith(authEnv);
      });
    });

    describe('when the auth succeeds', () => {
      it('logs an authorized debug message', () => {
        const promise = poolAuthCallback(env)(ip, port, workerName, password, responseCallback);
        return expect(promise).to.have.eventually.been.fulfilled.then(() => {
          expect(logger.debug).to.have.been.calledWith(`Authorized ${workerName}:${password} [${ip}]`);
        });
      });

      it('calls the response callback with a success', () => {
        const promise = poolAuthCallback(env)(ip, port, workerName, password, responseCallback);
        return expect(promise).to.have.eventually.been.fulfilled.then(() => {
          expect(responseCallback).to.have.been.calledOnce;
          const { error, authorized, disconnect } = responseCallback.getCall(0).args[0];
          expect(error).to.eq(null);
          expect(authorized).to.eq(true);
          expect(disconnect).to.eq(false);
        });
      });
    });

    describe('when the auth fails', () => {
      beforeEach(() => {
        authStub.resolves(false);
      });

      it('logs an unauthorized debug message', () => {
        const promise = poolAuthCallback(env)(ip, port, workerName, password, responseCallback);
        return expect(promise).to.have.eventually.been.fulfilled.then(() => {
          expect(logger.debug).to.have.been.calledWith(`Unauthorized ${workerName}:${password} [${ip}]`);
        });
      });

      it('calls the response callback with a failure', () => {
        const promise = poolAuthCallback(env)(ip, port, workerName, password, responseCallback);
        return expect(promise).to.have.eventually.been.fulfilled.then(() => {
          expect(responseCallback).to.have.been.calledOnce;
          const { error, authorized, disconnect } = responseCallback.getCall(0).args[0];
          expect(error).to.eq(null);
          expect(authorized).to.eq(false);
          expect(disconnect).to.eq(false);
        });
      });
    });
  });
});

const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const { expect } = require('../chai-local');

const { _auth } = require('../../src/worker/auth');

describe('auth() - Check worker authentication', () => {
  const pool = { daemon: {} };
  const poolConfig = {};

  let daemonStub;
  let DaemonWrapperStub;
  let port;
  let workerName;
  let password;
  let auth;
  let env;

  beforeEach(() => {
    pool.daemon = {};
    daemonStub = { rpcCmd: sinon.stub() };
    DaemonWrapperStub = function (_daemon) { return daemonStub; };
    const deps = { DaemonWrapper: DaemonWrapperStub };
    auth = _auth(deps);

    env = {
      pool,
      poolConfig
    };

    port = '<some port>';
    workerName = '<some worker name>';
    password = '<some password>';
  });

  it('responds with a promise', () => {
    const result = auth(env)(port, workerName, password);
    expect(result).to.be.an.instanceOf(Promise);
  });

  describe('when no worker username validation is enabled', () => {
    beforeEach(() => {
      env.poolConfig = { validateWorkerUsername: false };
    });

    it('returns authorized', () => {
      const response = auth(env)(port, workerName, password);
      return expect(response).to.eventually.be.true;
    });
  });

  describe('when worker username validation is enabled', () => {
    beforeEach(() => {
      env.poolConfig = { validateWorkerUsername: true };
    });

    describe('with a workername of incorrect length', () => {
      describe('when the daemon confirms a valid worker name', () => {
        const validResponses = [{ response: { isvalid: true } }];
        beforeEach(() => {
          daemonStub.rpcCmd.returns(Promise.resolve(validResponses));
        });

        it('calls out to the daemon to validate the worker name', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.fulfilled.then(() => {
            expect(daemonStub.rpcCmd).to.have.been.calledOnce;
            const cmdArgs = daemonStub.rpcCmd.getCall(0).args;
            expect(cmdArgs).to.deep.equal(['validateaddress', [workerName]]);
          });
        });

        it('returns authorized', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.true;
        });
      });

      describe('when the daemon does not confirm a valid worker name', () => {
        const invalidResponses = [{ response: { isvalid: false } }];
        beforeEach(() => {
          daemonStub.rpcCmd.returns(Promise.resolve(invalidResponses));
        });

        it('calls out to the daemon to validate the worker name', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.fulfilled.then(() => {
            expect(daemonStub.rpcCmd).to.have.been.calledOnce;
            const cmdArgs = daemonStub.rpcCmd.getCall(0).args;
            expect(cmdArgs).to.deep.equal(['validateaddress', [workerName]]);
          });
        });

        it('returns unauthorized', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.false;
        });
      });
    });

    describe('with a workername of the right length', () => {
      describe('with characters being valid hex', () => {
        beforeEach(() => {
          workerName = '0123456789abcdef0123'.repeat(2);
        });

        it('returns authorized', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.true;
        });
      });

      describe('with characters not being valid hex', () => {
        beforeEach(() => {
          workerName = '0123456789abcdefg012'.repeat(2);
        });

        it('returns unauthorized', () => {
          const response = auth(env)(port, workerName, password);
          return expect(response).to.eventually.be.false;
        });
      });
    });
  });
});

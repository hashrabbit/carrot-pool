const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _poolStartup } = require('../../src/startup');

describe('poolStartup -- initializes pool services/sub-processes', () => {
  const startCnC = sinon.spy();

  describe('when called from the primary process', () => {
    const spawnAPI = sinon.spy();
    const spawnPayments = sinon.spy();
    const spawnWorkers = sinon.spy();
    const deps = {
      startCnC, spawnAPI, spawnPayments, spawnWorkers
    };
    const poolStartup = _poolStartup(deps);
    const cluster = { isWorker: false };

    it('starts all the services, with the correct args', () => {
      poolStartup({ cluster });
      expect(startCnC).to.have.been.calledOnceWith({ cluster });
      expect(spawnAPI).to.have.been.calledOnceWith({ cluster });
      expect(spawnPayments).to.have.been.calledOnceWith({ cluster });
      expect(spawnWorkers).to.have.been.calledOnceWith({ cluster });
    });
  });

  describe('when called from the "api" spawned sub-process', () => {
    const spawnAPI = sinon.spy();
    const spawnPayments = sinon.spy();
    const spawnWorkers = sinon.spy();
    const deps = {
      startCnC, spawnAPI, spawnPayments, spawnWorkers
    };
    const poolStartup = _poolStartup(deps);
    const env = { workerType: 'api' };
    const cluster = { isWorker: true, worker: { process: { env } } };

    it('hands off to the spawnAPI service', () => {
      poolStartup({ cluster });
      expect(spawnAPI).to.have.been.calledOnceWith({ cluster });
      expect(spawnPayments).not.to.have.been.called;
    });
  });
});

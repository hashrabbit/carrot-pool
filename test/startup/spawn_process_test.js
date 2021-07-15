const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { spawnProcess } = require('../../src/startup/spawn_process');

describe('spawnProcess -- forks a sub-process for service listeners', () => {
  const logger = { error: sinon.stub() };

  describe('when no additional events are supplied', () => {
    const worker = { on: sinon.stub() };
    // We stub the cluster dependency so we don't fork multiple CI runs.
    const cluster = { fork: sinon.stub().returns(worker) };
    const env = { cluster, logger };

    it('assigns the type and adds the "exit" event listener to the worker', () => {
      const result = spawnProcess(env)({ type: 'test' });
      expect(result.type).to.eql('test');
      expect(worker.on).to.have.been.calledOnceWith('exit');
    });
  });

  describe('when 1 additional event is supplied', () => {
    const events = { foo: () => {} };
    const worker = { on: sinon.stub() };
    const cluster = { fork: sinon.stub().returns(worker) };
    const env = { cluster, logger };

    it('adds the 2nd event listeners to the worker', () => {
      spawnProcess(env)({ type: 'test', events });
      expect(worker.on).to.have.callCount(2);
      expect(worker.on).to.have.been.calledWith('foo');
    });
  });
});

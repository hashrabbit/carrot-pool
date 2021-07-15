const { describe, it } = require('mocha');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const { expect } = require('../chai-local');

const { _startCnC } = require('../../src/startup/start_cnc');

const initEmitters = (cluster) => {
  const cnc = new EventEmitter();
  cnc.listen = () => {};
  const PoolCnC = function () { return cnc; };
  const startCnC = _startCnC({ cluster, PoolCnC });
  return [cnc, startCnC];
};

describe('startCnC -- launch CnC server and processes emitted events', () => {
  const portalConfig = { cliPort: 0 };

  describe('when receiving a "command" event', () => {
    const baseLogger = { cached: () => {} };

    describe('for a "reloadpool" command', () => {
      const reply = sinon.spy();
      const args = ['reloadpool', ['test'], null, reply];
      const worker = { send: sinon.spy() };
      const workers = { 1: worker };
      const [cnc, startCnC] = initEmitters({ workers });

      it('replies back with the coin name, after signaling all workers', () => {
        startCnC({ portalConfig, baseLogger });
        cnc.emit('command', ...args);
        expect(worker.send).to.have.been.calledOnce;
        expect(reply).to.have.been.calledOnceWith('reloaded pool test');
      });
    });

    describe('for an unknown command', () => {
      const reply = sinon.spy();
      const args = ['test', null, null, reply];
      const [cnc, startCnC] = initEmitters();

      it('replies with "unknown command"', () => {
        startCnC({ portalConfig, baseLogger });
        cnc.emit('command', ...args);
        expect(reply).to.have.been.calledOnceWith('unknown command: test');
      });
    });
  });

  describe('when receiving a debug-severity "log" event', () => {
    const [cnc, startCnC] = initEmitters();
    const logger = { debug: sinon.spy() };
    const baseLogger = { cached: () => logger };
    const msg = 'Debug severity log';

    it('replies with "unknown command"', () => {
      startCnC({ portalConfig, baseLogger });
      cnc.emit('log', 'debug', msg);
      expect(logger.debug).to.have.been.calledOnceWith(msg);
    });
  });
});

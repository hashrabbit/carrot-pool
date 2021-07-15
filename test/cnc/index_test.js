const { describe, it } = require('mocha');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const { expect } = require('../chai-local');

const { _poolCnC } = require('../../src/cnc');

// construct fresh copies of the server emittier and spy callbacks
const buildEmitters = () => {
  const server = new EventEmitter();
  const net = { createServer: () => server };
  const PoolCnC = _poolCnC({ net, EventEmitter });
  const logSpy = sinon.spy();
  const commandSpy = sinon.spy();
  const cnc = new PoolCnC();
  cnc.on('command', commandSpy);
  cnc.on('log', logSpy);
  return [server, commandSpy, logSpy];
};

describe('poolCnC -- the Command/Control server listener', () => {
  describe('when receving a complete JSON data payload', () => {
    describe('containing valid JSON', () => {
      const [server, commandSpy, logSpy] = buildEmitters();
      const socket = new EventEmitter();
      const json = JSON.stringify({ command: 'test' });

      it('parses the attributed and emits a "command" message', () => {
        server.emit('connection', socket);
        socket.emit('data', `${json}\n`);
        expect(commandSpy).to.have.been.calledOnce;
        expect(commandSpy.args[0][0]).to.eql('test');
        expect(logSpy).not.to.have.been.called;
      });
    });

    describe('containing invalid JSON', () => {
      const [server, commandSpy, logSpy] = buildEmitters();
      const socket = new EventEmitter();
      const json = 'command: test';

      it('fails to parse the JSON and emits an error log', () => {
        server.emit('connection', socket);
        socket.emit('data', `${json}\n`);
        expect(logSpy).to.have.callCount(1);
        expect(logSpy.args[0][0]).to.eql('error');
        expect(commandSpy).not.to.have.been.called;
      });
    });
  });

  describe('when receiving an incomplete JSON data payload', () => {
    const [server, commandSpy, logSpy] = buildEmitters();
    const socket = new EventEmitter();
    const json = JSON.stringify({ command: 'test' });

    it('waits for the payload to complete before emitting any events', () => {
      server.emit('connection', socket);
      socket.emit('data', json);
      expect(commandSpy).not.to.have.been.called;
      expect(logSpy).not.to.have.been.called;
    });
  });
});

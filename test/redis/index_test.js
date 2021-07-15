const { describe, it } = require('mocha');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const { expect } = require('../chai-local');
const { _redis } = require('../../src/redis');

describe('Redis() - Constuctor for client instances and event listeners', () => {
  const config = { host: 1, port: 2 };

  describe('when supplied a non-cluster connection config', () => {
    const clients = { standard: sinon.stub().returnsArg(0) };
    const Redis = _redis({ clients });

    it('initializes the correct client instance', () => {
      new Redis(config);
      expect(clients.standard).to.have.callCount(1);
    });
  });

  describe('when attaching events to the client instance', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const isValidVersion = () => sinon.stub().resolves(true);
    const clients = { standard: sinon.stub().returns(new EventEmitter()) };
    const Redis = _redis({ clients, isValidVersion });

    it('passes emitted events to the appropriate logger severity', () => {
      const instance = new Redis(config);
      instance.attachEvents(logger);
      instance.client.emit('error', '');
      expect(logger.error).to.have.callCount(1);
    });
  });
});

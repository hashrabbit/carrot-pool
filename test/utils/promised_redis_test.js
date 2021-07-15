const { describe, it, beforeEach, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { createClient } = require('../helpers');

const { promiseCmd, promiseExec } = require('../../src/utils/promised_redis');

describe('promiseCmd() - Redis generic command/promise wrapper', () => {
  describe('for a successful "hgetall" command', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const hash = { foo: 'bar' };
    const client = { hgetall: sinon.stub().callsArgWith(1, null, hash) };
    const hgetAll = promiseCmd('hgetall')({ client, logger });

    it('returns the hash at the specified key', async () => {
      const result = await hgetAll({ args: ['key'] });
      expect(Object.keys(result)).to.eql(['foo']);
    });
  });

  describe('for a failing "info" command', () => {
    const logger = { error: sinon.stub().returnsArg(0) };
    const client = { info: sinon.stub().callsArgWith(1, 'error') };
    const info = promiseCmd('info')({ client, logger });
    const fullName = 'info server';
    const failMsg = 'Info command failed';

    // Since we want to both verify the correct error message, and verify that
    // our logger is being called, we need to return the resolved/rejected
    // promise, with our expectations inside the catch() block.
    it('rejects the promise and logs the error message', () => {
      const promise = info({ args: ['server'], fullName, failMsg });
      return promise.catch((error) => {
        expect(error.toString()).to.have.string('Info command failed');
        expect(logger.error).to.have.callCount(1);
      });
    });
  });
});

describe('promiseExec() - Redis transaction processing', () => {
  const logger = { error: sinon.stub().returnsArg(0) };

  describe('when the transaction succeeds', () => {
    const client = createClient();
    const commands = [['incr', 'foo']];

    beforeEach(() => client.flushall());
    after(() => client.quit());

    it('returns with no error', () => {
      const promise = promiseExec({ client, logger })({ commands, failMsg: '' });
      expect(promise).to.eventually.deep.equal([1]);
    });
  });

  describe('when the transaction fails', () => {
    const exec = sinon.stub().throws('fetch error');
    const client = { multi: () => ({ exec }) };
    const failMsg = 'Test client error';

    it('logs, and re-throws, the error, including our failMsg', () => {
      const promise = promiseExec({ client, logger })({ commands: [], failMsg });
      expect(promise).to.be.rejectedWith(failMsg);
    });
  });
});

const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { listUnspent } = require('../../src/payments/list_unspent');

describe('listUnspet() - wraps daemon.cmd("listunspent") RPC call', () => {
  const coinsRound = sinon.stub().returnsArg(0);
  const coinsToSatoshies = sinon.stub().returnsArg(0);
  const notAddr = 'notAddr';

  describe('with no unspent transactions and displayBool is true', () => {
    const daemon = { rpcCmd: sinon.stub().resolves([0]) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = {
      daemon, logger, coinsRound, coinsToSatoshies
    };

    it('returns a balance of 0 an logs to the "special" severity', () => {
      const result = listUnspent(env)(null, notAddr, 1, true);
      return result.then((balance) => {
        expect(balance).to.eql(0);
        expect(logger.special).to.have.callCount(1);
        expect(logger.error).to.have.callCount(0);
      });
    });
  });

  describe('with 1 unspent transaction', () => {
    const unspent = { address: 'AAAA', amount: 1.5 };
    const response = { response: [unspent] };
    const daemon = { rpcCmd: sinon.stub().resolves([response]) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = {
      daemon, logger, coinsRound, coinsToSatoshies
    };

    it('returns the total balance and does not log', () => {
      const result = listUnspent(env)(null, notAddr, 1);
      return result.then((balance) => {
        expect(balance).to.eql(1.5);
        expect(logger.special).to.have.callCount(0);
        expect(logger.error).to.have.callCount(0);
      });
    });
  });

  describe('when the RPC call fails', () => {
    const error = new Error('Test failed');
    const daemon = { rpcCmd: sinon.stub().rejects(error) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = {
      daemon, logger, coinsRound, coinsToSatoshies
    };

    it('catches the error and logs to error', async () => {
      try {
        await listUnspent(env)();
      } catch (err) {
        expect(err).to.eql(error);
        expect(logger.special).to.have.callCount(0);
        expect(logger.error).to.have.callCount(1);
      }
    });
  });
});

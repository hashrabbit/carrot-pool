const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { listUnspent } = require(
  '../../../src/payments/process_share_blocks/list_unspent'
);

describe('listUnspent() - wraps daemon.cmd("listunspent") RPC call', () => {
  const coinsRound = sinon.stub().returnsArg(0);
  const coinsToSatoshies = sinon.stub().returnsArg(0);
  const coinUtils = { coinsRound, coinsToSatoshies };
  const minConfPayout = 1;

  describe('with no unspent transactions & displayBool = true', () => {
    const data = { response: [] };
    const daemon = { rpcCmd: sinon.stub().resolves([data]) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = {
      daemon, logger, coinUtils, minConfPayout
    };

    it('returns a balance of 0, logs a "special" message', async () => {
      const balance = await listUnspent(env)(true);
      expect(balance).to.eql(0);
      expect(logger.special).to.have.callCount(1);
      expect(logger.error).to.have.callCount(0);
    });
  });

  describe('with 1 unspent transaction & displayBool = false', () => {
    const unspent = { address: 'AAAA', amount: 1.5 };
    const data = { response: [unspent] };
    const daemon = { rpcCmd: sinon.stub().resolves([data]) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = { daemon, logger, coinUtils };

    it('returns the total balance with no log output', async () => {
      const balance = await listUnspent(env)(false);
      expect(balance).to.eql(1.5);
      expect(logger.special).to.have.callCount(0);
      expect(logger.error).to.have.callCount(0);
    });
  });

  describe('when the RPC call fails', () => {
    const error = new Error('Test failed');
    const daemon = { rpcCmd: sinon.stub().rejects(error) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = { daemon, logger, coinUtils };

    it('catches the error and logs to error', async () => {
      await listUnspent(env)()
        .catch((err) => {
          expect(err).to.eql(error);
          expect(logger.special).to.have.callCount(0);
          expect(logger.error).to.have.callCount(1);
        });
    });
  });
});

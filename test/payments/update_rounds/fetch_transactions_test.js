const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { fetchTransactions } = require(
  '../../../src/payments/update_rounds/fetch_transactions'
);

// Without a viable daemon service stand-in, this test exists for coverage purposes.
describe('fetchTransactions() - wraps daemon.rpcBatch("gettransaction") call', () => {
  describe('with 1 round to retrieve', () => {
    const rounds = [{ txHash: '0000' }];
    const data = [{ result: { confirmations: 0 } }];
    const daemon = { rpcBatch: sinon.stub().resolves(data) };
    const logger = {
      error: sinon.stub().returnsArg(0),
      special: sinon.stub().returnsArg(0)
    };
    const env = { daemon, logger };

    it('returns the batch response', async () => {
      const txs = await fetchTransactions(env)(rounds);
      expect(txs[0].result).to.eql({ confirmations: 0 });
    });
  });
});

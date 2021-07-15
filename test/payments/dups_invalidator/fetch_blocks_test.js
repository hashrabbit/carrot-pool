const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { fetchBlocks } = require('../../../src/payments/dups_invalidator/fetch_blocks');

describe('fetchBlocks()', () => {
  const logger = { error: sinon.stub() };
  let stubDaemon;

  beforeEach(() => {
    stubDaemon = { rpcBatch: sinon.stub().resolves() };
  });

  it('calls out to the rpc daemon to fetch each potential dup block', () => {
    const dups = [{ blockHash: 111 }, { blockHash: 222 }];
    const commands = [['getblock', [111]], ['getblock', [222]]];
    fetchBlocks({ daemon: stubDaemon, logger })(dups);
    expect(stubDaemon.rpcBatch).to.have.been.calledWith(commands);
  });

  describe('when the fetch succeeds', () => {
    beforeEach(() => {
      stubDaemon = { rpcBatch: sinon.stub().resolves('success') };
    });

    it('retuns the resolved daemon result', () => {
      const dups = [{ blockHash: 111 }, { blockHash: 222 }];
      const promise = fetchBlocks({ daemon: stubDaemon, logger })(dups);
      return expect(promise).to.eventually.eq('success');
    });
  });

  describe('when the fetch fails', () => {
    const rejectionReason = new Error('rejection reason');
    beforeEach(() => {
      stubDaemon = { rpcBatch: sinon.stub().rejects(rejectionReason) };
    });

    it('rethrows the rejected result', () => {
      const dups = [{ blockHash: 111 }, { blockHash: 222 }];
      const promise = fetchBlocks({ daemon: stubDaemon, logger })(dups);
      return expect(promise).to.eventually.be.rejectedWith(rejectionReason.message);
    });
  });
});

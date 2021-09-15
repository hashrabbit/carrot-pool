const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { findInvalidBlocks } = require(
  '../../../src/payments/initialize_payouts/find_invalid_blocks'
);

describe('findInvalidBlocks() - use daemon "getblock" to find invalid blocks', () => {
  describe('when the daemon returns block data', () => {
    const logger = { warning: sinon.stub(), debug: sinon.stub() };

    describe('and the block has confirmations < 0', () => {
      const blocks = [{ result: { hash: 'AAAAAA', confirmations: -1 } }];
      const daemon = { rpcBatch: sinon.stub().resolves(blocks) };
      const dups = [{ blockHash: 'AAAAAA', serialized: 'block_1' }];

      it('retuns the duplicate block as invalid', async () => {
        const invalid = await findInvalidBlocks({ daemon, logger })(dups);
        expect(invalid).to.eql(['block_1']);
      });
    });

    describe('and the block has confirmations == 0, but is not duplicated', () => {
      const blocks = [{ result: { hash: 'AAAAAA', confirmations: 0 } }];
      const daemon = { rpcBatch: sinon.stub().resolves(blocks) };
      const dups = [{ blockHash: 'AAAAAA', serialized: 'block_1' }];

      it('retuns no invalid blocks', async () => {
        const invalid = await findInvalidBlocks({ daemon, logger })(dups);
        expect(invalid).to.eql([]);
      });
    });

    describe('and the block has confirmations == 0, and is duplicated', () => {
      const blocks = [
        { result: { hash: 'AAAAAA', confirmations: 0 } },
        { result: { hash: 'AAAAAA', confirmations: 0 } }
      ];
      const daemon = { rpcBatch: sinon.stub().resolves(blocks) };
      const dups = [
        { blockHash: 'AAAAAA', serialized: 'block_1' },
        { blockHash: 'AAAAAA', serialized: 'block_2' }
      ];

      it('retuns the 2nd block as invalid', async () => {
        const invalid = await findInvalidBlocks({ daemon, logger })(dups);
        expect(invalid).to.eql(['block_2']);
      });
    });
  });

  describe('when the daemon fails to return block data', () => {
    const logger = { error: sinon.stub() };
    const error = new Error('Daemon failed');
    const daemon = { rpcBatch: sinon.stub().rejects(error) };
    const dups = [1];

    it('rethrows the error', () => {
      const promise = findInvalidBlocks({ daemon, logger })(dups);
      return expect(promise).to.eventually.be.rejectedWith(error.message);
    });
  });
});

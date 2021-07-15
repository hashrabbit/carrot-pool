const { describe, it, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { createClient } = require('../../helpers');

const { moveInvalid } = require('../../../src/payments/dups_invalidator/move_invalid');

const stubDaemon = (blocks) => ({ rpcBatch: sinon.stub().resolves(blocks) });

describe('moveInvalid()', () => {
  const client = createClient();
  const logger = { error: sinon.stub() };

  after(() => { client.quit(); });

  describe('when given no invalid blocks', () => {
    const invalidBlocks = [];
    const daemon = stubDaemon([{}, {}]);
    const env = {
      coin: 'coin',
      daemon,
      client,
      logger
    };

    it('retuns true', () => (
      expect(moveInvalid(env)(invalidBlocks)).to.eventually.eql(true)
    ));
  });

  describe('when given invalid blocks', () => {
    const invalidBlocks = [
      ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's1'],
      ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's2'],
      ['smove', 'coin:blocks:pending', 'coin:blocks:duplicate', 's3']
    ];

    const daemon = stubDaemon([{}, {}]);
    const env = {
      coin: 'coin',
      daemon,
      client,
      logger
    };

    it('moves the duplicate blocks in the database and returns the count', () => (
      expect(moveInvalid(env)(invalidBlocks)).to.eventually.eql(3)
    ));
  });
});

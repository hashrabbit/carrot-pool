const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { convertTransaction } = require(
  '../../../src/payments/update_rounds/convert_transaction'
);

describe('convertTransaction() - updateRounds support function', () => {
  const poolOptions = { addresses: { address: 'AAAAAA' } };
  const coinUtils = { coinsRound: (c) => c };
  const env = { poolOptions, coinUtils };

  describe('for a "complete" transaction with a matching detail', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const detail = { category: 'generate', address: 'AAAAAA', amount: 5 };
    const tx = {
      result: {
        confirmations: 10,
        details: [{ address: 'BBBBBB' }, detail]
      }
    };

    it('updates the round, setting the reward', () => {
      const updater = convertTransaction(env)(tx);
      updater(round);
      expect(round.category).to.eql('generate');
    });
  });

  describe('for a "missing" transaction, multiple non-matching details', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const logger = { error: sinon.stub().returnsArg(0) };
    const errorArg = sinon.match('Missing output details');
    const tx = {
      result: {
        confirmations: 10,
        details: [{ address: 'BBBBBB' }, { address: 'CCCCCC' }]
      }
    };

    it('logs an error and leaves the round unchanged', () => {
      const updater = convertTransaction({ ...env, logger })(tx);
      updater(round);
      expect(logger.error).to.have.been.calledOnceWith(errorArg);
    });
  });

  describe('for an "invalid" transaction', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const logger = { warning: sinon.stub().returnsArg(0) };
    const errorArg = sinon.match('Invalid transaction:');
    const tx = { error: { code: -5 } };

    it('logs the invalid warning and sets the round to "kicked"', () => {
      const updater = convertTransaction({ ...env, logger })(tx);
      updater(round);
      expect(round.category).to.eql('kicked');
      expect(logger.warning).to.have.been.calledOnceWith(errorArg);
    });
  });

  describe('for an "incomplete" transaction', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const logger = { warning: sinon.stub().returnsArg(0) };
    const errorArg = sinon.match('Invalid transaction details:');
    const tx = { result: { details: 'invalid' } };

    it('logs the invalid details warning and sets the round to "kicked"', () => {
      const updater = convertTransaction({ ...env, logger })(tx);
      updater(round);
      expect(round.category).to.eql('kicked');
      expect(logger.warning).to.have.been.calledOnceWith(errorArg);
    });
  });

  describe('for an "unknown" transaction', () => {
    const round = { category: 'orphan', txHash: 'txHash' };
    const logger = { error: sinon.stub().returnsArg(0) };
    const errorArg = sinon.match('Unknown transaction error:');
    const tx = { error: {} };

    it('logs the invalid transaction error and leaves the round unchanged', () => {
      const updater = convertTransaction({ ...env, logger })(tx);
      updater(round);
      expect(round.category).to.eql('orphan');
      expect(logger.error).to.have.been.calledOnceWith(errorArg);
    });
  });
});

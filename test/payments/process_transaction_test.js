const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { processTransaction } = require('../../src/payments/process_transaction');

const stubbedLogger = (severities) => {
  const stubs = {};
  severities.forEach((s) => { stubs[s] = sinon.stub().returns(true); });
  return stubs;
};

describe('processTransaction() - validateTransactions pipeline function', () => {
  const poolOptions = { addresses: { address: 'AAAAAA' } };
  const coinsRound = sinon.stub().returnsArg(0);

  describe('for a valid transaction, with a matching "generate" detail', () => {
    const rounds = [{ txHash: '0000' }];
    const env = {
      rounds, coinsRound, poolOptions, logger: {}
    };
    const tx = {
      result: {
        confirmations: 1,
        details: [{ address: 'AAAAAA', category: 'generate', amount: 0.5 }]
      }
    };

    it('sets confirmations, category, and reward fields on the round', () => {
      [tx].forEach(processTransaction(env));
      expect(rounds[0].confirmations).to.eql(1);
      expect(rounds[0].reward).to.eql(0.5);
    });
  });

  describe('for a valid transaction, with a matching "send" detail', () => {
    const rounds = [{ txHash: '0000' }];
    const env = {
      rounds, coinsRound, poolOptions, logger: {}
    };
    const tx = {
      result: {
        confirmations: 1,
        details: [{ address: 'AAAAAA', category: 'send', amount: 0.5 }]
      }
    };

    it('sets confirmations, and category fields on the round', () => {
      [tx].forEach(processTransaction(env));
      expect(rounds[0].confirmations).to.eql(1);
      expect(rounds[0].category).to.eql('send');
      expect(rounds[0].reward).to.eql(undefined);
    });
  });

  describe('for a valid transaction, without a matching detail', () => {
    const rounds = [{ txHash: '0000' }];
    const logger = stubbedLogger(['error']);
    const env = {
      rounds, coinsRound, poolOptions, logger
    };
    const tx = { result: { confirmations: 1, details: [{}, {}] } };

    it('sends 1 message to logger.error, and adds round confirmations field', () => {
      [tx].forEach(processTransaction(env));
      expect(logger.error).to.have.callCount(1);
      expect(Object.keys(rounds[0])).to.eql(['txHash', 'confirmations']);
    });
  });

  describe('for an invalid transaction, with no details', () => {
    const rounds = [{ txHash: '0000' }];
    const logger = stubbedLogger(['warning']);
    const env = {
      rounds, coinsRound, poolOptions, logger
    };
    const tx = { result: { details: [] } };
    const arg = sinon.match(/^Invalid transaction details/);

    it('sends 1 message to logger.error, and adds round confirmations field', () => {
      [tx].forEach(processTransaction(env));
      expect(logger.warning).to.have.been.calledOnceWith(arg);
      expect(rounds[0].category).to.eql('kicked');
    });
  });
});

const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _processPayments } = require('../../src/payments/process_payments');

describe('processPayments() - asynchronously handle a round of worker payouts based on mined shares', () => {
  let stubs;
  let env;

  let initializePayoutsEnvStub;
  let validateTransactionsStub;
  let validateTransactionsEnvStub;
  let processShareBlocksStub;
  let processShareBlocksEnvStub;
  let calculatePaymentsStub;
  let calculatePaymentsEnvStub;
  let manageSentPaymentsStub;
  let manageSentPaymentsEnvStub;
  let fixFailedPaymentsStub;
  let fixFailedPaymentsEnvStub;

  beforeEach(() => {
    initializePayoutsEnvStub = sinon.stub();

    validateTransactionsStub = sinon.stub();
    validateTransactionsEnvStub = sinon.stub();
    validateTransactionsEnvStub.returns(validateTransactionsStub);

    processShareBlocksStub = sinon.stub();
    processShareBlocksEnvStub = sinon.stub();
    processShareBlocksEnvStub.returns(processShareBlocksStub);

    calculatePaymentsStub = sinon.stub();
    calculatePaymentsEnvStub = sinon.stub();
    calculatePaymentsEnvStub.returns(calculatePaymentsStub);

    manageSentPaymentsStub = sinon.stub();
    manageSentPaymentsEnvStub = sinon.stub();
    manageSentPaymentsEnvStub.returns(manageSentPaymentsStub);

    fixFailedPaymentsStub = sinon.stub();
    fixFailedPaymentsEnvStub = sinon.stub();
    fixFailedPaymentsEnvStub.returns(fixFailedPaymentsStub);

    stubs = {
      initializePayouts: initializePayoutsEnvStub,
      validateTransactions: validateTransactionsEnvStub,
      processShareBlocks: processShareBlocksEnvStub,
      calculatePayments: calculatePaymentsEnvStub,
      manageSentPayments: manageSentPaymentsEnvStub,
      fixFailedPayments: fixFailedPaymentsEnvStub
    };

    env = { some: 'env' };
  });

  describe('coordinating dependencies', () => {
    beforeEach(() => {
      initializePayoutsEnvStub.resolves('gwrOutput');
      validateTransactionsStub.resolves('valTxOutput');
      processShareBlocksStub.resolves('psbOutput');
      calculatePaymentsStub.resolves('calcOutput');
      manageSentPaymentsStub.resolves('mspOutput');
      fixFailedPaymentsStub.resolves('ffpOutput');
    });

    it('chains its outputs together', () => {
      const promise = _processPayments(stubs)(env)('paymentMode', 'lastInterval');
      return expect(promise).to.eventually.eql('ffpOutput').then(() => {
        expect(validateTransactionsStub).to.have.been.calledWith('gwrOutput');
        expect(processShareBlocksStub).to.have.been.calledWith('valTxOutput');
        expect(calculatePaymentsStub).to.have.been.calledWith('psbOutput');
        expect(manageSentPaymentsStub).to.have.been.calledWith('calcOutput');
        expect(fixFailedPaymentsStub).to.have.been.calledWith('mspOutput');
      });
    });

    it('calls each dependency with the correct env', () => {
      const expectedSubEnv = {
        ...env,
        paymentMode: 'paymentMode',
        lastInterval: 'lastInterval',
      };
      const promise = _processPayments(stubs)(env)('paymentMode', 'lastInterval');
      return expect(promise).to.eventually.eql('ffpOutput').then(() => {
        Object.values(stubs).forEach((subEnvStub) => {
          expect(subEnvStub).to.have.been.calledWith(expectedSubEnv);
        });
      });
    });
  });
});

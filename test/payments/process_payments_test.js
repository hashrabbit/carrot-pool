const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
const { _processPayments } = require('../../src/payments/process_payments');

chai.use(chaiAsPromised);

describe('processPayments() - asynchronously handle a round of worker payouts based on mined shares', () => {
  let stubs;
  let env;

  let dupsInvalidatorStub;
  let dupsInvalidatorEnvStub;
  let getWorkersRoundsEnvStub;
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
    dupsInvalidatorStub = sinon.stub();
    dupsInvalidatorEnvStub = sinon.stub();
    dupsInvalidatorEnvStub.returns(dupsInvalidatorStub);

    getWorkersRoundsEnvStub = sinon.stub();

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
      dupsInvalidator: dupsInvalidatorEnvStub,
      getWorkersRounds: getWorkersRoundsEnvStub,
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
      getWorkersRoundsEnvStub.resolves('gwrOutput');
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
        invalidateDups: dupsInvalidatorStub
      };
      const promise = _processPayments(stubs)(env)('paymentMode', 'lastInterval');
      return expect(promise).to.eventually.eql('ffpOutput').then(() => {
        expect(stubs.dupsInvalidator).to.have.been.calledWith(env);
        delete stubs.dupsInvalidator;
        Object.values(stubs).forEach((subEnvStub) => {
          expect(subEnvStub).to.have.been.calledWith(expectedSubEnv);
        });
      });
    });
  });
});

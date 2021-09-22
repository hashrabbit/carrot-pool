const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _processPayments } = require('../../src/payments/process_payments');

describe('processPayments() - asynchronously handle a round of worker payouts based on mined shares', () => {
  let stubs;
  let env;

  let initOutput;
  let initializePayoutsEnvStub;
  let updateRoundsStub;
  let updateRoundsEnvStub;
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

    updateRoundsStub = sinon.stub();
    updateRoundsEnvStub = sinon.stub();
    updateRoundsEnvStub.returns(updateRoundsStub);

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
      updateRounds: updateRoundsEnvStub,
      processShareBlocks: processShareBlocksEnvStub,
      calculatePayments: calculatePaymentsEnvStub,
      manageSentPayments: manageSentPaymentsEnvStub,
      fixFailedPayments: fixFailedPaymentsEnvStub
    };

    env = { some: 'env' };
  });

  describe('coordinating dependencies', () => {
    beforeEach(() => {
      initOutput = { workers: 'initW', rounds: 'initR' };
      initializePayoutsEnvStub.resolves(initOutput);
      updateRoundsStub.resolves();
      processShareBlocksStub.resolves();
      calculatePaymentsStub.resolves('calcOutput');
      manageSentPaymentsStub.resolves('mspOutput');
      fixFailedPaymentsStub.resolves('ffpOutput');
    });

    it('chains its outputs together', () => {
      const promise = _processPayments(stubs)(env)('paymentMode', 'lastInterval');
      return expect(promise).to.eventually.eql('ffpOutput').then(() => {
        expect(updateRoundsStub).to.have.been.calledWith('initR');
        expect(processShareBlocksStub).to.have.been.calledWith(initOutput);
        expect(calculatePaymentsStub).to.have.been.calledWith(initOutput);
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

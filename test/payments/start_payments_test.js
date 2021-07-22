const { describe, it, after } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _startPayments } = require('../../src/payments/start_payments');

// Sanity check test, as there's no branching login in startPayments
describe('startPayments() - start the async payment processing timers', () => {
  const clock = sinon.useFakeTimers();
  const _processPayments = sinon.stub().resolves(true);
  const processPayments = () => _processPayments;
  const startPayments = _startPayments({ processPayments });

  const logger = sinon.stub();
  const poolOptions = { paymentProcessing: { checkInterval: 0.8, paymentInterval: 0.9 } };

  after(() => clock.restore());

  it('correctly delegates to paymentProcessing', () => {
    const { checkTimerId, paymentTimerId } = startPayments({ logger, poolOptions });
    clock.tick(1000);
    clearInterval(checkTimerId);
    clearInterval(paymentTimerId);
    expect(_processPayments).to.have.callCount(3);
    expect(_processPayments.getCall(0)).to.have.been.calledWith('start', 100);
    expect(_processPayments.getCall(1)).to.have.been.calledWith('check', 800);
    expect(_processPayments.getCall(2)).to.have.been.calledWith('payment', 900);
  });
});

const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { metricCoinInfo } = require('../../helpers.js');
const { RetryError } = require('../../../src/utils/retry.js');
const { _calculatePayments } = require('../../../src/payments/calculate_payments');
const { CoinUtils } = require('../../../src/payments/coin_utils');

describe('calculatePayments() - send payments + make redis records pipeline function', () => {
  const logger = { error: sinon.stub() };
  const coinUtils = new CoinUtils(metricCoinInfo);
  const addressAccount = 'AAAAAAA';
  const poolOptions = {};
  const signalStop = () => {};

  let workers;
  let rounds;

  let env;
  let stubs;
  let workerRecords;
  let buildWorkerRecordsStub;
  let buildWorkerRecordsEnvStub;
  let sendPaymentsStub;
  let sendPaymentsEnvStub;
  let preparePaymentsUpdateStub;
  let preparePaymentsUpdateEnvStub;
  let prepareFnStub;
  let retrier;
  let retryStub;
  let daemon;

  beforeEach(() => {
    workers = {};
    rounds = {};

    workerRecords = {
      amountsRecords: {},
      unpaidRecords: {},
      shareRecords: {},
      totalSent: 0,
      totalShares: 0,
    };

    buildWorkerRecordsStub = sinon.stub();
    buildWorkerRecordsStub.returns(workerRecords);
    buildWorkerRecordsEnvStub = sinon.stub();
    buildWorkerRecordsEnvStub.returns(buildWorkerRecordsStub);

    sendPaymentsStub = sinon.stub();
    sendPaymentsStub.returns(Promise.resolve({ response: 'sendPaymentsResponse' }));
    sendPaymentsEnvStub = sinon.stub();
    sendPaymentsEnvStub.returns(sendPaymentsStub);

    preparePaymentsUpdateStub = sinon.stub();
    preparePaymentsUpdateStub.returns([{}, {}, []]);
    preparePaymentsUpdateEnvStub = sinon.stub();
    preparePaymentsUpdateEnvStub.returns(preparePaymentsUpdateStub);
    prepareFnStub = sinon.stub();

    retryStub = sinon.stub();
    retryStub.returns(Promise.resolve());
    retrier = {
      retry: retryStub,
      RetryError
    };

    stubs = {
      buildWorkerRecords: buildWorkerRecordsEnvStub,
      sendPayments: sendPaymentsEnvStub,
      preparePaymentsUpdate: preparePaymentsUpdateEnvStub,
      retrier
    };

    env = {
      logger,
      coinUtils,
      poolOptions,
      daemon,
      paymentMode: '',
      signalStop
    };
  });

  describe('when the payment mode is "payment"', () => {
    beforeEach(() => {
      env.paymentMode = 'payment';
    });

    it('retries calculating the payment up to 5 times', () => {
      const promise = _calculatePayments(stubs)(env)({
        workers,
        rounds,
        addressAccount
      }).then(() => retryStub.getCall(0).args[0]);

      return expect(promise).to.eventually.eql(5);
    });

    it('boosts the btc withholding by 0.001 each additional try', () => {
      const promise = _calculatePayments(stubs)(env)({
        workers,
        rounds,
        addressAccount
      }).then(() => {
        const retryFn = retryStub.getCall(0).args[1];
        return retryFn(0).then(() => retryFn(42).then(() => retryFn(10).then(() => [
          buildWorkerRecordsEnvStub.getCall(0).args[0].withholdPercent,
          buildWorkerRecordsEnvStub.getCall(1).args[0].withholdPercent,
          buildWorkerRecordsEnvStub.getCall(2).args[0].withholdPercent
        ])));
      });
      return expect(promise).to.eventually.deep.eql([0, 0.042, 0.01]);
    });

    it('provides a retry predicate, true when the error message includes "Retry!"', () => {
      const promise = _calculatePayments(stubs)(env)({
        workers,
        rounds,
        addressAccount
      }).then(() => {
        const retryPred = retryStub.getCall(0).args[2];
        return [
          retryPred(new Error('Retry! with a bang')),
          retryPred(new Error('Anything else, including Retry without a bang'))
        ];
      });

      return expect(promise).to.eventually.deep.eql([true, false]);
    });

    describe('when trying to calculate a payment', () => {
      const tryOnce = () => {
        const retryFn = retryStub.getCall(0).args[1];
        return retryFn(0);
      };

      it('calls out to build worker records with an augmented environment', () => {
        const localEnv = { withholdPercent: 0, ...env };
        const promise = _calculatePayments(stubs)(env)({
          workers,
          rounds,
          addressAccount
        }).then(tryOnce);

        return expect(promise).to.eventually.be.fulfilled.then(() => {
          expect(buildWorkerRecordsEnvStub.getCall(0).args[0]).to.include.deep.keys(localEnv);
          expect(buildWorkerRecordsStub).to.have.been.calledWith(workers);
        });
      });

      describe('when buildWorkerRecords returns an empty amountsRecords', () => {
        it('returns its records and rounds with undefined paymentsUpdate arg', () => {
          const promise = _calculatePayments(stubs)(env)({
            workers,
            rounds,
            addressAccount
          }).then(tryOnce);

          // TODO: I'm almost certain this is supposed to return an empty array instead
          //       and only 'works' this way by total accident
          return expect(promise).to.eventually.deep.eql({ workers, rounds });
        });
      });

      describe('when buildWorkerRecords returns some amountsRecords', () => {
        const sendResult = { response: 'some response' };

        beforeEach(() => {
          workerRecords.amountsRecords = { worker1: 123.456 };
          sendPaymentsStub.returns(Promise.resolve(sendResult));
          preparePaymentsUpdateStub.returns(prepareFnStub);
        });

        it('attempts to send payments of those amounts and write a payment update', () => {
          const localEnv = { withholdPercent: 0, ...env };
          const sendArgs = {
            addressAccount,
            amountsRecords: workerRecords.amountsRecords,
            totalSent: workerRecords.totalSent
          };
          const paymentArgs = {
            workers,
            rounds,
            workerRecords
          };

          const promise = _calculatePayments(stubs)(env)({
            workers,
            rounds,
            addressAccount
          }).then(tryOnce);

          return expect(promise).to.eventually.be.fulfilled.then(() => {
            expect(sendPaymentsEnvStub.getCall(0).args[0]).to.include.deep.keys(localEnv);
            expect(sendPaymentsStub.getCall(0).args[0]).to.include.deep.keys(sendArgs);

            expect(preparePaymentsUpdateEnvStub.getCall(0).args[0]).to.include.deep.keys(localEnv);
            expect(preparePaymentsUpdateStub.getCall(0).args[0]).to.include.deep.keys(paymentArgs);

            expect(prepareFnStub).to.have.been.calledWith(sendResult);
          });
        });
      });
    });
  });
});

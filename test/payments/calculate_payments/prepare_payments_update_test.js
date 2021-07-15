const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { preparePaymentsUpdate } = require('../../../src/payments/calculate_payments/prepare_payments_update');
const { CoinUtils } = require('../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../helpers');

describe('preparePaymentsUpdate() - format payment call arg for redis to make a record of sent worker payments ', () => {
  const coinUtils = new CoinUtils(metricCoinInfo);

  let withholdPercent;

  let workers;
  let rounds;
  let workerRecords;
  let signalStop;
  let logger;
  let result;
  let clock;
  let env;

  beforeEach(() => {
    workers = {};
    rounds = [];
    workerRecords = {
      amountsRecords: {},
      unpaidRecords: {},
      shareRecords: {},
      totalShares: 0.0,
      totalSent: 0.0
    };
    result = {};
    signalStop = sinon.stub();
    logger = {
      component: 'comp',
      error: sinon.stub(),
      special: sinon.stub(),
      warning: sinon.stub()
    };
    clock = sinon.useFakeTimers();

    env = {
      logger,
      coinUtils,
      withholdPercent,
      signalStop
    };
  });

  afterEach(() => {
    clock.restore();
  });

  describe("when it's given a sendmany success result without the spend tx", () => {
    it('stops future payment scheduling for fear of double-spends', () => {
      const actual = () => {
        preparePaymentsUpdate(env)({
          workers,
          rounds,
          workerRecords
        })(result);
      };

      expect(actual).to.throw();
      expect(signalStop).to.have.been.calledOnce;
    });

    it('throws an explanatory error', () => {
      const actual = () => {
        preparePaymentsUpdate(env)({
          workers,
          rounds,
          workerRecords
        })(result);
      };

      expect(actual).to.throw('RPC sendmany did not return txid');
      expect(actual).to.throw('Disabling payment processing');
    });
  });

  describe("when it's given a sendmany success result with the spend tx", () => {
    const txid = 'txid';
    let expectedPayments;

    beforeEach(() => {
      result = { response: txid };
      workerRecords.totalSent = 42;
      workerRecords.totalShares = 99.9;
      workerRecords.amountsRecords = { w1: 'amount1', w2: 'amount2', w3: 'amount3' };
      workerRecords.shareRecords = { w1: 'share1', w2: 'share2', w3: 'share3' };
      workerRecords.unpaidRecords = { w1: 'unpaid1', w2: 'unpaid2', w3: 'unpaid3' };

      expectedPayments = {
        time: Date.now(),
        txid,
        paid: workerRecords.totalSent * 0.1, // `totalSent` is satoshis, `paid` is coins
        records: [],
        shares: workerRecords.totalShares,
        totals: {
          amounts: workerRecords.amountsRecords,
          shares: workerRecords.shareRecords,
        },
        unpaid: workerRecords.unpaidRecords,
        workers: 3
      };
    });

    describe('when some amount had to be withheld', () => {
      beforeEach(() => {
        env = { ...env, withholdPercent: 0.25, logger };
      });

      it('sends a log warning to inform on the withhold amount', () => {
        preparePaymentsUpdate(env)({
          workers,
          rounds,
          workerRecords
        })(result);
        expect(logger.warning.getCall(0).args[0]).to.include('Had to withhold 25%');
      });
    });

    describe('with no generate rounds', () => {
      it('prepares a payment update with no round records', () => {
        const { paymentsUpdate } = preparePaymentsUpdate(env)({
          workers,
          rounds,
          workerRecords
        })(result);

        expect(paymentsUpdate).to.deep.eql([[
          'zadd',
          'comp:payments:payments',
          Date.now(),
          JSON.stringify(expectedPayments)
        ]]);
      });
    });

    describe('with generate rounds', () => {
      beforeEach(() => {
        rounds = [
          { height: 'round1', category: 'other' },
          { height: 'round2', category: 'generate' },
          { height: 'round3', category: 'other' },
          { height: 'round4', category: 'generate' }
        ];
      });

      describe('with no workers having records for the generate rounds', () => {
        beforeEach(() => {
          workers = {
            w1: {
              records: {
                round1: {
                  amounts: 3,
                  shares: 4,
                  times: 1
                }
              }
            },
            w3: {
              records: {
                round3: {
                  amounts: 3,
                  shares: 4,
                  times: 1
                }
              }
            },
          };
        });

        it('prepares a payment update with empty round records', () => {
          expectedPayments.records = [
            {
              height: 'round2',
              amounts: {},
              shares: {},
              times: {}
            },
            {
              height: 'round4',
              amounts: {},
              shares: {},
              times: {}
            }
          ];

          const { paymentsUpdate } = preparePaymentsUpdate(env)({
            workers,
            rounds,
            workerRecords
          })(result);

          expect(paymentsUpdate).to.deep.eql([[
            'zadd',
            'comp:payments:payments',
            Date.now(),
            JSON.stringify(expectedPayments)
          ]]);
        });
      });

      describe('with workers having records for generatae rounds', () => {
        beforeEach(() => {
          workers = {
            w1: {
              records: {
                round2: {
                  amounts: 1,
                  shares: 4,
                  times: 7
                },
                round3: {
                  amounts: 2,
                  shares: 5,
                  times: 8
                }
              }
            },
            w2: {
              records: {
                round2: {
                  amounts: 10,
                  shares: 40,
                  times: 70
                },
                round4: {
                  amounts: 20,
                  shares: 50,
                  times: 80
                }
              }
            },
          };
        });

        it('prepares a payment update with worker-filled round records', () => {
          expectedPayments.records = [
            {
              height: 'round2',
              amounts: { w1: 1, w2: 10 },
              shares: { w1: 4, w2: 40 },
              times: { w1: 7, w2: 70 }
            }, {
              height: 'round4',
              amounts: { w2: 20 },
              shares: { w2: 50 },
              times: { w2: 80 }
            }
          ];

          const { paymentsUpdate } = preparePaymentsUpdate(env)({
            workers,
            rounds,
            workerRecords
          })(result);

          expect(paymentsUpdate).to.deep.eql([[
            'zadd',
            'comp:payments:payments',
            Date.now(),
            JSON.stringify(expectedPayments)
          ]]);
        });
      });
    });
  });
});

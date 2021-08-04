const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { fixFailedPayments } = require('../../src/payments/fix_failed_payments');

describe('fixFailedPayments() - handle negative-confirmation payouts', () => {
  const logger = { error: sinon.stub(), special: sinon.stub(), warning: sinon.stub() };
  const coin = 'carrot';

  let env;
  let paymentMode;
  let redisStub;
  let daemonStub;
  let clock;

  // Clear all stubs before each test
  beforeEach(() => {
    paymentMode = '';
    redisStub = { zrange: sinon.stub(), zadd: sinon.stub(), zremrangebyscore: sinon.stub() };
    redisStub.zrange.onCall(0).callsArgWith(3, null, []);
    redisStub.zadd.onCall(0).callsArgWith(3, null);
    redisStub.zremrangebyscore.onCall(0).callsArgWith(3, null);

    daemonStub = { rpcCmd: sinon.stub() };
    daemonStub.rpcCmd.onCall(0).resolves('daemon succeeded');
    clock = sinon.useFakeTimers();

    env = {
      paymentMode,
      coin,
      logger,
      client: redisStub,
      daemon: daemonStub
    };
  });

  afterEach(() => {
    clock.restore();
  });

  describe('With a payment mode other than "payment"', () => {
    it('resolves without any updates to redis or the coin daemon', () => {
      const promise = fixFailedPayments(env)();
      return expect(promise).to.eventually.be.fulfilled.then(() => {
        expect(daemonStub.rpcCmd).not.to.have.been.called;
        expect(redisStub.zrange).not.to.have.been.called;
      });
    });
  });

  describe('With a payment mode "payment"', () => {
    beforeEach(() => {
      env.paymentMode = 'payment';
    });

    it('fetches a zrange for the coin payment from 5 payments back', () => {
      const expectedKey = `${coin}:payments:payments`;
      const promise = fixFailedPayments(env)();
      return expect(promise).to.eventually.be.fulfilled.then(() => {
        expect(redisStub.zrange).to.have.been.calledWith(expectedKey, -5, -5);
      });
    });

    describe('when redis succeeds with a zrange of records', () => {
      const record = { txid: 'tx1', amounts: 'paymentAmount1', time: 'time1' };
      const jsonRecord = JSON.stringify(record);

      beforeEach(() => {
        redisStub.zrange.onCall(0).callsArgWith(3, null, [jsonRecord]);
        daemonStub.rpcCmd.onCall(0).resolves([{ response: { transaction: null } }]);
      });

      it("attempts to fetch each record's parsed transaction id from the daemon", () => {
        const promise = fixFailedPayments(env)();
        const pending = promise.then(() => daemonStub.rpcCmd.getCall(0).args.slice(0, 2));
        return expect(pending).to.eventually.eql(['gettransaction', ['tx1']]);
      });

      describe('When transactions have non-negative confirmations', () => {
        beforeEach(() => {
          daemonStub.rpcCmd.onCall(0).resolves([{ response: { confirmations: 0 } }]);
        });

        it('does not call sendmany', () => {
          const promise = fixFailedPayments(env)();
          const pending = promise.then(() => daemonStub.rpcCmd.getCall(0).args[0]);
          return expect(pending).not.to.eventually.eql('sendmany').then(() => {
            expect(daemonStub.rpcCmd).to.have.been.calledOnce;
          });
        });
      });

      describe('When a transaction has -1 confirmations', () => {
        beforeEach(() => {
          daemonStub.rpcCmd.onCall(0).resolves([{ response: { confirmations: -1 } }]);
          daemonStub.rpcCmd.onCall(1).resolves('sendmany response');
        });

        it('tries to resend that transaction via daemon sendmany', () => {
          const promise = fixFailedPayments(env)();
          return expect(promise).to.eventually.be.rejected.then(() => {
            const actual = daemonStub.rpcCmd.getCall(1).args.slice(0, 2);
            expect(actual).to.eql(['sendmany', ['', 'paymentAmount1']]);
            expect(daemonStub.rpcCmd).to.have.callCount(2);
          });
        });

        describe('When sendmany returns an rpc error', () => {
          const sendmanyErr = 'sendmany err';
          beforeEach(() => {
            daemonStub.rpcCmd.onCall(1).resolves({ error: sendmanyErr });
          });

          it('rejects without updating redis with new payments', () => {
            const promise = fixFailedPayments(env)();
            return expect(promise).to.eventually.be.rejectedWith(
              `Error sending payments "${sendmanyErr}"`
            ).then(() => {
              expect(redisStub.zadd).not.to.have.been.called;
              expect(redisStub.zremrangebyscore).not.to.have.been.called;
            });
          });
        });

        describe('When sendmany returns a result without a response property', () => {
          const sendmanyRaw = 'sendmany without response';
          beforeEach(() => {
            daemonStub.rpcCmd.onCall(1).resolves(sendmanyRaw);
          });

          it('rejects without updating redis with new payments', () => {
            const promise = fixFailedPayments(env)();
            return expect(promise).to.eventually.be.rejectedWith(
              `Error sending payments "${sendmanyRaw}"`
            ).then(() => {
              expect(redisStub.zadd).not.to.have.been.called;
              expect(redisStub.zremrangebyscore).not.to.have.been.called;
            });
          });
        });

        describe('When sendmany returns a result with a response property', () => {
          const newTx = 'returned-txid';
          beforeEach(() => {
            daemonStub.rpcCmd.onCall(1).resolves({ response: newTx });
          });

          it('updates redis with new payments and current time', () => {
            const payment = { ...record, ...{ txid: newTx, time: Date.now() } };
            const actual = [`${coin}:payments:payments`, Date.now(), JSON.stringify(payment)];
            const promise = fixFailedPayments(env)();
            const pending = promise.then(() => redisStub.zadd.getCall(0).args.slice(0, 3));

            return expect(pending).to.eventually.eql(actual).then(() => {
              expect(redisStub.zadd).to.have.been.calledOnce;
            });
          });

          it('removes the old payments at the old time from redis', () => {
            const actual = [`${coin}:payments:payments`, 'time1', 'time1'];
            const promise = fixFailedPayments(env)();
            const pending = promise.then(() => {
              const stub = redisStub.zremrangebyscore;
              return stub.getCall(0).args.slice(0, 3);
            });
            return expect(pending).to.eventually.eql(actual).then(() => {
              expect(redisStub.zremrangebyscore).to.have.been.calledOnce;
            });
          });
        });
      });
    });
  });
});

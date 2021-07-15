const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
const { _manageSentPayments: manageSentPayments } = require('../../../src/payments/manage_sent_payments');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('manageSentPayments() - write redis records of payments', () => {
  const workers = { workerA: 'worker A', workerB: 'worker B' };
  const rounds = { roundA: 'round A', roundB: 'round B' };
  const paymentsUpdate = [];
  const emptyPaymentMode = '';
  const coin = 'carrot';
  const lastInterval = Date.now();

  let env;
  let stubs;
  let balancesEnvStub;
  let balancesStub;
  let sharesEnvStub;
  let sharesStub;
  let sendRedisEnvStub;
  let sendRedisStub;

  // Clear all stubs before each test
  beforeEach(() => {
    balancesStub = sinon.stub();
    balancesStub.returns([0.0, [], [], []]);
    balancesEnvStub = sinon.stub();
    balancesEnvStub.returns(balancesStub);

    sharesStub = sinon.stub();
    sharesStub.returns([[], [], [], [], []]);
    sharesEnvStub = sinon.stub();
    sharesEnvStub.returns(sharesStub);

    sendRedisStub = sinon.stub();
    sendRedisStub.returns(Promise.resolve());
    sendRedisEnvStub = sinon.stub();
    sendRedisEnvStub.returns(sendRedisStub);

    stubs = {
      updateWorkerPayoutBalances: balancesEnvStub,
      updateWorkerShares: sharesEnvStub,
      sendRedisCommands: sendRedisEnvStub,
    };

    env = {
      paymentMode: emptyPaymentMode,
      coin,
      lastInterval
    };
  });

  it('calls out to update worker payout balances and shares', () => {
    const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
    return expect(promise).to.eventually.be.fulfilled.then(() => {
      expect(balancesEnvStub).to.have.been.calledWith(env);
      expect(balancesStub).to.have.been.calledWith(workers);
      expect(sharesEnvStub).to.have.been.calledWith(env);
      expect(sharesStub).to.have.been.calledWith(rounds);
    });
  });

  describe('when payment updates are present', () => {
    const presentPaymentsUpdate = ['update1', 'update2', 'update3'];

    it('passes them straight through to redis', () => {
      const promise = manageSentPayments(stubs)(env)({
        workers,
        rounds,
        paymentsUpdate: presentPaymentsUpdate
      });
      const pending = promise.then(() => sendRedisStub.getCall(0).args[0]);
      return expect(pending).to.eventually.include.deep.members(paymentsUpdate);
    });
  });

  describe('when worker payout updates would cause redis updates', () => {
    const totalPaid = 1.23;
    const workerPayoutsCommand = ['a'];
    const balanceUpdateCommands = ['b', 'bb', 'bbb'];
    const immatureUpdateCommands = ['c', 'cc', 'ccc'];
    const expectedTotalPaidCommand = [['hincrbyfloat', `${coin}:statistics:basic`, 'totalPaid', totalPaid]];

    beforeEach(() => {
      balancesStub.returns([
        totalPaid,
        workerPayoutsCommand,
        balanceUpdateCommands,
        immatureUpdateCommands
      ]);
    });

    it('passes them straight through to redis', () => {
      const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
      const pending = promise.then(() => sendRedisStub.getCall(0).args[0]);
      return expect(pending).to.eventually.be.fulfilled.then((actual) => {
        expect(actual).to.include.deep.members(workerPayoutsCommand);
        expect(actual).to.include.deep.members(balanceUpdateCommands);
        expect(actual).to.include.deep.members(immatureUpdateCommands);
        expect(actual).to.include.deep.members(expectedTotalPaidCommand);
      });
    });
  });

  describe('when worker share updates would cause redis updates', () => {
    const movePendingCommands = ['d', 'dd', 'ddd'];
    const orphanMergeCommands = ['e', 'ee', 'eee'];
    const roundsToDelete = ['f', 'ff', 'fff'];
    const confirmsUpdate = ['g', 'gg', 'ggg'];
    const confirmsToDelete = ['h', 'hh', 'hhh'];

    beforeEach(() => {
      sharesStub.returns([
        movePendingCommands,
        orphanMergeCommands,
        roundsToDelete,
        confirmsUpdate,
        confirmsToDelete
      ]);
    });

    it('passes the unmodified commands straight through to redis', () => {
      const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
      const promiseResult = promise.then(() => sendRedisStub.getCall(0).args[0]);

      return expect(promiseResult).to.eventually.be.fulfilled.then((actual) => {
        expect(actual).to.include.deep.members(movePendingCommands);
        expect(actual).to.include.deep.members(orphanMergeCommands);
        expect(actual).to.include.deep.members(confirmsUpdate);
        expect(actual).to.include.deep.members(confirmsToDelete);
      });
    });

    it('passes through modified roundsToDelete commands to redis', () => {
      const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
      const expected = [['del'].concat(roundsToDelete)];
      const pending = promise.then(() => sendRedisStub.getCall(0).args[0]);
      return expect(pending).to.eventually.include.deep.members(expected);
    });
  });

  describe('when worker updates would not cause redis updates', () => {
    it('does not send any commands to redis', () => {
      const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
      return expect(promise).to.eventually.be.fulfilled.then(() => {
        expect(sendRedisStub).to.have.been.calledWith([]);
      });
    });
  });

  describe('paymentMode redis behavior', () => {
    describe('when the payment mode is "payment"', () => {
      const paymentMode = 'payment';
      beforeEach(() => { env.paymentMode = paymentMode; });

      it('Sends lastPaid statistics to redis', () => {
        const expected = [['hset', `${coin}:statistics:basic`, 'lastPaid', lastInterval]];
        const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
        const pending = promise.then(() => sendRedisStub.getCall(0).args[0]);
        return expect(pending).to.eventually.include.deep.members(expected);
      });
    });

    describe('when the payment mode is "start"', () => {
      const paymentMode = 'start';
      beforeEach(() => {
        env.paymentMode = paymentMode;
      });

      it('Sends lastPaid statistics to redis', () => {
        const expected = [['hset', `${coin}:statistics:basic`, 'lastPaid', lastInterval]];
        const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
        const pending = promise.then(() => sendRedisStub.getCall(0).args[0]);
        return expect(pending).to.eventually.include.deep.members(expected);
      });
    });

    describe('when the payment mode is not "payment" or "start"', () => {
      const paymentMode = 'not-payment';
      beforeEach(() => {
        env.paymentMode = paymentMode;
      });

      it('does not send any commands to redis', () => {
        const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
        return expect(promise).to.eventually.be.fulfilled.then(() => {
          expect(sendRedisStub).to.have.been.calledWith([]);
        });
      });
    });
  });

  describe('when calling out to sendRedisCommands', () => {
    it('calls sendRedisCommands with the current env', () => {
      const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
      return expect(promise).to.eventually.be.fulfilled.then(() => {
        expect(sendRedisEnvStub).to.have.been.calledWith(env);
      });
    });

    describe('When sendRedisCommands returns a resolved promise', () => {
      beforeEach(() => {
        sendRedisStub.returns(Promise.resolve(42));
      });

      it('Returns the result of the send', () => {
        const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
        return expect(promise).to.eventually.eql(42);
      });
    });

    describe('When sendRedisCommands returns a rejected promise', () => {
      beforeEach(() => {
        sendRedisStub.returns(Promise.reject(new Error('some err')));
      });

      it('Returns the result of the send', () => {
        const promise = manageSentPayments(stubs)(env)({ workers, rounds, paymentsUpdate });
        return expect(promise).to.eventually.be.rejectedWith('some err');
      });
    });
  });
});

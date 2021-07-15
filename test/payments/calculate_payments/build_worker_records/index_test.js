const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
const { _buildWorkerRecords } = require('../../../../src/payments/calculate_payments/build_worker_records');
const { CoinUtils } = require('../../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../../helpers');

chai.use(chaiAsPromised);

describe('buildWorkerRecords() - update tabulated worker data', () => {
  const coinUtils = new CoinUtils(metricCoinInfo);
  const nullRecords = {
    amountsRecords: {},
    unpaidRecords: {},
    shareRecords: {},
    totalSent: 0,
    totalShares: 0,
  };

  let workers;
  let env;
  let stubs;
  let fillWorkerRecordsStub;
  let utilStub;

  beforeEach(() => {
    workers = {};
    fillWorkerRecordsStub = sinon.stub();
    utilStub = { addressFromEx: sinon.stub() };

    stubs = {
      fillWorkerRecords: fillWorkerRecordsStub,
      util: utilStub
    };

    env = {
      coinUtils,
      withholdPercent: 0.0,
      poolOptions: {}
    };
  });

  describe('when there are no workers', () => {
    it('returns an empty set of worker records', () => {
      const actual = _buildWorkerRecords(stubs)(env)({});
      expect(actual).to.deep.eql(nullRecords);
    });
  });

  describe('when there are workers present', () => {
    beforeEach(() => {
      workers = {
        w1: { balance: 3.2, reward: 4.5 },
        w2: { totalShares: 37 },
        w3: { reward: 99.9, totalShares: 89 }
      };
    });

    it('sums the worker totals for each worker', () => {
      const actual = _buildWorkerRecords(stubs)(env)(workers);
      expect(actual.totalShares).to.eq(126);
    });

    it('fills out worker records for each worker', () => {
      _buildWorkerRecords(stubs)(env)(workers);
      expect(stubs.fillWorkerRecords).to.have.been.calledThrice;
    });

    it('ensures each worker has a balance and reward property', () => {
      _buildWorkerRecords(stubs)(env)(workers);
      expect(workers.w1.balance).to.eq(3.2);
      expect(workers.w1.reward).to.eq(4.5);
      expect(workers.w2.balance).to.eq(0);
      expect(workers.w2.reward).to.eq(0);
      expect(workers.w3.balance).to.eq(0);
      expect(workers.w3.reward).to.eq(99.9);
    });

    it('returns worker records modified by fillWorkerRecords', () => {
      const actual = _buildWorkerRecords(stubs)(env)(workers);
      expect(stubs.fillWorkerRecords.getCall(0).args[1]).to.eql(actual);
    });

    describe('when filling worker records', () => {
      beforeEach(() => {
        env.withholdPercent = 0.25;
        env.poolOptions = { addresses: { address: 'poolOptionsAddr' } };
        stubs.util.addressFromEx.returns('w3 address from ex');

        workers = {
          'worker1.full.key': { balance: 3.2, reward: 4.5, address: 'existing w1 address' },
          'worker2LessThan40Characters.full.key': {},
          'worker3PaddedTo40Characters_____________.full.key': { reward: 99.9 }
        };
      });

      it('fills for each worker', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        expect(stubs.fillWorkerRecords.getCall(0).args[0]).to.eq(workers['worker1.full.key']);
        expect(stubs.fillWorkerRecords.getCall(1).args[0]).to.eq(workers['worker2LessThan40Characters.full.key']);
        expect(stubs.fillWorkerRecords.getCall(2).args[0]).to.eq(workers['worker3PaddedTo40Characters_____________.full.key']);
      });

      it('accumulates worker records for each worker', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        const initialRecords = nullRecords;
        const accumulatedRecords = stubs.fillWorkerRecords.getCall(0).args[1];
        expect(stubs.fillWorkerRecords.getCall(0).args[1]).to.deep.eql(initialRecords);
        expect(stubs.fillWorkerRecords.getCall(1).args[1]).to.eql(accumulatedRecords);
        expect(stubs.fillWorkerRecords.getCall(2).args[1]).to.eql(accumulatedRecords);
      });

      it('calculates # of satoshis to pay out to each worker', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        // 3.2 + 4.5, 25% withheld, rounded
        expect(stubs.fillWorkerRecords.getCall(0).args[3]).to.eq(6);
        // 0 + 0, 25% withheld, rounded
        expect(stubs.fillWorkerRecords.getCall(1).args[3]).to.eq(0);
        // 0 + 99.9, 25% withheld, rounded
        expect(stubs.fillWorkerRecords.getCall(2).args[3]).to.eq(75);
      });

      it('uses or builds the worker address based on its presence and length', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        expect(stubs.fillWorkerRecords.getCall(0).args[5]).to.eq('existing w1 address');

        expect(stubs.fillWorkerRecords.getCall(1).args[5]).to.eq('worker2LessThan40Characters');

        expect(stubs.util.addressFromEx.getCall(0).args).to.deep.eq([
          'poolOptionsAddr',
          'worker3PaddedTo40Characters_____________'
        ]);

        expect(stubs.fillWorkerRecords.getCall(2).args[5]).to.eq('w3 address from ex');
      });
    });

    describe('when summing worker totals', () => {
      beforeEach(() => {
        env.withholdPercent = 0.5;
        stubs.util.addressFromEx.returns('w3 address from ex');

        workers = {
          worker1: { address: 'sameAddr', balance: 1.0, reward: 2.0 },
          worker2: { address: 'sameAddr', balance: 3.0, reward: 4.0 },
          worker3: { address: 'diffAddr', balance: 20.0, reward: 40.0 }
        };
      });

      // NOTE(rschifflin): Order of operations here makes a big difference!
      // Rounding (1 + 2 + 3 + 4) * .50 gives us 10,
      // but adding the rounded (1 + 2) * .50 with the rounded (3 + 4) * .50 gives us 11!
      const expectedTotals = {
        sameAddr: 6.0,
        diffAddr: 30.0
      };

      it('provides satoshis to send per address', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        expect(stubs.fillWorkerRecords.getCall(0).args[2]).to.deep.eq(expectedTotals);
      });

      it('accumulates satoshis to send per call', () => {
        _buildWorkerRecords(stubs)(env)(workers);
        expect(stubs.fillWorkerRecords.getCall(0).args[2]).to.deep.eq(expectedTotals);
      });
    });
  });
});

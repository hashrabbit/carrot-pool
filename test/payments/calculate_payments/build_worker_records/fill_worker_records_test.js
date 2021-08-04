const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');

const { expect } = chai;
const { fillWorkerRecords } = require('../../../../src/payments/calculate_payments/build_worker_records/fill_worker_records');
const { CoinUtils } = require('../../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../../helpers');

describe('fillWorkerRecords() - use individual worker data plus accumulated worker totals to build worker records', () => {
  const coinUtils = new CoinUtils(metricCoinInfo);
  const nullRecords = {
    amountsRecords: {},
    unpaidRecords: {},
    shareRecords: {},
    totalSent: 0,
    totalShares: 0,
  };

  let worker;
  let workerRecords;
  let workerTotals;
  let toSendSatoshis;
  let address;

  beforeEach(() => {
    worker = {};
    workerRecords = nullRecords;
    workerTotals = {};
    toSendSatoshis = 0.0;
    address = '';
  });

  describe('when the worker address does not match the format of a base58 bitcoin address', () => {
    beforeEach(() => {
      address = 'workerAddress';
      workerTotals[address] = 123;
    });

    it("marks the worker as not being paid out this round with 'sent' as 0", () => {
      fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
      expect(worker.sent).to.eql(0);
    });

    describe('with a worker who earned a reward', () => {
      const balance = 5.0;
      const reward = 1.5;
      const existingUnpaidRecord = 47.2;

      beforeEach(() => {
        workerRecords.unpaidRecords[address] = existingUnpaidRecord;
        worker = { balance };

        // Result of old owed balance + new reward, scaled by withholding and rounded
        toSendSatoshis = balance + reward;
      });

      it('sets an owed balance change to reflect the new reward in satoshis', () => {
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(worker.balanceChange).to.eql(reward);
      });

      it('updates the unpaid records to reflect the new reward in coins', () => {
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(workerRecords.unpaidRecords[address]).to.eql(existingUnpaidRecord + (reward * 0.1));
      });
    });
  });

  describe('when the total # of satoshis for a given address is below the payment threshold', () => {
    beforeEach(() => {
      address = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      workerTotals[address] = 0.99;
    });

    it("marks the worker as not being paid out this round with 'sent' as 0", () => {
      fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
      expect(worker.sent).to.eql(0);
    });

    describe('with a worker who earned a reward', () => {
      const balance = 5.0;
      const reward = 1.5;
      const existingUnpaidRecord = 47.2;

      beforeEach(() => {
        workerRecords.unpaidRecords[address] = existingUnpaidRecord;
        worker = { balance };

        // Result of old owed balance + new reward, scaled by withholding and rounded
        toSendSatoshis = balance + reward;
      });

      it('sets an owed balance change to reflect the new reward in satoshis', () => {
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(worker.balanceChange).to.eql(reward);
      });

      it('updates the unpaid records to reflect the new reward in coins', () => {
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(workerRecords.unpaidRecords[address]).to.eql(existingUnpaidRecord + (reward * 0.1));
      });
    });
  });

  describe('when the total # of satoshis for a given address meets the payment threshold'
    + ' and the address appears legal', () => {
    const sentSatoshis = 101;
    const currentTotalSent = 994;

    beforeEach(() => {
      address = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      workerTotals[address] = 1.00;
      workerRecords.totalSent = currentTotalSent;
      toSendSatoshis = sentSatoshis;
    });

    it('Increments the total amount sent to all workers by the new sent amount in coins', () => {
      fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
      expect(worker.sent).to.be.closeTo(sentSatoshis * 0.1, 10 ** -10);
    });

    it("sets the worker 'sent' prop to the amount being paid out in satoshis", () => {
      fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
      expect(workerRecords.totalSent).to.eql(currentTotalSent + sentSatoshis);
    });

    describe('with a worker who earned a reward', () => {
      const balance = 5.0;
      const reward = 1.5;
      const existingAmountsRecord = 47.2;

      beforeEach(() => {
        workerRecords.amountsRecords[address] = existingAmountsRecord;
        worker = { balance };

        // Result of old owed balance + new reward, scaled by withholding and rounded
        toSendSatoshis = balance + reward;
      });

      it('sets an owed balance change to the additive inverse, so the balance will be zeroed out', () => {
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(worker.balanceChange).to.eql(-balance);
      });

      it('updates the amounts record to reflect the new total sent in coins', () => {
        const expectedAmountsRecord = existingAmountsRecord + (toSendSatoshis * 0.1);
        fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
        expect(workerRecords.amountsRecords[address]).to.eql(expectedAmountsRecord);
      });
    });
  });

  describe('when the worker has found shares', () => {
    const totalShares = 33;
    const existingShareRecord = 57;
    beforeEach(() => {
      worker = { totalShares };
      workerRecords.shareRecords[address] = existingShareRecord;
    });

    it('Updates the existing share record to reflect the found shares', () => {
      fillWorkerRecords(worker, workerRecords, workerTotals, toSendSatoshis, coinUtils, address);
      expect(workerRecords.shareRecords[address]).to.eql(existingShareRecord + totalShares);
    });
  });
});

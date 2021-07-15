const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { sendPayments } = require('../../../src/payments/calculate_payments/send_payments');
const { CoinUtils } = require('../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../helpers');

describe('sendPayments() - async call to daemon to send worker payments ', () => {
  const coinUtils = new CoinUtils(metricCoinInfo);
  const logger = { error: sinon.stub(), warning: sinon.stub() };

  let withholdPercent;
  let addressAccount;
  let amountsRecords;
  let totalSent;
  let daemonStub;
  let env;

  beforeEach(() => {
    addressAccount = 'addressAccount';
    amountsRecords = {};
    totalSent = 0.0;
    daemonStub = { cmd: sinon.stub() };
    daemonStub.cmd.onCall(0).callsArgWith(2, { response: 'daemon succeeded' });

    env = {
      daemon: daemonStub,
      logger,
      coinUtils,
      withholdPercent
    };
  });

  it('calls out to the daemon', () => {
    const promise = sendPayments(env)({ addressAccount, amountsRecords, totalSent });
    return expect(promise).to.eventually.be.fulfilled.then(() => {
      expect(daemonStub.cmd.getCall(0).args[0]).to.eql('sendmany');
      expect(daemonStub.cmd.getCall(0).args[1]).to.eql([addressAccount, amountsRecords]);
      expect(daemonStub.cmd.getCall(0).args[2]).to.be.an.instanceOf(Function);
      expect(daemonStub.cmd.getCall(0).args[3]).to.eql(true);
      expect(daemonStub.cmd.getCall(0).args[4]).to.eql(true);
    });
  });

  describe('when the send attempt succeeds', () => {
    it('resolves the success', () => {
      const promise = sendPayments(env)({ addressAccount, amountsRecords, totalSent });
      const pending = promise.then((res) => res.response);
      return expect(pending).to.eventually.eql('daemon succeeded');
    });
  });

  describe("when the send attempt fails with the specific 'has insufficient funds' error", () => {
    const insufficientFundsError = {
      error: {
        code: -6,
        message: 'wallet has insufficient funds'
      }
    };

    beforeEach(() => {
      daemonStub.cmd.onCall(0).callsArgWith(2, insufficientFundsError);
    });

    it('rejects with a Retry! error to indicate it should be retried with more withheld', () => {
      const promise = sendPayments(env)({ addressAccount, amountsRecords, totalSent });
      return expect(promise).to.eventually.be.rejectedWith('Retry!');
    });
  });

  describe('when the send attempt fails with any other error', () => {
    const otherError = { error: 'the sun was in my eyes' };
    beforeEach(() => {
      daemonStub.cmd.onCall(0).callsArgWith(2, otherError);
    });

    it('rejects without retrying', () => {
      const promise = sendPayments(env)({ addressAccount, amountsRecords, totalSent });
      return expect(promise).to.eventually.be.rejectedWith('Error sending payments').then((e) => {
        expect(e.message).to.contain(otherError.error);
        expect(e.message).not.to.contain('Retry!');
      });
    });
  });
});

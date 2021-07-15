const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const { updateWorkerPayoutBalances } = require('../../../src/payments/manage_sent_payments/update_worker_payout_balances');
const { CoinUtils } = require('../../../src/payments/coin_utils');
const { metricCoinInfo } = require('../../helpers');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('update_worker_payout_balances()', () => {
  const emptyPaymentMode = '';
  const coin = 'carrot';
  const coinUtils = new CoinUtils(metricCoinInfo);

  let env;
  beforeEach(() => {
    env = {
      paymentMode: emptyPaymentMode,
      coin,
      coinUtils
    };
  });

  describe('with no workers', () => {
    const workers = {};
    it('returns zero total paid', () => {
      const [totalPaid] = updateWorkerPayoutBalances(env)(workers);
      expect(totalPaid).to.eql(0);
    });

    it('returns no redis worker payout command', () => {
      const [_, workerPayoutCommand] = updateWorkerPayoutBalances(env)(workers);
      expect(workerPayoutCommand).to.be.empty;
    });

    it('returns no redis balance update commands', () => {
      const [_paid, _payoutCmds, balanceUpdateCommands] = updateWorkerPayoutBalances(env)(workers);
      expect(balanceUpdateCommands).to.be.empty;
    });

    it('returns no redis immature update commands', () => {
      const [
        _paid, _payoutCmds, _updateCmds, immatureUpdateCommands
      ] = updateWorkerPayoutBalances(env)(workers);
      expect(immatureUpdateCommands).to.be.empty;
    });
  });

  describe('with workers', () => {
    let workers = {};

    describe('with payment mode Payment', () => {
      beforeEach(() => { env.paymentMode = 'payment'; });

      describe('with workers with no balance changes', () => {
        beforeEach(() => {
          workers = {
            w1: { balanceChange: 0 },
            w2: { balanceChange: 0 },
            w3: { balanceChange: 0 }
          };
        });

        it('creates no balance change updates', () => {
          const [
            _paid, _payoutCmds, balanceUpdateCommands
          ] = updateWorkerPayoutBalances(env)(workers);
          expect(balanceUpdateCommands).to.be.empty;
        });
      });

      describe('with workers with balance changes', () => {
        beforeEach(() => {
          workers = {
            w1: { balanceChange: 1.23 },
            w2: { balanceChange: -456.7 },
            w3: { balanceChange: 0 }
          };
        });

        it('creates balance change updates for the unpaid nonzero balances', () => {
          const expected = [
            ['hincrbyfloat', `${coin}:payments:unpaid`, 'w1', coinUtils.satoshisToCoins(1.23)],
            ['hincrbyfloat', `${coin}:payments:unpaid`, 'w2', coinUtils.satoshisToCoins(-456.7)],
          ];
          const [
            _paid, _payoutCmds, balanceUpdateCommands
          ] = updateWorkerPayoutBalances(env)(workers);
          expect(balanceUpdateCommands).to.include.deep.members(expected);
        });
      });

      describe('with workers with no payout amount sent to them', () => {
        beforeEach(() => {
          workers = {
            w1: { balanceChange: 0, sent: 0 },
            w2: { balanceChange: 0, sent: 0 },
            w3: { balanceChange: 0, sent: 0 }
          };
        });
        it('creates no payout command updates', () => {
          const [_paid, workerPayoutCommands] = updateWorkerPayoutBalances(env)(workers);
          expect(workerPayoutCommands).to.be.empty;
        });
      });

      describe('with workers with positive payout amounts sent to them', () => {
        beforeEach(() => {
          workers = {
            w1: { balanceChange: 0, sent: 987.65 },
            w2: { balanceChange: 0, sent: 432.1 },
            w3: { balanceChange: 0, sent: 0 },
            w4: { balanceChange: 0, sent: -321 },
            w5: { balanceChange: 0, sent: -789.65 }
          };
        });
        it('creates balance change updates for the paid-out sent amounts', () => {
          const expected = [
            ['hincrbyfloat', `${coin}:payments:payouts`, 'w1', coinUtils.coinsRound(987.65)],
            ['hincrbyfloat', `${coin}:payments:payouts`, 'w2', coinUtils.coinsRound(432.1)],
          ];
          const [_paid, workerPayoutCommands] = updateWorkerPayoutBalances(env)(workers);
          expect(workerPayoutCommands).to.include.deep.members(expected);
        });

        it('returns the total amount paid out', () => {
          const expected = coinUtils.coinsRound(987.65 + 432.1);
          const [totalPaid] = updateWorkerPayoutBalances(env)(workers);
          expect(totalPaid).to.eq(expected);
        });
      });
    });

    describe('with any other payment mode', () => {
      beforeEach(() => { env.paymentMode = 'other'; });

      describe('with workers with rewards', () => {
        beforeEach(() => {
          workers = {
            w1: { reward: 1.23 },
            w2: { reward: -456.7 },
            w3: { reward: 0 },
            w4: { reward: 345 },
            w5: { reward: 67.8 },
            w6: { }
          };
        });

        it('creates a zero hset balance statement update for missing and nonpositive rewards', () => {
          const expected = [
            ['hset', `${coin}:payments:balances`, 'w2', 0],
            ['hset', `${coin}:payments:balances`, 'w3', 0],
            ['hset', `${coin}:payments:balances`, 'w6', 0],
          ];
          const [
            _paid, _payoutCmds, balanceUpdateCommands
          ] = updateWorkerPayoutBalances(env)(workers);
          expect(balanceUpdateCommands).to.include.deep.members(expected);
        });

        it('creates the given hset balance statement update for rewards', () => {
          const fmtAmount = (amt) => coinUtils.coinsRound(coinUtils.satoshisToCoins(amt));
          const expected = [
            ['hset', `${coin}:payments:balances`, 'w1', fmtAmount(1.23)],
            ['hset', `${coin}:payments:balances`, 'w4', fmtAmount(345)],
            ['hset', `${coin}:payments:balances`, 'w5', fmtAmount(67.8)],
          ];
          const [
            _paid, _payoutCmds, balanceUpdateCommands
          ] = updateWorkerPayoutBalances(env)(workers);
          expect(balanceUpdateCommands).to.include.deep.members(expected);
        });
      });
    });

    describe('with workers with immature balances', () => {
      beforeEach(() => {
        workers = {
          w1: { immature: 0 },
          w2: { immature: 143.2 },
          w3: { immature: 678.9 },
          w4: {},
          w5: { immature: -111 },
          w6: { immature: 42 }
        };
      });

      it('creates a zero hset immature update for missing and nonpositive immature rewards', () => {
        const expected = [
          ['hset', `${coin}:payments:immature`, 'w1', 0],
          ['hset', `${coin}:payments:immature`, 'w4', 0],
          ['hset', `${coin}:payments:immature`, 'w5', 0],
        ];
        const [
          _paid, _payoutCmds, _balanceCmds, immatureUpdateCommands
        ] = updateWorkerPayoutBalances(env)(workers);
        expect(immatureUpdateCommands).to.include.deep.members(expected);
      });

      it('creates the given hset immature update for immature rewards', () => {
        const fmtAmount = (amt) => coinUtils.coinsRound(coinUtils.satoshisToCoins(amt));
        const expected = [
          ['hset', `${coin}:payments:immature`, 'w2', fmtAmount(143.2)],
          ['hset', `${coin}:payments:immature`, 'w3', fmtAmount(678.9)],
          ['hset', `${coin}:payments:immature`, 'w6', fmtAmount(42)],
        ];
        const [
          _paid, _payoutCmds, _balanceCmds, immatureUpdateCommands
        ] = updateWorkerPayoutBalances(env)(workers);
        expect(immatureUpdateCommands).to.include.deep.members(expected);
      });
    });
  });
});

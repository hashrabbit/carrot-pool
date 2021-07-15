const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { updateWorkerShares } = require('../../../src/payments/manage_sent_payments/update_worker_shares');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('update_worker_shares()', () => {
  const emptyPaymentMode = '';
  const coin = 'carrot';

  let env;
  let loggerStub;

  beforeEach(() => {
    loggerStub = { warning: sinon.stub() };
    env = { paymentMode: emptyPaymentMode, coin };
  });

  describe('with no rounds', () => {
    const rounds = {};
    it('returns no commands', () => {
      const [
        moveCmds,
        orphanCmds,
        roundsToDelete,
        confirmsUpdate,
        confirmsToDelete
      ] = updateWorkerShares(env)(rounds);
      expect(moveCmds).to.be.empty;
      expect(orphanCmds).to.be.empty;
      expect(roundsToDelete).to.be.empty;
      expect(confirmsUpdate).to.be.empty;
      expect(confirmsToDelete).to.be.empty;
    });
  });

  describe('with rounds', () => {
    let rounds = {};

    describe('With kicked or orphaned rounds', () => {
      beforeEach(() => {
        env.logger = loggerStub;

        rounds = {
          r1: { blockHash: 'hash1', serialized: 's1', category: 'kicked' },
          r2: { blockHash: 'hash2', serialized: 's2', category: 'orphan' },
          r3: {
            blockHash: 'hash3',
            serialized: 's3',
            category: 'kicked',
            canDeleteShares: true,
            height: 3,
            workerShares: { r3w1: 31, r3w2: 32 }
          },
          r4: {
            blockHash: 'hash4',
            serialized: 's4',
            category: 'orphan',
            canDeleteShares: true,
            height: 4,
            workerShares: { r4w1: 41, r4w2: 42 }
          },
          r5: {
            blockHash: 'hash5',
            serialized: 's5',
            category: 'kicked',
            canDeleteShares: false,
            height: 5,
            workerShares: { r5w1: 51, r5w2: 52 }
          },
          x1: {
            blockHash: 'hash6',
            serialized: 's6',
            category: 'other',
            canDeleteShares: true,
            height: 6,
            workerShares: { r6w1: 61, r6w2: 62 }
          },
          x2: { blockHash: 'hash7', serialized: 's7', category: 'other' }
        };
      });

      it('issues delete commands for the pendingConfirms of kicked or orphaned blocks', () => {
        const expected = [
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash1'],
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash2'],
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash3'],
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash4'],
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash5']
        ];
        const absent = [
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash6'],
          ['hdel', `${coin}:blocks:pendingConfirms`, 'hash7'],
        ];
        const [_mpc, _oc, _rtd, _cu, confirmsToDelete] = updateWorkerShares(env)(rounds);
        expect(confirmsToDelete).to.deep.include.members(expected);
        absent.forEach((a) => expect(confirmsToDelete).not.to.deep.include(a));
      });

      it('issues movePending commands from pending to kicked for kicked or orphaned blocks', () => {
        const expected = [
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's1'],
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's2'],
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's3'],
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's4'],
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's5']
        ];
        const absent = [
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's6'],
          ['smove', `${coin}:blocks:pending`, `${coin}:blocks:kicked`, 's7']
        ];
        const [movePendingCommands, _oc, _rtd, _cu, _ctd] = updateWorkerShares(env)(rounds);
        expect(movePendingCommands).to.deep.include.members(expected);
        absent.forEach((a) => expect(movePendingCommands).not.to.deep.include(a));
      });

      it('issues orphanMergeCommands for each workers share from kicked or orphaned blocks when ok to delete shares', () => {
        const expected = [
          ['hincrby', `${coin}:shares:roundCurrent`, 'r3w1', 31],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r3w2', 32],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r4w1', 41],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r4w2', 42],
        ];
        const absent = [
          ['hincrby', `${coin}:shares:roundCurrent`, 'r5w1', 51],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r5w2', 52],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r6w1', 61],
          ['hincrby', `${coin}:shares:roundCurrent`, 'r6w2', 62],
        ];
        const [_mpc, orphanMergeCommands, _rtd, _cu, _ctd] = updateWorkerShares(env)(rounds);
        expect(orphanMergeCommands).to.deep.include.members(expected);
        absent.forEach((a) => expect(orphanMergeCommands).not.to.deep.include(a));
      });

      it('issues roundsToDelete strings for each kicked or orphaned round when ok to delete shares', () => {
        const expected = [
          `${coin}:shares:round3`,
          `${coin}:times:times3`,
          `${coin}:shares:round4`,
          `${coin}:times:times4`,
        ];
        const absent = [
          `${coin}:shares:round5`,
          `${coin}:times:times5`,
          `${coin}:shares:round6`,
          `${coin}:times:times5`,
        ];
        const [_mpc, _omc, roundsToDelete, _cu, _ctd] = updateWorkerShares(env)(rounds);
        expect(roundsToDelete).to.deep.include.members(expected);
        absent.forEach((a) => expect(roundsToDelete).not.to.deep.include(a));
      });
    });

    describe('With immature rounds', () => {
      beforeEach(() => {
        rounds = {
          r1: { blockHash: 'hash1', confirmations: 1, category: 'immature' },
          r2: { blockHash: 'hash2', category: 'immature' },
          r3: { blockHash: 'hash3', confirmations: 3, category: 'other' }
        };
      });

      it('returns commands for still-immature blocks to mark them as pending', () => {
        const expected = [
          ['hset', `${coin}:blocks:pendingConfirms`, 'hash1', 1],
          ['hset', `${coin}:blocks:pendingConfirms`, 'hash2', 0]
        ];
        const absent = [
          ['hset', `${coin}:blocks:pendingConfirms`, 'hash3', 3],
        ];
        const [_mpc, _oc, _rtd, confirmsUpdates, _ctd] = updateWorkerShares(env)(rounds);
        expect(confirmsUpdates).to.deep.include.members(expected);
        absent.forEach((a) => expect(confirmsUpdates).not.to.deep.include(a));
      });
    });

    describe('With generate rounds', () => {
      beforeEach(() => {
        rounds = {
          r1: { blockHash: 'hash1', serialized: 's1', category: 'generate' },
          r2: { blockHash: 'hash2', serialized: 's2', category: 'generate' },
          r3: { blockHash: 'hash3', serialized: 's3', category: 'other' }
        };
      });

      describe('When the mode is not payment', () => {
        beforeEach(() => {
          env.paymentMode = 'other';
        });

        it('skips generate commands', () => {
          const [
            movePendingCommands, _oc, roundsToDelete, _cu, confirmsToDelete
          ] = updateWorkerShares(env)(rounds);
          expect(movePendingCommands).to.be.empty;
          expect(roundsToDelete).to.be.empty;
          expect(confirmsToDelete).to.be.empty;
        });
      });

      describe('When the mode is payment', () => {
        beforeEach(() => {
          env.paymentMode = 'payment';
        });

        it('deletes the block from pending confirms', () => {
          const expected = [
            ['hdel', `${coin}:blocks:pendingConfirms`, 'hash1'],
            ['hdel', `${coin}:blocks:pendingConfirms`, 'hash2'],
          ];
          const absent = [
            ['hdel', `${coin}:blocks:pendingConfirms`, 'hash3'],
          ];
          const [_mpc, _oc, _rtd, _cu, confirmsToDelete] = updateWorkerShares(env)(rounds);
          expect(confirmsToDelete).to.deep.include.members(expected);
          expect(confirmsToDelete).not.to.deep.include(absent);
        });

        it('moves the block from pending to confirmed with its serialized hash', () => {
          const expected = [
            ['smove', `${coin}:blocks:pending`, `${coin}:blocks:confirmed`, 's1'],
            ['smove', `${coin}:blocks:pending`, `${coin}:blocks:confirmed`, 's2'],
          ];
          const absent = [
            ['smove', `${coin}:blocks:pending`, `${coin}:blocks:confirmed`, 's3'],
          ];
          const [movePendingCommands, _oc, _rtd, _cu, _ctd] = updateWorkerShares(env)(rounds);
          expect(movePendingCommands).to.deep.include.members(expected);
          expect(movePendingCommands).not.to.deep.include(absent);
        });
      });
    });
  });
});

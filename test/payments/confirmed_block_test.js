const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { confirmedBlock } = require('../../src/payments/confirmed_block');

describe('confirmedBlock() - prepareRounds category function', () => {
  const feeSatoshi = 0;
  const coinsToSatoshies = sinon.stub().returnsArg(0);
  const satoshisToCoins = sinon.stub().returnsArg(0);
  const reward = 0.5;
  const addr = 'AAAAAA';

  describe('for a solo round', () => {
    const round = {
      soloMined: true, workerAddress: addr, reward, height: 1
    };
    const solo = { [addr]: 1 };
    const workers = { [addr]: {} };
    const env = {
      workers, satoshisToCoins, coinsToSatoshies, feeSatoshi
    };
    const args = { round, solo };

    it('sets reward, roundShares, and totalShares keys on worker', () => {
      confirmedBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(1);
      expect(workers[addr].reward).to.eql(1);
    });
  });

  describe('for a shared round, with 1 worker', () => {
    const round = { reward: 1.5, height: 1 };
    const shared = { [addr]: 10 };
    const workers = { [addr]: {} };
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      logger, workers, coinsToSatoshies, satoshisToCoins, feeSatoshi
    };
    const args = {
      round, shared, times: {}, maxTime: 1
    };

    it('sets the correct key/value pairs on the worker object.', () => {
      confirmedBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(10);
      expect(workers[addr].records[1].amounts).to.eql(2);
    });
  });

  describe('for a shared round, with 1 worker, losing half their shares', () => {
    const round = { reward: 1.5, height: 1 };
    const shared = { [addr]: 10 };
    const workers = { [addr]: {} };
    const times = { [addr]: 0.5 };
    const logger = { error: sinon.stub().returnsArg(0) };
    const env = {
      logger, workers, coinsToSatoshies, satoshisToCoins, feeSatoshi
    };
    const args = {
      round, shared, times, maxTime: 1
    };

    it('sets the correct key/value pairs on the worker object.', () => {
      confirmedBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(5);
      expect(workers[addr].records[1].shares).to.eql(10);
      expect(workers[addr].records[1].amounts).to.eql(2);
    });
  });
});

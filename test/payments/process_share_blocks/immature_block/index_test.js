const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../../chai-local');

const { immatureBlock } = require(
  '../../../../src/payments/process_share_blocks/immature_block'
);

describe('immatureBlock() - prepareRounds category function', () => {
  const feeSatoshi = 0;
  const coinUtils = { coinsToSatoshies: sinon.stub().returnsArg(0) };
  const reward = 0.5;
  const addr = 'AAAAAA';

  describe('for a soloMined round', () => {
    const round = { soloMined: true, workerAddress: addr, reward };
    const solo = { [addr]: 0 };
    const workers = { [addr]: {} };
    const env = { coinUtils, feeSatoshi };
    const args = { workers, round, solo };

    it('sets immature and roundShares keys on worker', () => {
      immatureBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(0);
      expect(workers[addr].immature).to.eql(1);
    });
  });

  describe('for a non-soloMined round, with no lost shares', () => {
    describe('with an existing worker', () => {
      const round = { reward };
      const shared = { [addr]: 10 };
      const workers = { [addr]: {} };
      const env = { coinUtils, feeSatoshi };
      const args = {
        workers, round, shared, times: {}, maxTime: 1
      };

      it('sets immature and roundShares keys on worker', () => {
        immatureBlock(env)(args);
        expect(workers[addr].roundShares).to.eql(10);
        expect(workers[addr].immature).to.eql(1);
      });
    });

    describe('with no previous existing workers', () => {
      const round = { reward };
      const shared = { [addr]: 10 };
      const workers = {};
      const env = { coinUtils, feeSatoshi };
      const args = {
        workers, round, shared, times: {}, maxTime: 1
      };

      it('sets immature and roundShares keys on a new worker', () => {
        immatureBlock(env)(args);
        expect(workers[addr].roundShares).to.eql(10);
        expect(workers[addr].immature).to.eql(1);
      });
    });
  });

  describe('for a non-soloMined round, with 1 lost share', () => {
    const round = { reward };
    const shared = { [addr]: 10 };
    const workers = { [addr]: {} };
    const times = { [addr]: 0.5 };
    const env = { coinUtils, feeSatoshi };
    const args = {
      workers, round, shared, times, maxTime: 1
    };

    it('sets immature and roundShares keys on worker', () => {
      immatureBlock(env)(args);
      expect(workers[addr].roundShares).to.eql(5);
      expect(workers[addr].immature).to.eql(1);
    });
  });
});

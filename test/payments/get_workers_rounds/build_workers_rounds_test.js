const { describe, it } = require('mocha');
const { expect } = require('../../chai-local');

const { buildWorkersRounds } = require('../../../src/payments/get_workers_rounds/build_workers_rounds');

describe('buildWorkersRounds() - format unpaid & pending records from fetch step', () => {
  const coinsToSatoshies = (coins) => coins;
  const address = 'AAAAAA';
  const env = { coinUtils: { coinsToSatoshies } };

  describe('when formatting "unpaid" entries', () => {
    const unpaid = { [address]: '0.001' };
    const pending = [];

    it('retuns the correct workers', () => {
      const { workers, rounds } = buildWorkersRounds(env)([unpaid, pending]);
      expect(workers[address].balance).to.eql(0.001);
      expect(rounds.length).to.eql(0);
    });
  });

  describe('when formatting "pending" entries', () => {
    const json = JSON.stringify({ worker: address });
    const unpaid = null;
    const pending = [json];

    it('retuns the correct rounds', () => {
      const { workers, rounds } = buildWorkersRounds(env)([unpaid, pending]);
      expect(workers).to.eql({});
      expect(rounds.length).to.eql(1);
      expect(rounds[0]).to.include({ workerAddress: address });
    });
  });
});

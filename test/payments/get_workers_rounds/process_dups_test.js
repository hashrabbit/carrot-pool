const { describe, it } = require('mocha');
const { expect } = require('../../chai-local');

const { processDups } = require('../../../src/payments/get_workers_rounds/process_dups');

describe('processDups() - filters out duplicate entries, after updating the DB', () => {
  const invalidateDups = () => Promise.resolve(true);
  const workers = {};
  const rounds = [
    { height: 2, duplicate: false },
    { height: 1, duplicate: true },
    { height: 1, duplicate: true },
  ];
  const dups = [
    { height: 1, duplicate: true },
    { height: 1, duplicate: true }
  ];

  it('retuns rounds with duplicates removed', async () => {
    const result = await processDups({ invalidateDups })({ workers, rounds, dups });
    expect(result.rounds.length).to.eql(1);
    expect(result.rounds[0]).to.include({ height: 2 });
  });
});

const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _processAutoRounds } = require(
  '../../../src/payments/process_share_blocks/process_auto_rounds'
);

describe('processAutoRounds() - delegate payable rounds to payout calculators', () => {
  const buildDeps = () => {
    const spies = { generate: sinon.spy(), immature: sinon.spy() };
    const confirmedBlock = () => spies.generate;
    const immatureBlock = () => spies.immature;
    const deps = { confirmedBlock, immatureBlock };
    return { spies, deps };
  };

  describe('with 1 "generate" round and 1 "orphan" round', () => {
    const { spies, deps } = buildDeps();
    const processAutoRounds = _processAutoRounds(deps)({});
    const rounds = [{ category: 'generate' }, { category: 'orphan' }];
    const args = {
      rounds, times: [{}, {}], solo: [], shared: [], workers: {}
    };

    it('delegates to confirmedBlock', () => {
      processAutoRounds(args);
      expect(spies.generate).to.have.been.calledOnce;
      expect(spies.generate.args[0][0].round).to.eql(rounds[0]);
      expect(spies.immature).not.to.have.been.called;
    });
  });

  describe('with 1 "immature" round', () => {
    const { spies, deps } = buildDeps();
    const processAutoRounds = _processAutoRounds(deps)({});
    const rounds = [{ category: 'immature' }];
    const args = {
      rounds, times: [{}], solo: [], shared: [], workers: {}
    };

    it('delegates to immatureBlock', () => {
      processAutoRounds(args);
      expect(spies.immature).to.have.been.calledOnce;
      expect(spies.generate).not.to.have.been.called;
    });
  });
});

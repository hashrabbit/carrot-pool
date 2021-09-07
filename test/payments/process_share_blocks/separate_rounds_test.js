const { describe, it } = require('mocha');
const { expect } = require('../../chai-local');

const { separateRounds } = require(
  '../../../src/payments/process_share_blocks/separate_rounds'
);

describe('separateRounds() - processShareBlocks pipeline function', () => {
  describe('with 1 auto and 1 manual rounds', () => {
    const rounds = [{ height: 111 }, { height: 112 }];
    const solo = [{}, {}];
    const shared = [{ 111: 0 }, {}];
    const args = { rounds, solo, shared };

    it('retuns 1 autoRounds and 1 manualRounds entries', () => {
      const { autoRounds, manualRounds } = separateRounds(args);
      expect(autoRounds.length).to.eql(1);
      expect(autoRounds[0]).to.include({ height: 111 });
      expect(manualRounds.length).to.eql(1);
      expect(manualRounds[0]).to.include({ height: 112 });
    });
  });
});

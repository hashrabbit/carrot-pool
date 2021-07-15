const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { _dupsInvalidator } = require('../../../src/payments/dups_invalidator');

describe('dupsInvalidator()', () => {
  const logger = { warning: sinon.stub() };
  const env = { logger };

  const fetchBlocks = sinon.stub().resolves('fetchBlocksResult');
  const fetchBlocksEnv = sinon.stub().returns(fetchBlocks);

  const findInvalid = sinon.stub().resolves('findInvalidResult');
  const findInvalidDups = sinon.stub().returns(findInvalid);
  const findInvalidEnv = sinon.stub().returns(findInvalidDups);

  const moveInvalid = sinon.stub().resolves('moveInvalidResult');
  const moveInvalidEnv = sinon.stub().returns(moveInvalid);

  const deps = {
    fetchBlocks: fetchBlocksEnv,
    findInvalid: findInvalidEnv,
    moveInvalid: moveInvalidEnv
  };

  it('calls through the promise chain with the given env, dups and chained args', () => {
    const dups = [1, 2, 3];
    const promise = _dupsInvalidator(deps)(env)(dups);
    return expect(promise).to.eventually.eql('moveInvalidResult').then(() => {
      expect(fetchBlocksEnv).to.have.been.calledWith(env);
      expect(findInvalidEnv).to.have.been.calledWith(env);
      expect(moveInvalidEnv).to.have.been.calledWith(env);
      expect(findInvalidDups).to.have.been.calledWith(dups);

      expect(fetchBlocks).to.have.been.calledWith(dups);
      expect(findInvalid).to.have.been.calledWith('fetchBlocksResult');
      expect(moveInvalid).to.have.been.calledWith('findInvalidResult');
    });
  });
});
